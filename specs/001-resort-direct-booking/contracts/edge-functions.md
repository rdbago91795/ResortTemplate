# Contract — Edge Functions

**Feature**: 001-resort-direct-booking

Four functions. Each exists because it needs something SQL cannot do: mint a signed URL, call a third
party, or run colour maths.

**Secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`,
`TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`) are Edge Function environment values only and never carry a
`VITE_` prefix (baseline §3).

---

## 1. `booking-payment` — the payment step

`POST /functions/v1/booking-payment` · `verify_jwt = true` (anon key) · **rate limited**

**Why an Edge Function and not an RPC**: a `security definer` SQL function cannot create a Storage
signed URL — signing is a Storage API operation (research R7). This is the only place in the feature
where an Edge Function is structurally required rather than convenient.

**Request**: `{ reference, email }`

**Behaviour**:
1. Look up the booking via the same reference + email pair as `get_booking_by_reference`.
2. **Refuse unless status is `held` or `awaiting_verification`** (FR-009a). A confirmed, cancelled, or
   expired booking gets no QR.
3. Mint a signed URL over `payment-assets/{qr_path}` with **TTL = remaining hold time, capped at 15
   minutes**. Tracking the hold rather than a fixed clock matters: a URL that outlives its booking is
   the public bucket again, slower (baseline §1.4).

**Response**: `{ qrUrl, qrExpiresAt, depositGuidance, stayTotal, holdExpiresAt, status }`

**Errors**: `404` opaque for both not-found and wrong-email — no enumeration signal. `409
booking_not_payable`. `429 rate_limited`.

---

## 2. `send-booking-email` — transactional mail

Invoked internally after `submit_reference` and `verify`. Not publicly routable.

1. Read the booking; **skip silently when `guest_email` is null** (FR-021e — owner-entered walk-ins).
2. Render the template. **Escape every interpolated value explicitly** — React is not in this path and
   nothing escapes for you (constitution VIII / baseline §4.4b). Guest name and payment reference are
   both guest-supplied and both land in HTML.
3. Strip `\r` and `\n` from any value reaching a header (baseline §4.4c).
4. Send via Resend; insert an `email_deliveries` row with the returned `provider_message_id` and
   `outcome = 'sent'`.
5. **Never block or reverse a booking transition on send failure** (FR-018d) — record `rejected` and
   return.

**Resend path** (FR-018c) re-invokes with a corrected address, creating a **new** row rather than
overwriting the failed one (FR-018e), and is rate limited per booking (FR-018g).

---

## 3. `email-webhook` — delivery outcomes

`POST /functions/v1/email-webhook` · **`verify_jwt = false`**

> **This endpoint is fully public. The signature check is its only authentication.** Deploying it with
> `verify_jwt = false` and an incomplete signature check is an open, unauthenticated write path
> (baseline §6.2).

Order is not negotiable:

1. Read the **raw body as bytes**. Compute HMAC over exactly those bytes — parsing and re-serialising
   changes key order and breaks the signature, and the usual "fix" is to skip verification.
2. `crypto.timingSafeEqual`, never `===`.
3. Reject a timestamp older than 5 minutes — signature verification alone does not stop replay.
4. **Only then** parse.
5. Insert into `webhook_events` keyed `(provider, event_id)`; a conflict means already-processed —
   return `2xx` so the provider stops retrying.
6. Update the matching `email_deliveries.outcome` in the **same transaction** as step 5, or a crash
   between them loses the effect while marking the event handled.

Return `2xx` within a couple of seconds. **Never `5xx` for a business rejection** — that triggers
retries forever.

---

## 4. `save-branding` — colour derivation and contrast enforcement

`POST /functions/v1/save-branding` · `verify_jwt = true`, gated on `is_admin()`

**Why it is not a table write**: `site_branding` has no client write policy (baseline §1.3, P1s). A
direct PostgREST update would walk straight past the validation below, and the owner is already
authenticated for it — so the one control protecting a non-technical owner from an unreadable site
would be advisory.

**Request**: `{ primaryHex, secondaryHex }` — plus optional logo/OG paths.

**Behaviour**:
1. Validate both parse as 6-digit hex. No named colours, no `rgb()`, no gradients.
2. Derive the ten columns in OKLCH via `culori` (research R8), per design-system.md §3.4.
3. **Enforce contrast, refusing the write on failure** (FR-063): `primary` ≥3:1 on `surface.base`;
   `onPrimary` ≥4.5:1 on `primary` after auto-selection; `secondary` ≥3:1 on `surface.base`. Return
   the measured ratio and the failing pair so the admin can say *what* is wrong, not just *that* it is.
4. Write all twelve columns in one statement.

**Errors**: `422 contrast_too_low` with `{ pair, ratio, required }` · `422 invalid_hex` ·
`403 not_authorised`

---

## Upload path — no fifth function

Image uploads go **direct to Storage** with an admin session, not through an Edge Function. Supabase
Edge Functions run Deno; `sharp` is a native Node binding and Storage image transformations are a
paid-plan feature (research R6).

The split that results:

| Step | Where | Enforces |
|---|---|---|
| Resize, re-encode, strip EXIF, build derivatives | **Client**, Canvas API | Constitution VII's image pipeline |
| MIME allowlist, size limit | **Storage bucket config** | Baseline §5.2 |
| Magic-byte check, dimension bounds | **Client before upload; bucket config as backstop** | Baseline §5.2 |

**Honest limitation**: the re-encode happens on a machine we do not control, so it is a
*capability*, not a *guarantee* — the bucket's MIME and size limits are what actually enforce. This is
a recorded deviation from baseline §5.2's "re-encode server-side" and appears in the plan's Complexity
Tracking. It disappears if the project ever moves to a paid Supabase plan.

**SVG remains banned** at the bucket's `allowed_mime_types` — a bucket-level rule no client can
bypass. Logo uploads must **preserve alpha**: re-encode to PNG or WebP, never JPEG (design-system.md
§3.5).
