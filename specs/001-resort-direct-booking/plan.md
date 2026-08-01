# Implementation Plan: Resort Site & Direct Booking — MVP

**Branch**: `001-resort-direct-booking` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)
**Revision 2** — re-run after clarifications C9–C13, gate remediation, and two blocking spec edits

**Input**: Feature specification from `/specs/001-resort-direct-booking/spec.md` — 180 functional
requirements, 21 success criteria, 14 clarifications

---

## Summary

A per-client resort marketing site with direct booking, one deployment per property. Guests search
availability, hold a room, pay the resort directly by QR, and submit a payment reference; the owner
verifies against their own banking app and confirms. The owner manages rooms, rates, blocks, gallery,
content, page composition, branding, and bookings through an admin designed for someone non-technical.

**The technical centre of gravity is one guarantee**: a room unit cannot be double-claimed, across
**four writers**, under concurrent load. Everything else is presentational by comparison. The design
puts that guarantee in a database exclusion constraint over a single `room_occupancy` table, and routes
every booking mutation through one `security definer` function so the state machine has one
implementation rather than four.

### What changed since revision 1

| Change | Driver |
|---|---|
| **`page_sections`** — new table, updatable but never creatable | C10 |
| **`gallery_categories`** — new table; images gained two position columns | C11 |
| **`personal_data_stores`** — the erasure register as a real object | FR-026a |
| Content pages gained menu position, label, and kind | C9, FR-049a |
| Site settings gained seven settings — timezone, notice, retention, session, hero | C13, FR-020a, FR-028e, FR-069d |
| Two more scheduled jobs (retention) | FR-028d |
| **Selective optimistic concurrency** on three entities | R13, CHK035 |
| Concurrency suite widened from three writers to four | FR-037a |

**Two spec edits were made before planning**, because planning around them would have encoded the gap:
**FR-037a** (block *movement* is governed by the same overlap rule as creation) and **FR-069g/h** (the
sole owner account cannot be disabled; password reset is the recovery path). Both were `flows.md`
findings that touch the schema.

---

## Technical Context

The stack is FIXED by the constitution and is not reopened here.

**Language/Version**: TypeScript 5.x, React 18+

**Primary Dependencies**: React + Vite, Vanilla Extract, Framer Motion, Lenis, Supabase JS client

**Storage**: Supabase (PostgreSQL), one project per deployment. Buckets: `public-media`,
`demo-assets`, `payment-assets` *(private)*

**Testing**: Vitest + Testing Library; Playwright for journeys; **four-writer** concurrency suite
(research R12, quickstart V1)

**Target Platform**: Mobile web first (mid-range Android on mobile data), desktop second

**Performance Goals**: Guest pages usable ≤4s, LCP ≤2.5s on a 4× CPU-throttled profile over
1.6 Mbps / 750 kbps / 150 ms (SC-004); admin the same, bookings list ≤6s at a year of data (SC-004a);
no horizontal scroll at 360px (SC-012)

**Constraints**: Free-tier Supabase — **no server-side image transforms** (research R6, C-1); font
budget ~90KB, route-scoped

**Scale/Scope**: 8–30 rooms, one property per deployment, one owner account

**Scheduled jobs**: 4 — hold expiry, awaiting-verification expiry, booking anonymisation, enquiry
deletion (research R4)

**3D layer**: **OFF.** This plan does not enable Three.js, R3F, drei, or postprocessing. The
configurable hero uses image, video, or DOM-transform depth-parallax — none engage the 3D layer.

**New dependencies requiring the constitution X approval gate**: `react-day-picker`,
`react-markdown`, `markdown-it`, `culori`, `@vanilla-extract/dynamic`, Resend SDK, Cloudflare
Turnstile. **None installed by this plan.**

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates III and VIII are NON-NEGOTIABLE and cannot be justified away.

| # | Gate | Initial | Post-Design |
|---|---|---|---|
| I | No property-specific value hardcoded outside config, content, or theme. No new tenancy assumption | PASS | **PASS** — every property value lives in `site_settings`/`site_branding`; page composition is data (R14), not code |
| II | No payment gateway, no card data, no computed/enforced amounts | PASS | **PASS** — `stay_total` displayed, `amount_received` owner-entered, overpayment accepted (FR-016a) |
| III | **Overlap prevention at DB level in one transaction; holds auto-expire; transitions server-side** | PASS | **PASS** — `occupancy_no_overlap` covers all four writers including block movement (FR-037a); `pg_cron` expiry; `write_booking()` owns all transitions |
| IV | Evaluative imagery is real photography; demo assets isolated and gated | PASS | **PASS** — `demo-assets` separate bucket, emptiness script-checkable |
| V | Every colour/spacing/typography value referenced by exact token name | PASS | **PASS** — theme contract from design-system §3; brand values via `setElementVars`, never `assignInlineVars` |
| VI | Only transform/opacity animated; reduced-motion fallback; Lenis fully disabled under it; 3D off | PASS | **PASS** — 3D off; `HoldTimer` uses a `scaleX` bar |
| VII | Image pipeline planned, not deferred | PASS | ⚠ **PASS with deviation** — runs client-side. See C-1 |
| VIII a | RLS per table, explicit policy per operation per role | PASS | **PASS** — data-model RLS table, all 19 tables |
| VIII b | Views set `security_invoker`; `security definer` functions pin `search_path = ''` | PASS | **PASS** — no views planned; every function pins it |
| VIII c | Public signup disabled | PASS | **PASS** — owner provisioned as a deployment step (FR-069a) |
| VIII d | CSP header without `'unsafe-inline'` in `script-src` | PASS | **PASS** — single theme means no inline bootstrap; Vanilla Extract keeps `style-src 'self'` reachable |
| VIII e | No secret in client bundle; nothing secret carries `VITE_` | PASS | **PASS** — secrets are Edge Function env only |
| VIII f | Client-supplied values verified server-side | PASS | **PASS** — `stay_total`, `origin`, `hold_expires_at`, unit selection, capacity, and the notice cutoff all derived server-side |
| VIII g | Output encoded in every non-React path | PASS | **PASS** — email templates escape explicitly; CRLF stripped from headers |
| IX | Full CRUD per entity (or spec-stated deferral); four states per surface | PASS | **PASS** — spec CRUD table covers **16** entities with deferrals stated |
| X | Plan scoped so each stage runs in isolation | PASS | **PASS** — see Implementation Staging |
| XI | Completion report will name Simplified / Skipped / Blocked | PASS | **PASS** |
| Compliance | No sensitive personal info; retention covers new personal data; data region recorded | PASS | **PASS** — retention now a requirement (FR-028d) enforced by scheduled job, iterating the register |

**Result: PASS with one recorded deviation (C-1).** No non-negotiable gate is violated.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-resort-direct-booking/
├── plan.md              # This file
├── spec.md              # 180 FRs, 21 SCs, 14 clarifications
├── research.md          # Phase 0 — R1–R17
├── data-model.md        # Phase 1 — ER diagram, 19 tables, constraints, RLS map
├── quickstart.md        # Phase 1 — 13 validation scenarios
├── contracts/
│   ├── rpc-functions.md
│   └── edge-functions.md
├── checklists/
│   ├── requirements.md  # spec quality — 16/16
│   ├── gate.md          # requirements gate — 63/65
│   └── flows.md         # failure & lifecycle — 60 items, 3 closed by this plan
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

> **The tree below is illustrative, not an inventory.** It shows the shape of the codebase and the
> reasoning behind two directory choices. It does **not** enumerate every component or route, and it
> is not expected to stay exhaustive as tasks are added.
>
> **The authoritative inventories are elsewhere**: `design-system.md` §5 for components (name,
> purpose, props), and `tasks.md` for routes. When they disagree with this tree, **they win**.
>
> This is stated because it was the root of four separate analysis findings across three passes —
> each one "a listing here is stale" — caused by two documents both claiming to enumerate the same
> things with neither declared authoritative.

```text
src/
├── styles/
│   ├── contract.css.ts          # createThemeContract — design-system §3
│   ├── theme.balaiAmihan.css.ts
│   ├── breakpoints.ts           # plain constants — NOT tokens
│   └── global.css.ts
├── brand/applyBranding.ts       # setElementVars only
├── components/
│   ├── primitives/              # Button, Input, FormField, Stepper, …
│   ├── layout/                  # Container, Stack, Section, PaneBand, PaneGrid, SiteHeader, SiteFooter, MobileNav
│   ├── content/                 # Heading, Text, Prose, Image, Gallery, Logo, StatusBadge
│   ├── feedback/                # Skeleton, EmptyState, ErrorState, RateLimitNotice
│   ├── booking/                 # AvailabilitySearch, DateRangeField, QRPaymentPanel, HoldTimer
│   ├── sections/                # the fixed catalogue (R14) — one per section_type
│   └── admin/                   # AdminShell, DataTable, VerifyPaymentForm, BrandColorPicker
├── motion/                      # MotionConfig + named variants
├── scroll/lenis.ts              # desktop guest routes only
├── routes/
│   ├── guest/                   # _layout, home, accommodations, gallery, location, policies, booking, lookup
│   └── admin/                   # bookings, rooms, rates, availability, gallery, content, enquiries, sections, settings, branding, reset-password
├── lib/
│   ├── supabase.ts
│   ├── schemas/                 # Zod — shared with server, never instead of it
│   └── images/                  # client-side resize/re-encode (R6)
└── main.tsx

supabase/
├── migrations/                  # each approved before apply (constitution X)
├── functions/
│   ├── booking-payment/
│   ├── send-booking-email/
│   ├── email-webhook/
│   └── save-branding/
└── seed/{seed.ts, teardown.ts}

demo-assets/
tests/
├── concurrency/                 # SC-001 — four writers
├── rls/                         # anon reaches nothing it shouldn't
├── register/                    # personal-data register coverage (R16)
├── integration/
└── e2e/
```

**Structure Decision**: Single Vite application, route-level separation between guest and admin, plus
a `supabase/` tree for migrations, Edge Functions, and seed. No backend service — the database and
Edge Functions are the backend.

Two directories exist for reasons worth stating. **`components/sections/`** mirrors the
`page_sections` catalogue one-to-one; a section type in the database with no component, or the
reverse, is a defect a directory listing makes visible. **`tests/register/`** exists because R16's
guarantee is only real if something fails when a new personal-data store skips the register.

---

## Implementation Staging

Constitution X: **one scoped stage per `/speckit-implement` run.** Setup + Foundational is its own run
and does not continue into US1.

| Stage | Contents | Gate before proceeding |
|---|---|---|
| **Setup + Foundational** | Vite scaffold, theme contract, motion config, primitives; **full schema, RLS, constraints, 4 cron jobs, register**; seed | `pnpm build`; V1, V1b, V3, V6 |
| **US1** | Availability search, hold, minimum notice | V1, V3 |
| **US2** | QR payment step, reference submission, guest lookup, submission email | V4 |
| **US3** | Owner verification and confirmation, confirmation email | V6 |
| **US4** | Booking management, owner-created bookings, date/room changes | **V1 re-run** — three writers now live |
| **US5–US6** | Rooms, units, rates, blocks | **V1 re-run** — block movement is the fourth writer |
| **US7–US12** | Gallery, content, home sections, location, policies, **branding and settings** | V5, V7, V8, V9 |

**V1 runs three times, not once.** Foundational proves the constraint; US4 adds the second and third
writers; US5–US6 adds the fourth. A suite that only ran when one writer existed proves nothing about
four — and the fourth, block movement, is the one FR-037a was added to cover.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **C-1: Image re-encode runs client-side** (deviates from baseline §5.2) | Edge Functions run Deno; `sharp` is a native Node binding, and Storage transformations are a paid-plan feature against a "none to minimal" budget | A WASM codec in Deno works but carries cold-start cost on every upload. Accepting unprocessed originals leaves EXIF GPS intact and abandons constitution VII. **Mitigation**: bucket MIME and size limits are the actual enforcement; client re-encode is a capability, not a guarantee. **Revisit on any move to a paid plan** |
| **C-2: `room_occupancy` is a table bookings and blocks both project into** | An exclusion constraint spans one table, but FR-004, FR-037, and FR-037a require one guarantee across two | A trigger checking across tables reintroduces the check-then-act race the constraint exists to close. The extra table is the cost of making the guarantee unconditional — and it made FR-037a free |
| **C-3: Optimistic concurrency on three entities, last-write-wins on the rest** | A lost update on a booking, rate, or block costs money or a double-booking; on a gallery caption it costs a retype | Locking everywhere pays the cost of tokens and conflict messaging on twelve entities to protect three. Locking nowhere loses updates silently on the three that matter. The asymmetry is real, so the treatment is asymmetric (R13) |

---

## Open items carried into implementation

Nothing blocks Setup + Foundational.

- ~~CHK010~~ **closed as C14** — `search_availability` gates `units_available` at
  `site_settings.scarcity_threshold`, returning `null` above it so the exact count never leaves the
  database. Search is now rate limited (FR-014b), which became material only once a count was
  disclosable.
- **57 items in `flows.md`** — the remainder after this plan closed CHK028, CHK035, and CHK036. They
  belong to the stories they concern and are better answered against a real surface than guessed at
  now.

---

## Artifacts

| Artifact | Path |
|---|---|
| Research and decisions | [research.md](research.md) |
| Schema, ER diagram, RLS map | [data-model.md](data-model.md) |
| Database RPC contract | [contracts/rpc-functions.md](contracts/rpc-functions.md) |
| Edge Function contract | [contracts/edge-functions.md](contracts/edge-functions.md) |
| Validation guide | [quickstart.md](quickstart.md) |
