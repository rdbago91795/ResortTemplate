-- 0002_admin_users.sql — T018
--
-- Exactly one owner account per deployment (C3, FR-069a). Supabase Auth holds the identity;
-- this table holds what Auth does not model.
--
-- NO `disabled_at` COLUMN — deliberately (FR-069g). With one account per deployment,
-- disabling it would lock the property out of its own admin with no route back. A field that
-- can brick a deployment should not exist rather than exist and be governed. Recovery from a
-- compromised account is a password reset (FR-069h), not a disablement.
--
-- `role` carries one value in this release. It exists so that staff accounts can be
-- introduced later as a data change rather than a policy rewrite.

create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'One row per admin. Exactly one in this release (C3). No disabled_at by design (FR-069g).';

comment on column public.admin_users.role is
  'owner in this release. staff is defined but unused — see C3.';
