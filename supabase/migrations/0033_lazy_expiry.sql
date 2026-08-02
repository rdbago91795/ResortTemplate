-- 0033_lazy_expiry.sql — T050 (part 1 of 2)
--
-- ======================================================================================
-- A ROOM FREES ITSELF WHEN SOMEONE LOOKS FOR IT, NOT WHEN A SCHEDULER SAYS SO.
-- ======================================================================================
--
-- T050 as specified put hold expiry in pg_cron. That makes availability correctness depend
-- on a process that is not guaranteed to run: free-tier projects pause after 7 days idle,
-- and pg_cron stops with them. An unexpired hold keeps its room_occupancy row, and a room
-- that is actually free shows as taken to every other guest.
--
-- That contradicts how the rest of this schema is built. room_occupancy guarantees
-- non-overlap with a CONSTRAINT precisely so that no process has to be trusted to maintain
-- it. Expiry gets the same treatment:
--
--   READ  path (search_availability, STABLE): ignores occupancy rows whose booking is a hold
--         past its deadline. Cannot write, so it does not try to.
--   WRITE path (write_booking, VOLATILE): purges those rows before it needs the capacity, so
--         the exclusion constraint adjudicates against true state.
--
-- Cron (0035) then only tidies. If it never runs, nothing user-facing is wrong — rows simply
-- accumulate until the next write.
--
-- Both `held` and `awaiting_verification` expire, and both use hold_expires_at:
-- submit_reference re-stamps it with site_settings.awaiting_hours.

-- ---- The tidy operation, shared by the write path and cron ---------------------------

create or replace function public.expire_stale_holds()
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_n   int := 0;
begin
  -- SKIP LOCKED: this runs inside another guest's booking attempt. A hold being concurrently
  -- paid for is locked by that transaction; skipping it is correct — that transaction will
  -- either commit (no longer stale) or roll back (caught next time).
  for v_row in
    select id, status from public.bookings
    where status in ('held', 'awaiting_verification')
      and hold_expires_at is not null
      and hold_expires_at < now()
    for update skip locked
  loop
    update public.bookings
      set status = 'expired', hold_expires_at = null, updated_at = now()
    where id = v_row.id;

    -- This is what returns the dates.
    delete from public.room_occupancy where booking_id = v_row.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_row.id, null, 'state_changed',
            jsonb_build_object('status', v_row.status),
            jsonb_build_object('status', 'expired', 'by', 'expiry'));

    v_n := v_n + 1;
  end loop;

  return v_n;
end $$;

revoke all on function public.expire_stale_holds() from public, anon, authenticated;

comment on function public.expire_stale_holds() is
  'Releases holds past their deadline. Called by write_booking before it needs capacity and by cron (0035) to tidy. Correctness does not depend on the cron half running.';

-- ---- Read path: availability ignores expired holds -----------------------------------
--
-- Reproduced from 0026 with only the occupancy predicate changed.

create or replace function public.search_availability(
  p_check_in  date,
  p_check_out date,
  p_guests    int
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_settings public.site_settings%rowtype;
  v_today    date;
  v_earliest date;
  v_results  jsonb := '[]'::jsonb;
  v_row      record;
  v_total    numeric(12, 2);
  v_break    jsonb;
  v_free     int;
  v_shown    int;
begin
  select * into v_settings from public.site_settings where id;
  if not found then raise exception 'settings_missing'; end if;

  v_today := (now() at time zone v_settings.timezone)::date;

  if p_check_out <= p_check_in then
    return jsonb_build_object('status', 'invalid_date_range');
  end if;
  if p_check_out - p_check_in > 30 then
    return jsonb_build_object('status', 'stay_too_long');
  end if;
  if p_check_in > v_today + 365 then
    return jsonb_build_object('status', 'too_far_ahead');
  end if;

  v_earliest := greatest(
    v_today + (case
      when extract(hour from (now() at time zone v_settings.timezone))
           >= v_settings.same_day_cutoff_hour then 1 else 0 end),
    (v_today + make_interval(hours => v_settings.min_notice_hours))::date
  );

  if p_check_in < v_earliest then
    return jsonb_build_object('status', 'too_soon', 'earliest_bookable', v_earliest);
  end if;

  for v_row in
    select rt.id, rt.name, rt.slug, rt.max_occupancy, rt.base_nightly_rate, rt.sort_order
    from public.room_types rt
    where rt.published_at is not null
      and rt.archived_at is null
      and rt.max_occupancy >= p_guests
    order by rt.sort_order, rt.name
  loop
    select count(*) into v_free
    from public.room_units ru
    where ru.room_type_id = v_row.id
      and ru.active
      and not exists (
        select 1
        from public.room_occupancy ro
        left join public.bookings b on b.id = ro.booking_id
        where ro.room_unit_id = ru.id
          and ro.stay_range && daterange(p_check_in, p_check_out, '[)')
          -- An occupancy row backed by a hold past its deadline no longer occupies anything.
          -- Availability must not wait for a scheduler to agree.
          and not (
            ro.source = 'booking'
            and b.status in ('held', 'awaiting_verification')
            and b.hold_expires_at is not null
            and b.hold_expires_at < now()
          )
      );

    if v_free > 0 then
      select * into v_total, v_break
      from public.price_stay(v_row.id, p_check_in, p_check_out);

      -- The gate. NULL above the threshold — the number never leaves the database.
      v_shown := case
        when v_settings.scarcity_threshold > 0 and v_free <= v_settings.scarcity_threshold
        then v_free else null end;

      v_results := v_results || jsonb_build_object(
        'room_type_id',      v_row.id,
        'name',              v_row.name,
        'slug',              v_row.slug,
        'max_occupancy',     v_row.max_occupancy,
        'base_nightly_rate', v_row.base_nightly_rate,
        'stay_total',        v_total,
        'nightly_breakdown', v_break,
        'units_available',   v_shown
      );
    end if;
  end loop;

  if jsonb_array_length(v_results) = 0 then
    if exists (
      select 1 from public.room_types rt
      where rt.published_at is not null and rt.archived_at is null
        and rt.max_occupancy >= p_guests
    ) then
      return jsonb_build_object('status', 'no_availability', 'results', '[]'::jsonb);
    else
      return jsonb_build_object('status', 'no_capacity_match', 'results', '[]'::jsonb);
    end if;
  end if;

  return jsonb_build_object('status', 'ok', 'results', v_results);
end $$;

-- ---- Guest lookup reports the EFFECTIVE status ---------------------------------------
--
-- Between expiry and tidy-up the row still reads 'held'. Showing a guest a hold that no
-- longer holds anything would be a lie the schema can avoid telling.

create or replace function public.get_booking_by_reference(p_reference text, p_email text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_row record; v_status text;
begin
  select b.booking_reference, b.status, b.hold_expires_at, b.check_in, b.check_out,
         rt.name as room_type_name, b.stay_total, b.amount_received,
         b.stay_total - coalesce(b.amount_received, 0) as balance
  into v_row
  from public.bookings b
  join public.room_units ru on ru.id = b.room_unit_id
  join public.room_types rt on rt.id = ru.room_type_id
  where b.booking_reference = upper(btrim(p_reference))
    and b.guest_email = lower(btrim(p_email))
    and b.erased_at is null;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_status := case
    when v_row.status in ('held', 'awaiting_verification')
     and v_row.hold_expires_at is not null
     and v_row.hold_expires_at < now()
    then 'expired' else v_row.status end;

  return jsonb_build_object(
    'status', 'ok', 'booking_reference', v_row.booking_reference,
    'booking_status', v_status, 'check_in', v_row.check_in, 'check_out', v_row.check_out,
    'room_type_name', v_row.room_type_name, 'stay_total', v_row.stay_total,
    'amount_received', v_row.amount_received, 'balance', v_row.balance);
end $$;
