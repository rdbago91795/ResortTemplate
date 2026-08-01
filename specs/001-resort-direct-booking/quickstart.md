# Quickstart — Validation Guide

**Feature**: 001-resort-direct-booking

How to stand this up and prove it works. Run these after each implement stage, before starting the
next (constitution X).

---

## Prerequisites

- Node 20+, pnpm (or npm)
- Docker Desktop running — the local Supabase stack needs it
- Supabase CLI
- A Resend API key (free tier) for the email checks; everything else runs locally

**No dependency in `research.md` has been installed.** Constitution X requires the exact package and
version to be shown and confirmed first. Expect an approval prompt before each install.

---

## Setup

```bash
supabase start
```

```bash
cp .env.example .env.local
```

Fill `.env.local`. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TURNSTILE_SITE_KEY`
carry the `VITE_` prefix — anything else with that prefix is published into the client bundle
(baseline §3.1).

```bash
supabase db reset
```

```bash
pnpm seed
```

Seeds the fictional demo property with 4–6 room types, realistic availability, at least one seasonal
rate override, and a booking in **every** state (FR-070…FR-074).

```bash
pnpm seed:teardown
```

Both commands must be re-runnable against a fresh database (FR-075). If seeding ever needs a manual
dashboard step, it has failed its purpose and will rot within a month.

---

## Run

```bash
pnpm dev
```

Guest site at `http://localhost:5173`, admin at `/admin`. Sign in with the seeded owner account
printed by `pnpm seed`.

---

## Validation scenarios

Each maps to a spec success criterion. Run the ones covering the story you just implemented.

### V1 — Availability integrity (SC-001) — **the one that matters**

```bash
pnpm test:concurrency
```

Fires 200 simultaneous claims on one unit and identical dates. **Expect exactly one success.** Then
repeats with **all four writers interleaved** — guest holds, owner-created bookings, owner date-moves,
and **block moves** (FR-037a). A suite that exercised only the first proves nothing about the other
three.

Fails here mean the exclusion constraint is missing, mis-scoped, or a writer bypassed
`write_booking()`. Do not proceed past this.

```bash
supabase db diff --schema public | grep -i "exclude"
```

Should show `occupancy_no_overlap` and `rate_overrides_no_overlap`. Absent means the guarantee is
absent regardless of what the tests say.

### V1b — Stale writes are refused (R13)

Load a booking in two tabs, save in one, then save in the other. **Expect `stale_record`**, not a
silent overwrite. Repeat for a rate override and an availability block. Then repeat for a gallery
caption and **expect it to succeed** — last-write-wins is the deliberate choice there, and a
`stale_record` on a caption would mean the selectivity was implemented as blanket locking.

### V2 — Hold expiry without human action (SC-005)

Create a hold, set `hold_expires_at` into the past, wait for the 5-minute `pg_cron` tick, confirm the
booking is `expired` and the dates are bookable again.

```bash
supabase db query "select jobname, schedule, active from cron.job;"
```

Two active jobs expected. **A passing unit test proves nothing here** — the requirement is that expiry
happens with nobody acting.

### V3 — Guests never receive occupancy (FR-002a, SC-018)

With the browser network tab open, search availability. Inspect every response.

- No `bookings` row, no `availability_blocks` row, no `reason` field — anywhere.
- `search_availability` returns counts and prices only.

```bash
pnpm test:rls
```

Asserts that an anon key selecting from `bookings`, `availability_blocks`, and `room_occupancy`
returns zero rows rather than an error — RLS filters rather than refuses, which is the correct and
more confusing outcome to verify.

### V3b — Scarcity count is gated in the database (FR-002c, C14)

Seed a room type with four free units and set `scarcity_threshold` to 2.

**Search those dates with the network tab open.** The response must carry `units_available: null` —
not `4`. A response containing the real count with the interface merely not rendering it is a **fail**,
however correct the screen looks: the occupancy curve is then readable by anyone who opens devtools,
and harvestable by polling.

Then reduce availability to 2 and search again — expect the true count. Set the threshold to `0` and
search at every level — expect `null` throughout.

```bash
pnpm test:rls
```

Extend this suite to assert the same over repeated queries, since a single check cannot distinguish
"gated" from "happens to be null right now".

### V4 — Payment QR is gated (C8, FR-009a)

Copy the signed QR URL from an active hold. Then:

- Confirm the booking and re-request `booking-payment` → expect `409`.
- Wait past the hold and open the copied URL directly → expect expiry.
- Request `booking-payment` with a valid reference and a wrong email → expect an opaque `404`,
  indistinguishable from not-found.

### V5 — No HTML path (C7)

```bash
grep -rn "dangerouslySetInnerHTML" src/
```

**Must return nothing.** Then paste `<img src=x onerror=alert(1)>` into a content page body and save —
expect `html_not_allowed` with the offending fragment named, and confirm nothing renders as markup on
the guest page.

### V6 — Erasure reaches everywhere (SC-014, FR-026b, FR-027a)

Seed a guest who **booked twice, had one email bounce, and also sent an enquiry**. Erase by email
address once.

```bash
supabase db query "select table_name, personal_columns from public.personal_data_stores;"
```

Then search **every column named in that register** for the erased values. Expect zero hits — both
bookings anonymised, both delivery addresses cleared, the enquiry gone, from a single action.

```bash
pnpm test:register-coverage
```

Asserts that every column documented as personal data appears in `personal_data_stores`. **A new
store that skips the register must fail here**, not in a privacy audit two years later — that
assertion is the whole reason the register is a table rather than prose (R16).

### V6b — Retention runs unattended (SC-019, FR-028d)

Seed a booking checked out beyond `booking_retention_months` and an enquiry beyond
`enquiry_retention_months`. Wait for the daily job. Expect the booking anonymised and the enquiry
gone, **with nobody having acted**. A passing unit test proves nothing here; the requirement is that
it happens on its own.

### V7 — Brand contrast is enforced server-side (FR-063)

In the admin, set the primary colour to `#FFF9C4` (pale yellow). Expect refusal with the measured
ratio. Then bypass the UI:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/save-branding" \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"primaryHex":"#FFF9C4","secondaryHex":"#C9DCD4"}'
```

Expect `422 contrast_too_low`. **A UI-only check would pass this and is not sufficient.**

### V8 — Four states on every surface (constitution IX)

For each surface in spec.md's Surface State Coverage table: throttle to Slow 3G for loading, use a
fresh database for empty, stop the Supabase container for error, and seed for success. A surface
missing any of the four is incomplete, not "mostly done."

### V9 — Mobile performance (SC-004, SC-012)

```bash
pnpm build && pnpm preview
```

Lighthouse mobile against the home page and an accommodation page: usable ≤4s on throttled 3G, LCP
≤2.5s, and no horizontal scroll at 360px width.

### V10 — Reduced motion (constitution VI)

Enable the OS reduced-motion setting, reload, and confirm: no transforms animate, **Lenis is destroyed
rather than shortened**, the hero is static, and `HoldTimer` shows a number instead of an animating
bar.

### V11 — Token discipline (constitution V)

```bash
pnpm build
```

A wrong theme token name fails the build rather than looking subtly off — that is the point of the
typed contract.

```bash
grep -rnE "#[0-9a-fA-F]{6}|rgb\(|[0-9]+px" src/ --include="*.css.ts"
```

Every hit must be a justified exception (hairline borders, values genuinely outside the system) and
recorded in the plan's Complexity Tracking.

---

## Before moving to the next story

Constitution X's verification, in order:

1. `pnpm build` — clean
2. Loose-ends sweep (chain doc §1.10) — every BLOCKER fixed
3. Look at it in the browser, or drive it with Playwright

Then file the completion report with **Simplified / Skipped / Blocked** named explicitly, and state
which story is next (constitution XI).

---

## References

- Contracts: [rpc-functions.md](contracts/rpc-functions.md) · [edge-functions.md](contracts/edge-functions.md)
- Schema, cardinality, RLS map: [data-model.md](data-model.md)
- Decisions and rejected alternatives: [research.md](research.md)
