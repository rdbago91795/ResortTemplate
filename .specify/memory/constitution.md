<!--
SYNC IMPACT REPORT — v1.1.0 (2026-07-31)
========================================
Version change: 1.0.0 → 1.1.0
Bump rationale: MINOR — nine amendments from the Phase 0.4 security baseline. All expand existing
principles or add guidance. No principle removed, none redefined incompatibly. Work compliant with
1.0.0 remains compliant, with one exception noted below.

Source: .specify/memory/security-baseline.md §11.

Amendments applied:
  A1 → VIII  Public signup MUST be disabled; owner provisioned manually
  A2 → VIII  RLS scope extended to views (security_invoker) and security definer functions
  A3 → Compliance  Data region is a recorded per-deployment decision
  A4 → Compliance  Default retention: 24mo bookings / 12mo enquiries, job-enforced
  A5 → I     Multi-property un-deferral requires a tenant predicate in every RLS policy
  A6 → Compliance  Government IDs, passports, DOB MUST NOT be collected without review
  A7 → VIII  CSP without 'unsafe-inline' is a core requirement, not hardening
  A8 → VIII  Output encoding applies outside React (email templates, non-React render paths)
  A9 → Workflow  Full chain order stated: specify → clarify → security review → plan →
                 checklist → tasks → analyze → implement → loose-ends → converge

  NOT BACKWARD COMPATIBLE (the one exception): A1 and A2 make previously-passing configurations
  non-compliant. Any deployment with public signup enabled, or any view without
  security_invoker = true, now fails the Constitution Check. This is deliberate — both were
  live security holes that 1.0.0's wording permitted.

Templates updated:
  ✅ .specify/templates/plan-template.md — Constitution Check gates extended for A1–A9
  ✅ .specify/memory/security-baseline.md — §11 marked applied

Deferred intents resolved this amendment (were open follow-ups 3 and 4 under v1.0.0):
  ✅ Photography sourcing for the first real client — RESOLVED as a client prerequisite with a
     paid-shoot fallback. See Compliance section. INFERRED DECISION — correct if wrong.
  ✅ Timeline constraint — RESOLVED by ratifying the working assumption (no external deadline,
     solo part-time pace) rather than leaving it blank. See Compliance section. If a real date
     appears, it amends the §8 deferral list in the product brief before it amends this file.

------------------------------------------------------------------------------
SYNC IMPACT REPORT — v1.0.0 (2026-07-31)
========================================
Version change: unfilled template → 1.0.0 (initial ratification)
Bump rationale: MAJOR — first concrete constitution. All placeholder tokens replaced with
binding governance. No prior ratified version existed to be backward-compatible with.

Modified principles (placeholder → concrete):
  [PRINCIPLE_1_NAME] → I. Configuration Over Code
  [PRINCIPLE_2_NAME] → II. The System Never Touches Money
  [PRINCIPLE_3_NAME] → III. Availability Integrity (NON-NEGOTIABLE)
  [PRINCIPLE_4_NAME] → IV. Truthful Imagery
  [PRINCIPLE_5_NAME] → V. Tokens Are the Only Source of Style Values
  (added)            → VI. Motion Discipline and Optional 3D
  (added)            → VII. Mobile-First Performance
  (added)            → VIII. Server-Side Authority (NON-NEGOTIABLE)
  (added)            → IX. Complete Surfaces
  (added)            → X. Incremental Delivery and Explicit Approval Gates
  (added)            → XI. Honest Completion Reporting

Added sections:
  [SECTION_2_NAME]   → Technology and Compliance Constraints
  [SECTION_3_NAME]   → Development Workflow and Quality Gates

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md    — Constitution Check gates + fixed stack prefilled
  ✅ .specify/templates/spec-template.md    — CRUD completeness + four-state coverage mandated
  ✅ .specify/templates/tasks-template.md   — principle-driven task categories + scoping rule
  ✅ .claude/skills/speckit-*/SKILL.md      — verified: hyphenated command names correct,
                                              no agent-specific references requiring change
  ✅ .claude/skills/speckit-implement/SKILL.md — conflicts patched, see resolved items 1–2

Resolved after initial ratification (propagation completed, no version bump — these close ⚠
items the report itself listed as pending):
  1. speckit-implement/SKILL.md §6 mandated "complete each phase before moving to the next" and
     its Done When required ALL tasks marked [X], against Principle X. PATCHED: step 6 now fixes
     the run's scope to exactly one of (a) Setup+Foundational only, (b) one user story phase,
     (c) a convergence batch, or (d) one 3D scene — matching vibe-coding-speckit-chain.md §1.8 —
     and asks when no scope is given; step 9 and Done When validate scope-local completion.
     Step 3 now also loads design-system.md and security-baseline.md. Frontmatter updated.
  2. speckit-implement/SKILL.md "Completion Report" said only "Report final status with summary
     of completed work". PATCHED: now requires explicit Simplified / Skipped / Blocked sections
     per Principle XI.

  NOTE: both patches edit a vendored github-spec-kit file. A Spec Kit upgrade that re-vendors
  .claude/skills/speckit-implement/SKILL.md will silently revert them. Re-apply after any
  upgrade; the patched passages are marked "Local amendment, project constitution Principle X/XI".

Open follow-up items:
  3. Photography sourcing for the first real client remains open (product-brief §6.4c).
     Principle IV is enforceable today for the demo; the client-supply answer is a sales
     decision, not a code one.
  4. Timeline constraint remains unsupplied (product-brief §7). No principle depends on it.
-->

# Resort Site & Direct Booking Template Constitution

**Upstream sources**: `.specify/memory/product-brief.md` (Phase 0.2) and
`.specify/memory/security-baseline.md` (Phase 0.4). Principles I–IV and VII restate settled
decisions from the brief (§4.1–§4.9). They are not open questions and MUST NOT be relitigated in
`/speckit-specify`, `/speckit-plan`, or `/speckit-implement`.

The security baseline is the **implementation manual for Principle VIII**. Where this document
states a requirement, the baseline gives the pattern that satisfies it — RLS-P1…P6, the field
validation table, the secrets classification. A spec references those patterns by name rather than
reinventing them.

## Core Principles

### I. Configuration Over Code

One codebase serves any resort through configuration, theming, and content — never through code
changes. Every property-specific value MUST live in the database or in a per-deployment config or
theme file: property name, copy, rates, room types, amenities, coordinates, address, transport
notes, contact details, brand colours, typography, and imagery.

Hardcoding any of these into a component is a violation, including map coordinates.

**Testable gate**: standing up deployment #2 MUST require zero changes to shared application code.
A diff touching anything outside config, content, theme, and asset paths fails this principle.

**Rationale**: this is the single claim the product exists to make. If the second deployment needs
code changes, the template is an expensive one-off (product-brief §5, metric S2).

**Single-tenancy is load-bearing, and un-deferring it is a security event.** Because one deployment
serves one property, "owner-only" access collapses to "is an admin of this deployment" and no
policy carries a tenant predicate. If multi-property support is ever un-deferred, **every RLS policy
in the system becomes wrong simultaneously** — each needs a tenant predicate added, and a missed one
is a cross-property data leak rather than a bug. That change MUST trigger a full security review
before any code is written. It is not a feature. *(A5)*

### II. The System Never Touches Money

The application MUST NOT integrate a payment gateway, handle card data, hold funds, or move money.
The resort's own QR code is displayed; the guest pays the resort directly via GCash, Maya, or
InstaPay and submits a payment reference number.

The system MUST NOT compute, enforce, or validate an amount due. Deposit guidance ("50% deposit to
reserve") is editable owner-authored content, not a calculation. Do not build percentage logic,
partial-payment rules, or amount validation — there is nothing to validate against.

The system records exactly two money-adjacent facts: the reference number the guest submitted, and
the amount the owner states they actually received at verification. Remaining balance is a
subtraction displayed on the booking, not a payments subsystem.

Payment verification is manual and asynchronous. A booking is confirmed when the owner verifies the
reference against their own payment app — never when the guest claims payment. Cancellation is a
state change and nothing more; any refund is arranged outside the app, and guest-facing policy text
MUST say so plainly.

**Rationale**: a significant legal and security advantage that MUST NOT be traded for convenience.

### III. Availability Integrity (NON-NEGOTIABLE)

Two guests MUST NOT be able to reserve the same unit for overlapping dates. Overlap prevention MUST
be enforced at the database level inside a single transaction — application-level checks alone are
insufficient, because a check-then-insert across two round trips has a race window.

Booking state is explicit and exhaustive:
`available → held → awaiting_verification → confirmed`, with `cancelled` and `expired` as terminal
states. Every state transition MUST be server-side. A client MUST NOT be able to set booking state
directly.

Holds MUST expire automatically without human action. An expiry mechanism that depends on the owner
remembering to clear stale holds is not an expiry mechanism.

**Testable gate**: a concurrency test issuing simultaneous booking requests for the same unit and
overlapping dates MUST result in exactly one hold. This is the most scrutinised item in the security
review.

**Rationale**: double-booking is a correctness failure with a real-world cost — an owner telling a
guest their confirmed room does not exist (product-brief §6.4a).

### IV. Truthful Imagery

Evaluative content — what a guest actually judges before deciding — MUST be real photography of the
real property. Rooms, pools, views, and dining are evaluative. Stylised or generated imagery is
permitted for atmosphere only and MUST NOT be mistakable for a depiction of the real property.

Cinematic treatment (scroll-driven reveals, depth parallax, shader transitions) governs how real
images are *presented*. It MUST NOT substitute for them.

The fictional demo resort is exempt while it remains fictional: no real property is misrepresented,
nothing is bookable, no guest can be deceived. AI-generated demo imagery is the correct choice
there, not a compromise.

**The hard boundary is deployment.** Demo imagery MUST NOT reach a real resort's site. Two enforced
guards:

1. All demo assets live in a single clearly separated directory (`/demo-assets/` or equivalent).
2. "No demo imagery remains" is an explicit, verified item on the client deployment checklist —
   verified, not assumed.

**Rationale**: this is a truthfulness constraint, not an aesthetic preference. A guest's booking
decision depends on seeing what they will actually get.

### V. Tokens Are the Only Source of Style Values

Vanilla Extract theme contracts are typed. Any colour, spacing, radius, typography, shadow, z-index,
or duration value that a token covers MUST be referenced by its exact token name.

A raw literal in a `.css.ts` file for a value a token already covers is a violation. If a needed
value has no token, the token MUST be added to the contract first — never inlined "just this once".

**Testable gate**: grep for hex colours, `rgb(`, and bare `px` spacing values in `.css.ts` files.
Legitimate exceptions (hairline borders, `1px`, values genuinely outside the design system) MUST be
justified in the plan's Complexity Tracking table.

**Rationale**: the typed contract is what makes per-client rethemeing (Principle I) a config change
rather than a search-and-replace.

### VI. Motion Discipline and Optional 3D

**Animate only `transform` and `opacity`.** Animating `width`, `height`, `top`, `left`, or `filter`
forces layout or paint and drops frames. Where a layout-affecting effect is genuinely required, it
MUST be achieved through transform (e.g. `scale`) or justified in Complexity Tracking.

**Every animation MUST have a `prefers-reduced-motion` fallback.** Where Lenis smooth scroll is
active, reduced motion MUST disable Lenis entirely and restore native scrolling — not shorten its
duration, not reduce its easing. A shortened smooth scroll is still smooth scroll.

**The 3D layer is off by default.** Three.js, React Three Fiber, drei, and postprocessing MUST NOT
be installed or imported unless a plan explicitly enables them. 3D is permitted only where the
visual experience is part of what is being sold — atmosphere, immersion, a property worth rendering.
It is forbidden on tools, dashboards, and task-oriented surfaces; **the admin area MUST NOT use 3D
under any circumstances.**

Where a plan does enable 3D, that same plan MUST state a payload budget in megabytes and describe
the mobile fallback. A mobile fallback designed after the fact is a retrofit and fails this
principle. Baseline hero support (image, video, depth-parallax) is configuration and does not
require enabling the 3D layer; bespoke 3D scenes stay outside the reusable core.

### VII. Mobile-First Performance

A mid-range Android phone on mobile data is the primary target, not the laptop. A gallery-heavy page
that takes eight seconds there has failed regardless of how it looks on a desktop.

The image pipeline is a **core requirement, not an optimisation pass**: AVIF/WebP with fallbacks,
responsive `srcset` sizes, blur-up or dominant-colour placeholders, and lazy loading below the fold.
Every plan touching a visual surface MUST state its performance budget, and that budget MUST be
verified on a throttled mobile profile before the phase is reported complete.

### VIII. Server-Side Authority (NON-NEGOTIABLE)

**Row Level Security MUST be enabled on every table, with an explicit policy per operation
(`select`, `insert`, `update`, `delete`) per role (`anon`, `authenticated`).** A table with RLS never
enabled is a live security hole regardless of what the client code does. "No policy needed, the
client never writes here" is not an argument — it is the vulnerability.

**RLS protects data, not tables — so it extends to everything that reads them.** Two documented
bypass routes around a correct policy set, both of which MUST be closed: *(A2)*

- **Views** run with their owner's privileges and ignore RLS unless created
  `with (security_invoker = true)`. Every view over a protected table MUST set it.
- **`security definer` functions** run privileged and MUST pin `set search_path = ''` with every
  identifier schema-qualified. Without it, a caller-controlled search path redirects the function's
  queries to attacker-chosen objects.

**Public signup MUST be disabled.** The owner account is provisioned manually as a documented
deployment step; there is no self-service registration. *(A1)*

This is not hardening — it is what makes the rest of this principle mean anything. Supabase enables
open email signup by default. Left on, anyone can mint an `authenticated` user, and **every policy
written `to authenticated` without an explicit admin check becomes world-accessible while appearing
correct**. A deployment can satisfy every other clause here and still be wide open on this one.

**A Content-Security-Policy without `'unsafe-inline'` in `script-src` is a core requirement.** *(A7)*
In a client-only SPA the Supabase session lives in `localStorage`, so any successful XSS is a full
session compromise that token expiry cannot mitigate. **CSP is therefore the session-security
control**, not a nice-to-have added at the end. Vanilla Extract's build-time CSS makes
`style-src 'self'` achievable too; a runtime CSS-in-JS library would force `'unsafe-inline'` and
weaken the policy, which is one more reason the styling choice in this constitution is fixed.

**Secrets are environment variables only.** The Supabase `service_role` key, SMTP credentials, and
any API secret MUST NOT appear in frontend code, in `VITE_`-prefixed variables, or in the client
bundle. Only the publishable/anon key may reach the browser.

**Anything the client could tamper with is verified server-side**: nightly rates, totals,
availability, booking state, amount received, and admin permissions. A value that arrives from the
browser is an assertion, not a fact.

**User input is validated server-side, not only in the form.** Client-side validation is a UX
affordance. The server-side check is the actual constraint, and it MUST exist independently.

**Output encoding is a separate obligation from input validation, and it applies wherever React
does not.** *(A8)* React escapes interpolated values; nothing else in this stack does. Every
interpolated value MUST be explicitly escaped in **email templates**, and in any future PDF,
webhook payload, CSV export, or server-rendered string. Guest-supplied names and payment references
reach the owner's inbox through a path with no framework protecting it. Where guest-supplied text
is rendered as HTML anywhere, it MUST be sanitized on write **and** on render — sanitizing only on
write leaves a later-discovered bypass already persisted in the database.

### IX. Complete Surfaces

**Every entity gets full CRUD** — create, read, update, and delete — unless the spec *explicitly*
defers a specific operation with a stated reason. Silent omission is a violation. Where a hard
delete is wrong (bookings, which are cancelled rather than erased for inventory and audit reasons),
the spec MUST say so and MUST define the archival or state-transition path that replaces it.

**Every user-facing surface handles four states: loading, empty, error, and success.** A surface
missing any of them is incomplete, not "mostly done", and MUST NOT be reported as finished. The
empty state carries real weight here — a new deployment starts empty, and the owner's first
impression of the admin is every list with nothing in it.

**Rationale**: generated specs reliably cover create and read while dropping update and delete, and
reliably render the success state while leaving loading and error unhandled. Naming both as
constitutional makes the omission visible at spec review instead of at handover.

### X. Incremental Delivery and Explicit Approval Gates

**One user story per implementation run.** `/speckit-implement` MUST be scoped to a single user
story phase from `tasks.md`. This is required, not optional. Building multiple stories in one run
produces work that cannot be debugged, because a failure has too many possible origins.

This principle **overrides** the default full-phase walk described in the `speckit-implement` skill.
Where they conflict, the constitution governs.

**Database migrations require explicit approval.** The exact SQL MUST be shown and confirmed before
it is applied. Never apply a migration as a side effect of another task.

**Dependency installation requires explicit approval.** The exact package name and version MUST be
shown, with a one-line justification, and confirmed before installing. This applies to transitive
additions the operator did not ask for and to anything in the 3D layer (Principle VI).

Both gates mean *stop and wait for a human answer* — not "state the intent and proceed".

### XI. Honest Completion Reporting

At the end of every implementation run, report what was actually built against what was asked, as an
explicit comparison — not a narrative summary.

The report MUST name, in their own labelled sections:

- **Simplified** — built, but less than specified, and in what way
- **Skipped** — not built, and why
- **Blocked** — attempted, could not complete, and what stopped it

If all three are empty, say so explicitly. "Done" with no such statement is not a valid report.

**A silent omission is worse than a flagged one**, because it consumes the trust that makes the
flagged ones useful. Reporting a phase complete while a four-state surface is missing its error
state, or an entity is missing its delete path, is a violation of this principle *and* of
Principle IX.

## Technology and Compliance Constraints

**Fixed stack — not open for reconsideration during planning:**

| Layer | Technology |
|---|---|
| Framework / build | React + Vite |
| Styling | Vanilla Extract (typed theme contracts) |
| Animation | Framer Motion |
| Smooth scroll | Lenis |
| Backend / DB / auth / storage | Supabase (PostgreSQL) |
| Optional, off by default | Three.js, React Three Fiber, drei, postprocessing (Principle VI) |

Adding a library outside this list requires the approval gate in Principle X and a justification
entry in the plan's Complexity Tracking table.

**Deployment model**: per client, not multi-tenant. One codebase, one deployment per resort, each
with its own domain, branding, and Supabase project. No shared tenancy, no subscription billing, no
cross-resort user accounts.

**Demo dataset**: a complete fictional demo resort ships with the codebase and is simultaneously the
sales demo, the development target, and the deployment test. Seeding MUST be a single reproducible
command, re-runnable against a fresh database, with a matching teardown. Manual dashboard seeding
steps are forbidden — they rot within a month and the demo stops working. The seed MUST include
bookings in every state named in Principle III.

**Data protection (RA 10173, Philippines)**: guest names, contact details, and stay dates are
personal information. Per deployment the resort is the data controller and the developer is the
processor. Privacy policy, terms, and cancellation policy are required and ship as editable content
with sensible defaults. A path to erase a guest's personal data MUST exist, distinct from the
booking-cancellation flow in Principle II — cancellation preserves the record, erasure removes the
person from it.

**Sensitive personal information MUST NOT be collected.** *(A6)* Specifically: government-issued ID
numbers, passport numbers, dates of birth, nationality, health information, and anything else
falling under RA 10173 §3(l). These are a different legal category from what the product holds
today — they raise the consent standard, lower the breach-notification threshold, and increase
penalty exposure. A guest check-in or ID-capture module would walk straight into this. **Adding any
such field is a compliance review before it is a feature**, and it MUST NOT be introduced by a
spec, a plan, or an implementation run on its own authority.

**Retention is bounded, and enforced by a scheduled job.** *(A4)* RA 10173 requires personal data be
kept no longer than necessary; an erasure path alone satisfies only half of that, because it waits
for someone to ask. Defaults, configurable per deployment:

- **Bookings**: personal fields (name, email, phone, notes) anonymized in place **24 months after
  checkout**. The row survives for inventory history and accounting.
- **Enquiries**: deleted **12 months** after creation.
- **Rate-limit records**: pruned once past the longest active window.

Enforcement is a database-scheduled job. Retention that depends on the owner remembering is not
retention, by the same reasoning that makes hold expiry automatic in Principle III.

**Data region is a recorded per-deployment decision.** *(A3)* Supabase will host this outside the
Philippines. The chosen region MUST be decided deliberately, recorded in the deployment record, and
named in the published privacy notice. Cross-border transfer is permitted under RA 10173, but the
controller remains accountable for data transferred abroad — which makes the region a compliance
fact, not an infrastructure default to be accepted silently.

**Photography sourcing for a real client deployment: client prerequisite, with a paid-shoot
fallback.** *(Resolves product-brief §6.4c.)* Usable photography is a qualification criterion in the
sales conversation, not a deliverable absorbed into the project fee — a one-person, minimal-budget
operation cannot carry a shoot. Where a property's imagery is inadequate, a shoot is quoted
separately or subcontracted, and it is scoped **before** the engagement is priced. Principle IV is
unaffected: whatever the source, real evaluative imagery of the real property is required.
**INFERRED DECISION — this is the developer's commercial call and should be corrected if wrong.**

**Timeline: no external deadline; solo part-time pace.** *(Resolves product-brief §7.)* Ratified as
the working assumption rather than left blank, because the scope boundaries in product-brief §8
were drawn against it — particularly holding the line on deferred pricing rules. If a real date
appears (a season, a specific prospect, a runway limit), it amends the product brief's deferral list
first and this document second. **INFERRED — supply a real date if one exists.**

**Accessibility of the admin**: the owner is non-technical and learned computers through consumer
social apps. Any admin flow assuming technical literacy — raw JSON, SQL, ID fields, unlabelled
toggles, destructive actions without confirmation — will go unused, and the content will go stale.
This is a functional requirement, not a courtesy.

## Development Workflow and Quality Gates

**Constitution Check runs twice per plan**: before Phase 0 research and again after Phase 1 design.
Violations are either resolved by changing the design or recorded in the plan's Complexity Tracking
table with a concrete justification. An unjustified violation blocks the plan.

**Order of work** *(A9)* — the full chain, per `vibe-coding-speckit-chain.md` Phase 1. Steps are not
optional and MUST NOT be skipped to reach implementation sooner:

```
specify  →  clarify ⟲  →  security review  →  plan  →  checklist  →  tasks  →  analyze ⟲
                                                                                    ↓
                          ┌──────────────────────────────────────────────────┐
                          │  implement (one scoped stage)  →  loose-ends     │ ⟲ per stage
                          └──────────────────────────────────────────────────┘
                                                                                    ↓
                                                                              converge ⟲
```

- **clarify** loops until it returns no questions, or only cosmetic ones.
- **security review** runs between clarify and plan, against `security-baseline.md`, while changes
  are still cheap. Gaps go back to clarify.
- **analyze** loops until it reports no inconsistencies. Fix at the source, never in the report.
- **implement** is scoped per Principle X. **loose-ends** runs between every stage; anything tagged
  BLOCKER is fixed before the next stage starts.
- **converge** loops with implement until it reports converged and leaves `tasks.md` untouched.

Availability and booking are the highest-priority stories; they carry all the correctness risk and
everything else is presentational by comparison.

**Verification between implement stages** means three specific things, not a judgment call: run the
build, run the loose-ends sweep and fix every BLOCKER, and look at the result in a browser or
through Playwright MCP.

**Definition of done for a user story phase** — all MUST hold before it is reported complete:

- [ ] Every acceptance scenario in the story passes
- [ ] Every entity touched has full CRUD, or a spec-stated deferral (IX)
- [ ] Every surface handles loading, empty, error, and success (IX)
- [ ] Every new table has RLS enabled with an explicit policy per operation per role (VIII)
- [ ] Every new view sets `security_invoker = true`; every `security definer` function pins
      `search_path = ''` (VIII)
- [ ] Public signup is disabled (VIII)
- [ ] CSP served as a header, with no `'unsafe-inline'` in `script-src` (VIII)
- [ ] Every interpolated value in an email template or non-React render path is escaped (VIII)
- [ ] No secret reaches the client bundle (VIII)
- [ ] Every animation has a reduced-motion fallback; Lenis fully disabled under it (VI)
- [ ] No hardcoded style value that a token covers (V)
- [ ] No property-specific value hardcoded outside config, content, or theme (I)
- [ ] Performance budget verified on a throttled mobile profile, where the story is visual (VII)
- [ ] Completion report filed with Simplified / Skipped / Blocked sections (XI)

**Security review** (Phase 0.4 and pre-launch) gives the most careful attention to the concurrency
guarantee in Principle III and the RLS policy matrix in Principle VIII.

## Governance

This constitution supersedes all other development practices, defaults, and conventions for this
project — including the default behaviour described in any `speckit-*` skill file. Where a skill's
instructions and this document conflict, this document governs, and the conflict is recorded in the
Sync Impact Report at the top of this file.

**Amendment procedure**: amendments are made by editing this file directly, incrementing the version
below, updating the Sync Impact Report, and propagating the change to `.specify/templates/` and any
affected runtime guidance in the same change. An amendment that is not propagated is not complete.

**Versioning policy** (semantic):

- **MAJOR** — a principle is removed or redefined in a backward-incompatible way, or governance
  changes such that previously compliant work is now non-compliant
- **MINOR** — a principle or section is added, or existing guidance is materially expanded
- **PATCH** — clarification, wording, or typo fixes that do not change what is required

**Compliance review**: every plan runs the Constitution Check gate. `/speckit-analyze` treats a
constitution conflict as CRITICAL and requires the spec, plan, or tasks to change — never a dilution
or reinterpretation of the principle. If a principle itself is wrong, that is an explicit
constitution amendment, made separately and deliberately, not resolved inside a feature.

**Precedence among principles**: where two principles pull in opposite directions, the
NON-NEGOTIABLE ones (III, VIII) win. Correctness and security are never traded for polish or pace.

**Version**: 1.1.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
