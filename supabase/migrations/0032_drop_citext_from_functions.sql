-- 0032_drop_citext_from_functions.sql — the second half of the 0031 change
--
-- Split from 0031 so schema conversion and function rewrites apply as separate migrations.
-- Read 0031's header first: it explains why citext was silently case-sensitive inside every
-- `search_path = ''` function, and why the fix is a storage invariant rather than a patch.
--
-- The five functions that named citext, rewritten against text columns. write_booking and
-- save_site_settings are reproduced from 0024 / 0028 with ONLY the casts removed - leaving
-- them would strand a live dependency on an extension nothing else uses.

-- ---- write_booking - the single writer (0024) ----------------------------------------

create or replace function public.write_booking(p_action text, p_payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_is_admin   boolean := coalesce((select public.is_admin()), false);
  v_settings   public.site_settings%rowtype;
  v_today      date;
  v_booking    public.bookings%rowtype;
  v_type_id    uuid;
  v_unit       record;
  v_check_in   date;
  v_check_out  date;
  v_guests     int;
  v_max_occ    int;
  v_total      numeric(12, 2);
  v_breakdown  jsonb;
  v_ref        text;
  v_expires    timestamptz;
  v_new_id     uuid;
  v_actor      uuid := (select auth.uid());
  v_prev       jsonb;
begin
  select * into v_settings from public.site_settings where id;
  if not found then raise exception 'settings_missing'; end if;

  v_today := (now() at time zone v_settings.timezone)::date;

  -- === HOLD - anonymous guest (C2) ===================================================
  if p_action = 'hold' then
    if v_is_admin then
      raise exception 'not_authorised' using detail = 'admins use create_confirmed';
    end if;

    v_type_id   := (p_payload ->> 'room_type_id')::uuid;
    v_check_in  := (p_payload ->> 'check_in')::date;
    v_check_out := (p_payload ->> 'check_out')::date;
    v_guests    := (p_payload ->> 'guests')::int;

    if v_check_out <= v_check_in then raise exception 'invalid_date_range'; end if;
    if v_check_in < v_today then raise exception 'check_in_in_past'; end if;
    if v_check_out - v_check_in > 30 then raise exception 'stay_too_long'; end if;
    if v_check_in > v_today + 365 then raise exception 'too_far_ahead'; end if;

    -- Minimum notice, evaluated HERE and never at reference submission (C13, FR-020c).
    if v_check_in = v_today
       and extract(hour from (now() at time zone v_settings.timezone))
           >= v_settings.same_day_cutoff_hour then
      raise exception 'too_soon';
    end if;
    if v_check_in < v_today + make_interval(hours => v_settings.min_notice_hours) then
      raise exception 'too_soon';
    end if;

    select max_occupancy into v_max_occ from public.room_types
    where id = v_type_id and published_at is not null and archived_at is null;
    if v_max_occ is null then raise exception 'unknown_room_type'; end if;
    if v_guests < 1 or v_guests > v_max_occ then raise exception 'invalid_guest_count'; end if;

    select * into v_total, v_breakdown from public.price_stay(v_type_id, v_check_in, v_check_out);

    v_ref     := public.generate_booking_reference();
    v_expires := now() + make_interval(mins => v_settings.hold_minutes);

    -- Server picks the unit. A guest who could name one could probe which rooms are occupied.
    for v_unit in
      select ru.id from public.room_units ru
      where ru.room_type_id = v_type_id and ru.active
      order by ru.sort_order, ru.id
    loop
      begin
        insert into public.bookings (
          room_unit_id, booking_reference, status, origin,
          check_in, check_out, guests,
          guest_name, guest_email, guest_phone, guest_notes,
          stay_total, hold_expires_at
        ) values (
          v_unit.id, v_ref, 'held', 'online',
          v_check_in, v_check_out, v_guests,
          p_payload ->> 'guest_name', p_payload ->> 'guest_email',
          p_payload ->> 'guest_phone', p_payload ->> 'guest_notes',
          v_total, v_expires
        ) returning id into v_new_id;

        insert into public.room_occupancy (room_unit_id, source, booking_id, stay_range)
        values (v_unit.id, 'booking', v_new_id, daterange(v_check_in, v_check_out, '[)'));

        insert into public.booking_events (booking_id, actor_id, event_type, new_values)
        values (v_new_id, null, 'created',
                jsonb_build_object('status', 'held', 'origin', 'online',
                                   'check_in', v_check_in, 'check_out', v_check_out));

        return jsonb_build_object('booking_reference', v_ref, 'expires_at', v_expires,
                                  'stay_total', v_total, 'breakdown', v_breakdown);
      exception when exclusion_violation then
        continue;  -- that unit is taken for these dates; try the next
      end;
    end loop;

    raise exception 'no_availability';

  -- === CREATE CONFIRMED - owner, phone or walk-in guest (C4) =========================
  elsif p_action = 'create_confirmed' then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    v_type_id   := (p_payload ->> 'room_type_id')::uuid;
    v_check_in  := (p_payload ->> 'check_in')::date;
    v_check_out := (p_payload ->> 'check_out')::date;
    v_guests    := (p_payload ->> 'guests')::int;

    if v_check_out <= v_check_in then raise exception 'invalid_date_range'; end if;

    select max_occupancy into v_max_occ from public.room_types where id = v_type_id;
    if v_max_occ is null then raise exception 'unknown_room_type'; end if;
    if v_guests < 1 or v_guests > v_max_occ then raise exception 'invalid_guest_count'; end if;

    select * into v_total, v_breakdown from public.price_stay(v_type_id, v_check_in, v_check_out);
    v_ref := public.generate_booking_reference();

    for v_unit in
      select ru.id from public.room_units ru
      where ru.room_type_id = v_type_id and ru.active
      order by ru.sort_order, ru.id
    loop
      begin
        insert into public.bookings (
          room_unit_id, booking_reference, status, origin,
          check_in, check_out, guests,
          guest_name, guest_email, guest_phone, guest_notes,
          stay_total, amount_received
        ) values (
          v_unit.id, v_ref, 'confirmed', 'owner',
          v_check_in, v_check_out, v_guests,
          p_payload ->> 'guest_name', p_payload ->> 'guest_email',
          p_payload ->> 'guest_phone', p_payload ->> 'guest_notes',
          v_total, (p_payload ->> 'amount_received')::numeric
        ) returning id into v_new_id;

        insert into public.room_occupancy (room_unit_id, source, booking_id, stay_range)
        values (v_unit.id, 'booking', v_new_id, daterange(v_check_in, v_check_out, '[)'));

        insert into public.booking_events (booking_id, actor_id, event_type, new_values)
        values (v_new_id, v_actor, 'created',
                jsonb_build_object('status', 'confirmed', 'origin', 'owner'));

        return jsonb_build_object('booking_reference', v_ref, 'stay_total', v_total);
      exception when exclusion_violation then
        continue;
      end;
    end loop;

    raise exception 'no_availability';

  -- === SUBMIT REFERENCE - anonymous guest ============================================
  elsif p_action = 'submit_reference' then
    select * into v_booking from public.bookings
    where booking_reference = upper(trim(p_payload ->> 'booking_reference')) for update;

    if not found then raise exception 'booking_not_found'; end if;
    if v_booking.status <> 'held' then raise exception 'invalid_transition'; end if;

    update public.bookings set
      payment_reference = upper(trim(p_payload ->> 'payment_reference')),
      status            = 'awaiting_verification',
      hold_expires_at   = now() + make_interval(hours => v_settings.awaiting_hours),
      updated_at        = now()
    where id = v_booking.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_booking.id, null, 'state_changed',
            jsonb_build_object('status', 'held'),
            jsonb_build_object('status', 'awaiting_verification'));

    return jsonb_build_object('status', 'awaiting_verification');

  -- === VERIFY - owner records what actually arrived ==================================
  elsif p_action = 'verify' then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    select * into v_booking from public.bookings
    where id = (p_payload ->> 'booking_id')::uuid for update;
    if not found then raise exception 'booking_not_found'; end if;

    -- R13 optimistic concurrency: a lost update here costs money.
    if p_payload ? 'updated_at'
       and v_booking.updated_at <> (p_payload ->> 'updated_at')::timestamptz then
      raise exception 'stale_record';
    end if;

    if v_booking.status not in ('awaiting_verification', 'confirmed') then
      raise exception 'invalid_transition';
    end if;

    -- Constitution II: whatever the owner records is accepted. No amount is enforced, and an
    -- overpayment is displayed rather than refused (FR-016a).
    update public.bookings set
      status = 'confirmed',
      amount_received = (p_payload ->> 'amount_received')::numeric,
      hold_expires_at = null,
      updated_at = now()
    where id = v_booking.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_booking.id, v_actor, 'payment_verified',
            jsonb_build_object('status', v_booking.status),
            jsonb_build_object('status', 'confirmed'));

    return jsonb_build_object('status', 'confirmed');

  -- === CANCEL / REJECT - dates return to availability =================================
  elsif p_action in ('cancel', 'reject') then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    select * into v_booking from public.bookings
    where id = (p_payload ->> 'booking_id')::uuid for update;
    if not found then raise exception 'booking_not_found'; end if;
    if v_booking.status in ('cancelled', 'expired') then raise exception 'booking_terminal'; end if;

    update public.bookings set status = 'cancelled', updated_at = now() where id = v_booking.id;

    -- Deleting the occupancy row is what returns the dates.
    delete from public.room_occupancy where booking_id = v_booking.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_booking.id, v_actor, 'state_changed',
            jsonb_build_object('status', v_booking.status),
            jsonb_build_object('status', 'cancelled', 'reason', p_payload ->> 'reason'));

    return jsonb_build_object('status', 'cancelled');

  -- === CHANGE STAY - owner moves dates or room (C6) ===================================
  elsif p_action = 'change_stay' then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    select * into v_booking from public.bookings
    where id = (p_payload ->> 'booking_id')::uuid for update;
    if not found then raise exception 'booking_not_found'; end if;

    if p_payload ? 'updated_at'
       and v_booking.updated_at <> (p_payload ->> 'updated_at')::timestamptz then
      raise exception 'stale_record';
    end if;

    if v_booking.status in ('cancelled', 'expired') then raise exception 'booking_terminal'; end if;

    v_check_in  := coalesce((p_payload ->> 'check_in')::date,  v_booking.check_in);
    v_check_out := coalesce((p_payload ->> 'check_out')::date, v_booking.check_out);
    if v_check_out <= v_check_in then raise exception 'invalid_date_range'; end if;

    select room_type_id into v_type_id from public.room_units where id = v_booking.room_unit_id;

    -- FR-022c: re-price from rates in force NOW. amount_received is carried across untouched,
    -- so only the balance moves.
    select * into v_total, v_breakdown from public.price_stay(v_type_id, v_check_in, v_check_out);

    v_prev := jsonb_build_object('check_in', v_booking.check_in,
                                 'check_out', v_booking.check_out,
                                 'stay_total', v_booking.stay_total);

    -- Delete and re-insert the occupancy row inside this transaction so the exclusion
    -- constraint adjudicates the move exactly as it adjudicates a creation.
    delete from public.room_occupancy where booking_id = v_booking.id;

    begin
      insert into public.room_occupancy (room_unit_id, source, booking_id, stay_range)
      values (v_booking.room_unit_id, 'booking', v_booking.id,
              daterange(v_check_in, v_check_out, '[)'));
    exception when exclusion_violation then
      raise exception 'dates_unavailable';
    end;

    update public.bookings set
      check_in = v_check_in, check_out = v_check_out,
      stay_total = v_total, updated_at = now()
    where id = v_booking.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_booking.id, v_actor, 'stay_changed', v_prev,
            jsonb_build_object('check_in', v_check_in, 'check_out', v_check_out,
                               'stay_total', v_total));

    return jsonb_build_object('stay_total', v_total, 'breakdown', v_breakdown);

  else
    raise exception 'unknown_action';
  end if;
end $$;

comment on function public.write_booking(text, jsonb) is
  'The only path that mutates bookings or room_occupancy. Owns every state transition (research R1). origin, stay_total, hold_expires_at, and unit selection are all derived here and never accepted from the caller. Emails are normalised by trigger, not by citext (0031).';

-- ---- get_booking_by_reference - the comparison that could never match (0027) ---------

create or replace function public.get_booking_by_reference(p_reference text, p_email text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_row record;
begin
  select b.booking_reference, b.status, b.check_in, b.check_out,
         rt.name as room_type_name, b.stay_total, b.amount_received,
         b.stay_total - coalesce(b.amount_received, 0) as balance
  into v_row
  from public.bookings b
  join public.room_units ru on ru.id = b.room_unit_id
  join public.room_types rt on rt.id = ru.room_type_id
  where b.booking_reference = upper(btrim(p_reference))
    -- Both sides normalised: the stored value by trigger, the input here. Plain text equality,
    -- resolvable from pg_catalog under search_path = ''.
    and b.guest_email = lower(btrim(p_email))
    and b.erased_at is null;

  if not found then
    -- Same shape for both failure modes. Nothing distinguishes them (FR-013b).
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status', 'ok', 'booking_reference', v_row.booking_reference,
    'booking_status', v_row.status, 'check_in', v_row.check_in, 'check_out', v_row.check_out,
    'room_type_name', v_row.room_type_name, 'stay_total', v_row.stay_total,
    'amount_received', v_row.amount_received, 'balance', v_row.balance);
end $$;

-- ---- Erasure and export - the register still drives them (0029) ----------------------

create or replace function public.erase_guest_data(p_email text, p_identity_verified boolean)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_store record; v_email text := lower(btrim(p_email));
  v_counts jsonb := '{}'::jsonb; v_n int; v_booking record;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;
  if not p_identity_verified then raise exception 'identity_not_attested'; end if;

  -- Journal before erasing, on every affected booking. booking_events holds no personal
  -- fields, so this entry survives erasure without defeating it (FR-022g).
  for v_booking in select id from public.bookings where guest_email = v_email loop
    insert into public.booking_events (booking_id, actor_id, event_type, new_values)
    values (v_booking.id, (select auth.uid()), 'guest_erased',
            jsonb_build_object('identity_attested', true, 'at', now()));
  end loop;

  for v_store in select * from public.personal_data_stores loop
    if v_store.disposition = 'delete' then
      execute format('delete from public.%I where %I = $1', v_store.table_name, v_store.key_column)
        using v_email;
      get diagnostics v_n = row_count;
    else
      execute format('update public.%I set %s %s where %I = $1',
        v_store.table_name,
        (select string_agg(format('%I = null', col), ', ') from unnest(v_store.personal_columns) as col),
        case when v_store.table_name = 'bookings' then ', erased_at = now()' else '' end,
        v_store.key_column) using v_email;
      get diagnostics v_n = row_count;
    end if;
    v_counts := v_counts || jsonb_build_object(v_store.table_name, v_n);
  end loop;

  return jsonb_build_object('status', 'erased', 'affected', v_counts);
end $$;

create or replace function public.export_guest_data(p_email text, p_identity_verified boolean)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_store record; v_email text := lower(btrim(p_email));
        v_out jsonb := '{}'::jsonb; v_rows jsonb;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;
  if not p_identity_verified then raise exception 'identity_not_attested'; end if;

  for v_store in select * from public.personal_data_stores loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where t.%I = $1',
      v_store.table_name, v_store.key_column) into v_rows using v_email;
    v_out := v_out || jsonb_build_object(v_store.table_name, v_rows);
  end loop;

  return jsonb_build_object('status', 'ok', 'email', v_email, 'data', v_out);
end $$;

-- ---- save_site_settings - the only write path (0028) ---------------------------------

create or replace function public.save_site_settings(p_settings jsonb)
returns void language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;

  if p_settings ? 'timezone'
     and not exists (select 1 from pg_catalog.pg_timezone_names where name = p_settings ->> 'timezone') then
    raise exception 'invalid_timezone';
  end if;

  -- FR-053b: transport notes are Markdown, same restriction as content pages.
  perform public.reject_raw_html(p_settings ->> 'transport_notes');

  update public.site_settings set
    property_name        = coalesce(p_settings ->> 'property_name', property_name),
    address              = coalesce(p_settings ->> 'address', address),
    latitude             = coalesce((p_settings ->> 'latitude')::numeric, latitude),
    longitude            = coalesce((p_settings ->> 'longitude')::numeric, longitude),
    transport_notes      = coalesce(p_settings ->> 'transport_notes', transport_notes),
    contact_phone        = coalesce(p_settings ->> 'contact_phone', contact_phone),
    contact_email        = coalesce(p_settings ->> 'contact_email', contact_email),
    payment_qr_path      = coalesce(p_settings ->> 'payment_qr_path', payment_qr_path),
    deposit_guidance     = coalesce(p_settings ->> 'deposit_guidance', deposit_guidance),
    timezone             = coalesce(p_settings ->> 'timezone', timezone),
    hold_minutes         = coalesce((p_settings ->> 'hold_minutes')::int, hold_minutes),
    awaiting_hours       = coalesce((p_settings ->> 'awaiting_hours')::int, awaiting_hours),
    min_notice_hours     = coalesce((p_settings ->> 'min_notice_hours')::int, min_notice_hours),
    same_day_cutoff_hour = coalesce((p_settings ->> 'same_day_cutoff_hour')::int, same_day_cutoff_hour),
    scarcity_threshold   = coalesce((p_settings ->> 'scarcity_threshold')::int, scarcity_threshold),
    session_idle_minutes = coalesce((p_settings ->> 'session_idle_minutes')::int, session_idle_minutes),
    booking_retention_months = coalesce((p_settings ->> 'booking_retention_months')::int, booking_retention_months),
    enquiry_retention_months = coalesce((p_settings ->> 'enquiry_retention_months')::int, enquiry_retention_months),
    hero_treatment       = coalesce(p_settings ->> 'hero_treatment', hero_treatment),
    rate_limits          = coalesce(p_settings -> 'rate_limits', rate_limits),
    updated_at           = now()
  where id;

  -- No updated_at staleness check: R13 restricts optimistic concurrency to bookings, rate
  -- overrides, and blocks. A lost settings update costs a retype, not money.
exception when check_violation then
  raise exception 'invalid_range' using detail = sqlerrm;
end $$;

-- ---- Disarm the condition ------------------------------------------------------------
--
-- Nothing references citext now. Dropping it means no future function can reintroduce the
-- fault by writing a comparison that looks case-insensitive and is not.
--
-- btree_gist stays and is NOT affected: an exclusion constraint's operator class is resolved
-- at DDL time and stored in the index, so constraint enforcement does not consult search_path
-- at all. Probed - the overlap constraint still refuses conflicts and still accepts same-day
-- turnover into the same unit.

drop extension if exists citext;
