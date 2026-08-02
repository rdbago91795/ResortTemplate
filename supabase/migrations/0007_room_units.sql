-- 0007_room_units.sql — T023
--
-- A single physical room. THIS is what availability is calculated against, and what the
-- occupancy exclusion constraint in 0011 keys on.
--
-- The relationship is 1 : 0..N deliberately. A room type being drafted has no units and
-- simply never appears in availability — forcing at least one would block the owner
-- mid-edit (data-model.md cardinality table).
--
-- `on delete restrict` on the type reference: deleting a type that still has units must fail
-- loudly rather than cascade away inventory that bookings may point at.

create table public.room_units (
  id           uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types (id) on delete restrict,
  label        text not null,
  sort_order   int not null default 0,
  active       boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (room_type_id, label)
);

create index room_units_type_idx on public.room_units (room_type_id, sort_order);

comment on table public.room_units is
  'One physical room. Availability and the occupancy exclusion constraint key on this, not on room_types.';

comment on column public.room_units.label is
  'Owner-facing identifier such as "Villa 3". Never shown to guests — they choose a type, and the unit is selected server-side so a guest cannot probe which specific units are occupied.';
