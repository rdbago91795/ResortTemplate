---

description: "Task list for Resort Site & Direct Booking â€” MVP"
---

# Tasks: Resort Site & Direct Booking â€” MVP

**Input**: Design documents from `/specs/001-resort-direct-booking/`

**Prerequisites**: [plan.md](plan.md) Â· [spec.md](spec.md) Â· [research.md](research.md) Â·
[data-model.md](data-model.md) Â· [contracts/](contracts/) Â· [quickstart.md](quickstart.md)

**Tests**: Generic unit tests are NOT generated â€” the spec does not request TDD. Four test suites
**are** included because the constitution and spec require them by name: the concurrency suite
(SC-001, Principle III), the RLS suite (SC-018), the personal-data register suite (FR-026b), and the
scarcity-gating check (FR-002c).

**Organization**: Tasks are grouped by user story so each can be implemented and verified
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel â€” different files, no dependency on incomplete work
- **[Story]**: US1â€“US12, mapping to spec.md user stories
- Exact file paths are given in every task

## Path Conventions

Single Vite application at repository root, per plan.md Project Structure. Database work lives in
`supabase/`.

---

## âš  Execution rules â€” read before starting

**One scoped stage per `/speckit-implement` run (constitution X).** Phase 1+2 is one run and stops
before US1. Each user story phase is its own run.

**Migrations and dependencies need approval before they are applied or installed (constitution X).**
Tasks marked **[GATE]** stop and wait for a human answer. They are not announcements.

**V1 runs three times.** After Foundational, after US4, and after US6. Each of those stages adds a
writer to the overlap guarantee, and a suite that only ran when one writer existed proves nothing
about four.

**Every destructive action goes through `ConfirmDialog` (T060), naming what is about to happen in
plain words** â€” FR-067a, no exceptions. Named explicitly in T112, T118, and T136; the same applies to
content page deletion, enquiry deletion, gallery image deletion, and branding reset without being
restated at each one.

**Between stages**: `pnpm build` clean â†’ loose-ends sweep, fix every BLOCKER â†’ look at it in a
browser. Then file the completion report naming Simplified / Skipped / Blocked (constitution XI).

---

## Phase 1: Setup

**Purpose**: Project skeleton, tooling, and the design-system foundation everything references.

- [X] T001 Initialise Vite + React + TypeScript project at repository root with `pnpm`
- [X] T002 **[GATE]** Present exact package names and versions for `@vanilla-extract/css`, `@vanilla-extract/vite-plugin`, `@vanilla-extract/dynamic`, `framer-motion`, `lenis`, `@supabase/supabase-js` â€” wait for approval before installing
- [X] T003 Configure Vanilla Extract in `vite.config.ts` with the plugin and path aliases
- [X] T004 [P] Configure ESLint + Prettier in `eslint.config.js` and `.prettierrc`
- [X] T005 [P] Create `.gitignore` and `.env.example` with only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY` â€” no other variable may carry a `VITE_` prefix
- [X] T006 ~~Initialise the local Supabase stack and commit `supabase/config.toml`~~ → **Substituted: hosted project `balai-amihan` (`eukapgrafolpwgdwyils`), region `ap-southeast-1`.** Neither Docker nor the Supabase CLI is installed on this machine; migrations are authored as files in `supabase/migrations/` and applied through the Supabase connector. **Consequence: SC-001's 200-way concurrency test cannot be run credibly against a free-tier connection cap** — see the Phase 1 completion report
- [X] T007 Create the theme contract in `src/styles/contract.css.ts` using `createThemeContract`, with the exact token names from design-system.md Â§3
- [X] T008 Create `src/styles/theme.balaiAmihan.css.ts` implementing the contract with the seed values from design-system.md Â§3.1
- [X] T009 [P] Create `src/styles/breakpoints.ts` as plain TypeScript constants â€” **not** contract tokens, since CSS custom properties do not work in media query conditions
- [X] T010 [P] Create `src/styles/global.css.ts` with the reset and base typography
- [X] T011 Create `src/motion/variants.ts` with the named variants from design-system.md Â§7 â€” `paneReveal`, `sectionReveal`, `staggerParent`, `pageTransition`, `cardHover`, `pressable`, `blurUp`, `sheetUp`, `overlayFade`, `toastEnter`, `bandDraw`, `skeletonPulse`
- [X] T012 Create `src/motion/config.tsx` wrapping the app in `MotionConfig reducedMotion="user"`
- [X] T013 Create `src/scroll/lenis.ts` â€” desktop guest routes only, destroyed under reduced motion, `syncTouch: false`, never active on `/admin`
- [X] T014 Configure CSP and security headers in the host config: `script-src 'self'` with no `'unsafe-inline'`, `style-src 'self'`, `frame-ancestors 'none'`, HSTS, `nosniff`
- [X] T015 Configure fonts in `src/styles/fonts.css.ts` â€” self-hosted Archivo, Public Sans, DM Mono, subset to Latin, body preloaded, mono scoped to admin and confirmation routes

**Checkpoint**: `pnpm build` is clean and the theme contract type-checks.

---

## Phase 2: Foundational â€” BLOCKING

**Purpose**: The complete database, its guarantees, and the shared component layer. **No user story
can begin until this is done.**

**âš  This is the largest phase in the project and carries the entire correctness surface.**

### Schema â€” extensions and helpers

- [ ] T016 **[GATE]** Present the SQL enabling `btree_gist`, `pg_cron`, `citext`, and `pgcrypto` â€” wait for approval before applying
- [ ] T017 Create migration `supabase/migrations/0001_extensions.sql` enabling the four extensions
- [ ] T018 Create `supabase/migrations/0002_admin_users.sql` â€” `admin_users` with `user_id`, `role`, `created_at`. **No `disabled_at` column** (FR-069g: a field that can brick a deployment must not exist)
- [ ] T019 Create `supabase/migrations/0003_helpers.sql` with `public.is_admin()` and `public.has_role(text[])` â€” both `security definer` with `set search_path = ''`, execute granted to `authenticated` only

### Schema â€” settings and branding

- [ ] T020 Create `supabase/migrations/0004_site_settings.sql` â€” singleton with `check (id)`, including `timezone`, `hold_minutes`, `awaiting_hours`, `min_notice_hours`, `same_day_cutoff_hour`, `session_idle_minutes`, `booking_retention_months`, `enquiry_retention_months`, `scarcity_threshold`, `hero_treatment`, `rate_limits`
- [ ] T021 Create `supabase/migrations/0005_site_branding.sql` â€” singleton with two owner-set hex columns and ten derived columns, plus logo and OG paths

### Schema â€” inventory

- [ ] T022 Create `supabase/migrations/0006_room_types.sql` with `published_at`, `archived_at`, `sort_order`, `updated_at`
- [ ] T023 Create `supabase/migrations/0007_room_units.sql` referencing `room_types`
- [ ] T024 Create `supabase/migrations/0008_rate_overrides.sql` with a generated `date_range` and **`exclude using gist (room_type_id with =, date_range with &&)`** (FR-029b)

### Schema â€” the occupancy guarantee

- [ ] T025 Create `supabase/migrations/0009_bookings.sql` â€” all columns from data-model.md, including `origin`, `stay_total`, `erased_at`, `updated_at`
- [ ] T026 Create `supabase/migrations/0010_availability_blocks.sql` with `date_range` and `updated_at`
- [ ] T027 **Create `supabase/migrations/0011_room_occupancy.sql`** with the source check and **`exclude using gist (room_unit_id with =, stay_range with &&)`**. This single constraint discharges FR-004, FR-037, FR-037a, and SC-001 across all four writers
- [ ] T028 Create `supabase/migrations/0012_booking_events.sql` with `actor_id` nullable (null means the system, FR-022h) and the **check constraint rejecting personal keys** in both JSONB columns (FR-022g)
- [ ] T029 [P] Create `supabase/migrations/0013_email_deliveries.sql` with `provider_message_id` unique and `recipient`

### Schema â€” content and guest-facing

- [ ] T030 [P] Create `supabase/migrations/0014_enquiries.sql`
- [ ] T031 [P] Create `supabase/migrations/0015_gallery.sql` â€” `gallery_categories` and `gallery_images` with `room_type_id` nullable and **two position columns**, `gallery_position` and `room_position` (FR-041c)
- [ ] T032 [P] Create `supabase/migrations/0016_content_pages.sql` with `page_kind`, `menu_position`, `menu_label`, `body_markdown`
- [ ] T033 Create `supabase/migrations/0017_page_sections.sql` with `unique (page, section_type)` and the **`availability_always_enabled` check constraint** (FR-050c, FR-033b) â€” enforced in the database, not by hiding a toggle
- [ ] T034 [P] Create `supabase/migrations/0018_infrastructure.sql` â€” `rate_limit_events` and `webhook_events`
- [ ] T035 **Create `supabase/migrations/0019_personal_data_stores.sql`** â€” the register table plus its three seed rows for `bookings`, `email_deliveries`, and `enquiries` (FR-026a)

### Row Level Security

- [ ] T036 Create `supabase/migrations/0020_rls_enable.sql` â€” `enable row level security` **and** `force row level security` on all 19 tables, plus `revoke all` from `anon` and `authenticated`
- [ ] T037 Create `supabase/migrations/0021_rls_public_read.sql` â€” P1 policies for `room_types`, `rate_overrides`, `gallery_categories`, `gallery_images`, `content_pages` (with the `page_kind <> 'policy'` delete guard)
- [ ] T038 Create `supabase/migrations/0022_rls_singletons.sql` â€” P1s for `site_settings` and `site_branding`, public select, **no client write policy**
- [ ] T039 Create `supabase/migrations/0023_rls_server_only.sql` â€” P4 for `bookings`, `room_units`, `availability_blocks`, `room_occupancy`, `admin_users`, `personal_data_stores`, `rate_limit_events`, `webhook_events`. **No write policy for any client role on `bookings`**
- [ ] T040 Create `supabase/migrations/0024_rls_audit.sql` â€” P7 append-only for `booking_events` and `email_deliveries`: select for admin, no insert, update, or delete for any client
- [ ] T041 [P] Create `supabase/migrations/0025_rls_intake.sql` â€” P3 for `enquiries`: anon insert with a bounded `with check`, no anon read
- [ ] T042 Create `supabase/migrations/0026_rls_page_sections.sql` â€” select for all, **update only** for admin, no insert or delete for any client (R14)

### Server-side logic

- [ ] T043 **Create `supabase/migrations/0027_write_booking.sql`** â€” the single `security definer` function owning every state transition and every date/room change. Derives `origin` from the caller, computes `stay_total` and `hold_expires_at` server-side, selects the room unit server-side, validates capacity against the stored row, writes a `booking_events` row for every action, and **requires the caller's `updated_at`, raising `stale_record` on mismatch** (R13)
- [ ] T045 Create `supabase/migrations/0028_search_availability.sql` â€” returns availability never occupancy, prices night by night, enforces the minimum notice, and **gates `units_available` at `scarcity_threshold`, returning `null` above it** (FR-002c, R18)
- [ ] T046 [P] Create `supabase/migrations/0029_guest_lookup.sql` â€” `get_booking_by_reference`, returning only the FR-013a field list, with failure indistinguishable between wrong reference and wrong email (FR-013b)
- [ ] T047 [P] Create `supabase/migrations/0030_admin_rpcs.sql` â€” `upsert_rate_override`, `upsert_availability_block`, `set_page_section`, `save_content_page` with raw-HTML rejection (FR-045a), and **`save_site_settings` validating timezone as an IANA name, `same_day_cutoff_hour` 0â€“23, retention months > 0, and `scarcity_threshold >= 0`**. **Both upserts require the caller's `updated_at` and raise `stale_record` on mismatch** (R13)
- [ ] T048 **Create `supabase/migrations/0031_privacy.sql`** â€” `erase_guest_data` and `export_guest_data`, both **iterating `personal_data_stores`** rather than naming tables, keyed on email address, requiring the identity attestation (FR-026b, FR-027, FR-028)
- [ ] T049 [P] Create `supabase/migrations/0032_rate_limit.sql` â€” `check_rate_limit` storing a salted hash of the identifier, never a raw IP
- [ ] T050 Create `supabase/migrations/0033_cron.sql` â€” four `pg_cron` jobs: hold expiry and awaiting expiry every 5 minutes, booking anonymisation and enquiry deletion daily (R4)
- [ ] T050a **Create all three Storage buckets with their policies** â€” `public-media` (public read, admin write), `demo-assets` (public read, admin write), `payment-assets` (**private, admin write, no read policy for any role**). MIME allowlist **excludes SVG at the bucket**, where no client can bypass it. **Placed here because T051's seed and T054's imagery both reference stored objects** â€” position enforces the ordering rather than a note asking for it

### Seed

- [ ] T051 Create `supabase/seed/seed.ts` producing the fictional demo property â€” 4â€“6 room types with different rates and capacities, realistic availability including booked dates, at least one seasonal rate override, **a booking in every state**, **and uploading the imagery from `demo-assets/` into the `demo-assets` bucket so the seeded gallery references objects that exist** (FR-070â€“FR-074)
- [ ] T052 [P] Create `supabase/seed/teardown.ts` removing everything the seed created â€” **table rows and the objects it uploaded to the `demo-assets` bucket**. It MUST NOT delete the local `demo-assets/` directory, which holds the source files T054 supplies. Re-running seed after teardown must leave no orphaned objects (FR-075)
- [ ] T053 [P] Add `pnpm seed` and `pnpm seed:teardown` to `package.json`, both re-runnable against a fresh database (FR-075)
- [ ] T054 Place AI-generated demo imagery in `demo-assets/` with a placeholder payment QR that is visibly non-functional (FR-074, FR-076). **These files must exist before `pnpm seed` is run** â€” T051 writes the uploader, this task supplies its input. Writing the uploader first is fine; only running it needs both

### Shared components

- [ ] T055 [P] Create primitives in `src/components/primitives/` â€” `Button`, `IconButton`, `Link`, `Input`, `Textarea`, `Select`, `Stepper`, `Checkbox`, `Radio`, `Switch`, `FormField`, `FieldError`
- [ ] T056 [P] Create layout components in `src/components/layout/` â€” `Container`, `Stack`, `Row`, `Section`, `PaneBand`, `PaneGrid`
- [ ] T057 **Create `src/components/content/Image.tsx`** â€” AVIF/WebP/JPEG sources, `srcset`, lazy loading, blur-up placeholder, explicit dimensions, and **`alt` as a required prop with no default** (FR-068b)
- [ ] T058 [P] Create `src/components/content/` â€” `Heading`, `Text`, `StatusBadge` rendering icon **and** text, `PriceTag` with tabular figures
- [ ] T058a [P] Create `src/components/content/Card.tsx` and `src/components/booking/BookingSummary.tsx` â€” the generic surface `RoomCard` builds on, and the panel showing what a guest is reserving
- [ ] T059 **Create `src/components/content/Prose.tsx`** taking a `markdown` prop and rendering with `react-markdown` **without `rehype-raw`** â€” no `dangerouslySetInnerHTML` anywhere in the render path (C7)
- [ ] T059a **Create `src/components/content/MarkdownEditor.tsx`** â€” a toolbar for headings, bold, italic, lists, and links so the owner never types syntax (FR-045), emitting Markdown. Rejects pasted raw HTML as a first line of defence; **the server rejection is the actual gate** (FR-045a). Used by both the content editor and the settings screen â€” this is the shared component, not a per-route toolbar
- [ ] T060 [P] Create feedback components in `src/components/feedback/` â€” `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, `InlineAlert`, `Toast`, `RateLimitNotice`, `LockoutNotice`, and **`ConfirmDialog` naming what is about to happen in plain words, focus trapped, Escape to close** (FR-067a)
- [ ] T060a [P] Create `src/components/admin/FormPanel.tsx` and `FilterBar.tsx` â€” the create/edit wrapper and filter row every admin route shares
- [ ] T061 Create `src/brand/applyBranding.ts` using **`setElementVars`** from `@vanilla-extract/dynamic` â€” **never `assignInlineVars`**, which emits a `style` attribute that `style-src 'self'` blocks silently
- [ ] T062 [P] Create `src/lib/supabase.ts` and `src/lib/schemas/` with the shared Zod schemas
- [ ] T063 Create `src/components/admin/AdminShell.tsx` â€” **sidebar navigation across all eleven admin routes**, header, and content area, with sign-in, idle timeout warning, and session end (FR-069dâ€“f). The design system defines the `nav` prop; **this task supplies it**, or the eleven routes cannot be reached from one another
- [ ] T063a Create `src/routes/admin/reset-password.tsx` wiring Supabase's reset flow â€” email enumeration protection on, **exact redirect URL allowlist with no wildcards**, short single-use token (FR-069h). With one account and no second admin, this is the only recovery path FR-069g leaves
- [ ] T063b [P] Create `src/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`, and `MobileNav.tsx` â€” structural destinations (FR-051), footer carrying all three policies, drawer with focus trap below 768px. **Header transparency is derived from whether an inverse logo exists, never passed as a prop** (design-system Â§3.5)
- [ ] T063c Create `src/routes/guest/_layout.tsx` composing the shell around every guest route
- [ ] T063d Create `src/routes/guest/not-found.tsx` and `src/routes/admin/not-found.tsx` â€” the guest one for unpublished or deleted pages (FR-047, FR-049b), the admin one **revealing nothing about whether a resource exists** (FR-069c)

### Required verification suites

- [ ] T064 **Create `tests/concurrency/occupancy.test.ts`** â€” 200 simultaneous claims on one unit and identical dates, asserting exactly one succeeds. Parameterised over the writer set so US4 and US6 extend it rather than replacing it
- [ ] T065 [P] Create `tests/rls/anon-access.test.ts` asserting an anon key selecting from `bookings`, `availability_blocks`, and `room_occupancy` returns **zero rows rather than an error**
- [ ] T066 [P] Create `tests/register/coverage.test.ts` asserting every column documented as personal data appears in `personal_data_stores` â€” **a new store that skips the register must fail here** (R16)
- [ ] T067 [P] Create `tests/rls/schema-audit.test.ts` running the Â§1.5 audit query and asserting an empty result

**Checkpoint** â€” do not proceed past a failure here:
`pnpm build` clean Â· **V1** (concurrency) Â· **V1b** (stale writes) Â· **V3** (guests receive no
occupancy) Â· **V3b** (scarcity gated in the database) Â· **V6** (erasure reaches the whole register)

---

## Phase 3: User Story 1 â€” Search availability and hold a room (P1) ðŸŽ¯ MVP

**Goal**: A guest searches dates and party size, sees genuinely free room types with prices, and holds
one for a bounded period.

**Independent Test**: Against the seeded demo, search a range, complete a hold, and watch the room
leave availability. Then fire two simultaneous holds for the same room and dates â€” exactly one wins.

- [ ] T068 **[GATE]** [US1] Present the exact package and version for `react-day-picker` â€” wait for approval before installing
- [ ] T069 [P] [US1] Create `src/components/booking/DateRangeField.tsx` â€” arrow keys by day, PageUp/PageDown by month, Enter selects, Escape closes; one month on mobile, two on desktop (FR-068c)
- [ ] T070 [P] [US1] Create `src/components/booking/AvailabilitySearch.tsx` with check-in, check-out, and a guest `Stepper`
- [ ] T071 [US1] Create `src/routes/guest/search.tsx` calling `search_availability` and rendering results
- [ ] T072 [US1] Create `src/components/booking/RoomCard.tsx` showing the nightly rate, the stay total, and a per-night breakdown when the stay spans more than one rate (FR-003a)
- [ ] T073 [US1] Render the scarcity count only when the function returned one â€” never derive it client-side (FR-002c)
- [ ] T074 [US1] Implement the four states on the search results surface â€” loading skeletons, empty distinguishing no-availability from no-capacity-match from too-soon, error with retry, success (FR-002b, FR-020d, FR-067)
- [ ] T075 [US1] Create `src/routes/guest/book.tsx` collecting name, email, and phone with server-mirrored Zod validation
- [ ] T076 [US1] Wire the hold submission to `write_booking(action: 'hold')` with a client-generated idempotency key (FR-019)
- [ ] T077 [US1] Implement the dates-taken-while-booking error, offering what remains open for those dates rather than dead-ending (spec US1 scenario 5)
- [ ] T078 **[US1] Create `src/components/booking/HoldTimer.tsx` using a `scaleX` progress bar with `transform-origin: left`** â€” **not** an SVG ring, which would animate `stroke-dashoffset` and violate Principle VI. Under reduced motion it re-renders at 30-second granularity with the number as the signal
- [ ] T079 [US1] Add `aria-live="polite"` to the hold timer, announcing at 5 minutes and 1 minute only
- [ ] T080 [US1] Add the guidance telling a guest each booking covers one room and how to reserve another (FR-019a)
- [ ] T081 [US1] Add Turnstile to the booking form, verified **server-side** inside the Edge Function

**Checkpoint**: V1 and V3 pass. A guest can search and hold. **This is the first demonstrable slice.**

---

## Phase 4: User Story 2 â€” Pay by QR and submit the reference (P1)

**Goal**: The guest sees the resort's QR, submits a reference, is emailed an acknowledgement, and can
look their booking up later.

**Independent Test**: From an active hold, view the QR, submit a reference, receive the email, then
look the booking up by reference and email.

- [ ] T082 **[GATE]** [US2] Present the exact package and version for the Resend SDK â€” wait for approval before installing
- [ ] T084 **[US2] Create `supabase/functions/booking-payment/index.ts`** issuing a Storage signed URL whose TTL is the remaining hold, capped at 15 minutes â€” refusing any booking not `held` or `awaiting_verification` (FR-009a)
- [ ] T085 [US2] Create `src/components/booking/QRPaymentPanel.tsx` showing the QR, the guidance text, and the stay total together
- [ ] T086 [US2] Add the statement that a booking is not confirmed until the resort verifies, and that no refund is issued through the site (FR-010)
- [ ] T087 [US2] Create `src/components/booking/ReferenceInput.tsx` â€” monospace, uppercased, charset and length validated server-side
- [ ] T088 [US2] Wire submission to `write_booking(action: 'submit_reference')`
- [ ] T089 **[US2] Implement hold expiry on the payment screen** â€” tell the guest, withdraw the QR, and offer to search the same dates again (FR-009b)
- [ ] T090 **[US2] Create `supabase/functions/send-booking-email/index.ts`** â€” escaping **every** interpolated value explicitly, since React is not in this path, and stripping CRLF from anything reaching a header (FR-018, constitution VIII g)
- [ ] T091 [US2] Skip sending silently when `guest_email` is null, for owner-entered walk-ins (FR-021e)
- [ ] T092 [US2] Write an `email_deliveries` row on every send attempt (FR-018e)
- [ ] T093 **[US2] Create `supabase/functions/email-webhook/index.ts`** with `verify_jwt = false` â€” reading the **raw body as bytes** before parsing, constant-time HMAC compare, 5-minute timestamp window, then idempotent insert into `webhook_events` in the same transaction as the delivery update
- [ ] T094 [P] [US2] Create `src/routes/guest/lookup.tsx` requiring reference and email, with all four states including rate-limited
- [ ] T094a [US2] Create `src/components/booking/BookingStatusTracker.tsx` for the lookup route
- [ ] T095 [US2] Add rate limiting to the lookup endpoint and to `search_availability` (FR-014, FR-014b)

**Checkpoint**: V4 passes. The QR is unreachable without an active booking.

---

## Phase 5: User Story 3 â€” Verify payment and confirm (P1)

**Goal**: The owner verifies a reference against their own banking app, records what arrived, and
confirms. The guest is emailed.

**Independent Test**: Open a seeded awaiting-verification booking, enter an amount, confirm, and
observe the state change, the recorded amount, the balance, and the email.

- [ ] T096 [US3] Create `src/routes/admin/bookings/index.tsx` surfacing awaiting-verification bookings first
- [ ] T097 [US3] Create `src/components/admin/VerifyPaymentForm.tsx` accepting any amount the owner enters â€” including one above the stay total (FR-016a)
- [ ] T098 [US3] Wire confirm and reject to `write_booking`, with a reason field on reject
- [ ] T099 [US3] Display the balance as stay total minus amount received, and allow confirming with a balance outstanding (FR-016, FR-016b)
- [ ] T100 [US3] Trigger the confirmation email, and **never block or reverse the state change when a send fails** (FR-018d)
- [ ] T101 [US3] Show which bookings have an undelivered email and let the owner filter to them (FR-018b)
- [ ] T102 [US3] Add the resend action with its own rate limit (FR-018c, FR-018g)
- [ ] T103 [US3] Implement all four states on the verification surface (FR-067)

**Checkpoint**: V6 passes. The money loop closes.

---

## Phase 6: User Story 4 â€” Manage bookings (P2)

**Goal**: The owner lists, filters, inspects, annotates, cancels, creates, and moves bookings.

**Independent Test**: Filter by each state, open a booking, add a note, change its dates, cancel it,
and confirm the dates return to availability.

- [ ] T104 [US4] Create `src/components/admin/DataTable.tsx` taking `loading`, `empty`, and `error` as first-class props, stacking to cards below 768px
- [ ] T105 [US4] Add state and date-range filtering, with **filtered-empty reading differently from genuinely empty**
- [ ] T106 [US4] Create `src/routes/admin/bookings/[id].tsx` showing guest details, dates, room, history, reference, amounts, and notes
- [ ] T107 [US4] Add private owner notes, never shown to the guest (FR-023)
- [ ] T108 [US4] Add editing of guest name, email, and phone (FR-023a) â€” without which a bounced email can never be resent
- [ ] T109 **[US4] Add owner-created bookings** via `write_booking(action: 'create_confirmed')`, with email optional and `origin` derived from the caller, never submitted (FR-021aâ€“f)
- [ ] T110 **[US4] Add date and room changes** via `write_booking(action: 'change_stay')` â€” re-pricing from rates in force now, carrying `amount_received` across untouched (FR-022c)
- [ ] T111 [US4] Show the overpayment and the outside-the-system refund statement when a stay is shortened below what was received (FR-022i)
- [ ] T112 [US4] Add cancellation **via `ConfirmDialog`** (FR-067a) with the refund statement, and reversal while the dates are still free (FR-024, FR-067e)
- [ ] T113 [US4] Render booking history from `booking_events`, showing the system as actor where no account acted (FR-022h)
- [ ] T114 [US4] Add erasure and export, both attesting identity and both iterating the register (FR-027b, FR-028a)
- [ ] T115 [US4] Surface `stale_record` as a plain-language message telling the owner the record changed elsewhere (R13)
- [ ] T116 **[US4] Extend `tests/concurrency/occupancy.test.ts` to three writers** â€” guest holds, owner-created bookings, and booking moves, interleaved

**Checkpoint**: **V1 re-run with three writers.** V1b passes.

---

## Phase 7: User Story 5 â€” Rooms, units, rates, and accommodations (P2)

**Goal**: The owner manages inventory and pricing; guests browse it.

**Independent Test**: Create a room type with two units and a rate, see it in search and on the
accommodations page, add a seasonal override, then archive it and watch it leave the guest surfaces
while its bookings remain.

- [ ] T117 [P] [US5] Create `src/routes/admin/rooms/index.tsx` listing room types with all four states
- [ ] T118 [US5] Create `src/routes/admin/rooms/[id].tsx` â€” full CRUD on name, description, bed configuration, capacity, base rate, and sort order (FR-029, FR-033a), **deletion via `ConfirmDialog`** (FR-067a)
- [ ] T119 [US5] Add room unit management, refusing deletion where bookings exist and offering archiving instead (FR-031)
- [ ] T120 [US5] Implement archive and un-archive, hiding archived types from guest surfaces while keeping their bookings readable (FR-032)
- [ ] T121 [US5] Create `src/routes/admin/rates/index.tsx` for date-range overrides with a label
- [ ] T122 [US5] Surface `rate_overlap` naming the conflicting override, from the exclusion constraint rather than a pre-check (FR-029b)
- [ ] T123 [P] [US5] Create `src/routes/guest/accommodations/index.tsx` in the owner's sort order
- [ ] T124 [US5] Create `src/routes/guest/accommodations/[slug].tsx` with photographs, bed configuration, capacity, rate, and an availability check
- [ ] T125 [US5] Implement room detail sections from `page_sections`, with the availability check undisableable (FR-033b), **and the scarcity count subject to the same threshold as search** â€” FR-002e requires it wherever availability is presented, not only in results
- [ ] T126 [US5] Verify every `position: sticky` element with Lenis active â€” it fails silently and looks like a CSS bug

**Checkpoint**: V8 and V11 pass. Token discipline holds.

---

## Phase 8: User Story 6 â€” Block dates (P2)

**Goal**: The owner withholds dates for maintenance, their own use, or a phone guest.

**Independent Test**: Block a range, confirm the unit is unavailable to guests, move the block onto
occupied dates and watch it refuse, then remove it.

- [ ] T127 [US6] Create `src/routes/admin/availability/index.tsx` with a month view distinguishing bookings from blocks at a glance (FR-038)
- [ ] T128 [US6] Add block creation with a reason, via `upsert_availability_block`
- [ ] T129 **[US6] Add block movement**, refused on collision by the same exclusion constraint that governs creation (FR-037a)
- [ ] T130 [US6] Surface `block_conflicts_booking` naming the conflicting booking's reference
- [ ] T131 [US6] Confirm block reasons never reach a guest-facing response (FR-002a)
- [ ] T132 **[US6] Extend the concurrency suite to four writers**, adding block movement

**Checkpoint**: **V1 re-run with four writers.** This is the last time the guarantee gains a writer.

---

## Phase 9: User Story 7 â€” Gallery (P3)

**Goal**: The owner uploads and organises photographs; guests browse them by category.

**Independent Test**: Upload an image with a description into a category, see it in the guest gallery,
reorder it, attach one to a room type and see it in both places from one upload, then delete it.

- [ ] T133 [US7] Confirm the bucket allowlist and size limits created in T050a actually reject an SVG, an oversized file, and a renamed non-image â€” bucket configuration is the enforcement, so it is worth proving rather than assuming
- [ ] T134 [US7] Create `src/lib/images/process.ts` â€” client-side resize and re-encode, stripping EXIF and generating responsive derivatives (R6)
- [ ] T135 [US7] Create `src/components/admin/ImageUploader.tsx` with magic-byte validation and **alt text required before save** (FR-040)
- [ ] T136 [US7] Create `src/routes/admin/gallery/index.tsx` with category management â€” add, rename, reorder, and delete once empty **via `ConfirmDialog`** (FR-041a, FR-067a)
- [ ] T137 [US7] Refuse deleting a category holding images, directing the owner to move them first (FR-041e)
- [ ] T138 **[US7] Implement the two-surface model** â€” one upload, `room_type_id` optional, independent `gallery_position` and `room_position` (FR-041b, FR-041c)
- [ ] T139 [US7] Withdraw an archived room type's photographs from the gallery as a query predicate, not a mutation, so un-archiving restores them (FR-041d)
- [ ] T140 [P] [US7] Create `src/routes/guest/gallery.tsx` with category filtering, hiding empty categories (FR-041f)
- [ ] T141 [P] [US7] Create `src/components/content/Lightbox.tsx` with focus trap, Escape to close, and focus returned to the trigger
- [ ] T142 [US7] Add the guidance when a category has too few photographs â€” advice, never a gate (FR-044a)

---

## Phase 10: User Story 8 â€” Content pages (P3)

**Goal**: The owner writes amenities, activities, and any other page; guests read them.

**Independent Test**: Create a page, publish it, watch it appear in navigation, edit it, unpublish it
and watch the menu entry go, then delete it.

- [ ] T143 **[GATE]** [US8] Present the exact packages and versions for `react-markdown` and `markdown-it` â€” wait for approval before installing
- [ ] T144 [US8] Create `src/routes/admin/content/index.tsx` and `[id].tsx` using **`MarkdownEditor` (T059a)**, so the owner never types syntax (FR-045)
- [ ] T145 **[US8] Reject raw HTML at save**, naming the offending fragment (FR-045a) â€” and configure the renderer with raw-HTML passthrough disabled as the second line
- [ ] T146 [US8] Preserve the owner's unsaved text when a save fails (FR-048)
- [ ] T147 [US8] Add menu position and optional menu label on the page itself â€” **no separate menu-management screen** (FR-051b)
- [ ] T148 [US8] Warn when the published page count would make navigation unusable, without blocking (FR-051c)
- [ ] T149 [US8] Refuse deletion of the three policy pages, enforced by the RLS delete guard (FR-059)
- [ ] T150 [P] [US8] Create `src/routes/guest/[slug].tsx` rendering with `Prose`
- [ ] T151 [US8] Remove a page from every navigation surface on unpublish and on delete (FR-047a, FR-049b)

---

## Phase 11: User Story 9 â€” Home page (P3)

**Goal**: A guest arriving from a shared link sees the property and can search immediately.

**Independent Test**: Load on a mobile viewport; hero and search usable without scrolling; disable a
section in the admin and watch the page change.

- [ ] T152 [US9] Create `src/components/sections/` â€” one component per `section_type`, mirroring the catalogue one-to-one
- [ ] T153 [US9] Create `src/routes/guest/home.tsx` composing enabled sections in their stored order (FR-050a)
- [ ] T154 [US9] Implement the three hero treatments â€” image, video with poster and no mobile autoplay, and DOM-transform depth-parallax (FR-050b). **None engage the 3D layer**
- [ ] T155 [US9] Implement the capiz `PaneGrid` hero reveal â€” opacity only, staggered 70ms, already visible under reduced motion
- [ ] T156 [US9] Implement the desktop pinned hero â€” 220vh wrapper, sticky inner, scale and opacity only (design-system Â§8.2). No pinned scene on mobile
- [ ] T157 [US9] Create `src/routes/admin/sections/index.tsx` for toggling and reordering, with the availability search having no disable control
- [ ] T158 [US9] Hide any section whose content is absent rather than rendering a gap (FR-050d)
- [ ] T159 [US9] Add OG tags, title, and description for shared links â€” the primary way this site will be seen (FR-052)
- [ ] T160 [US9] **Extend** the shell built in T063b with published content pages in menu order (FR-051a). The structural destinations already render; this adds the dynamic entries. Do not build a second navigation

---

## Phase 12: User Story 10 â€” Location, contact, enquiries (P3)

- [ ] T161 [P] [US10] Create `src/routes/guest/location.tsx` with address, static map image linking to a maps application, **transport directions rendered with `Prose`** (FR-053b â€” Markdown, never raw HTML), phone, and email (FR-053, FR-053a, FR-053b)
- [ ] T162 [US10] Read coordinates from `site_settings`, never a hardcoded position (FR-054)
- [ ] T163 [US10] Create the enquiry form with Turnstile, verified server-side, inserting **without `.select()`** â€” the P3 pattern gives anon no read, so returning the row fails
- [ ] T164 [US10] Implement the rate-limited state with a wait time and the resort's phone number (FR-014)
- [ ] T165 [P] [US10] Create `src/routes/admin/enquiries/index.tsx` with list, view, mark handled, note, and delete (FR-056)

---

## Phase 13: User Story 11 â€” Policy pages (P3)

- [ ] T166 [P] [US11] Seed privacy policy, terms, and cancellation policy with the coherent default text from security-baseline.md Â§8
- [ ] T167 [US11] State the published retention periods in the privacy policy, matching `site_settings` (FR-028e)
- [ ] T168 [US11] State in the cancellation policy that no refund is issued through the site (FR-060)
- [ ] T169 [US11] Make all three reachable from the footer on every page (FR-051)
- [ ] T170 [US11] Confirm the three carry no delete control anywhere in the admin (FR-059)

---

## Phase 14: User Story 12 â€” Site branding and settings (P3)

- [ ] T171 **[GATE]** [US12] Present the exact package and version for `culori` â€” wait for approval before installing
- [ ] T172 **[US12] Create `supabase/functions/save-branding/index.ts`** deriving the ten columns in OKLCH and **refusing the write when contrast fails**, returning the measured ratio and the failing pair (FR-063)
- [ ] T173 [US12] Create `src/components/admin/BrandColorPicker.tsx` showing the live contrast ratio as the owner drags
- [ ] T174 [US12] Create `src/components/admin/BrandPreview.tsx` previewing header, button, link, badge, pane band, and share card
- [ ] T175 [US12] Apply branding at startup with `setElementVars`, before first render
- [ ] T176 [US12] Create `src/components/admin/LogoUploader.tsx` for the four slots, accepting PNG and WebP only, **preserving alpha** â€” never flattening to JPEG (design-system Â§3.5)
- [ ] T176a [US12] Create `src/routes/admin/branding/index.tsx` mounting `BrandColorPicker`, `BrandPreview`, and `LogoUploader`, with all four states. **Three components were built with nothing rendering them** â€” the same gap G5 found for the guest shell
- [ ] T177 [US12] Create `src/components/content/Logo.tsx` falling back to the wordmark, with alt defaulting to the property name and never blank
- [ ] T178 [US12] Derive the header treatment from whether an inverse logo exists â€” transparent with scrim if present, solid if not
- [ ] T179 [US12] Generate the favicon server-side from the square mark, and enforce 1200Ã—630 on the share image
- [ ] T180 [US12] Add reset-to-seed, which is what delete means for a singleton (FR-066)
- [ ] T180a **[US12] Create `src/routes/admin/settings/index.tsx`** â€” property name, address, coordinates, **transport directions via `MarkdownEditor` (T059a, FR-053b)**, contact details, timezone, hold and awaiting durations, minimum notice and cutoff hour, scarcity threshold, session idle minutes, retention periods, and rate limits, with all four states (FR-002c, FR-005b, FR-014a, FR-020a, FR-020b, FR-028e, FR-069d)
- [ ] T180b [US12] Warn before saving a timezone change that it alters how every stored date is interpreted while migrating no data (R17)
- [ ] T180c [US12] Add inline guidance to every setting whose correct value is not self-evident â€” deposit guidance, payment QR, retention periods, scarcity threshold (FR-067d)

---

## Phase 15: Polish & Cross-Cutting

- [ ] T181 [P] Run the full quickstart V1â€“V11 suite and record the results
- [ ] T182 [P] Add the CI contrast assertion over the static token pairs, plus the photo-background pair against a white-sand image (design-system Â§11.1)
- [ ] T183 [P] Assert `grep -r "dangerouslySetInnerHTML" src/` returns nothing
- [ ] T184 [P] Assert `grep -r "service_role" dist/` returns nothing and no secret carries a `VITE_` prefix
- [ ] T185 Run Lighthouse mobile on the throttled profile against home and accommodations â€” usable â‰¤4s, LCP â‰¤2.5s, no horizontal scroll at 360px (SC-004, SC-012)
- [ ] T186 Verify every surface against the spec's Surface State Coverage table using the quickstart V8 method
- [ ] T187 Audit keyboard operability end to end, including the date picker and every modal (FR-068, FR-068c)
- [ ] T188 Verify reduced motion â€” Lenis destroyed rather than shortened, hero static, hold timer numeric
- [ ] T189 [P] Write the client deployment checklist covering owner provisioning (CHK039), data region, demo-asset removal, and DNS with SPF/DKIM
- [ ] T190 **Arrange the SC-007 observed trial** with a participant who is not the developer. If none is available, **report SC-007 as unverified â€” never as passed** (C12)
- [ ] T191 Work the 57 remaining items in `checklists/flows.md` against the stories they concern
- [ ] T192 Confirm no demo imagery remains â€” `demo-assets/` empty and unreferenced (constitution IV)

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** â†’ no dependencies
- **Foundational (Phase 2)** â†’ depends on Setup. **BLOCKS every user story**
- **US1 (Phase 3)** â†’ depends on Foundational. The MVP slice
- **US2 (Phase 4)** â†’ depends on US1 â€” there is no payment step without a hold
- **US3 (Phase 5)** â†’ depends on US2 â€” nothing to verify without a submitted reference
- **US4 (Phase 6)** â†’ depends on US3
- **US5, US6 (Phases 7â€“8)** â†’ depend on Foundational only. The seed supplies their data, so they may run before US4 if you prefer
- **US7â€“US12 (Phases 9â€“14)** â†’ depend on Foundational only. Genuinely independent of each other
  **because every shared component lives in Phase 2** â€” a component built inside one story's route and
  reused by another would silently create an ordering dependency, which is what T059a exists to prevent
- **Polish (Phase 15)** â†’ depends on everything

### The critical path

`Setup â†’ Foundational â†’ US1 â†’ US2 â†’ US3`. That is the booking loop and the entire correctness surface.
Everything after is presentational by comparison, which is the brief's own Â§8 sequencing note.

### Within each story

Migrations â†’ RPCs â†’ components â†’ routes â†’ states â†’ verification.

### Parallel opportunities

- T004, T005, T009, T010 during Setup
- T029â€“T032, T034 â€” independent migrations
- T055, T056, T058, T060, T062 â€” component families in different directories
- T065, T066, T067 â€” the three audit suites
- US7 through US12 in any order once Foundational is done

---

## Implementation Strategy

> **Constitution X â€” one scoped stage per run.** Phase 1+2 is one run and **stops before US1**. Every
> user story phase is its own run. Do not chain them: a failure spanning several stories has too many
> possible origins to debug.

### MVP first

1. Phase 1 + 2 â€” Setup and Foundational
2. **Stop. Validate**: V1, V1b, V3, V3b, V6
3. Phase 3 â€” US1
4. **Stop. Validate**: V1, V3
5. **This is demonstrable.** A guest can search real availability and hold a real room against the seeded property

### Incremental delivery

US2 â†’ US3 closes the money loop and makes the product complete in the narrow sense. US4â€“US6 make it
operable. US7â€“US12 make it sell.

### Verification between every stage

1. `pnpm build` â€” with typed tokens, a wrong name fails here rather than looking subtly off
2. Loose-ends sweep â€” fix every BLOCKER
3. Look at it in a browser, or drive it with Playwright

Then file the completion report naming **Simplified / Skipped / Blocked** explicitly, and say which
phase is next (constitution XI).

---

## Notes

- **[GATE]** tasks stop and wait for a human answer. Six of them â€” five dependency approvals and one
  extension migration. Every other migration is presented for approval as it is written
- **[P]** means different files and no dependency on incomplete work
- V1 runs at three checkpoints because the writer set grows: one at Foundational, three at US4, four
  at US6
- **Suffixed IDs** (`T050a`, `T063a`â€¦) are tasks inserted after the first generation, placed beside
  what they relate to. **Gaps in the sequence mean a task was withdrawn** â€” `T044` folded into T043
  and T047 so the locking lives with the functions it protects, and `T083` folded into `T050a` so all
  three buckets are created once, before anything references them
- 197 tasks Â· 12 user stories Â· MVP is Phase 1 + 2 + 3

## Changes from `/speckit-analyze`

Six findings, all closed by editing this file plus one spec heading:

| Finding | Change |
|---|---|
| **G1** â€” `site_settings` had no write path at all | `save_site_settings` added to T047; T180aâ€“c create the admin surface |
| **G3** â€” password reset had zero tasks | T063a |
| **G4** â€” `ConfirmDialog` was in no task | folded into T060 |
| **G5** â€” no task created the guest site shell | T063b, T063c; T160 now extends it rather than building a second navigation |
| **F1** â€” T044 modified functions created three tasks later | T044 withdrawn; locking folded into T043 and T047 |
| **F2** â€” buckets created in US7 but referenced in Phase 2 | T050a; T083 withdrawn, T133 reduced to proving the allowlist rejects what it should |

**Second analyze pass** found three more, two of them introduced by the remediation above:

| Finding | Change |
|---|---|
| **F4** â€” T053a claimed to precede T051 while numbered after it | Renumbered to **T050a** and moved before the seed. Position enforces the order; the note now explains rather than instructs |
| **F5** â€” `save_site_settings` existed only as a clause in T047 | Added to `contracts/rpc-functions.md` with its validation and error codes |
| **C1** â€” FR-002e was covered in search only | Folded into T125 |

**Third analyze pass** found three more, two again from the previous remediation:

| Finding | Change |
|---|---|
| **F7** â€” the FR-053b fix left transport notes with no renderer, no HTML rejection, and **no editor at all** | `save_site_settings` now rejects raw HTML; T161 renders with `Prose`; T180a gained the field |
| **C5** â€” nothing uploaded demo imagery into its bucket, so the seeded gallery would reference objects that never existed | T051 now uploads; T054 states its files are the input |
| **A2** â€” the plan's rewritten admin route listing dropped `enquiries` | Added |

**Fourth analyze pass** found two coverage gaps that had survived all three earlier passes:

| Finding | Change |
|---|---|
| **G6** â€” `BrandColorPicker`, `BrandPreview`, and `LogoUploader` were built with no route mounting them | **T176a** creates `admin/branding` |
| **G7** â€” no shared Markdown editor existed; T144 built a toolbar inside a route and T180a referenced "the same editor" | **T059a** creates `MarkdownEditor` in Phase 2; both consumers now reference it |
| **F8** â€” T180a's dependency on T144 silently broke the US7â€“US12 independence claim | Resolved by G7; the claim now states *why* it holds |
| **C6** â€” the C5 fix left teardown unable to remove what seed uploads | T052 names storage objects, and excludes the local source directory |

**Four passes, and the pattern was not what it looked like.** The first three each caught something
the previous remediation introduced, which suggested findings were shrinking toward cosmetic. They
were not â€” **each remediation reached into a new area, and the next pass audited that area for the
first time.** G6 survived three passes because nothing had made anyone check whether US12's
components had a route.

The fragile spots, consistently: cross-document listings, requirement changes whose downstream tasks
were not re-checked, and **components built without a surface that mounts them** â€” which is now the
second occurrence of that exact shape, after G5.

**Fifth pass â€” a systematic mount-and-link sweep** rather than another general pass. For every
component in `design-system.md` Â§5: does a task build it? For every route: does something link to
it? For every defined prop: does a task supply it?

| Finding | Change |
|---|---|
| **G8** â€” eleven admin routes existed and **nothing navigated between them**. The design system defines `AdminShell`'s `nav` prop; no task supplied it | T063 now builds the sidebar |
| **G9** â€” no not-found route, though FR-047 and FR-069c both require one | **T063d** |
| **G10** â€” five components specified in Â§5 and built by no task: `Card`, `BookingSummary`, `FormPanel`, `FilterBar`, `BookingStatusTracker` | **T058a, T060a, T094a** |
| **F9** â€” `MarkdownEditor` existed in tasks but not in the component inventory, so its props were defined nowhere | Added to design-system Â§5.3 |

**Sixth pass â€” the inverse sweep.** For every component a task builds, does any task consume it?

| Finding | Change |
|---|---|
| **G11a** â€” `ConfirmDialog` was built and used nowhere, so FR-067a's confirmation-before-destruction would have shipped unimplemented | Named in T112, T118, T136, plus a blanket rule in the execution rules above |
| **A4** â€” the plan's tree and `design-system.md` Â§5 both enumerated components and routes, neither declared authoritative. **Root cause of A2, A3, and part of G6 â€” four findings across three passes** | The plan's tree is now declared illustrative; Â§5 and this file are the inventories |
| **G11, F10, A3** â€” five more components built without a named consumer, and one inverted ordering | **Left deliberately.** A component nothing imports is something the build reports in seconds; spending a seventh pass on it costs more than it returns |

**Pass 6 was the first with no HIGH finding.** Six passes produced 23 findings, 2 critical â€” both
closed at pass 1 â€” and zero constitution violations.

**The sweep found in one pass what four general passes had missed.** G5, G6, and G8 were the same
defect three times; G10 found five more instances of it. A check of the form "every specified
component has a task, every route has a link, every prop has a supplier" would have caught all of
them at pass 1.

The lesson recorded after G6 was not acted on â€” the next two passes ran the same way and found G8 by
accident. **Naming a failure class and not sweeping for it is worse than not naming it**, because it
makes the class look handled.

**Still open, deliberately**: SC-003 needs funnel instrumentation and SC-005 needs a soak test, and
neither has a task. Both are success criteria that read like acceptance tests but are really
post-launch measurements â€” worth reclassifying rather than building infrastructure for.
