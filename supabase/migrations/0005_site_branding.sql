-- 0005_site_branding.sql — T021
--
-- Brand colour is DATA, not code (C14, design-system §3). The owner sets two colours; the
-- other ten are derived in OKLCH by an Edge Function with contrast enforced BEFORE the write
-- (FR-063).
--
-- ⚠ NO CLIENT WRITE POLICY (baseline P1s). This is the whole point: if the admin held UPDATE
-- through PostgREST, a direct row update would walk straight past the contrast validation —
-- and the owner is already authenticated for it. The one control protecting a non-technical
-- owner from an unreadable site would be advisory.
--
-- The derived columns are stored rather than computed at read time so the guest site does no
-- colour maths and ships no colour library (Principle VII).

create table public.site_branding (
  id boolean primary key default true check (id),

  -- Owner-set (FR-062)
  primary_hex   text not null check (primary_hex   ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_hex text not null check (secondary_hex ~ '^#[0-9A-Fa-f]{6}$'),

  -- Derived server-side. Never written by a client.
  primary_hover_hex     text not null check (primary_hover_hex     ~ '^#[0-9A-Fa-f]{6}$'),
  primary_active_hex    text not null check (primary_active_hex    ~ '^#[0-9A-Fa-f]{6}$'),
  primary_text_hex      text not null check (primary_text_hex      ~ '^#[0-9A-Fa-f]{6}$'),
  primary_subtle_hex    text not null check (primary_subtle_hex    ~ '^#[0-9A-Fa-f]{6}$'),
  on_primary_hex        text not null check (on_primary_hex        ~ '^#[0-9A-Fa-f]{6}$'),
  on_primary_subtle_hex text not null check (on_primary_subtle_hex ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_subtle_hex  text not null check (secondary_subtle_hex  ~ '^#[0-9A-Fa-f]{6}$'),
  on_secondary_hex      text not null check (on_secondary_hex      ~ '^#[0-9A-Fa-f]{6}$'),

  -- Identity images (§3.5). All optional — a property with no logo shows its name as a
  -- wordmark and nothing looks broken (FR-065).
  logo_wide_path    text,
  logo_wide_alt     text,   -- defaults to property name, never blank (§11.3)
  logo_inverse_path text,   -- absent → solid header instead of transparent
  logo_mark_path    text,   -- square; favicon derives from it
  og_image_path     text,   -- 1200×630 share card

  updated_at timestamptz not null default now()
);

comment on table public.site_branding is
  'Singleton. Two owner-set colours, ten derived. No client write policy — writes go through the save-branding Edge Function so contrast (FR-063) cannot be bypassed.';

comment on column public.site_branding.primary_text_hex is
  'Contrast-safe variant for text on surface.base. A colour good enough for a button fill is often too pale for a link — deriving this separately means the owner keeps the colour they chose and links stay readable.';

comment on column public.site_branding.logo_inverse_path is
  'Optional. Its presence decides the header treatment: present → transparent over the hero with a scrim; absent → solid. The system picks from what was uploaded rather than asking the owner (§3.5).';
