-- 0011_room_occupancy.sql — T027
--
-- ══════════════════════════════════════════════════════════════════════════════════════
-- THE CORRECTNESS CORE. Constitution Principle III is non-negotiable, and this table is
-- how it is discharged.
-- ══════════════════════════════════════════════════════════════════════════════════════
--
-- WHY THIS TABLE EXISTS AT ALL:
--
--   FR-004  prevents two bookings overlapping on one unit.
--   FR-037  prevents a block and a booking both claiming one unit.
--   FR-037a extends FR-037 to MOVING a block, not only creating one.
--
-- That is ONE guarantee spanning TWO source tables. A Postgres exclusion constraint governs
-- one table, so bookings and blocks each project exactly one row into this one, inserted in
-- the same transaction as their parent.
--
-- `occupancy_no_overlap` therefore discharges FR-004, FR-037, FR-037a and SC-001 together,
-- across ALL FOUR WRITERS — a guest's hold, an owner-created booking, an owner moving a
-- booking, and an owner moving a block — with no code path able to opt out.
--
-- FR-037a costs nothing here: a block whose dates change re-projects its occupancy row in the
-- same transaction and the constraint adjudicates the move exactly as it adjudicates a
-- creation. Had the constraint lived on `bookings` with a trigger checking blocks, FR-037a
-- would have needed a second implementation — and it would have been the one nobody
-- load-tested.
--
-- REJECTED: a trigger checking across the two tables. It reintroduces precisely the
-- check-then-act race the constraint exists to close.
--
-- Cancelling or expiring a booking DELETES its occupancy row — that is what returns the dates
-- to availability. FR-067e's reversal re-inserts it, and therefore fails if another booking
-- took the dates meanwhile, which is correct and needs no extra rule.

create table public.room_occupancy (
  id           uuid primary key default gen_random_uuid(),
  room_unit_id uuid not null references public.room_units (id) on delete restrict,

  source     text not null check (source in ('booking', 'block')),
  booking_id uuid unique references public.bookings (id) on delete cascade,
  block_id   uuid unique references public.availability_blocks (id) on delete cascade,

  stay_range daterange not null,

  constraint occupancy_source_matches check (
    (source = 'booking' and booking_id is not null and block_id is null) or
    (source = 'block'   and block_id is not null and booking_id is null)
  ),

  constraint occupancy_no_overlap
    exclude using gist (room_unit_id with =, stay_range with &&)
);

create index room_occupancy_unit_idx on public.room_occupancy using gist (room_unit_id, stay_range);

comment on table public.room_occupancy is
  'Single source of truth for what makes a unit unavailable. Bookings and blocks both project here so ONE exclusion constraint governs both (FR-004, FR-037, FR-037a, SC-001).';

comment on constraint occupancy_no_overlap on public.room_occupancy is
  'Constitution III, non-negotiable. Holds under concurrency, under a buggy RPC, under a future maintenance script, and under the service role key. An application-level check does not.';
