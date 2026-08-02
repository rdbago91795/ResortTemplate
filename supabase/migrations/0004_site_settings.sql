-- 0004_site_settings.sql — T020
--
-- Singleton. The `check (id)` pattern suits one-property-per-deployment (Principle I) and
-- removes a whole class of "which settings row is live" bugs.
--
-- Everything property-specific lives here rather than in code — that is Principle I made
-- concrete, and metric S2 depends on it: standing up deployment #2 must change configuration
-- and content only, never shared application code.
--
-- ⚠ NO CLIENT WRITE POLICY will be granted on this table (baseline P1s). Writes go through
-- public.save_site_settings() so the validation cannot be bypassed by the account that is
-- already authenticated for it.

create table public.site_settings (
  id boolean primary key default true check (id),

  -- Identity and contact
  property_name    text not null,
  address          text not null,
  latitude         numeric(9, 6)  not null check (latitude between -90 and 90),
  longitude        numeric(9, 6)  not null check (longitude between -180 and 180),
  transport_notes  text,            -- Markdown, no raw HTML (FR-053b)
  contact_phone    text not null,
  contact_email    citext not null,

  -- Payment (constitution II: no gateway, no card data, no computed amounts)
  payment_qr_path  text,            -- private payment-assets bucket (C8)
  deposit_guidance text not null default 'Send 50% to reserve your room.',

  -- Time. Every date comparison evaluates against this (FR-020a).
  timezone text not null default 'Asia/Manila',

  -- Booking windows
  hold_minutes        int not null default 30  check (hold_minutes > 0),
  awaiting_hours      int not null default 48  check (awaiting_hours > 0),
  min_notice_hours    int not null default 0   check (min_notice_hours >= 0),
  same_day_cutoff_hour int not null default 18 check (same_day_cutoff_hour between 0 and 23),

  -- Disclosure. 0 disables the remaining-rooms count entirely (FR-002c, C14).
  scarcity_threshold int not null default 2 check (scarcity_threshold >= 0),

  -- Sessions and retention
  session_idle_minutes     int not null default 30 check (session_idle_minutes > 0),
  booking_retention_months int not null default 24 check (booking_retention_months > 0),
  enquiry_retention_months int not null default 12 check (enquiry_retention_months > 0),

  -- Presentation
  hero_treatment text not null default 'image'
    check (hero_treatment in ('image', 'video', 'depth')),

  -- Rate limits, changeable without a release (FR-014a)
  rate_limits jsonb not null default '{
    "booking_hold":   {"limit": 5,  "window_minutes": 60},
    "enquiry":        {"limit": 3,  "window_minutes": 60},
    "ref_lookup":     {"limit": 10, "window_minutes": 60},
    "availability":   {"limit": 60, "window_minutes": 60},
    "email_resend":   {"limit": 3,  "window_minutes": 60},
    "upload":         {"limit": 20, "window_minutes": 60}
  }'::jsonb,

  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Singleton. Every property-specific value lives here so deployment #2 is configuration only (Principle I, metric S2).';

comment on column public.site_settings.timezone is
  'IANA name. All dates, "today", cutoffs, expiry, and retention evaluate against this (FR-020a). Changing it migrates nothing — stay dates are calendar dates in the property''s own frame (R17).';

comment on column public.site_settings.scarcity_threshold is
  'Remaining-room counts are disclosed only at or below this. 0 disables (FR-002c, C14).';

comment on column public.site_settings.transport_notes is
  'Markdown. Raw HTML rejected on write (FR-053b, FR-045a).';
