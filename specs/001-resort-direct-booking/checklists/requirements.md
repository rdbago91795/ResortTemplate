# Specification Quality Checklist: Resort Site & Direct Booking — MVP

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — **both resolved 2026-07-31**
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes

**Iteration 1 findings and fixes applied:**

1. *No implementation details* — initially failed. Draft requirements named row-level security
   patterns, the exclusion constraint, and Supabase storage buckets, all carried over from the
   security baseline. Removed; those decisions belong in `plan.md`. Assumption 13 now points at the
   constitution and security baseline as the governing technical documents instead of restating them.
2. *Success criteria technology-agnostic* — initially failed. SC drafts referenced database
   transaction behaviour and image format negotiation. Rewritten as user-observable outcomes
   (SC-001 concurrency behaviour, SC-004 time to usable page).
3. *Scope clearly bounded* — strengthened. Added the Scope Traceability table mapping every brief §8
   item to a story, plus an explicit restatement of the deferred list so absence is visibly deliberate
   rather than accidental.
4. *Dependencies and assumptions identified* — strengthened. 13 assumptions recorded, each one a
   default chosen where the brief was silent.

**Iteration 2 — clarifications resolved 2026-07-31:**

- **C1 (rate model)** → base nightly rate per room type plus manually entered date-range overrides.
  Added FR-003, FR-003a, FR-029a–FR-029d; replaced the Rate entity with Rate override; added US1
  scenario 9 and US5 scenarios 7–9; added SC-015, SC-016; added Assumption 4a.
- **C2 (one room per booking)** → confirmed single-room. Added FR-019a so a group is directed rather
  than left to fall back to Messenger; Booking entity states it explicitly; added US1 scenario 10.

Two consequences surfaced while folding the answers in, neither of which was in the original draft:

1. **The stay total must be captured at hold time and frozen** (Assumption 4a, FR-029d). Without it,
   editing a rate silently changes what a guest was already quoted — and with manual payment
   verification, the owner would be reconciling against a number that moved.
2. **Overlapping rate overrides are refused** rather than resolved by precedence. A precedence rule
   is the first component of the pricing engine the brief deferred, so allowing overlap would
   reintroduce deferred scope through the back door.

**Iteration 3 — `/speckit-clarify` session 2026-07-31 (4 questions asked, 4 answered):**

Re-validated after each integration. **16/16 → 16/16 items passing**, no state changes. Sections
touched: Clarifications, User Story 3, User Story 4, Functional Requirements, Key Entities, CRUD
Completeness, Surface State Coverage, Edge Cases, Success Criteria, Assumptions.

- **C3** one owner account → FR-069a, FR-069b; Owner account CRUD row corrected from
  "delete as disable" to no in-app lifecycle at all.
- **C4** owner-created bookings → FR-021a–e; Booking Create is now guest **and** owner.
- **C5** email delivery outcomes → FR-018a–d; new admin filter surface.
- **C6** booking date/room changes → FR-022a–e.

**One earlier statement was refined rather than duplicated**, per the no-contradictions rule:
Assumption 4a previously said the stay total "does not move afterwards." C6 makes that false for date
changes. Rewritten to distinguish the two events — frozen against rate edits (FR-022d, FR-029d),
recalculated when the stay itself changes (FR-022c). The obsolete wording was replaced, not appended
to.

**Carried into planning:** there are now **three write paths** into the same overlap-prevention
guarantee — a guest's hold, an owner-created booking, and an owner moving an existing booking.
SC-001 was widened to cover all three. `/speckit-plan` must satisfy them with one mechanism, not
three; three separate implementations of this rule is how the constitution's non-negotiable
Principle III gets violated in the one path nobody load-tested.

**Iteration 4 — security review remediation, 2026-07-31:**

Two entities that FR-018a–c, FR-022e, and FR-069b already required but never named were added:
**Booking event** and **Email delivery**. The Phase 1.3 security review flagged both as critical —
an entity the spec does not name is a table no access rule gets written for.

Added FR-018e, FR-018f, FR-022f, FR-022g, FR-027a; CRUD rows for both entities; US4 scenarios
13a–13c; two edge cases; SC-014 tightened.

**Both entities have deliberately partial CRUD, which is the point of recording them here.** Booking
events are system-created and immutable — an audit trail anyone can edit is not an audit trail. Email
deliveries are system-created and system-updated, because the outcome arrives after sending.

**One finding the security review itself missed, caught while writing this up:** the review required
booking events to hold no personal fields so that erasure (FR-027) stays complete — then treated
email delivery records the same way without noticing that **they necessarily store the guest's email
address**, since the owner needs to see the mistyped address to understand the bounce. Erasure would
have left a copy behind and appeared to succeed. FR-027a now requires erasure to reach delivery
records, and SC-014 verifies it by searching every stored record rather than only the booking.

**Iteration 5 — `/speckit-clarify` session 2026-07-31, security-review remediation:**

Eight items from the Phase 1.3 review. **Six applied as directives** (settled answers, no question
warranted); **two asked** as genuine product decisions.

Directives applied: FR-002a (availability exposed only as availability); FR-004 widened to all three
write paths, matching SC-001; FR-029b and FR-037 extended to hold under simultaneous requests;
FR-021f (origin derived from the caller); FR-018g + FR-014 (resend rate limit); FR-028 rewritten with
FR-028a/FR-028b (owner-only, identity verified outside the system, export reach equals erasure reach).

- **C7** content bodies are Markdown, raw HTML rejected at save → FR-045, FR-045a, FR-045b; Content
  page entity; US8 scenarios 7–8.
- **C8** payment QR reachable only from an active booking's payment step → FR-009a; US2 scenarios
  9–10; SC-018.

**Downstream artifacts now out of step with the spec — flag for the plan, do not silently diverge:**

1. `design-system.md` §5.3 defines a `Prose` component taking an `html` prop with sanitisation on
   write and render. C7 removes that path entirely; the component should take Markdown and the
   sanitisation note no longer applies.
2. `security-baseline.md` §1.3's `bookings` admin UPDATE policy predates C4 and C6 and is now both
   too narrow and too permissive. §1.4 also assumes a single public media bucket, which C8 breaks —
   the QR needs gated retrieval.
3. `security-baseline.md` needs two named patterns it lacks: singleton public-read, and append-only
   audit (booking events, email deliveries).

**Iteration 6 — gate remediation, 2026-07-31:**

Direct-edit pass plus a second `/speckit-specify` pass closed 54 of the 65 items in
[gate.md](gate.md). Spec grew from 100 to 155 functional requirements and 21 success criteria. All
16 quality items still pass.

The change worth recording is **FR-026a, the register of personal data stores.** Erasure and export
had now been found incomplete three separate times — first missing email deliveries, then missing
enquiries — and on each occasion the obvious fix was to add the missing entity name to the two
requirements. That fix would have failed again on the fourth store.

The requirements are now written against a register: FR-026a lists the stores and obliges any new
personal-data entity to join it; FR-026b states that a rule naming individual stores instead of the
register is defective by construction. Erasure is additionally re-keyed on the guest's email address
rather than on a booking, because a guest who booked twice and enquired once is one person and should
be one action.

Also closed: retention as a requirement rather than a constitution-only obligation (FR-028d–f), admin
session timeout (FR-069d–f), and the FR-045/FR-049 conflict over deletable amenities pages (FR-049a,
resolving it as **undeletable means legally required, and nothing else**).

**Scope addition flagged for confirmation:**

- **US12 (site branding)** is not on the product brief's §8 in-scope list. It arrived via the Phase
  0.5 design system and was confirmed twice in that session. It is called out in Scope Traceability so
  the addition is visible rather than assumed.

**Note**: Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
