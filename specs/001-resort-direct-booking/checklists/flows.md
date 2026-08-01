# Failure & Lifecycle Requirements Checklist: Resort Site & Direct Booking — MVP

**Purpose**: Requirements-quality gate for the paths that are not the happy path — error handling,
empty states, refused access, and the update and delete lifecycle of every entity. These are where
specifications are thinnest and where thinness is least visible until implementation.
**Created**: 2026-07-31
**Feature**: [spec.md](../spec.md)

**This checklist tests the writing, not the software.** Each item asks whether something is specified
well enough to build and verify. None ask whether code works.

**Depth**: formal gate, carried over from [gate.md](gate.md). A `[Gap]` routes to `/speckit-clarify`
or `/speckit-specify` before `/speckit-tasks`.

---

## A. Error paths

- [ ] CHK001 Are requirements defined for what a guest sees when the system cannot be reached at all, as distinct from a request that was refused? [Gap]
- [ ] CHK002 **Is the ambiguous-outcome case specified — a guest whose booking submission times out and who cannot tell whether they now hold a room?** FR-019 prevents a duplicate hold but says nothing about how the guest finds out which happened. [Gap, Spec §FR-019]
- [ ] CHK003 Are requirements defined for preserving what a guest typed when a booking submission fails, matching the protection FR-048 gives the content editor? [Gap, Spec §FR-048]
- [ ] CHK004 Is it specified that a guest returning from an error resumes at the step they were on rather than at the start of the booking flow? [Gap]
- [ ] CHK005 Are requirements defined for an image upload that fails part-way through? [Gap, Spec §FR-042]
- [ ] CHK006 Is atomicity specified as a requirement — that an operation touching several records either completes entirely or leaves nothing behind? [Gap, Coverage]
- [ ] CHK007 Are requirements defined for what the owner sees when a scheduled background action fails, given expiry and retention both run unattended? [Gap, Spec §FR-006, §FR-028d]
- [ ] CHK008 Is there a requirement that the same underlying failure produces the same wording wherever it surfaces? [Consistency, Gap]
- [ ] CHK009 Are the distinctions between a refusal, a failure, and an empty result required to be perceivable to the user, or only to the developer? [Clarity, Spec §FR-002b, §FR-067]
- [ ] CHK010 Are requirements defined for a guest who submits a payment reference for a booking that expired between page load and submission? [Coverage, Spec §FR-009b]
- [ ] CHK011 Is the owner's verification path specified for when the amount cannot be saved but the booking state already changed? [Gap, Exception Flow]
- [ ] CHK012 Are requirements defined for what happens when a guest's browser has been left open long enough that the availability shown is stale? [Gap, Edge Case]
- [ ] CHK013 Can FR-067's error state be objectively evaluated, or does it assert an error state exists without defining what qualifies as one? [Measurability, Spec §FR-067]
- [ ] CHK014 Are requirements defined for errors that occur while an error is being displayed — a failed retry? [Coverage, Gap]

## B. Empty states

- [ ] CHK015 **Do FR-050d and FR-041f contradict FR-067?** The first two require empty sections and categories to *hide themselves*; the third requires every surface to *present an empty state*. Hiding and showing are opposite behaviours and the spec does not say which applies where. [Conflict, Spec §FR-050d, §FR-041f vs §FR-067]
- [ ] CHK016 Is the distinction between guest-facing and owner-facing empty behaviour specified — that a guest sees nothing while an owner sees an invitation to act? [Gap, Clarity]
- [ ] CHK017 Are requirements defined for the guest gallery when every category is empty, given FR-041f hides categories individually? [Gap, Spec §FR-041f]
- [ ] CHK018 Are requirements defined for the home page when the owner has disabled or emptied every optional section? [Coverage, Spec §FR-050a]
- [ ] CHK019 **Is a filtered-empty result required to read differently from a genuinely empty list?** "No bookings match this filter" and "no bookings yet" call for different actions. [Gap, Spec §FR-021]
- [ ] CHK020 Are requirements defined for an owner's very first session, when every list is empty at once, or only for each list independently? [Coverage, Spec §FR-067]
- [ ] CHK021 Is "all archived" required to read differently from "none created"? [Gap, Spec §FR-032]
- [ ] CHK022 Are empty-state requirements specified for the surfaces added by later clarifications — page sections, gallery categories, rate overrides? [Completeness, Spec §Surface State Coverage]
- [ ] CHK023 Is it specified how empty states are exercised at all, given the demo seed guarantees nothing is ever empty in development? [Measurability, Gap]
- [ ] CHK024 Are requirements defined for a room type that exists but has no units, and therefore never appears in availability? [Gap, Spec §FR-030]
- [ ] CHK025 Is an empty search result required to distinguish "no rooms free" from "no rooms fit your party" from "too soon to book"? [Coverage, Spec §FR-002b, §FR-020d]

## C. Permission-denied behaviour

- [ ] CHK026 **With exactly one account (C3), can a signed-in user ever be refused for lack of permission?** If not, is that stated — so nobody builds a role check that can never fire and is therefore never tested? [Ambiguity, Spec §FR-069a]
- [ ] CHK027 Are requirements defined for a session that expires *during* a submitted action rather than while idle? FR-069f covers returning after sign-in but not the fate of the action itself. [Gap, Spec §FR-069f]
- [x] CHK028 **Is any behaviour specified for a disabled owner account?** [Gap, Conflict] → **FIXED.** FR-069g forbids disabling the sole account from within the application, and FR-069h makes self-service password reset the recovery path. **`disabled_at` has been removed from `admin_users`** — a field that can brick a deployment should not exist unused rather than exist governed
- [ ] CHK029 Are refusal-for-rate-limit and refusal-for-permission required to be distinguishable to the person refused? [Clarity, Spec §FR-014, §FR-069c]
- [ ] CHK030 Is it specified whether a refusal is recorded, and if so where — given booking changes are journalled but refused attempts may not be? [Gap, Spec §FR-022f]
- [ ] CHK031 Are requirements defined for repeated failed sign-in attempts beyond the rate limit — is the account locked, and if so how is it recovered with only one account? [Gap, Recovery Flow]
- [ ] CHK032 Does FR-069c's "MUST NOT reveal whether the thing they tried to reach exists" have a testable form, or does it state an intent without a criterion? [Measurability, Spec §FR-069c]
- [ ] CHK033 Are requirements defined for the payment QR being requested with a valid reference but a booking in a state that does not permit it? [Coverage, Spec §FR-009a]
- [ ] CHK034 Is the guest lookup's refusal behaviour consistent with the admin's refusal behaviour, or specified independently in each place? [Consistency, Spec §FR-013b, §FR-069c]

## D. Update flows

- [x] CHK035 **Is concurrent-edit behaviour specified for any entity?** [Gap, Coverage] → **DECIDED IN PLAN (R13), not in spec.** Selective optimistic concurrency: bookings, rate overrides, and availability blocks require a matching `updated_at` and reject a stale write; everything else is last-write-wins. A lost update costs money on those three and a retype on the rest, so the treatment is asymmetric. Verified by quickstart V1b, which also asserts a gallery caption save **succeeds** — blanket locking would fail that
- [x] CHK036 **Does FR-037's overlap refusal cover editing an existing block's dates, or only creating one?** [Gap, Spec §FR-037] → **FIXED.** FR-037a extends it to movement. Cost nothing in design: a block whose dates change re-projects its `room_occupancy` row in the same transaction, and the exclusion constraint adjudicates the move exactly as it adjudicates a creation (data-model R2). It did add a fourth writer to the SC-001 concurrency suite
- [ ] CHK037 **Are requirements defined for changing the property's timezone**, given FR-020a makes every stored date's interpretation depend on it? [Gap, Spec §FR-020a]
- [ ] CHK038 Are requirements defined for changing the hold duration while holds are active — do existing holds keep their original expiry? [Gap, Spec §FR-005b]
- [ ] CHK039 **Are requirements defined for reducing a room type's capacity below the party size of an existing booking?** [Gap, Spec §FR-029]
- [ ] CHK040 Is it specified what updating a room unit means — whether it can be renamed, deactivated, or moved to a different room type? [Ambiguity, Spec §FR-030]
- [ ] CHK041 Are requirements defined for changing a content page's address, and what becomes of links already pointing at the old one? [Gap, Spec §FR-045]
- [ ] CHK042 Are requirements defined for renaming a gallery category, and whether guest-facing references to it change with it? [Gap, Spec §FR-041a]
- [ ] CHK043 Is it specified whether archiving is reversible — whether an archived room type can be restored? [Gap, Spec §FR-032]
- [ ] CHK044 Are update requirements defined for every entity in the CRUD table that carries an Update tick, or do some rely on the tick alone? [Completeness, Spec §CRUD Completeness]
- [ ] CHK045 Is it specified whether the owner may edit a guest's stay dates and their contact details in one action or must do so separately? [Clarity, Spec §FR-022a, §FR-023a]
- [ ] CHK046 Are requirements defined for editing a booking that is currently being paid for by the guest? [Coverage, Gap]
- [ ] CHK047 Is it specified whether updates to seeded content — the shipped policies, categories, and sections — are distinguishable from owner-authored changes when a deployment is later re-seeded? [Gap, Spec §FR-075]

## E. Delete and archive flows

- [ ] CHK048 Are cascade consequences specified for deleting a record other entities depend on — a room type's last unit, a room's only photograph? [Gap, Coverage]
- [ ] CHK049 Is it specified what becomes of a gallery image that is a room type's only photograph when it is deleted? [Gap, Spec §FR-044]
- [ ] CHK050 Are requirements defined for deleting a rate override that a held booking was priced against? [Coverage, Spec §FR-029d]
- [ ] CHK051 Is the difference between archive, disable, unpublish, and delete defined anywhere as a consistent vocabulary, or does each entity use its own? [Consistency, Ambiguity]
- [ ] CHK052 Are delete requirements defined for every entity in the CRUD table that carries a Delete tick or a conditional marker? [Completeness, Spec §CRUD Completeness]
- [ ] CHK053 Is the conditional deletion in FR-031 stated with a testable condition — what exactly counts as "has bookings", including cancelled and expired ones? [Clarity, Spec §FR-031]
- [ ] CHK054 Are requirements defined for whether a deletion can be undone, or is FR-067e's reversal limited to cancelled bookings? [Gap, Spec §FR-067e]
- [ ] CHK055 Is it specified whether deletions are journalled, given booking changes are but other entities' are not? [Gap, Spec §FR-022f]
- [ ] CHK056 Are requirements defined for bulk deletion, or is it intentionally excluded? [Coverage, Gap]
- [ ] CHK057 Is the interaction between deletion and retention specified — whether an owner deleting an enquiry early conflicts with the retention schedule? [Consistency, Spec §FR-028d]

## F. Cross-cutting

- [ ] CHK058 Does the Surface State Coverage table still cover every surface, including those introduced by C9–C13? [Completeness, Spec §Surface State Coverage]
- [ ] CHK059 Are the four states required by FR-067 defined for admin surfaces added after that requirement was written? [Coverage, Spec §FR-067]
- [ ] CHK060 Is there a stated principle governing how failures are communicated, or does each requirement decide independently? [Consistency, Gap]

---

## Notes

- Check items off as resolved: `[x]`
- **A failing item is not a bug** — it is a requirement that needs writing, clarifying, or reconciling
- Route findings: requirement gaps → `/speckit-clarify` or `/speckit-specify`; design gaps → `/speckit-plan`
- 60 items · 4 requested domains + cross-cutting · traceability reference on every item
