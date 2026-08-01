# Contract — Database RPCs

**Feature**: 001-resort-direct-booking

Every function is `security definer` with `set search_path = ''` (constitution VIII / baseline §1.1
rule 4). Execute grants are stated per function; nothing defaults to `public`.

**Errors** are raised with a stable machine code as the message. The client maps codes to the copy in
design-system.md §6; it never surfaces a raw database error.

---

## Booking writes — one owner, three callers

### `public.write_booking(p_action, p_payload jsonb) → jsonb`

**The only path that mutates `bookings` or `room_occupancy`** (research R1). Owns every transition in
data-model.md's state diagram.

| `p_action` | Caller | Execute grant |
|---|---|---|
| `hold` | Guest, anonymous | `anon` |
| `create_confirmed` | Owner (C4) | `authenticated`, gated on `is_admin()` |
| `submit_reference` | Guest, anonymous | `anon` |
| `verify` | Owner | `authenticated` |
| `reject` / `cancel` | Owner | `authenticated` |
| `change_stay` | Owner (C6) | `authenticated` |
| `erase_guest` | Owner (FR-027, FR-027a) | `authenticated` |

**Invariants it enforces, in order:**

1. Caller authorisation — `is_admin()` for every owner action; anonymous actions reject an
   authenticated caller so `origin` cannot be forged (FR-021f).
2. **`origin` is derived here, never accepted from the payload** — `hold` → `online`,
   `create_confirmed` → `owner`.
3. Transition legality against the current status. Illegal transitions raise
   `invalid_transition`.
4. Date validity: `check_out > check_in`, not in the past, ≤30 nights, ≤12 months ahead (FR-020).
5. Capacity: `guests` against the stored `room_types.max_occupancy`, never a client-supplied value.
6. **Unit selection is server-side.** The caller names a room *type*; the function picks a free unit
   in `sort_order`, retrying the next on `exclusion_violation`.
7. `stay_total` computed from `room_types.base_nightly_rate` and `rate_overrides`, night by night
   (FR-003). **Never accepted from the client.**
8. `hold_expires_at` computed from `site_settings.hold_minutes`. Never accepted from the client.
9. Occupancy row written in the same transaction; the exclusion constraint is the overlap guarantee.
10. A `booking_events` row is written for every action — the 1..N cardinality is an invariant, not a
    convention.

**Errors**: `no_availability` · `invalid_date_range` · `check_in_in_past` · `stay_too_long` ·
`invalid_guest_count` · `invalid_transition` · `not_authorised` · `rate_limited` · `booking_terminal`

**`change_stay` specifics** (C6): re-prices from rates in force *now* (FR-022c), leaves
`amount_received` untouched, deletes and re-inserts the occupancy row inside the transaction so the
exclusion constraint adjudicates the move, and refuses on `cancelled` or `expired`.

---

## Guest reads

### `public.search_availability(p_check_in date, p_check_out date, p_guests int) → setof availability_row`

`grant execute to anon, authenticated`

Returns one row per available room type: `room_type_id`, `name`, `slug`, `max_occupancy`,
`base_nightly_rate`, `nightly_breakdown jsonb`, `stay_total`, `units_available`.

**Returns availability, never occupancy** (FR-002a). No booking row, no block row, no reason, and no
indication of *why* a unit is unavailable.

**It also enforces the minimum booking notice** (FR-020b–d): dates inside the notice window return
`too_soon` together with the earliest bookable date, rather than reporting the property as full. The
cutoff is evaluated here and at hold creation — **never at reference submission**, which would take a
guest's payment and then refuse the room (C13).

**`units_available` is threshold-gated at the function, not in the client** (FR-002c, C14). The
function returns the true count when it is at or below `site_settings.scarcity_threshold`, and
**`null` above it** — so the exact number never leaves the database on a query that should not
disclose it. Returning the real count and hiding it in the UI would put the occupancy curve in every
network response, which is the disclosure the threshold exists to prevent.

A threshold of `0` returns `null` always.

**Rate limited** (FR-014, FR-014b) — generous enough for a guest comparing date ranges, tight enough
that occupancy cannot be mapped by polling. This became material only once FR-002c made a count
disclosable.

### `public.get_booking_by_reference(p_reference text, p_email text) → setof booking_public_row`

`grant execute to anon, authenticated` · **rate limited 10/hour/IP** (baseline §2.5)

Requires both values. Returns `booking_reference`, `status`, `check_in`, `check_out`, room type name,
`stay_total`, `amount_received`, `balance`. Returns **no** `guest_phone`, `owner_notes`, or state
history.

Does **not** return the payment QR — that needs a signed URL, which SQL cannot mint (research R7). See
`edge-functions.md`.

---

## Owner writes — non-booking

### `public.upsert_rate_override(...)` · `public.upsert_availability_block(...)`

`grant execute to authenticated`, gated on `is_admin()`.

Both rely on exclusion constraints rather than pre-checks (research R3, data-model R2):

- Rate overrides raise `rate_overlap` on `exclusion_violation`, returning the conflicting override's
  id and label so FR-029b can show *which one*.
- Blocks raise `block_conflicts_booking`, returning the conflicting booking's reference.

**Both take the caller's `updated_at` and raise `stale_record` on mismatch** (R13). So does
`write_booking`. These three are the entities where a silently lost update costs money or a
double-booking; every other entity is last-write-wins and takes no such argument.

**`upsert_availability_block` covers movement, not only creation** (FR-037a). Changing a block's dates
or unit deletes and re-inserts its `room_occupancy` row inside the same transaction, so the exclusion
constraint adjudicates the move exactly as it adjudicates a creation. No second code path.

### `public.set_page_section(p_page, p_section_type, p_enabled, p_position)`

`grant execute to authenticated`, gated on `is_admin()`. **Update only** — there is no create or
delete, because the section catalogue is the template's (R14, C10). Attempting to disable the
availability search raises `section_required`, surfaced from the check constraint rather than from
application logic.

### `public.erase_guest_data(p_email, p_identity_verified)` · `public.export_guest_data(p_email, p_identity_verified)`

`grant execute to authenticated`, gated on `is_admin()`.

**Both iterate `personal_data_stores` rather than naming tables** (FR-026b, R16). Adding a store is a
row in that table; neither function changes. `p_identity_verified` must be true — the system cannot
prove who is asking, so the owner attests it and the attestation is recorded (FR-027b, FR-028a).

Keyed on email address across every store, so a guest who booked twice and enquired once is one
action (FR-027).

### `public.save_content_page(...)`

`grant execute to authenticated`. Rejects raw HTML in `body_markdown` before writing (FR-045a),
raising `html_not_allowed` with the offending fragment so the owner is told plainly what was refused.
Refuses `delete` on `page_kind = 'policy'` (FR-059).

### `public.save_site_settings(p_settings jsonb)`

`grant execute to authenticated`, gated on `is_admin()`.

**`site_settings` has no client write policy** (baseline P1s), so this is its only write path. A direct
PostgREST update is refused by RLS, which is deliberate — the validation below would otherwise be
bypassable by the account already authenticated for it.

**Validates**: `timezone` resolvable in `pg_timezone_names`; `same_day_cutoff_hour` 0–23;
`hold_minutes` and `awaiting_hours` > 0; `min_notice_hours` >= 0; both retention months > 0;
`scarcity_threshold` >= 0; `latitude` −90…90; `longitude` −180…180; **and rejects raw HTML in
`transport_notes` (FR-053b, FR-045a), raising `html_not_allowed` with the offending fragment — the
same check `save_content_page` performs, because it is the same class of owner-authored text reaching
the same renderer.**

**Takes no `updated_at` and performs no staleness check.** R13 restricts optimistic concurrency to
bookings, rate overrides, and availability blocks — a lost settings update costs a retype, not money
or a double-booking. Adding a lock here would contradict that decision rather than extend it.

**Errors**: `invalid_timezone` · `invalid_range` naming the offending field · `html_not_allowed` ·
`not_authorised`

### `public.export_guest_data(p_booking_id uuid) → jsonb`

`grant execute to authenticated`. Owner-only (FR-028). Requires an explicit
`p_identity_verified boolean` argument that the owner must set true — the system cannot verify who is
asking, and pretending otherwise would be a check that looks like security and is not (FR-028a).
Writes an audit event. Covers bookings **and** `email_deliveries.recipient` (FR-028b), the same reach
as erasure.

---

## Helpers

### `public.is_admin() → boolean` · `public.has_role(text[]) → boolean`

`security definer`, `search_path = ''`, `grant execute to authenticated` only. `security definer` is
load-bearing: it reads `admin_users` without triggering that table's own RLS, which would otherwise
recurse.

### `public.check_rate_limit(p_bucket, p_identifier, p_limit, p_window)`

Internal. Called by the functions above. Stores a **salted hash** of the IP, never the address —
a raw IP log is itself personal data under RA 10173 and adds a retention obligation for no benefit.
