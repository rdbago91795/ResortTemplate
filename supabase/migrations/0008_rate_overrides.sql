-- 0008_rate_overrides.sql — T024
--
-- C1: a base nightly rate per room type, plus manually entered date-range overrides. There
-- is no rules engine, no named seasons, no automatic application, nothing computed from a
-- percentage. An override is a value the owner typed against explicit dates (FR-029c).
--
-- This satisfies the brief's requirement that the demo show a seasonal rate variation (§4.8)
-- while keeping "seasonal pricing rules" deferred (§8) — because it is data, not rules.
--
-- ⚠ THE EXCLUSION CONSTRAINT IS THE POINT (FR-029b).
--
-- FR-029b requires overlapping overrides to be refused UNDER SIMULTANEOUS REQUESTS. A
-- `select ... where not exists` check races: two sessions both pass before either inserts.
-- The constraint holds unconditionally, and it is why upsert_rate_override catches
-- exclusion_violation rather than pre-checking.
--
-- Allowing overlap would force a precedence rule — and a precedence rule is the first
-- component of the pricing engine C1 declined to build.

create table public.rate_overrides (
  id           uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  label        text not null,
  starts_on    date not null,
  ends_on      date not null,
  nightly_rate numeric(12, 2) not null check (nightly_rate > 0),
  updated_at   timestamptz not null default now(),

  date_range daterange generated always as (daterange(starts_on, ends_on, '[)')) stored,

  constraint rate_overrides_dates_ordered check (ends_on > starts_on),

  constraint rate_overrides_no_overlap
    exclude using gist (room_type_id with =, date_range with &&)
);

create index rate_overrides_lookup_idx on public.rate_overrides using gist (room_type_id, date_range);

comment on table public.rate_overrides is
  'Owner-entered date-range prices. Data, not rules (C1, FR-029c).';

comment on constraint rate_overrides_no_overlap on public.rate_overrides is
  'FR-029b under concurrency. A check-then-insert races; this does not.';
