-- 0026_search_availability.sql — T045
--
-- ⚠ RETURNS AVAILABILITY, NEVER OCCUPANCY (FR-002a).
--
-- No booking row, no block row, no reason, and no indication of WHY a unit is unavailable. A
-- guest cannot tell whether a date is taken by a booking or by a block, because they receive
-- neither. That is enforced structurally — `bookings`, `availability_blocks`, and
-- `room_occupancy` all have zero anon policies — and this function is the only channel.
--
-- ⚠ THE SCARCITY COUNT IS GATED HERE, NOT IN THE CLIENT (FR-002c, C14, R18).
--
-- Returns the true remaining count only at or below site_settings.scarcity_threshold, and
-- NULL above it. Returning the real count and hiding it in the interface would put the
-- property's occupancy curve in every network response — readable by anyone who opens
-- devtools, and trivially harvestable by polling. A threshold of 0 returns null always.
--
-- Returns a jsonb envelope rather than a rowset so `too_soon` can carry the earliest bookable
-- date alongside it (FR-020d): a search inside the notice window must offer the first date
-- that works, not report the property as full.

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

  -- Earliest bookable date, given cutoff and minimum notice (C13).
  v_earliest := greatest(
    v_today + (case
      when extract(hour from (now() at time zone v_settings.timezone))
           >= v_settings.same_day_cutoff_hour then 1 else 0 end),
    (v_today + make_interval(hours => v_settings.min_notice_hours))::date
  );

  if p_check_in < v_earliest then
    return jsonb_build_object(
      'status', 'too_soon',
      'earliest_bookable', v_earliest
    );
  end if;

  for v_row in
    select rt.id, rt.name, rt.slug, rt.max_occupancy, rt.base_nightly_rate, rt.sort_order
    from public.room_types rt
    where rt.published_at is not null
      and rt.archived_at is null
      and rt.max_occupancy >= p_guests
    order by rt.sort_order, rt.name
  loop
    -- Free units: active units of this type with no occupancy row overlapping the range.
    -- One count, no disclosure of what occupies the others.
    select count(*) into v_free
    from public.room_units ru
    where ru.room_type_id = v_row.id
      and ru.active
      and not exists (
        select 1 from public.room_occupancy ro
        where ro.room_unit_id = ru.id
          and ro.stay_range && daterange(p_check_in, p_check_out, '[)')
      );

    if v_free > 0 then
      select * into v_total, v_break
      from public.price_stay(v_row.id, p_check_in, p_check_out);

      -- The gate. NULL above the threshold — the number never leaves the database.
      v_shown := case
        when v_settings.scarcity_threshold > 0 and v_free <= v_settings.scarcity_threshold
        then v_free
        else null
      end;

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

  -- FR-002b: nothing free is a different remedy from nothing that fits the party.
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

revoke all on function public.search_availability(date, date, int) from public;
grant execute on function public.search_availability(date, date, int) to anon, authenticated;

comment on function public.search_availability(date, date, int) is
  'The only channel by which availability reaches a guest. Returns availability, never occupancy (FR-002a). units_available is gated at scarcity_threshold and returns NULL above it, so the exact count never leaves the database (FR-002c, R18).';
