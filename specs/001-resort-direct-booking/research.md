# Phase 0 — Research

**Feature**: 001-resort-direct-booking
**Date**: 2026-07-31 · **Revision 2** — re-run after clarifications C9–C13 and gate remediation
**Spec at time of writing**: 176 functional requirements, 21 success criteria, 13 clarifications

Resolves every `NEEDS CLARIFICATION` in the plan's Technical Context. The stack is fixed by the
constitution and is not researched here — only the choices it leaves open.

**What changed since revision 1**: R13–R17 are new, driven by C9–C13 and by findings in
`checklists/flows.md`. R6 gained a note. Everything else stands.

---

## R1 — Booking writes: one mechanism for three paths

**Decision**: A single `security definer` PL/pgSQL function, `public.write_booking()`, owns every
state transition and every date/room change. Three thin callers use it — the anon hold RPC, the admin
create RPC, the admin modify RPC. The `bookings` table has **no client write policy at all**.

**Rationale**: The spec has three write paths (C2, C4, C6) into one state machine, and SC-001 requires
the overlap guarantee across all three. The database exclusion constraint protects overlap
unconditionally because it is a constraint. The *state machine* has no equivalent backstop — expressed
as table policies it would be written three times and load-tested once. This is why the security
baseline withdrew the admin UPDATE policy rather than widening it (baseline §1.3).

**Alternatives**: widening the admin UPDATE policy (rejected — `with check` cannot see the old row, so
it cannot express "confirmed may go to cancelled but not back to held"); a trigger (rejected — cannot
return which unit was taken or what remains open, which the error requirements need).

## R2 — Overlap prevention

**Decision**: A single `room_occupancy` table that bookings and blocks both project into, carrying one
`btree_gist` exclusion constraint. Full rationale in [data-model.md](data-model.md).

**This design now also discharges FR-037a for free**, which is worth recording. A block whose dates
change simply re-projects its occupancy row inside the same transaction, and the exclusion constraint
adjudicates the move exactly as it adjudicates a creation. Had the constraint lived on
`availability_blocks` with a trigger checking `bookings`, FR-037a would have needed a second
implementation — and would have been the one nobody load-tested.

## R3 — Rate overrides: overlap under concurrency

**Decision**: `exclude using gist (room_type_id with =, date_range with &&)` on `rate_overrides`
(FR-029b). Same reasoning as R2 — a `select ... where not exists` check races.

## R4 — Scheduled work

**Decision**: `pg_cron`, **four jobs**: hold expiry and awaiting-verification expiry (5-minute
cadence), booking anonymisation and enquiry deletion (daily).

**Rationale**: Constitution III requires expiry with no human action; FR-028d extends the same
principle to retention. Both run in-database so a deploy that forgets a worker cannot break them.
SC-005 requires release within 5 minutes of expiry, which the cadence satisfies directly. Retention is
daily because a 24-month boundary does not need minute precision.

## R5 — Markdown rendering without an HTML path (C7)

**Decision**: `react-markdown` **without** `rehype-raw`; server-side rejection at save using
`markdown-it` with `html: false`.

**Rationale**: `react-markdown` builds a React element tree — it never assembles an HTML string and
never touches `innerHTML`, so there is no `dangerouslySetInnerHTML` in the render path at all. That is
a structurally different guarantee from "we sanitise carefully": the unsafe API is absent rather than
used correctly.

## R6 — Image processing ⚠ **constraint**

**Decision**: Client re-encodes and resizes before upload (Canvas API); bucket configuration enforces
MIME allowlist and size; derivatives generated client-side at upload.

**Rationale and honest cost**: Supabase Edge Functions run Deno; `sharp` is a native Node binding.
Storage image transformations are a paid-plan feature and the constraint is "budget: none to minimal."
Client-side re-encode strips EXIF and neutralises polyglots as a side effect of decoding — but on a
machine we do not control, so **the bucket's MIME and size limits are what actually enforce**.
Recorded as deviation C-1 in the plan.

**New note from C11**: a photograph now appears on two surfaces from one upload (FR-041b). That is a
row-level concern, not an image-processing one — the same stored file is referenced twice with two
positions. No additional derivatives are needed.

## R7 — Payment QR retrieval (C8)

**Decision**: An **Edge Function**, not an RPC — SQL cannot mint a Storage signed URL. TTL tracks the
remaining hold, capped at 15 minutes. Full contract in
[contracts/edge-functions.md](contracts/edge-functions.md).

## R8 — Brand colour derivation

**Decision**: Edge Function using `culori` via `npm:` specifier, OKLCH space, contrast enforced before
write (FR-063).

## R9 — Transactional email

**Decision**: **Resend**, with its delivery/bounce webhook feeding `email_deliveries` (C5). Free tier
of 3,000/month comfortably exceeds a 14-room property's volume. The resort's own domain sends, with
SPF/DKIM at deploy — a confirmation from a generic sender lands in spam, which is FR-018's failure
mode by another route.

## R10 — Rate limiting

**Decision**: Cloudflare Turnstile on public forms, verified server-side inside the Edge Function;
`rate_limit_events` counter table for per-identifier limits, IP stored as a salted hash. FR-014a
requires the thresholds be changeable without a release, so they live in `site_settings`.

## R11 — Accessible date range picker

**Decision**: `react-day-picker` v9, styled with Vanilla Extract against the theme contract.
FR-068c makes keyboard operability a requirement rather than a nicety — this is the sole entry point
to the booking flow.

## R12 — Testing

**Decision**: Vitest + Testing Library; Playwright for journeys; a dedicated concurrency suite.

**The concurrency suite now covers four writers, not three.** SC-001 was widened, and FR-037a adds
block *movement* as a fourth way to claim occupancy. The suite fires 200 interleaved
holds / owner-creates / booking-moves / block-moves at one unit and identical dates, and asserts
exactly one claim survives.

---

## R13 — Concurrent edits: selective optimistic concurrency *(new — CHK035)*

**Decision**: Every owner-editable table carries `updated_at`. The write path **requires a matching
`updated_at` from the caller** for **bookings, rate overrides, and availability blocks**, and rejects
a stale write with `stale_record`. All other entities are last-write-wins.

**Rationale**: The spec has one owner account, but that owner uses a phone and a laptop (design system
§10.1 explicitly designs for both). A lost update is silent by nature — nothing tells the owner their
change vanished.

The selectivity is the interesting part. Optimistic locking everywhere means every form must carry and
return a token, and every conflict must be explained to a non-technical owner — real cost, paid on
twelve entities. But a lost update on a **gallery caption** costs a retype, while a lost update on a
**booking's dates**, a **rate**, or a **block** costs money or a double-booking. Those three earn the
protection; the rest do not.

**Alternatives**: last-write-wins everywhere (rejected — silent loss on the three that matter);
optimistic locking everywhere (rejected — cost on twelve entities to protect three); pessimistic locks
(rejected — an owner who closes a tab holds a lock nobody can clear).

## R14 — Composed pages: sections as data *(new — C10)*

**Decision**: A `page_sections` table holds one row per (page, section type), seeded from a catalogue
the template defines. The owner toggles `enabled` and sets `position`. **No insert or delete is
available to any client** — the catalogue is fixed by the template, so the only writes are updates.

**Rationale**: This is what makes C10 "fixed sections the owner arranges" rather than a page builder.
Modelling section types as data the owner can create would be a builder by another name; modelling
them as code would put `enabled` in a config file and break Principle I's configuration-not-code rule.
Rows the owner may update but not create or destroy is exactly the middle position C10 chose.

**FR-050c and FR-033b** (the availability search cannot be disabled) are enforced by a check
constraint, not by hiding a toggle in the UI — a rule enforced only in the interface is a rule that
survives until someone calls the API directly.

**Alternatives**: JSON blob in `site_settings` (rejected — no per-row constraint, so FR-050c becomes
application logic); a section table the owner can insert into (rejected — that is a page builder,
which C10 declined).

## R15 — Gallery: one image, two surfaces *(new — C11)*

**Decision**: `gallery_images` carries a nullable `room_type_id`, a `category_id`, and **two position
columns** — `gallery_position` and `room_position`. A room's photographs are found by
`room_type_id`; the Rooms category is a query over the same rows.

**Rationale**: FR-041b requires one upload to serve both surfaces, and FR-041c requires independent
ordering. Two position columns on one row is the smallest structure that satisfies both. A join table
would allow an image in several categories — which the spec does not ask for, and which would make
"the Rooms category" ambiguous.

**FR-041d** (archiving a room type withdraws its photographs from the gallery) becomes a predicate on
the gallery query rather than a data mutation, so un-archiving restores them without a repair step.

## R16 — Personal data register as a database object *(new — FR-026a)*

**Decision**: The register is a **table**, `personal_data_stores`, listing each store and the columns
holding personal data. Erasure, export, and retention all iterate it. Adding a store is a row, and the
migration that adds a personal-data column adds that row.

**Rationale**: FR-026b states that a rule naming individual stores instead of the register is defective
by construction. That is only true if the register is a real object — a register that exists as prose
in the spec is one someone forgets to update, which is exactly how this defect recurred three times.
Making it data means the erasure function is written once and never needs editing when a store is
added.

**The verification is what makes it work**: a test asserts that every column named in any table's
comment as personal data appears in the register. A new store that skips the register fails CI rather
than failing a privacy audit two years later.

**Alternatives**: hard-coded list in the erasure function (rejected — this is the defect); scanning
`information_schema` by column name (rejected — `email` on `site_settings` is the resort's address,
not a guest's, so name-matching produces false positives that erase the property's own contact
details).

## R17 — Timezone as a stored setting *(new — FR-020a, CHK037)*

**Decision**: `site_settings.timezone` (IANA name), defaulting to `Asia/Manila`. All date comparisons
— "today", cutoffs, expiry, retention boundaries — evaluate against it. Stay dates remain `date`, not
`timestamptz`: a stay occupies nights, not hours.

**Changing the timezone does not migrate anything**, and this is deliberate. Stay dates are calendar
dates in the property's own frame; they mean the same nights regardless of where the reader is. Only
*evaluation* moves — what counts as "today" and when the cutoff falls. Recording this now prevents a
future maintainer writing a migration that shifts every booking by a day.

## R18 — Scarcity count gated in the database, not the client *(new — C14)*

**Decision**: `search_availability` returns the true remaining count when it is at or below
`site_settings.scarcity_threshold`, and **`null` above it**. The threshold is applied inside the
function.

**Rationale**: Returning the real count and hiding it in the interface would put the property's full
occupancy curve in every network response — readable by anyone who opens a browser's network tab, and
trivially harvestable by polling. The number must not leave the database on a query that should not
disclose it. A UI-level filter satisfies the requirement as written and defeats its purpose entirely,
which is the kind of gap that survives code review because the screen looks correct.

This also made rate limiting on search material for the first time (FR-014b). Before a count was
disclosable, searching revealed only what a booking attempt would reveal anyway.

**Alternatives**: filter in the client (rejected above); omit the count entirely (rejected — binary
availability already discloses occupancy at the extremes, and C2's one-room-per-booking rule creates a
group dead-end the count repairs); always return it (rejected — hands over the exact occupancy curve).

---

## Resolved Technical Context

| Field | Value |
|---|---|
| **Testing** | Vitest + Testing Library; Playwright for journeys; four-writer concurrency suite (R12) |
| **Performance** | Guest pages usable ≤4s, LCP ≤2.5s on a 4× CPU-throttled profile over 1.6 Mbps / 750 kbps / 150 ms (SC-004); admin same, bookings list ≤6s at a year of data (SC-004a) |
| **Constraints** | Free-tier Supabase — no server-side image transforms (R6); ~90KB font budget, route-scoped |
| **3D layer** | **Off.** No plan enables it |
| **Scheduled jobs** | 4 (R4) |
| **New dependencies** | `react-day-picker`, `react-markdown`, `markdown-it`, `culori`, `@vanilla-extract/dynamic`, Resend SDK, Cloudflare Turnstile |

**Every dependency requires the constitution X approval gate before installation** — exact package and
version shown, confirmed, then installed. **None have been installed by this plan.**
