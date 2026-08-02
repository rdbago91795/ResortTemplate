-- 0003_helpers.sql — T019
--
-- The role helpers every RLS policy calls.
--
-- `security definer` is LOAD-BEARING, not incidental: it lets the helper read admin_users
-- without triggering that table's own RLS, which would otherwise recurse infinitely when a
-- policy calls it.
--
-- `set search_path = ''` is equally load-bearing (baseline §1.1 rule 4). Without it, a
-- caller-controlled search_path can shadow public.admin_users and the function runs
-- privileged against attacker-chosen objects. Every identifier below is schema-qualified.
--
-- `(select auth.uid())` rather than bare `auth.uid()` so Postgres caches it as an InitPlan
-- instead of re-evaluating per row — a 10–100× difference on list queries (baseline §1.1
-- rule 2).

create or replace function public.has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.role = any(p_roles)
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(array['owner', 'staff']);
$$;

-- Never executable by anon. An unauthenticated caller has no business asking.
revoke all on function public.has_role(text[]) from public, anon;
revoke all on function public.is_admin() from public, anon;

grant execute on function public.has_role(text[]) to authenticated;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'True when the caller is a signed-in admin. security definer + pinned search_path — see baseline §1.1.';
