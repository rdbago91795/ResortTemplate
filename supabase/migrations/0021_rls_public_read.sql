-- 0021_rls_public_read.sql — T037
--
-- RLS-P1 PUBLIC-READ-PUBLISHED. Anonymous visitors see published, unarchived rows; admins see
-- everything including drafts.
--
-- ⚠ ONE POLICY PER COMMAND. `for all` is forbidden (baseline §1.1 rule 1): USING and
-- WITH CHECK have different semantics per command, and a single `for all` policy reliably
-- gets one of them wrong.
--
-- ⚠ `WITH CHECK` ON UPDATE IS NOT OPTIONAL. Without it, anything running with an admin
-- session can update a row INTO a state the policy would have refused on insert.
--
-- ⚠ `(select public.is_admin())` rather than a bare call, so Postgres caches it as an
-- InitPlan instead of re-evaluating per row (baseline §1.1 rule 2).
--
-- Multiple permissive SELECT policies OR together — which is how anon gets published rows and
-- the admin gets everything without a branch.

-- ── room_types ────────────────────────────────────────────────────────────────
grant select on table public.room_types to anon, authenticated;
grant insert, update, delete on table public.room_types to authenticated;

create policy room_types_select_public on public.room_types
  for select to anon, authenticated
  using (published_at is not null and archived_at is null);

create policy room_types_select_admin on public.room_types
  for select to authenticated using ((select public.is_admin()));

create policy room_types_insert_admin on public.room_types
  for insert to authenticated with check ((select public.is_admin()));

create policy room_types_update_admin on public.room_types
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy room_types_delete_admin on public.room_types
  for delete to authenticated using ((select public.is_admin()));

-- ── rate_overrides ────────────────────────────────────────────────────────────
-- Rates are published prices; nothing is disclosed by reading them.
grant select on table public.rate_overrides to anon, authenticated;
grant insert, update, delete on table public.rate_overrides to authenticated;

create policy rate_overrides_select_public on public.rate_overrides
  for select to anon, authenticated using (true);

create policy rate_overrides_insert_admin on public.rate_overrides
  for insert to authenticated with check ((select public.is_admin()));

create policy rate_overrides_update_admin on public.rate_overrides
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy rate_overrides_delete_admin on public.rate_overrides
  for delete to authenticated using ((select public.is_admin()));

-- ── gallery_categories ────────────────────────────────────────────────────────
grant select on table public.gallery_categories to anon, authenticated;
grant insert, update, delete on table public.gallery_categories to authenticated;

create policy gallery_categories_select_public on public.gallery_categories
  for select to anon, authenticated using (true);

create policy gallery_categories_insert_admin on public.gallery_categories
  for insert to authenticated with check ((select public.is_admin()));

create policy gallery_categories_update_admin on public.gallery_categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy gallery_categories_delete_admin on public.gallery_categories
  for delete to authenticated using ((select public.is_admin()));

-- ── gallery_images ────────────────────────────────────────────────────────────
-- FR-041d: an archived room type's photographs leave the gallery. Expressed as a PREDICATE,
-- not a mutation, so un-archiving restores them with no repair step.
grant select on table public.gallery_images to anon, authenticated;
grant insert, update, delete on table public.gallery_images to authenticated;

create policy gallery_images_select_public on public.gallery_images
  for select to anon, authenticated
  using (
    published_at is not null
    and (
      room_type_id is null
      or exists (
        select 1 from public.room_types rt
        where rt.id = gallery_images.room_type_id and rt.archived_at is null
      )
    )
  );

create policy gallery_images_select_admin on public.gallery_images
  for select to authenticated using ((select public.is_admin()));

create policy gallery_images_insert_admin on public.gallery_images
  for insert to authenticated with check ((select public.is_admin()));

create policy gallery_images_update_admin on public.gallery_images
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy gallery_images_delete_admin on public.gallery_images
  for delete to authenticated using ((select public.is_admin()));

-- ── content_pages ─────────────────────────────────────────────────────────────
-- FR-059 / FR-049a: only the three policy pages are undeletable, and that is enforced in the
-- DELETE policy rather than by hiding a button. Undeletable means legally required, nothing else.
grant select on table public.content_pages to anon, authenticated;
grant insert, update, delete on table public.content_pages to authenticated;

create policy content_pages_select_public on public.content_pages
  for select to anon, authenticated using (published_at is not null);

create policy content_pages_select_admin on public.content_pages
  for select to authenticated using ((select public.is_admin()));

create policy content_pages_insert_admin on public.content_pages
  for insert to authenticated with check ((select public.is_admin()));

create policy content_pages_update_admin on public.content_pages
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy content_pages_delete_admin on public.content_pages
  for delete to authenticated
  using ((select public.is_admin()) and page_kind <> 'policy');
