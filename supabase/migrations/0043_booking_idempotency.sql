-- 0043_booking_idempotency.sql — FR-019, required by T076
--
-- ======================================================================================
-- A REPEATED SUBMISSION MUST PRODUCE ONE HOLD, NOT TWO.
-- ======================================================================================
--
-- FR-019 requires a repeated booking submission from the same attempt to produce a single
-- hold. `write_booking('hold')` accepted no idempotency key, so it could not: a double-tap on
-- a slow connection, or a retry after a timeout the guest never saw resolve, creates a second
-- hold on a SECOND UNIT. The guest is then holding two rooms, the property shows one fewer
-- available than it has, and the surplus does not clear until the hold expires.
--
-- This is also the answer to CHK002 in checklists/flows.md — "a guest whose booking
-- submission times out and who cannot tell whether they now hold a room". With a request id
-- the retry is safe, so the interface can simply retry rather than having to ask.
--
-- ── Why a client-generated id and not a natural key ──────────────────────────
--
-- Deduplicating on (room_type_id, dates, guest_email) would be wrong: a guest legitimately
-- booking a second room for the same dates is FR-019a's explicit case, and a natural key
-- would silently refuse it. The client generates a uuid per submission attempt and reuses it
-- across retries of that attempt. Two deliberate bookings carry two ids.
--
-- ── Why the unique index is partial ──────────────────────────────────────────
--
-- Owner-created bookings (`create_confirmed`) and every row seeded or migrated before this
-- carry NULL. A plain unique index tolerates many NULLs in Postgres, but the partial index
-- states the intent and stays smaller.
--
-- ⚠ THE REPLAY PATH RETURNS THE ORIGINAL, IT DOES NOT ERROR. An idempotent endpoint that
-- raises on a duplicate has not solved the problem — the client still cannot tell "already
-- done" from "failed". It returns the same payload the first call did.

alter table public.bookings
  add column if not exists request_id uuid;

comment on column public.bookings.request_id is
  'Client-generated per booking ATTEMPT, reused across retries of that attempt (FR-019). Null for owner-created and pre-0043 bookings.';

create unique index if not exists bookings_request_id_key
  on public.bookings (request_id)
  where request_id is not null;

-- ---- write_booking: hold becomes idempotent -------------------------------------------
--
-- Reproduced from 0034 with THREE changes, all confined to the `hold` branch:
--   1. reads `request_id` from the payload
--   2. returns the existing booking when that id has already been used
--   3. stores it on insert, and treats a concurrent unique_violation as a replay
--
-- Everything else is byte-identical to 0034.

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
  v_request_id uuid;
  v_existing   public.bookings%rowtype;
begin
  select * into v_settings from public.site_settings where id;
  if not found then raise exception 'settings_missing'; end if;

  v_today := (now() at time zone v_settings.timezone)::date;

  if p_action in ('hold', 'create_confirmed', 'change_stay') then
    perform public.expire_stale_holds();
  end if;

  if p_action = 'hold' then
    if v_is_admin then
      raise exception 'not_authorised' using detail = 'admins use create_confirmed';
    end if;

    -- CHANGE 1: the idempotency key.
    v_request_id := (p_payload ->> 'request_id')::uuid;

    -- CHANGE 2: replay. Returns the ORIGINAL result, not an error.
    if v_request_id is not null then
      select * into v_existing from public.bookings where request_id = v_request_id;
      if found then
        return jsonb_build_object(
          'booking_reference', v_existing.booking_reference,
          'expires_at',        v_existing.hold_expires_at,
          'stay_total',        v_existing.stay_total,
          'replayed',          true
        );
      end if;
    end if;

    v_type_id   := (p_payload ->> 'room_type_id')::uuid;
    v_check_in  := (p_payload ->> 'check_in')::date;
    v_check_out := (p_payload ->> 'check_out')::date;
    v_guests    := (p_payload ->> 'guests')::int;

    if v_check_out <= v_check_in then raise exception 'invalid_date_range'; end if;
    if v_check_in < v_today then raise exception 'check_in_in_past'; end if;
    if v_check_out - v_check_in > 30 then raise exception 'stay_too_long'; end if;
    if v_check_in > v_today + 365 then raise exception 'too_far_ahead'; end if;

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
          stay_total, hold_expires_at, request_id
        ) values (
          v_unit.id, v_ref, 'held', 'online',
          v_check_in, v_check_out, v_guests,
          p_payload ->> 'guest_name', p_payload ->> 'guest_email',
          p_payload ->> 'guest_phone', p_payload ->> 'guest_notes',
          v_total, v_expires, v_request_id     -- CHANGE 3
        ) returning id into v_new_id;

        insert into public.room_occupancy (room_unit_id, source, booking_id, stay_range)
        values (v_unit.id, 'booking', v_new_id, daterange(v_check_in, v_check_out, '[)'));

        insert into public.booking_events (booking_id, actor_id, event_type, new_values)
        values (v_new_id, null, 'created',
                jsonb_build_object('status', 'held', 'origin', 'online',
                                   'check_in', v_check_in, 'check_out', v_check_out));

        return jsonb_build_object('booking_reference', v_ref, 'expires_at', v_expires,
                                  'stay_total', v_total, 'breakdown', v_breakdown);
      exception
        when exclusion_violation then
          continue;  -- that unit is taken for these dates; try the next
        when unique_violation then
          -- Two retries of the SAME attempt raced past the check above. The other
          -- transaction won; return what it created rather than failing this one.
          select * into v_existing from public.bookings where request_id = v_request_id;
          if found then
            return jsonb_build_object(
              'booking_reference', v_existing.booking_reference,
              'expires_at',        v_existing.hold_expires_at,
              'stay_total',        v_existing.stay_total,
              'replayed',          true
            );
          end if;
          raise;
      end;
    end loop;

    raise exception 'no_availability';

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

  elsif p_action = 'submit_reference' then
    select * into v_booking from public.bookings
    where booking_reference = upper(trim(p_payload ->> 'booking_reference')) for update;

    if not found then raise exception 'booking_not_found'; end if;
    if v_booking.status <> 'held' then raise exception 'invalid_transition'; end if;

    if v_booking.hold_expires_at is not null and v_booking.hold_expires_at < now() then
      raise exception 'hold_expired' using
        detail = 'this hold passed its deadline and the dates were released';
    end if;

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

  elsif p_action = 'verify' then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    select * into v_booking from public.bookings
    where id = (p_payload ->> 'booking_id')::uuid for update;
    if not found then raise exception 'booking_not_found'; end if;

    if p_payload ? 'updated_at'
       and v_booking.updated_at <> (p_payload ->> 'updated_at')::timestamptz then
      raise exception 'stale_record';
    end if;

    if v_booking.status not in ('awaiting_verification', 'confirmed') then
      raise exception 'invalid_transition';
    end if;

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

  elsif p_action in ('cancel', 'reject') then
    if not v_is_admin then raise exception 'not_authorised'; end if;

    select * into v_booking from public.bookings
    where id = (p_payload ->> 'booking_id')::uuid for update;
    if not found then raise exception 'booking_not_found'; end if;
    if v_booking.status in ('cancelled', 'expired') then raise exception 'booking_terminal'; end if;

    update public.bookings set status = 'cancelled', updated_at = now() where id = v_booking.id;
    delete from public.room_occupancy where booking_id = v_booking.id;

    insert into public.booking_events (booking_id, actor_id, event_type, previous_values, new_values)
    values (v_booking.id, v_actor, 'state_changed',
            jsonb_build_object('status', v_booking.status),
            jsonb_build_object('status', 'cancelled', 'reason', p_payload ->> 'reason'));

    return jsonb_build_object('status', 'cancelled');

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
    select * into v_total, v_breakdown from public.price_stay(v_type_id, v_check_in, v_check_out);

    v_prev := jsonb_build_object('check_in', v_booking.check_in,
                                 'check_out', v_booking.check_out,
                                 'stay_total', v_booking.stay_total);

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
