-- 0014_enquiries.sql — T030
--
-- RLS-P3 ANON-INTAKE: anon inserts, anon never reads — not even its own row.
--
-- ⚠ IMPLEMENTATION GOTCHA, carried from baseline §1.3: with no anon SELECT policy,
-- `.insert(x).select()` FAILS, because PostgREST's RETURNING needs read access. The client
-- must call `.insert(x)` with no `.select()` and render success from the absence of an error.
-- A feature that forgets this ships broken.
--
-- A PERSONAL DATA STORE (FR-026a). Deleted outright on erasure — an enquiry has no business
-- record to preserve — and purged after the retention period (FR-028d).

create table public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null check (char_length(full_name) between 1 and 120),
  email      citext not null check (char_length(email) between 3 and 254),
  message    text not null check (char_length(message) between 1 and 2000),
  status     text not null default 'new' check (status in ('new', 'handled')),
  owner_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_status_idx on public.enquiries (status, created_at desc);
create index enquiries_email_idx  on public.enquiries (email);

comment on table public.enquiries is
  'Guest messages (RLS-P3). Anon inserts, never reads. A personal data store — deleted on erasure, purged on retention.';
