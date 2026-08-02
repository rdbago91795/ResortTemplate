-- 0028_admin_rpcs.sql — T047
--
-- Owner writes that are not bookings. Each gated on is_admin().
--
-- Two rely on EXCLUSION CONSTRAINTS rather than pre-checks — a `select ... where not exists`
-- races, and both FR-029b and FR-037/FR-037a require the guarantee under simultaneous
-- requests.
--
-- R13 optimistic concurrency applies to rate overrides and availability blocks (and to
-- bookings, in write_booking). Everything else is last-write-wins: a lost update on a gallery
-- caption costs a retype; on a rate or a block it costs money or a double-booking.

-- ── Rate overrides ────────────────────────────────────────────────────────────
create or replace function public.upsert_rate_override(p_payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_id uuid := (p_payload ->> 'id')::uuid;
  v_existing public.rate_overrides%rowtype;
  v_conflict record;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;

  if v_id is not null then
    select * into v_existing from public.rate_overrides where id = v_id for update;
    if not found then raise exception 'not_found'; end if;
    if p_payload ? 'updated_at'
       and v_existing.updated_at <> (p_payload ->> 'updated_at')::timestamptz then
      raise exception 'stale_record';
    end if;
  end if;

  begin
    if v_id is null then
      insert into public.rate_overrides (room_type_id, label, starts_on, ends_on, nightly_rate)
      values ((p_payload ->> 'room_type_id')::uuid, p_payload ->> 'label',
              (p_payload ->> 'starts_on')::date, (p_payload ->> 'ends_on')::date,
              (p_payload ->> 'nightly_rate')::numeric)
      returning id into v_id;
    else
      update public.rate_overrides set
        label = p_payload ->> 'label',
        starts_on = (p_payload ->> 'starts_on')::date,
        ends_on = (p_payload ->> 'ends_on')::date,
        nightly_rate = (p_payload ->> 'nightly_rate')::numeric,
        updated_at = now()
      where id = v_id;
    end if;
  exception when exclusion_violation then
    -- FR-029b: name WHICH override it conflicts with, not just that it conflicts.
    select id, label, starts_on, ends_on into v_conflict
    from public.rate_overrides
    where room_type_id = (p_payload ->> 'room_type_id')::uuid
      and date_range && daterange((p_payload ->> 'starts_on')::date,
                                  (p_payload ->> 'ends_on')::date, '[)')
      and (v_id is null or id <> v_id)
    limit 1;
    raise exception 'rate_overlap' using
      detail = format('conflicts with "%s" (%s to %s)',
                      v_conflict.label, v_conflict.starts_on, v_conflict.ends_on);
  end;

  return jsonb_build_object('id', v_id);
end $$;

revoke all on function public.upsert_rate_override(jsonb) from public, anon;
grant execute on function public.upsert_rate_override(jsonb) to authenticated;

-- ── Availability blocks ───────────────────────────────────────────────────────
--
-- ⚠ COVERS MOVEMENT, NOT ONLY CREATION (FR-037a). Changing a block's dates deletes and
-- re-inserts its room_occupancy row inside this transaction, so the exclusion constraint
-- adjudicates the move exactly as it adjudicates a creation. No second code path.

create or replace function public.upsert_availability_block(p_payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_id uuid := (p_payload ->> 'id')::uuid;
  v_existing public.availability_blocks%rowtype;
  v_unit uuid := (p_payload ->> 'room_unit_id')::uuid;
  v_from date := (p_payload ->> 'starts_on')::date;
  v_to   date := (p_payload ->> 'ends_on')::date;
  v_ref  text;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;
  if v_to <= v_from then raise exception 'invalid_date_range'; end if;

  if v_id is not null then
    select * into v_existing from public.availability_blocks where id = v_id for update;
    if not found then raise exception 'not_found'; end if;
    if p_payload ? 'updated_at'
       and v_existing.updated_at <> (p_payload ->> 'updated_at')::timestamptz then
      raise exception 'stale_record';
    end if;
    delete from public.room_occupancy where block_id = v_id;
    update public.availability_blocks set
      room_unit_id = v_unit, reason = p_payload ->> 'reason',
      starts_on = v_from, ends_on = v_to, updated_at = now()
    where id = v_id;
  else
    insert into public.availability_blocks (room_unit_id, reason, starts_on, ends_on)
    values (v_unit, p_payload ->> 'reason', v_from, v_to)
    returning id into v_id;
  end if;

  begin
    insert into public.room_occupancy (room_unit_id, source, block_id, stay_range)
    values (v_unit, 'block', v_id, daterange(v_from, v_to, '[)'));
  exception when exclusion_violation then
    select b.booking_reference into v_ref
    from public.room_occupancy ro
    join public.bookings b on b.id = ro.booking_id
    where ro.room_unit_id = v_unit and ro.stay_range && daterange(v_from, v_to, '[)')
    limit 1;
    raise exception 'block_conflicts_booking' using
      detail = coalesce('booking ' || v_ref, 'another block');
  end;

  return jsonb_build_object('id', v_id);
end $$;

revoke all on function public.upsert_availability_block(jsonb) from public, anon;
grant execute on function public.upsert_availability_block(jsonb) to authenticated;

-- ── Page sections — UPDATE ONLY (R14, C10) ────────────────────────────────────
create or replace function public.set_page_section(
  p_page text, p_section_type text, p_enabled boolean, p_position int
)
returns void language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;

  update public.page_sections
  set enabled = p_enabled, position = p_position, updated_at = now()
  where page = p_page and section_type = p_section_type;

  if not found then raise exception 'unknown_section'; end if;
exception when check_violation then
  -- Surfaced from availability_always_enabled, not from application logic.
  raise exception 'section_required' using
    detail = 'the availability search cannot be switched off (FR-050c)';
end $$;

revoke all on function public.set_page_section(text, text, boolean, int) from public, anon;
grant execute on function public.set_page_section(text, text, boolean, int) to authenticated;

-- ── Content pages — the HTML gate (C7, FR-045a) ───────────────────────────────
--
-- ⚠ THIS IS WHERE THE MARKDOWN GUARANTEE LIVES. The column is `text`; no check constraint can
-- detect HTML. Rejecting at save is what makes `Prose` safe to render without a sanitiser.

create or replace function public.reject_raw_html(p_text text)
returns void language plpgsql immutable set search_path = ''
as $$
declare v_match text;
begin
  if p_text is null then return; end if;
  select (regexp_match(p_text, '</?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?/?>'))[1] into v_match;
  if v_match is not null or p_text ~ '</?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?/?>' then
    raise exception 'html_not_allowed' using
      detail = substring(p_text from '</?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?/?>');
  end if;
end $$;

revoke all on function public.reject_raw_html(text) from public, anon, authenticated;

create or replace function public.save_content_page(p_payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare v_id uuid := (p_payload ->> 'id')::uuid;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;

  perform public.reject_raw_html(p_payload ->> 'body_markdown');

  if v_id is null then
    insert into public.content_pages (slug, page_kind, title, menu_label, menu_position,
                                      body_markdown, published_at)
    values (p_payload ->> 'slug', coalesce(p_payload ->> 'page_kind', 'content'),
            p_payload ->> 'title', p_payload ->> 'menu_label',
            coalesce((p_payload ->> 'menu_position')::int, 0),
            coalesce(p_payload ->> 'body_markdown', ''),
            (p_payload ->> 'published_at')::timestamptz)
    returning id into v_id;
  else
    update public.content_pages set
      title = p_payload ->> 'title',
      menu_label = p_payload ->> 'menu_label',
      menu_position = coalesce((p_payload ->> 'menu_position')::int, menu_position),
      body_markdown = coalesce(p_payload ->> 'body_markdown', body_markdown),
      published_at = (p_payload ->> 'published_at')::timestamptz,
      updated_at = now()
    where id = v_id;
  end if;

  return jsonb_build_object('id', v_id);
end $$;

revoke all on function public.save_content_page(jsonb) from public, anon;
grant execute on function public.save_content_page(jsonb) to authenticated;

-- ── Site settings — the only write path (baseline P1s) ────────────────────────
create or replace function public.save_site_settings(p_settings jsonb)
returns void language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;

  if p_settings ? 'timezone'
     and not exists (select 1 from pg_catalog.pg_timezone_names
                     where name = p_settings ->> 'timezone') then
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
    contact_email        = coalesce((p_settings ->> 'contact_email')::public.citext, contact_email),
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

revoke all on function public.save_site_settings(jsonb) from public, anon;
grant execute on function public.save_site_settings(jsonb) to authenticated;
