-- 0034_write_booking_lazy_expiry.sql — T050 (part 2 of 2)
--
-- Reproduced from 0032 with TWO changes. Everything else is byte-identical.
--
-- 1. PURGE BEFORE SEEKING CAPACITY. `hold`, `create_confirmed`, and `change_stay` call
--    expire_stale_holds() first, so the exclusion constraint adjudicates against true state
--    rather than against rows a scheduler has not got around to deleting yet.
--
--    Deliberately NOT called for `verify`, `cancel`, `reject`, or `submit_reference`. Those
--    do not need free capacity, and for `verify` it would be actively wrong: an owner
--    verifying a payment that arrived just after the deadline would find the booking expired
--    out from under them mid-transaction. Whether to honour a late payment is the owner's
--    call, not the scheduler's.
--
-- 2. AN EXPIRED HOLD CANNOT BE PAID FOR. Lazy expiry makes this reachable: between deadline
--    and tidy-up the row still reads 'held', and without this guard a guest could submit a
--    payment reference for a hold whose room another guest has since taken — moving it to
--    awaiting_verification with no occupancy row behind it. Raised as `hold_expired`, not
--    `invalid_transition`, so the interface can say what actually happened and offer the
--    dates again rather than showing a generic failure.

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

  -- CHANGE 1: release lapsed holds before any action that needs capacity.
  if p_action in ('hold', 'create_confirmed', 'change_stay') then
    perform public.expire_stale_holds();
  end if;

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
        continue;
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

    -- CHANGE 2: the hold lapsed. Its room may already belong to someone else.
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
    -- overpayment is displayed rather than refused (FR-016a). A payment that arrived after
    -- the deadline is still the owner's to honour — no expiry check here, by design.
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

    -- FR-022c: re-price from rates in force NOW. amount_received carries across untouched.
    select * into v_total, v_breakdown from public.price_stay(v_type_id, v_check_in, v_check_out);

    v_prev := jsonb_build_object('check_in', v_booking.check_in,
                                 'check_out', v_booking.check_out,
                                 'stay_total', v_booking.stay_total);

    -- Delete and re-insert inside this transaction so the exclusion constraint adjudicates
    -- the move exactly as it adjudicates a creation.
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
