-- 0037_storage_buckets.sql — T050a
--
-- Three buckets. Placed before the seed (T051) and the imagery (T054) because both reference
-- stored objects.
--
-- ======================================================================================
-- SVG IS EXCLUDED AT THE BUCKET, NOT IN THE UPLOAD FORM.
-- ======================================================================================
--
-- An SVG is a script container: `<svg onload=...>` served from your own origin is stored XSS
-- against every visitor. A client-side accept="" attribute is a hint to a file picker, not a
-- control — it is bypassed by any direct API call. allowed_mime_types is enforced by Storage
-- itself, so no request path evades it by simply renaming the file.
--
-- ⚠ CORRECTION (probed 2026-08-01, before T054's imagery arrived). The sentence above
-- originally read "there is no request path that evades it". That was too strong, and the
-- probe disproved it: `allowed_mime_types` checks the DECLARED `Content-Type` header, not the
-- bytes. SVG content sent as `Content-Type: image/jpeg` is stored.
--
-- What still holds: an SVG declared honestly is refused, and a relabelled one is SERVED as
-- image/jpeg with `X-Content-Type-Options: nosniff` from a separate origin, so no browser
-- parses it as SVG and the script never runs. Uploads are admin-only besides.
--
-- What does NOT hold: this bucket alone is not the complete gate. security-baseline.md §5.2
-- already requires "Magic bytes server-side. Never trust the extension or the client
-- Content-Type" plus a server-side re-encode — neither exists yet. Both belong with
-- `ImageUploader` in US7, and T133 is the task that proves them.
--
-- This is also why the design system bans SVG for the logo (design-system 3.5): the logo is
-- the one image a resort owner is most likely to have as an SVG, so the ban has to be stated
-- where they will hit it AND enforced where it cannot be argued with.
--
-- Sizes: 5 MB for photography, 2 MB for the payment QR. Both are generous for their purpose
-- and small enough that a mistake is cheap.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Guest-facing photography the owner uploads: rooms, gallery, hero, logo.
  ('public-media', 'public-media', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),

  -- The fictional demo property. Separate from public-media so `pnpm seed:teardown` can
  -- remove every demo object without touching anything the owner uploaded.
  ('demo-assets', 'demo-assets', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),

  -- PRIVATE. The payment QR is gated behind a confirmed booking (C8), so it must not be
  -- reachable by URL. public = false AND no select policy below: a signed URL issued
  -- server-side after checking the booking is the only way in.
  ('payment-assets', 'payment-assets', false, 2097152,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---- Policies ------------------------------------------------------------------------
--
-- storage.objects has RLS on already. One policy per operation per role, per constitution.
-- Writes are admin-only everywhere: there is no guest upload anywhere in this product.

drop policy if exists public_media_read       on storage.objects;
drop policy if exists public_media_insert     on storage.objects;
drop policy if exists public_media_update     on storage.objects;
drop policy if exists public_media_delete     on storage.objects;
drop policy if exists demo_assets_read        on storage.objects;
drop policy if exists demo_assets_insert      on storage.objects;
drop policy if exists demo_assets_update      on storage.objects;
drop policy if exists demo_assets_delete      on storage.objects;
drop policy if exists payment_assets_insert   on storage.objects;
drop policy if exists payment_assets_update   on storage.objects;
drop policy if exists payment_assets_delete   on storage.objects;

-- public-media: anyone reads, only an admin writes.
create policy public_media_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-media');

create policy public_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-media' and public.is_admin());

create policy public_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'public-media' and public.is_admin())
  with check (bucket_id = 'public-media' and public.is_admin());

create policy public_media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'public-media' and public.is_admin());

-- demo-assets: same shape. The seed writes here with the service role, which bypasses RLS;
-- these policies exist so an owner can also clear demo imagery from the admin surface.
create policy demo_assets_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'demo-assets');

create policy demo_assets_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'demo-assets' and public.is_admin());

create policy demo_assets_update on storage.objects
  for update to authenticated
  using (bucket_id = 'demo-assets' and public.is_admin())
  with check (bucket_id = 'demo-assets' and public.is_admin());

create policy demo_assets_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'demo-assets' and public.is_admin());

-- payment-assets: NO SELECT POLICY FOR ANY ROLE. Not an oversight — reading is deliberately
-- impossible through the client API, including for the owner. The QR reaches a guest only as
-- a signed URL minted server-side once their booking is confirmed.
create policy payment_assets_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-assets' and public.is_admin());

create policy payment_assets_update on storage.objects
  for update to authenticated
  using (bucket_id = 'payment-assets' and public.is_admin())
  with check (bucket_id = 'payment-assets' and public.is_admin());

create policy payment_assets_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-assets' and public.is_admin());
