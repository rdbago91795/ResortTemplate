-- 0012_booking_events.sql — T028
--
-- An audit trail nobody can author, alter, or remove is the only kind worth keeping. RLS in
-- 0020 grants SELECT to the admin and nothing else to anyone; rows arrive only from
-- write_booking().
--
-- `actor_id` is NULLABLE and null means THE SYSTEM (FR-022h). Scheduled expiry changes state
-- with no account acting; an event that could not express that would leave the trail unable
-- to explain its own entries.
--
-- ⚠ THE CHECK CONSTRAINT IS A PRIVACY CONTROL, not a tidiness rule (FR-022g).
--
-- Booking events hold NO personal fields. That is what lets this table be immutable: an
-- immutable table containing personal data could never satisfy erasure (FR-027). Bookings are
-- anonymised in place; events describe what happened to a reservation, never who the guest
-- was. The constraint enforces it rather than trusting the writer.

create table public.booking_events (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_id   uuid references public.admin_users (user_id) on delete set null,

  event_type text not null check (event_type in (
    'created', 'state_changed', 'stay_changed', 'payment_verified',
    'amount_corrected', 'note_added', 'contact_corrected', 'guest_erased'
  )),

  previous_values jsonb not null default '{}'::jsonb,
  new_values      jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint booking_events_no_personal_fields check (
    not (previous_values ?| array['guest_name', 'guest_email', 'guest_phone', 'guest_notes'])
    and
    not (new_values      ?| array['guest_name', 'guest_email', 'guest_phone', 'guest_notes'])
  )
);

create index booking_events_booking_idx on public.booking_events (booking_id, created_at desc);

comment on table public.booking_events is
  'Append-only history (RLS-P7). No insert/update/delete policy for any client role.';

comment on column public.booking_events.actor_id is
  'Null means the system acted — scheduled expiry has no account behind it (FR-022h).';

comment on constraint booking_events_no_personal_fields on public.booking_events is
  'FR-022g. Holding no personal data is what permits immutability: an immutable table with personal data could never satisfy erasure.';
