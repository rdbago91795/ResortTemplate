-- 0042_register_owner_notes.sql — T066 found a real gap on its first green-adjacent run
--
-- ======================================================================================
-- `bookings.owner_notes` HELD PERSONAL DATA AND WAS NOT IN THE REGISTER.
-- ======================================================================================
--
-- The register listed four columns for `bookings`:
--
--     guest_name, guest_email, guest_phone, guest_notes
--
-- `owner_notes` was not among them. Erasure and export both iterate the register (0032), so
-- a guest who asked to be erased kept the owner's written notes about them on file, and an
-- export told them those notes did not exist.
--
-- IT IS PERSONAL DATA. `guest_notes` is what the guest wrote; `owner_notes` is what the owner
-- wrote ABOUT THE GUEST — "arriving late, call on landing", "allergic to shellfish",
-- "difficult on the phone". Authorship does not decide the question; the data subject does,
-- and under RA 10173 a note about an identifiable person is that person's data.
--
-- The schema already treated it as sensitive without saying so. Migration 0027 excludes it
-- from `get_booking_by_reference` by name:
--
--     NOT returned: guest_phone, guest_notes, owner_notes, state history, or the room unit
--
-- So it was understood to be private FROM the guest, while never being registered as
-- belonging TO the guest. Those are different questions and the second one was missed.
--
-- ── Why this was not caught earlier ──────────────────────────────────────────
--
-- Every earlier probe of erasure used a booking with no owner notes. The register was
-- verified to REACH all three tables and to match rows correctly; nothing checked that the
-- column list within a table was complete. T066 is the check that does, and this is the first
-- thing it found — which is the argument for the test existing.
--
-- ⚠ ERASURE NOW CLEARS owner_notes. That is the intended consequence and is worth stating,
-- because it destroys information the owner wrote and may consider theirs. The alternative is
-- retaining notes about a person who has exercised their right to erasure, which is the thing
-- the law forbids. If a note must survive, it belongs on the room or the property, not on a
-- booking keyed to a named guest.

update public.personal_data_stores
set personal_columns = array['guest_name', 'guest_email', 'guest_phone', 'guest_notes', 'owner_notes']
where table_name = 'bookings';

comment on column public.bookings.owner_notes is
  'The owner''s notes about this booking. PERSONAL DATA: registered in personal_data_stores, cleared by erasure and by retention (0042). Never returned to the guest (0027).';

-- ---- The false positive alongside it --------------------------------------------------
--
-- `site_settings.transport_notes` matched `(^|_)notes$` and is the property's own Markdown
-- directions — how to get from Sayak airport to the resort. No data subject, nothing to
-- erase. Allowlisted with the reason, rather than by loosening the pattern that just found a
-- real gap.

create or replace function public.personal_data_register_gaps()
returns table (table_name text, column_name text)
language sql
stable
security definer
set search_path = ''
as $$
  with candidate as (
    select c.table_name::text as tbl, c.column_name::text as col
    from information_schema.columns c
    join pg_catalog.pg_class pc on pc.relname = c.table_name
    join pg_catalog.pg_namespace pn
      on pn.oid = pc.relnamespace and pn.nspname = 'public'
    where c.table_schema = 'public'
      and pc.relkind = 'r'
      and (
        c.column_name ~* '(^|_)(email|phone|recipient)$'
        or c.column_name ~* '^(guest|full)_name$'
        or c.column_name ~* '(^|_)(message|notes|body)$'
      )
  ),
  registered as (
    select s.table_name as tbl, unnest(s.personal_columns) as col
    from public.personal_data_stores s
  ),
  allowlisted as (
    select * from (values
      -- The property's own published contact details, not a guest's.
      ('site_settings', 'contact_email'),
      ('site_settings', 'contact_phone'),
      -- The property's own directions. Markdown about ferries, not about a person.
      ('site_settings', 'transport_notes'),
      -- The owner's login identity, governed by auth.users and FR-069, not by the register.
      ('admin_users', 'user_id'),
      -- Register metadata describing OTHER tables' columns.
      ('personal_data_stores', 'key_column'),
      ('personal_data_stores', 'personal_columns'),
      -- An enquiry's owner-written note about handling. Unlike bookings.owner_notes this one
      -- is deleted outright with the enquiry row (disposition = 'delete'), so registering the
      -- column individually would change nothing.
      ('enquiries', 'owner_note')
    ) as a(tbl, col)
  )
  select c.tbl, c.col
  from candidate c
  where not exists (select 1 from registered r where r.tbl = c.tbl and r.col = c.col)
    and not exists (select 1 from allowlisted a where a.tbl = c.tbl and a.col = c.col)
  order by 1, 2;
$$;

comment on function public.personal_data_register_gaps() is
  'R16 / T066. Anchored column-name heuristic plus an explicit allowlist. Found bookings.owner_notes unregistered on its first run (0042).';
