# Requirements Quality Gate: Resort Site & Direct Booking — MVP

**Purpose**: Formal pre-`/speckit-tasks` gate. Validates the *requirements themselves* — completeness,
clarity, consistency, measurability, coverage — across booking correctness, security and privacy,
admin usability, content surfaces, and accessibility and performance.
**Created**: 2026-07-31
**Feature**: [spec.md](../spec.md)

**This checklist tests the writing, not the software.** Every item asks whether something is
specified well enough to build and verify against. None of them ask whether code works.

**Depth**: formal gate. Expect items to fail — a `[Gap]` here means `/speckit-clarify` or
`/speckit-specify` before `/speckit-tasks`, per chain doc §1.5.

---

## A. Booking correctness

- [x] CHK001 Does FR-015 conflate room availability with booking state by listing "available" as a booking status, when a booking is never in that state? [Conflict, Spec §FR-015 vs data-model.md state diagram] → **FIXED.** FR-015 rewritten to five states; FR-015a states availability is derived, never stored
- [x] CHK002 Is "the past" defined against a specific timezone for check-in validation, so a guest booking near midnight from another timezone gets a predictable answer? [Ambiguity, Spec §FR-020, Assumption 9] → **FIXED.** FR-020a
- [x] CHK003 Is a *minimum* booking lead time specified, or is same-day booking permitted? [Gap, Spec §FR-020] → **RESOLVED (C13).** FR-020b–d: owner-set minimum notice, default same-day until 6pm property time, evaluated at hold creation only
- [x] CHK004 Is "the same guest attempt" defined precisely enough to implement idempotency, or does FR-019 leave the key undefined? [Ambiguity, Spec §FR-019] → **PASSES.** FR-019 states the outcome testably; the key is a mechanism, already specified in contracts/rpc-functions.md
- [x] CHK005 Are rounding rules specified for summing per-night rates into a stay total? [Gap, Spec §FR-003] → **FIXED.** FR-003b
- [x] CHK006 Is it explicitly stated that the owner may confirm a booking while a balance remains outstanding? [Clarity, Spec §FR-016, §FR-017] → **FIXED.** FR-016b
- [x] CHK007 Are requirements defined for an amount received that exceeds the stay total, which the spec lists as an edge case but no requirement addresses? [Gap, Spec Edge Cases] → **FIXED.** FR-016a
- [x] CHK008 Is the guest-facing behaviour specified for a hold that expires while the guest is on the payment screen? [Gap, Spec Edge Cases] → **FIXED.** FR-009b
- [x] CHK009 Are booking reference uniqueness and unguessability stated as requirements, or only as a data-model detail? [Traceability, Gap] → **FIXED.** FR-005a
- [x] CHK010 Is the disclosure of a per-type availability count to guests an intentional requirement or an unstated design choice? [Clarity, Spec §FR-002] → **RESOLVED (C14).** FR-002c–e: disclosed only at or below an owner-set threshold, default 2, zero disables. Gated inside `search_availability` so the exact count never leaves the database above the threshold. FR-014/FR-014b add rate limiting to search, which became material once a count was disclosable.

  **My earlier recommended default here — "do not show counts" — was wrong and is withdrawn.** It rested on treating any count as occupancy disclosure, which does not survive the observation that **binary availability is already occupancy disclosure**: "unavailable on 24 December" says the property is full. There is no zero-disclosure version of a booking site, so the question is granularity. It also missed that **C2 created a dead-end the count repairs** — one room per booking means a group discovers the limit by failing on their third attempt
- [x] CHK011 Are the requirements for pricing a stay that spans a rate boundary consistent between FR-003, FR-022c, and FR-022d? [Consistency] → **PASSES.** The three are consistent: priced per night, re-priced only when the stay changes, never by a rate edit
- [x] CHK012 Is the interaction between an owner shortening a stay and an already-received amount specified beyond being listed as an edge case? [Gap, Spec Edge Cases] → **FIXED.** FR-022i
- [x] CHK013 Are the hold and awaiting-verification durations stated as configurable requirements with defaults, or only as assumptions? [Traceability, Spec Assumption 6] → **FIXED.** FR-005b
- [x] CHK014 Can SC-001 be objectively verified as written, including which mix of the three write paths must be exercised? [Measurability, Spec §SC-001] → **FIXED.** SC-001 now names the procedure and requires isolated and interleaved runs
- [x] CHK015 Are requirements defined for what a guest sees when every room type is unavailable versus when no room type matches their party size? [Coverage, Spec §FR-002] → **FIXED.** FR-002b

## B. Security & privacy

- [x] CHK016 Does erasure cover enquiries, which hold a guest's name, email, and message but are named in neither FR-027 nor FR-027a? [Gap, Spec §FR-027a] → **FIXED at the pattern.** FR-026a introduces a register of personal data stores; FR-026b binds erasure, export, and retention to the register rather than to a restated list. FR-027 is now keyed on the guest's email address, the only identifier common to every store
- [x] CHK017 Does the personal data export cover enquiries, for the same reason? [Gap, Spec §FR-028b] → **FIXED.** FR-028b binds to the register; FR-028c keys export on the same identifier as erasure
- [x] CHK018 Are retention periods stated as requirements anywhere in the spec, given that data disappearing is user-visible behaviour? [Gap] → **FIXED.** FR-028d–f, with the values owner-configurable and required to match what the privacy policy publishes
- [x] CHK019 Are the rate limit thresholds specified or referenced from the spec, or does FR-014 assert limits exist without quantifying any of them? [Measurability, Spec §FR-014] → **FIXED.** FR-014a plus the upstream-documents table
- [x] CHK020 Is an admin session timeout specified as a requirement, or does it exist only in the design system? [Gap, Traceability] → **FIXED.** FR-069d–f, including a warning before expiry and no loss of unsaved work
- [x] CHK021 Are requirements defined for what the owner sees when an action is refused for lack of permission? [Gap, Coverage] → **FIXED.** FR-069c
- [x] CHK022 Is "the system" specified as a valid actor on booking events, given that scheduled expiry changes state with no account acting? [Gap, Spec §FR-069b] → **FIXED.** FR-022h
- [x] CHK023 Are the requirements for what a guest may retrieve about their own booking stated as an explicit allowed-fields list rather than by omission? [Clarity, Spec §FR-013] → **FIXED.** FR-013a, stated positively so later fields are excluded by default
- [x] CHK024 Is it specified that a failed booking lookup must be indistinguishable from a wrong email, so the response leaks nothing? [Completeness, Spec §FR-013] → **FIXED.** FR-013b, including response time
- [x] CHK025 Are requirements defined for who may trigger erasure and how the requester's identity is established, matching the treatment FR-028a gives export? [Gap, Spec §FR-027] → **FIXED.** FR-027b
- [x] CHK026 Are the privacy policy's required contents (FR-061) consistent with what the system actually collects per the Key Entities list? [Consistency, Spec §FR-061] → **PASSES.** FR-061's list covers every personal field in the entity model
- [x] CHK027 Is the payment QR's gating stated in terms a test can check — which booking states grant access and which refuse? [Measurability, Spec §FR-009a] → **PASSES.** FR-009a names the two permitting states; FR-009b covers expiry mid-flow
- [x] CHK028 Are requirements defined for the owner correcting a guest's email address, which FR-018c assumes is possible but no requirement grants? [Gap, Spec §FR-018c] → **FIXED.** FR-023a

## C. Admin usability for a non-technical owner

- [x] CHK029 Is "non-technical owner" operationalised as testable requirements anywhere, or asserted only in SC-007 and the constitution? [Gap, Spec §SC-007] → **RESOLVED (C12).** FR-067a–e are the checkable part and are declared complete; no further requirements will be written chasing SC-007
- [x] CHK030 Can SC-007 be objectively verified? Is the evaluation procedure defined? [Measurability, Spec §SC-007] → **RESOLVED (C12).** SC-007 rewritten as an observed trial: named participant profile, three tasks stated as outcomes, no help, pass condition, and an explicit rule that it is reported **unverified** rather than passed if the developer is the only participant available
- [x] CHK031 Are confirmation requirements specified before destructive actions such as cancelling a booking or deleting a room type? [Gap, Coverage] → **FIXED.** FR-067a
- [x] CHK032 Are requirements defined prohibiting raw identifiers, technical error text, or database vocabulary in owner-facing surfaces? [Gap] → **FIXED.** FR-067b
- [x] CHK033 Are recovery requirements defined for an owner who performs a destructive action by mistake? [Gap, Recovery Flow] → **FIXED.** FR-067e — reversal of a wrongly cancelled booking while the dates are still free
- [x] CHK034 Are the booking state names required to be explained to the owner, or assumed self-evident? [Ambiguity, Spec §FR-015] → **FIXED.** FR-067c
- [x] CHK035 Are guidance or help-text requirements specified for fields whose correct value is non-obvious? [Gap] → **FIXED.** FR-067d
- [x] CHK036 Is SC-008's claim that every management action works on a phone traceable to specific requirements? [Traceability, Spec §SC-008] → **PASSES.** SC-008 binds the CRUD table, which enumerates every management action
- [x] CHK037 Are requirements defined for the owner's first session, when every list is empty and nothing has been configured? [Coverage, Spec §FR-067] → **PASSES.** FR-067's empty state applies to every surface; design-system.md §6.2 supplies the copy
- [x] CHK038 Are the requirements for owner-facing error copy consistent between the spec and design-system.md §6? [Consistency, Traceability] → **FIXED.** FR-067b sets the rule; the upstream-documents table makes the design system's copy binding rather than advisory
- [ ] CHK039 Is the owner account's provisioning and first-login procedure specified as a requirement, given FR-069a places it outside the application? [Gap, Spec §FR-069a] → **DEPLOYMENT DOC** — not a spec requirement; belongs in the client deployment checklist

## D. Content and marketing surfaces

> **Finding, per Q3.** US7–US11 average around six acceptance scenarios each against US1's ten, and
> carry noticeably fewer requirements per surface. The items below test whether that thinness is
> under-specification. Several are likely to be real gaps rather than acceptable brevity.

- [x] CHK040 Are gallery categories specified as a fixed set or as owner-defined values? [Ambiguity, Spec §FR-041] → **RESOLVED (C11).** FR-041a: five shipped, owner may add, rename, reorder, and delete once empty
- [x] CHK041 Are requirements defined for how room types are ordered on guest-facing accommodation pages? [Gap, Spec §FR-033] → **FIXED.** FR-033a
- [x] CHK042 Is the home page specified beyond a hero and the availability search? [Clarity, Spec §FR-050] → **RESOLVED (C10).** FR-050a–e: fixed catalogue of sections the owner enables, disables, and orders
- [x] CHK043 Is the hero treatment specified as owner-configurable? [Gap, design-system.md §9] → **RESOLVED (C10).** FR-050b — image, video, or depth effect, chosen as a setting
- [x] CHK044 Are navigation requirements defined for owner-created content pages? [Gap, Spec §FR-045, §FR-051] → **RESOLVED (C9).** FR-051a–c: published pages appear automatically, positioned from the page itself, with a warning past the point the menu stops working
- [x] CHK045 Are requirements defined for a published page that is later unpublished while still linked from navigation? [Gap, Edge Case] → **FIXED.** FR-047a
- [x] CHK046 Is the map specified as static in a requirement, or only in Assumption 8 — and are the privacy consequences traced to FR-061? [Traceability, Spec Assumption 8] → **FIXED.** FR-053a, with the FR-061 consequence stated in the requirement itself
- [x] CHK047 Are transport directions specified as structured data or free text? [Clarity, Spec §FR-053] → **FIXED.** FR-053b — prose, because ferries and named landmarks defeat any fixed schema
- [x] CHK048 Are minimum or maximum image counts specified per gallery category? [Gap, Consistency] → **FIXED.** FR-044a — guidance, explicitly not a gate
- [x] CHK049 Are requirements defined for the accommodation detail page's content beyond photographs, bed configuration, capacity, and rate? [Completeness, Spec §FR-033] → **RESOLVED (C10).** FR-033b — same section model as the home page, with the availability check undisableable
- [x] CHK050 Are the amenities and activities pages specified as fixed, always-present pages or as ordinary deletable content pages? [Conflict, Spec §FR-045 vs §FR-049] → **RESOLVED.** FR-049a: content pages carry a kind; only the three policy pages are undeletable, because only they are legally required. Amenities and activities ship seeded and published but are ordinary deletable pages. FR-049b extends the navigation rule to deletion
- [x] CHK051 Is the relationship between room type photographs and the categorised gallery specified, or left implicit? [Ambiguity, Spec §FR-033 vs §FR-041] → **RESOLVED (C11).** FR-041b–d: a room's photographs appear in Rooms from one upload, carry a separate position per surface, and withdraw from the gallery when the room type is archived

## E. Accessibility and performance

- [x] CHK052 Is a target accessibility standard named? [Gap, Spec §SC-011] → **FIXED.** FR-068 now names WCAG 2.2 Level AA
- [x] CHK053 Does FR-068 cover screen reader requirements, or only keyboard operation and reduced motion? [Completeness, Spec §FR-068] → **FIXED.** Covered by the WCAG 2.2 AA reference plus FR-068b
- [x] CHK054 Is alt text required for room type photographs, the logo, and hero imagery, or only for gallery images? [Gap, Spec §FR-040] → **FIXED.** FR-068b extends it to every image, and requires decorative images be marked as such rather than left undescribed
- [x] CHK055 Are accessibility requirements specified for the date range picker? [Gap, Traceability] → **FIXED.** FR-068c
- [x] CHK056 Are requirements defined for the site's behaviour when images fail to load? [Gap, Spec Edge Cases] → **FIXED.** FR-068d, including reserved layout space
- [x] CHK057 Is SC-004 specified precisely enough for two people to measure it the same way? [Measurability, Spec §SC-004] → **FIXED.** Now names the throttling profile and connection figures
- [x] CHK058 Are performance requirements defined for the admin, or does SC-004 cover only guest-facing pages? [Coverage] → **FIXED.** SC-004a, with a stated relaxation for the bookings list at scale
- [x] CHK059 Are reduced-motion requirements traceable from the spec? [Traceability, Spec §FR-068] → **FIXED.** FR-068a
- [x] CHK060 Is the document language requirement specified? [Gap, Spec Assumption 11] → **FIXED.** FR-068e

## F. Cross-cutting consistency and traceability

- [x] CHK061 Do the CRUD Completeness and Surface State Coverage tables cover every entity and surface introduced by the clarification rounds? [Completeness] → **PASSES.** All 14 entities and 20 surfaces present, including those added by C4, C5, and iteration 4
- [x] CHK062 Are there requirements stated only in `design-system.md` or `security-baseline.md` that the spec depends on but never references? [Traceability, Gap] → **FIXED.** An upstream-documents table now heads the Requirements section, naming what each governs and warning that a change there may invalidate requirements here
- [x] CHK063 Is every clarification C1–C8 reflected in at least one functional requirement? [Traceability] → **PASSES.** C1→FR-003/029a-d · C2→FR-004 · C3→FR-069a · C4→FR-021a-f · C5→FR-018a-g · C6→FR-022a-e · C7→FR-045a-b · C8→FR-009a
- [x] CHK064 Do any Assumptions carry requirement-strength consequences that should have been promoted to functional requirements? [Consistency] → **FIXED.** Six promoted: timezone, hold durations, static map, rate-limit thresholds, language, money rounding. Recorded at the head of the Assumptions section
- [x] CHK065 Is a requirement identifier scheme documented? [Traceability] → **FIXED.** Convention stated at the head of the Requirements section, including that identifiers are permanent and gaps mean withdrawal

---

## Notes

- Check items off as resolved: `[x]`
- **A failing item is not a bug** — it is a requirement that needs writing, clarifying, or reconciling
- Route findings: requirement gaps → `/speckit-clarify` or `/speckit-specify`; design gaps → `/speckit-plan`. Never patch the checklist
- Per chain doc §1.5, re-run `/speckit-plan` after any change that alters the design surface
- 65 items · 5 domains · traceability reference on every item

## Status after the direct-edit pass — 2026-07-31

**63 of 65 resolved.** 55 fixed; 8 passed on inspection, with the reasoning recorded inline rather
than left as a bare tick.

| Route | Count | Items |
|---|---|---|
| ✅ **Resolved** | 64 | 56 fixed · 8 pass |
| ⚪ **Out of spec scope** | 1 | CHK039 — belongs in the client deployment checklist |

**CHK010 closed 2026-07-31 as C14**, the last open item. Nothing in this gate now routes anywhere.

**The specify and clarify columns are both empty.**

Three passes closed this out: a direct-edit pass (41), a second `/speckit-specify` pass (5), and a
clarify session of five bundled questions (9 items across C9–C13).

**The two findings worth carrying forward:**

**FR-026a, the register of personal data stores.** Erasure and export had been found incomplete three
separate times — email deliveries, then enquiries — and each obvious fix would have failed again on
the fourth store. The requirements now bind to a register rather than restating entity names, and
FR-026b states that a rule naming individual stores instead of the register is defective by
construction.

**SC-007 is now the only criterion that can be reported unverified.** C12 rewrote it as an observed
trial with a participant who is explicitly not the developer, and added a rule that it is reported
unverified rather than passed if no such person is available. That is deliberate: a solo builder
self-administering a usability trial proves nothing, and marking it passed anyway would make the
criterion worthless.

CHK033 resolved as fixed for the cancel-reversal case (FR-067e). A broader undo model across all
destructive actions remains available as a clarify question if you want one.

**CHK029 and CHK030 are partly answered by FR-067a–e**, which turn "usable by a non-technical owner"
from an assertion into five testable requirements. What remains is a judgment call about how much
further to specify, which is why they stay in the clarify column rather than being marked resolved.
