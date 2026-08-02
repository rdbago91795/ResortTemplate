-- 0015_gallery.sql — T031
--
-- C11: five shipped categories plus any the owner adds, and a room's photographs appear in
-- the Rooms category from ONE upload.
--
-- ⚠ TWO POSITION COLUMNS, and this is the part that would otherwise be got wrong (FR-041c).
--
-- The photograph that best sells a specific room is not necessarily the one that should lead
-- the Rooms category. A single shared order means one surface always gets an order chosen for
-- the other, so each carries its own: `room_position` for the room's page, `gallery_position`
-- for the category.
--
-- `room_position` is required exactly when `room_type_id` is set — a photo attached to a room
-- must have an order on that room's page.
--
-- FR-041d (archiving a room type withdraws its photographs) is a PREDICATE ON THE QUERY, not
-- a mutation here. Un-archiving therefore restores them with no repair step.

create table public.gallery_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  position   int not null default 0,
  is_shipped boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.gallery_categories (id) on delete restrict,
  room_type_id uuid references public.room_types (id) on delete cascade,

  storage_path text not null,

  -- Required, no default (FR-068b). Without it every property image ships unlabelled and the
  -- product cannot be made accessible after the fact.
  alt_text text not null check (char_length(alt_text) between 1 and 300),

  gallery_position int not null default 0,
  room_position    int,

  published_at timestamptz,
  updated_at   timestamptz not null default now(),

  constraint gallery_images_room_position_required
    check (room_type_id is null or room_position is not null)
);

create index gallery_images_category_idx on public.gallery_images (category_id, gallery_position)
  where published_at is not null;
create index gallery_images_room_idx on public.gallery_images (room_type_id, room_position)
  where room_type_id is not null;

comment on table public.gallery_categories is
  'Five ship seeded (C11). All renameable, reorderable, and deletable once empty — deletion while images remain is refused so photographs are never destroyed as a side effect (FR-041e).';

comment on column public.gallery_images.alt_text is
  'Required with no default (FR-068b). The reason this is a column rather than a nicety: the owner must be able to supply it, or accessibility is unfixable after launch.';

comment on column public.gallery_images.room_position is
  'Separate from gallery_position (FR-041c). One image, two surfaces, two independent orders.';
