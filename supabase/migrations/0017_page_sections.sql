-- 0017_page_sections.sql — T033
--
-- C10: the home page and room detail page are assembled from a FIXED CATALOGUE of sections
-- the owner turns on, off, and reorders. Not a page builder.
--
-- Rows are seeded from the template's catalogue. RLS in 0020 grants UPDATE and nothing else —
-- no insert, no delete, for any client role. Rows the owner may update but not create or
-- destroy is exactly the middle position C10 chose. Modelling section types as data the owner
-- can create would be a builder by another name; modelling them as code would put `enabled`
-- in a config file and break Principle I.
--
-- ⚠ `availability_always_enabled` IS A CHECK CONSTRAINT, NOT A HIDDEN TOGGLE (FR-050c,
-- FR-033b). The availability search is what the site exists to do. A rule enforced only in
-- the interface survives until someone calls the API directly.

create table public.page_sections (
  id   uuid primary key default gen_random_uuid(),
  page text not null check (page in ('home', 'room_detail')),

  section_type text not null,

  enabled  boolean not null default true,
  position int not null default 0,

  updated_at timestamptz not null default now(),

  unique (page, section_type),

  constraint availability_always_enabled check (
    section_type not in ('availability_search', 'room_availability') or enabled
  )
);

create index page_sections_page_idx on public.page_sections (page, position) where enabled;

comment on table public.page_sections is
  'Fixed catalogue, seeded (C10). UPDATE only — no client may insert or delete, which is what makes this section arrangement rather than a page builder.';

comment on constraint availability_always_enabled on public.page_sections is
  'FR-050c / FR-033b enforced in the database. The booking entry point cannot be switched off, including by a direct API call.';
