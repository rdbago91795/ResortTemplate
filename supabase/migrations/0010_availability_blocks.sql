-- 0010_availability_blocks.sql — T026
--
-- Dates withheld for maintenance, the owner's own use, or a guest taken by phone.
--
-- ⚠ `reason` IS NEVER PUBLIC (FR-002a). This table gets no anon policy at all. The obvious
-- implementation would expose blocks so the guest calendar can grey out dates — and reasons
-- read "owner's family staying" or "repairs after typhoon damage". Guests need to know a date
-- is unavailable; they do not need to know why, or that a block rather than a booking caused
-- it. Availability reaches guests only through search_availability().

create table public.availability_blocks (
  id           uuid primary key default gen_random_uuid(),
  room_unit_id uuid not null references public.room_units (id) on delete cascade,
  reason       text not null check (char_length(reason) between 1 and 200),
  starts_on    date not null,
  ends_on      date not null,
  updated_at   timestamptz not null default now(),

  date_range daterange generated always as (daterange(starts_on, ends_on, '[)')) stored,

  constraint availability_blocks_dates_ordered check (ends_on > starts_on)
);

create index availability_blocks_unit_idx
  on public.availability_blocks using gist (room_unit_id, date_range);

comment on table public.availability_blocks is
  'Owner-withheld dates. No anon policy — reason is never public (FR-002a).';

comment on column public.availability_blocks.reason is
  'Private operational note. Publishing it would leak the property''s internal state to anyone browsing.';
