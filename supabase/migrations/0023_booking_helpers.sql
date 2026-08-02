-- 0023_booking_helpers.sql — part of T043
--
-- Three helpers write_booking() depends on. Split out so the main function reads as a state
-- machine rather than a pile of arithmetic.

-- ── Booking reference ─────────────────────────────────────────────────────────
--
-- FR-005a: high-entropy, NON-SEQUENTIAL. Crockford base32 minus I, L, O, U so a reference
-- read aloud over the phone or typed off a screen cannot be transcribed wrong.
--
-- ⚠ WHY NOT A SEQUENCE: reference plus email is what grants a guest access to their own
-- booking (FR-013). `BK-000123` turns get_booking_by_reference() into an enumeration oracle
-- for every guest's stay dates.

create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  candidate text;
  attempt   int := 0;
begin
  loop
    candidate := '';
    for i in 1..10 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.bookings b where b.booking_reference = candidate
    );

    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'reference_generation_failed';
    end if;
  end loop;

  return candidate;
end $$;

revoke all on function public.generate_booking_reference() from public, anon, authenticated;

-- ── Rate limiting ─────────────────────────────────────────────────────────────
--
-- ⚠ Stores a SALTED HASH of the identifier, never the raw value. A raw IP log is personal
-- data under RA 10173 and adds a retention obligation for no benefit (baseline §2.5).
--
-- Thresholds come from site_settings.rate_limits so they change without a release (FR-014a).

create or replace function public.check_rate_limit(
  p_bucket     text,
  p_identifier text,
  p_salt       text default 'balai-amihan-default-salt'
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_config jsonb;
  v_limit  int;
  v_window int;
  v_hash   text;
  v_count  int;
begin
  select rate_limits -> p_bucket into v_config from public.site_settings where id;

  if v_config is null then
    return;  -- unconfigured bucket is not a limit of zero
  end if;

  v_limit  := (v_config ->> 'limit')::int;
  v_window := (v_config ->> 'window_minutes')::int;

  v_hash := encode(extensions.digest(p_identifier || p_salt, 'sha256'), 'hex');

  select count(*) into v_count
  from public.rate_limit_events e
  where e.bucket = p_bucket
    and e.identifier = v_hash
    and e.created_at > now() - make_interval(mins => v_window);

  if v_count >= v_limit then
    raise exception 'rate_limited' using errcode = 'P0001',
      detail = format('bucket=%s retry_after_minutes=%s', p_bucket, v_window);
  end if;

  insert into public.rate_limit_events (bucket, identifier) values (p_bucket, v_hash);
end $$;

revoke all on function public.check_rate_limit(text, text, text) from public, anon, authenticated;

-- ── Stay pricing ──────────────────────────────────────────────────────────────
--
-- C1: priced NIGHT BY NIGHT — each night takes an override rate if one covers it, otherwise
-- the room type's base rate. The total is the sum. A stay crossing a boundary is therefore
-- priced correctly without anyone deciding which rate "wins" for the whole stay.
--
-- FR-003b: each night rounds to 2dp BEFORE summing, so the breakdown a guest is shown always
-- adds up to the total they are shown. A total that cannot be reconciled by hand is a
-- support message.
--
-- ⚠ NEVER accepts a price from the client. This is the only place a stay total is computed.

create or replace function public.price_stay(
  p_room_type_id uuid,
  p_check_in     date,
  p_check_out    date
)
returns table (total numeric, breakdown jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_base  numeric(12, 2);
  v_night date;
  v_rate  numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_lines jsonb := '[]'::jsonb;
begin
  select rt.base_nightly_rate into v_base
  from public.room_types rt where rt.id = p_room_type_id;

  if v_base is null then
    raise exception 'unknown_room_type';
  end if;

  v_night := p_check_in;
  while v_night < p_check_out loop
    select ro.nightly_rate into v_rate
    from public.rate_overrides ro
    where ro.room_type_id = p_room_type_id
      and ro.date_range @> v_night
    limit 1;

    v_rate := round(coalesce(v_rate, v_base), 2);
    v_total := v_total + v_rate;
    v_lines := v_lines || jsonb_build_object('night', v_night, 'rate', v_rate);

    v_night := v_night + 1;
  end loop;

  return query select v_total, v_lines;
end $$;

revoke all on function public.price_stay(uuid, date, date) from public, anon, authenticated;
