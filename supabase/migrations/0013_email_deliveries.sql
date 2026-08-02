-- 0013_email_deliveries.sql — T029
--
-- One row per send ATTEMPT (FR-018e). A resend after a corrected address creates a new row
-- rather than overwriting the failure, so the owner can see what was already tried.
--
-- ⚠ THIS TABLE IS IN ERASURE'S SCOPE AND booking_events IS NOT — the distinction is the
-- whole point (FR-027a).
--
-- `recipient` necessarily holds the guest's email: the owner must see `ana@gmial.com` to
-- understand why the confirmation bounced. So erasure must clear it. An earlier draft of the
-- security review required booking_events to hold no personal fields, then treated this table
-- the same way without noticing it cannot — erasure would have reported success with a copy
-- of the address still sitting here.
--
-- `provider_message_id` unique: the delivery webhook keys on it, and the uniqueness is what
-- makes the webhook idempotent (baseline §6.3).

create table public.email_deliveries (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,

  message_kind text not null check (message_kind in ('submission', 'confirmation')),

  recipient citext,

  provider_message_id text unique,

  outcome text not null default 'queued'
    check (outcome in ('queued', 'sent', 'delivered', 'bounced', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_deliveries_booking_idx on public.email_deliveries (booking_id, created_at desc);
create index email_deliveries_failed_idx  on public.email_deliveries (outcome)
  where outcome in ('bounced', 'rejected');

comment on table public.email_deliveries is
  'One row per send attempt (RLS-P7). Owner reads and triggers resends; the system writes.';

comment on column public.email_deliveries.recipient is
  'Personal data — registered in personal_data_stores. Cleared on erasure while message_kind and outcome survive (FR-027a).';
