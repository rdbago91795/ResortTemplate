-- 0020_rls_enable.sql — T036
--
-- Constitution VIII, non-negotiable: RLS enabled on EVERY table, with `force` so it applies
-- to the table owner too.
--
-- ⚠ RLS IS THE ROW GATE. `GRANT` IS THE TABLE GATE. BOTH ARE REQUIRED (baseline §1.1).
--
-- A table with perfect policies but a blanket grant still leaks through any operation the
-- policies did not anticipate. A revoked grant with no policy is a table nobody can use. This
-- migration revokes everything first; the following migrations grant back exactly the verbs
-- each pattern needs.
--
-- After this migration and before 0021–0026, the database is CLOSED. That is the correct
-- intermediate state.

do $$
declare t text;
begin
  foreach t in array array[
    'admin_users', 'site_settings', 'site_branding',
    'room_types', 'room_units', 'rate_overrides',
    'bookings', 'availability_blocks', 'room_occupancy',
    'booking_events', 'email_deliveries', 'enquiries',
    'gallery_categories', 'gallery_images', 'content_pages', 'page_sections',
    'personal_data_stores', 'rate_limit_events', 'webhook_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;
