-- 0041_register_heuristic.sql — corrective, found by running T066
--
-- 0040's heuristic matched `message` as a SUBSTRING, so it flagged two columns in
-- `email_deliveries` that hold no personal data at all:
--
--   message_kind         an enum: 'submission' | 'confirmation'
--   provider_message_id  the email provider's own identifier
--
-- `email_deliveries` is already a registered store — its `recipient` column is in the
-- register and erasure clears it. The register was right; the heuristic was wrong.
--
-- Allowlisting the two would have worked and would have been the wrong fix: the same
-- substring match would flag `message_template`, `message_status`, or `message_id` the next
-- time one is added, and each would be resolved by appending another allowlist line until the
-- allowlist is doing the thinking.
--
-- So the pattern now anchors on the END of the column name:
--
--   (^|_)(message|notes|body)$
--
--   MATCHES      message, guest_notes, enquiry_message, body
--   DOES NOT     message_kind, provider_message_id, message_template
--
-- This is deliberately still a heuristic — nothing in Postgres marks a column as personal
-- data, a human decides. It is tuned to catch a NEW store that skips the register (R16),
-- which is the failure it exists to prevent, while not crying wolf on metadata that happens
-- to be named after the thing it describes.

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
        -- Anchored: `guest_email`, `recipient`, `contact_phone` — but not `email_verified`.
        c.column_name ~* '(^|_)(email|phone|recipient)$'
        or c.column_name ~* '^(guest|full)_name$'
        -- Content, not metadata about content. See the header.
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

comment on function public.personal_data_register_gaps() is
  'R16 / T066. Column-name heuristic anchored at word end, plus an explicit allowlist. Any column that looks personal, is not registered, and is not allowlisted is a gap (0041).';
