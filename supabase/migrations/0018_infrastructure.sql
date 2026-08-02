-- 0018_infrastructure.sql — T034
--
-- Two tables no client ever touches.
--
-- rate_limit_events: FR-014 counters. ⚠ STORES A SALTED HASH OF THE IDENTIFIER, NEVER A RAW
-- IP. A raw IP log is itself personal data under RA 10173 and would add a retention
-- obligation for no benefit — the hash rate-limits identically (baseline §2.5).
--
-- webhook_events: the idempotency ledger. `(provider, event_id)` as the primary key IS the
-- idempotency mechanism — the delivery handler inserts first and treats a conflict as
-- success, returning 2xx so the provider stops retrying (baseline §6.3).

create table public.rate_limit_events (
  id         bigserial primary key,
  bucket     text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (bucket, identifier, created_at desc);

comment on table public.rate_limit_events is
  'FR-014 counters. No client policy of any kind — touched only by security definer functions.';

comment on column public.rate_limit_events.identifier is
  'Salted hash, never a raw IP. A raw address is personal data under RA 10173 and carries a retention obligation for no gain (baseline §2.5).';

create table public.webhook_events (
  provider    text not null,
  event_id    text not null,
  payload     jsonb not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);

comment on table public.webhook_events is
  'Idempotency ledger. The composite primary key IS the mechanism — insert first, treat a conflict as already-processed (baseline §6.3).';
