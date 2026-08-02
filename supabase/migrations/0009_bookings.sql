-- 0009_bookings.sql — T025
--
-- One booking = exactly one room unit (C2). A group taking three rooms creates three
-- bookings, three references, three verifications. That is enforced structurally by the
-- 1 : 1 relationship to room_occupancy in 0011, not by convention.
--
-- ⚠ NO CLIENT WRITE POLICY will exist on this table (baseline §1.3, as amended). Reads are
-- admin-only; EVERY write goes through public.write_booking(). There are three ways a booking
-- gets written — a guest's hold, an owner-created booking, an owner moving one — and the
-- state machine has no database-level backstop the way overlap does. Expressed as table
-- policies it would be written three times and load-tested once.
--
-- "available" is NOT a state (FR-015a). It describes a unit with no live occupancy row, and
-- is derived rather than stored.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),

  room_unit_id uuid not null references public.room_units (id) on delete restrict,

  booking_reference text not null unique
    check (booking_reference ~ '^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10,}$'),

  status text not null
    check (status in ('held', 'awaiting_verification', 'confirmed', 'cancelled', 'expired')),

  -- Derived from the caller, never accepted from a payload (FR-021f).
  origin text not null check (origin in ('online', 'owner')),

  check_in  date not null,
  check_out date not null,
  guests    int  not null check (guests >= 1),

  -- Personal data. Registered in personal_data_stores; erasure anonymises in place.
  guest_name  text,
  guest_email citext,
  guest_phone text,
  guest_notes text,

  payment_reference text
    check (payment_reference is null or payment_reference ~ '^[A-Za-z0-9-]{4,40}$'),

  -- Captured at write, frozen against rate edits (FR-022d), re-priced only when the stay
  -- itself changes (FR-022c).
  stay_total      numeric(12, 2) not null check (stay_total >= 0),
  amount_received numeric(12, 2) check (amount_received is null or amount_received >= 0),

  owner_notes text,

  hold_expires_at timestamptz,
  erased_at       timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  stay_range daterange generated always as (daterange(check_in, check_out, '[)')) stored,

  constraint bookings_dates_ordered check (check_out > check_in),
  constraint bookings_stay_length   check (check_out - check_in <= 30),

  -- FR-021e: email is required for a guest-made booking (it is half of the lookup key),
  -- optional for a walk-in the owner entered.
  constraint bookings_email_required_online
    check (origin <> 'online' or guest_email is not null)
);

create index bookings_status_idx    on public.bookings (status, check_in);
create index bookings_unit_idx      on public.bookings (room_unit_id);
create index bookings_reference_idx on public.bookings (booking_reference);
create index bookings_email_idx     on public.bookings (guest_email) where guest_email is not null;
create index bookings_expiry_idx    on public.bookings (hold_expires_at)
  where status in ('held', 'awaiting_verification');

comment on table public.bookings is
  'One booking, one room unit (C2). No client write policy — every write goes through write_booking().';

comment on column public.bookings.booking_reference is
  'Crockford base32, 10+ chars, non-sequential (FR-005a). Reference plus email is what grants a guest access to their own booking, so a guessable reference makes every guest''s stay dates enumerable.';

comment on column public.bookings.origin is
  'Derived from who made the request, never submitted (FR-021f). A guest must not be able to mark their own booking owner-entered — the measure of what the site won would become guest-editable.';

comment on column public.bookings.stay_total is
  'Frozen at write. Editing a rate never re-prices an existing booking (FR-022d); changing the stay does (FR-022c).';
