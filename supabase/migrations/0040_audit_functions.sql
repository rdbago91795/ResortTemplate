-- 0040_audit_functions.sql — required by T066 and T067
--
-- Both tasks assert things about the SCHEMA, and PostgREST exposes no way to query
-- `pg_catalog`. Without these two functions the suites cannot be written at all — the
-- alternative was a direct Postgres connection, which means a new dependency and the database
-- password in CI, to run two read-only queries.
--
-- Read-only, `stable`, and granted to `service_role` only. Neither is reachable with the anon
-- key, so neither adds surface: they return schema metadata, which is exactly what the admin
-- 404 (FR-069c) and the RLS design work to keep from leaking.

-- ---- T067: the §1.5 audit query, verbatim ---------------------------------------------
--
-- Returns findings RAW, including the four tables that are deny-all ON PURPOSE. The
-- allowlist lives in the test, not here, so the exception is visible in the assertion rather
-- than buried in a function nobody reads.
--
-- See tests/rls/schema-audit.test.ts for why "RLS enabled but zero policies" cannot simply be
-- treated as a failure in this schema.

create or replace function public.rls_audit()
returns table (relname text, problem text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.relname::text, 'RLS not enabled'::text
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  union all
  select c.relname::text, 'RLS enabled but zero policies'::text
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    and not exists (select 1 from pg_catalog.pg_policy p where p.polrelid = c.oid)
  union all
  select c.relname::text, 'view without security_invoker'::text
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'v'
    and coalesce((c.reloptions::text like '%security_invoker=true%'), false) is not true;
$$;

revoke all on function public.rls_audit() from public, anon, authenticated;
grant execute on function public.rls_audit() to service_role;

comment on function public.rls_audit() is
  'security-baseline.md 1.5, verbatim. Returns findings raw; the deliberate deny-all allowlist lives in tests/rls/schema-audit.test.ts (T067).';

-- ---- T066: columns that look personal but are not registered ---------------------------
--
-- R16: a new personal-data store that skips `personal_data_stores` must FAIL. Erasure and
-- export both iterate the register (0032), so a store missing from it is silently never
-- erased and silently never exported — the exact defect found three times during
-- specification, and the reason the register exists.
--
-- ⚠ THIS IS A NAME HEURISTIC AND CANNOT BE ANYTHING ELSE. Nothing in Postgres marks a column
-- as personal data; a human decides. So it flags columns whose names match the shapes this
-- schema uses for personal data, and carries an explicit allowlist of matches that are not
-- personal — the property's own contact details, and labels that merely contain "name".
--
-- Adding to the allowlist is a deliberate act with the reason recorded next to it. Anything
-- NOT allowlisted and NOT registered fails T066, which is the behaviour R16 asks for.

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
        c.column_name ~* '(email|phone|recipient)'
        or c.column_name ~* '^(guest|full)_name$'
        or c.column_name ~* '(guest_notes|message)'
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
      -- The owner's login identity, governed by auth.users and FR-069, not by the register.
      ('admin_users', 'user_id'),
      -- Register metadata describing OTHER tables' columns.
      ('personal_data_stores', 'key_column'),
      ('personal_data_stores', 'personal_columns'),
      -- An enquiry's owner-written note about handling, not the enquirer's own words.
      ('enquiries', 'owner_note')
    ) as a(tbl, col)
  )
  select c.tbl, c.col
  from candidate c
  where not exists (select 1 from registered r where r.tbl = c.tbl and r.col = c.col)
    and not exists (select 1 from allowlisted a where a.tbl = c.tbl and a.col = c.col)
  order by 1, 2;
$$;

revoke all on function public.personal_data_register_gaps() from public, anon, authenticated;
grant execute on function public.personal_data_register_gaps() to service_role;

comment on function public.personal_data_register_gaps() is
  'R16 / T066. Name heuristic plus an explicit allowlist: any column that looks personal, is not registered, and is not allowlisted is a gap.';
