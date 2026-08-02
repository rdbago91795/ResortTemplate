-- 0022_rls_restricted.sql — T038, T039, T040, T041, T042 combined
--
-- Everything that is not RLS-P1. Grouped because each block is short and they share one
-- principle: the client gets the least verb that works.

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS-P1s SINGLETON-PUBLIC-READ — site_settings, site_branding (T038)
--
-- ⚠ NO CLIENT WRITE POLICY. For branding this is the crux: the colour ramp is derived and
-- contrast enforced server-side (FR-063). A direct PostgREST update walks straight past both,
-- and the owner is already authenticated for it — the one control protecting a non-technical
-- owner from an unreadable site would be advisory. Writes go through RPC/Edge Function only.
-- ═══════════════════════════════════════════════════════════════════════════════

grant select on table public.site_settings to anon, authenticated;
create policy site_settings_select_public on public.site_settings
  for select to anon, authenticated using (true);

grant select on table public.site_branding to anon, authenticated;
create policy site_branding_select_public on public.site_branding
  for select to anon, authenticated using (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS-P4 SERVER-ONLY (T039)
--
-- Zero policies for anon. Guests read NO table that could disclose occupancy — FR-002a
-- enforced structurally rather than by remembering to filter. A guest cannot tell whether a
-- date is taken by a booking or a block because they receive neither.
--
-- bookings: SELECT for admin only. NO insert/update/delete policy for ANY client role —
-- every write goes through write_booking(). The exclusion constraint protects overlap
-- unconditionally, but `with check` cannot see the old row, so it cannot express
-- "confirmed may go to cancelled but not back to held".
-- ═══════════════════════════════════════════════════════════════════════════════

grant select on table public.bookings to authenticated;
create policy bookings_select_admin on public.bookings
  for select to authenticated using ((select public.is_admin()));

grant select, insert, update, delete on table public.room_units to authenticated;
create policy room_units_select_admin on public.room_units
  for select to authenticated using ((select public.is_admin()));
create policy room_units_insert_admin on public.room_units
  for insert to authenticated with check ((select public.is_admin()));
create policy room_units_update_admin on public.room_units
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy room_units_delete_admin on public.room_units
  for delete to authenticated using ((select public.is_admin()));

-- availability_blocks: admin CRUD, no anon anything. `reason` is never public (FR-002a).
grant select, insert, update, delete on table public.availability_blocks to authenticated;
create policy availability_blocks_select_admin on public.availability_blocks
  for select to authenticated using ((select public.is_admin()));
create policy availability_blocks_insert_admin on public.availability_blocks
  for insert to authenticated with check ((select public.is_admin()));
create policy availability_blocks_update_admin on public.availability_blocks
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy availability_blocks_delete_admin on public.availability_blocks
  for delete to authenticated using ((select public.is_admin()));

-- room_occupancy: admin reads for the calendar; writes are RPC-only.
grant select on table public.room_occupancy to authenticated;
create policy room_occupancy_select_admin on public.room_occupancy
  for select to authenticated using ((select public.is_admin()));

-- admin_users, personal_data_stores, rate_limit_events, webhook_events:
-- no grant, no policy, for anyone. Read only by security definer functions.

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS-P7 APPEND-ONLY-AUDIT — booking_events, email_deliveries (T040)
--
-- An audit trail anyone can edit is not an audit trail. SELECT and nothing else, ever.
-- Rows arrive only from write_booking() and the email functions.
-- ═══════════════════════════════════════════════════════════════════════════════

grant select on table public.booking_events to authenticated;
create policy booking_events_select_admin on public.booking_events
  for select to authenticated using ((select public.is_admin()));

grant select on table public.email_deliveries to authenticated;
create policy email_deliveries_select_admin on public.email_deliveries
  for select to authenticated using ((select public.is_admin()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS-P3 ANON-INTAKE — enquiries (T041)
--
-- Anon writes and can never read — not their own row, not anyone's.
--
-- ⚠ The `with check` is a SECOND validation layer, not the primary one. It also forces the
-- created_at default, blocking backdating.
--
-- ⚠ With no anon SELECT policy, `.insert(x).select()` FAILS — PostgREST's RETURNING needs
-- read access. The client must call `.insert(x)` with no `.select()`.
-- ═══════════════════════════════════════════════════════════════════════════════

grant insert on table public.enquiries to anon;
grant select, update, delete on table public.enquiries to authenticated;

create policy enquiries_insert_anon on public.enquiries
  for insert to anon
  with check (
    status = 'new'
    and owner_note is null
    and char_length(full_name) between 1 and 120
    and char_length(message) between 1 and 2000
    and char_length(email) between 3 and 254
  );

create policy enquiries_select_admin on public.enquiries
  for select to authenticated using ((select public.is_admin()));
create policy enquiries_update_admin on public.enquiries
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy enquiries_delete_admin on public.enquiries
  for delete to authenticated using ((select public.is_admin()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- page_sections (T042) — UPDATE ONLY
--
-- No insert, no delete, for any client role. The catalogue is the template's; the owner
-- arranges it. That distinction is what makes C10 section arrangement rather than a page
-- builder, and it is enforced by the absence of policies rather than by a hidden button.
-- ═══════════════════════════════════════════════════════════════════════════════

grant select on table public.page_sections to anon, authenticated;
grant update on table public.page_sections to authenticated;

create policy page_sections_select_public on public.page_sections
  for select to anon, authenticated using (true);

create policy page_sections_update_admin on public.page_sections
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
