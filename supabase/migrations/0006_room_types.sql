-- 0006_room_types.sql — T022
--
-- A category of accommodation. Availability is calculated against room_units, not against
-- this — a property with four Garden Villas has four bookable units.
--
-- `archived_at` rather than deletion for types that have bookings (FR-031, FR-032): archived
-- types vanish from guest pages and from search while their bookings stay readable. Archiving
-- is reversible, which is why it is a nullable timestamp rather than a boolean.

create table public.room_types (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  description       text,
  bed_configuration text,
  max_occupancy     int not null check (max_occupancy between 1 and 20),
  base_nightly_rate numeric(12, 2) not null check (base_nightly_rate > 0),
  sort_order        int not null default 0,
  published_at      timestamptz,
  archived_at       timestamptz,
  updated_at        timestamptz not null default now()
);

create index room_types_visible_idx
  on public.room_types (sort_order)
  where published_at is not null and archived_at is null;

comment on table public.room_types is
  'Accommodation category. Guests see published, unarchived rows only (RLS-P1).';

comment on column public.room_types.sort_order is
  'Owner-set display order (FR-033a). Alphabetical or creation order would put whichever room the owner most wants to sell wherever chance places it.';

comment on column public.room_types.archived_at is
  'Set instead of deleting when bookings exist (FR-031). Reversible — un-archiving restores guest visibility and, via a query predicate, the type''s gallery photographs (FR-041d).';
