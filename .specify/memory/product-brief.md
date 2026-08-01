# Product Brief — Resort Site & Direct Booking Template

**File location:** `.specify/memory/product-brief.md`
**Feeds:** Phase 0.3 (constitution), 0.4 (security baseline), 0.5 (design system), and 1.1 (`/speckit.specify`) of the Spec Kit chain.
**Source:** `product-brief-resort-template.md` (your input). This document supersedes it for all downstream phases.

**Inference marker:** ⚑ marks reasoning I supplied rather than facts you gave me. Correct these before they harden into a spec — a wrong assumption here becomes expensive three phases later. Everything unmarked traces directly to your input.

**Three structural changes from your source, called out so you can reject them:**
1. §3 names **one** target user where your source named two. Your source's own line — *"Your buyer is the owner"* — decided it. The guest is reframed as a hard design constraint, not dropped.
2. §6 names **one** key risk where your source listed five. The other four are carried forward in §6.4 as known engineering risks, which is what they are — a hard problem is not an unvalidated assumption.
3. §4 decisions are renumbered sequentially. Your source ran 4.1–4.6, 4.9, 4.8, 4.7. No content changed; the mapping is noted per item.

---

## 1. Problem

Small and mid-size Philippine resorts are visible almost entirely through Facebook pages and OTA listings. That costs them twice: OTAs take a commission on every booking, and a Facebook page can't convey what a property actually feels like to stay at — which is the entire basis on which someone chooses one resort over another.

The alternatives don't fit. Hotel management platforms are priced and shaped for properties with front-desk staff and revenue managers. Generic website builders produce sites that look like website builders. Neither serves an 8-to-30-room resort whose owner answers enquiries personally.

⚑ *This market characterisation is inference, not evidence. It is also the load-bearing claim of the whole project — see §6, where it is named as the key risk and given a test.*

## 2. The idea

> A reusable web application for Philippine resorts, deployed per client, combining a visually rich marketing site with direct booking. Guests browse rooms, amenities, and galleries, check availability for their dates, and reserve — paying a deposit or full amount by scanning the resort's own QR code and submitting the payment reference number. The resort owner manages rooms, rates, availability, offers, and bookings through an admin area, and confirms each booking after verifying payment. Content is fully data-driven so one codebase serves any resort through configuration rather than code changes.

*(This block pastes into `/speckit.specify` verbatim.)*

## 3. Target user

**The target user is the resort owner-operator. They are the buyer, the admin user, and the person who decides whether this codebase gets a second deployment.**

⚑ *The persona below is a composite I constructed to make the segment concrete. The segment boundaries (8–30 rooms, Facebook + OTA, owner answers enquiries personally, non-technical) come from your input; the name, region, and daily specifics are mine. Correct the specifics if they mislead — but keep the shape, because the admin UI has to be designed against a real picture of someone.*

⚑ **Persona — "Marites," owner-manager, 14-room beachfront resort.** Late 40s. Runs the property in person; her phone is her office. The resort has a Facebook page with 4,000 followers, listings on Agoda and Booking.com, and no website. Enquiries arrive as Messenger threads — *"Available po Dec 26-28? How much for 2 pax?"* — and she answers each one by hand, often repeating herself thirty times a week. She adjusts rates by season and by feel. She blocks dates in a paper notebook and a Google Sheet that disagree with each other. She has never opened a database dashboard and never will. She learned computers through Facebook, and any interface that doesn't work the way Facebook works is an interface she'll abandon — at which point her content goes stale and the site quietly dies.

**Why her and not the adjacent groups:**

- **Not the guest.** The guest is a user, not the target user. Nobody's booking pays for this codebase; the owner's project fee does. Guests are addressed as a constraint (below), not as the customer.
- **Not 50+ room hotels.** They have front-desk staff, a revenue manager, and a budget — which is exactly why Cloudbeds and SiteMinder already have them. They need channel management, PMS integration, and night audit. Serving them means competing head-on with funded incumbents on their own feature set.
- **Not single-unit Airbnb hosts.** Airbnb already solves their discovery, payment, and calendar problems. They have no multi-unit inventory, so the hard part of this product is worthless to them, and they won't pay a project fee for brand presence they don't need.
- **Not multi-property owners.** Explicitly deferred in §8. Supporting them means an account model and cross-property inventory — a different product.

**⚑ Disqualifier within the segment:** an owner-operator with only phone snapshots. Per §6.4c, the template's value is carried by photography. That's a qualification question in the sales conversation, not a feature to build around.

**The guest as a design constraint, not a target user.** A domestic traveller researching on a phone, often on mobile data, deciding between several resorts. Judges within seconds whether the property looks worth the money. Wants to see real rooms, understand the total cost, and book without a phone call or a Messenger thread. **This constraint has veto power:** a site the owner loves that guests bounce from has failed just as completely as one guests love that the owner can't update. Both must hold.

## 4. Settled design decisions

**Do not relitigate these in later phases.** Each is a decision already made, with its reasoning attached so a later phase can tell the difference between a constraint and a preference.

**4.1 — Deployed per client, not multi-tenant SaaS.** *(source §4.1)* One codebase, one deployment per resort, each with its own domain, branding, and database. No shared tenancy, no subscription billing, no cross-resort user accounts. Reuse comes from configuration and theming, not from serving many resorts off one instance.

*Reasoning:* multi-tenant means building tenant isolation, billing, onboarding, and support before the first client is served — that's a company, not a project. Per-client deployment lets you charge project fees, matches how resorts want their own domain, and lets the cinematic quality vary per property.

**4.2 — You never touch money.** *(source §4.2)* The resort's QR code is displayed; the guest pays the resort directly through GCash, Maya, or InstaPay; the guest submits the reference number. No card data, no payment gateway, no funds held. This is a significant legal and security advantage and must not be traded away for convenience later.

*Consequence — payment verification is manual and asynchronous.* A booking is not confirmed when payment is claimed; it's confirmed when the owner verifies the reference against their own payment app. The booking state machine must reflect this honestly.

*The system never enforces an amount.* Since verification is manual, the amount due is the owner's judgment, displayed as editable guidance ("50% deposit to reserve", "full payment required") rather than computed and validated. **Do not build percentage logic, partial-payment rules, or amount validation — there is nothing to validate against.** What the system does record: on verification, the owner enters the amount actually received, and any remaining balance is shown on the booking. That's a field and a subtraction, not a payments subsystem.

**4.3 — Booking states are explicit, and holds expire.** *(source §4.3)* Availability moves through: `available → held` (guest is completing booking) `→ awaiting_verification` (reference submitted) `→ confirmed` (owner verified) `→ cancelled | expired`. Holds must expire automatically, or abandoned bookings will silently consume inventory.

**4.4 — Real photography carries the property; treatment carries the feeling.** *(source §4.4)* Guests are evaluating a specific place, so rooms, pools, and views must be genuine photographs. Cinematic techniques — scroll-driven reveals, depth parallax, shader transitions — apply to how real images are presented, never as a substitute for them. **This is a truthfulness constraint, not an aesthetic preference.**

**4.5 — The template ships with a configurable hero, not bespoke 3D per client.** ⚑ *(source §4.5, marked as inference there too)* Baseline supports image, video, or depth-parallax hero treatment selected by configuration. Heavy custom 3D is a paid add-on for a specific client, kept outside the reusable core — otherwise every client's custom scene becomes template maintenance forever.

**4.6 — Mobile is the primary target.** *(source §4.6)* PH traffic is mobile-dominant and often on constrained data. A gallery-heavy site that takes eight seconds on a mid-range Android has failed regardless of how it looks on a laptop. Image pipeline — AVIF/WebP, responsive sizes, blur-up placeholders, lazy loading — is a **core requirement, not an optimisation pass.**

**4.7 — Cancellation policy is editable content with a shipped default.** *(source §4.9)* The template ships a reasonable default the owner edits rather than writes from scratch — most won't have one written down, and a blank field stays blank.

Because no money moves through the system, a cancellation is a booking state change and nothing more. Any refund is arranged between resort and guest outside the app. **The policy text must say so plainly,** so a guest doesn't expect an automatic refund that will never arrive.

**4.8 — A complete fictional demo resort ships with the codebase.** *(source §4.8)* There is no client yet, so the seed dataset isn't scaffolding to be thrown away — it is the product's only visible form until a real resort exists. It has three jobs, and each raises the bar:

1. **It's the sales demo.** A prospective owner is shown this. If it looks like placeholder data, the demo sells nothing.
2. **It's the development target.** Every feature is built and judged against it.
3. **It's the deployment test.** Swapping this dataset for a real resort's is exactly what happens on day one of a client project. If that swap requires code changes, §4.1's reusability claim is false.

*Requirements:* a plausible named property with a coherent identity; 4–6 room types with genuinely different rates and capacities; realistic availability including already-booked dates; at least one seasonal rate variation; sample bookings in **every** state in §4.3; amenity and activity content; and a placeholder payment QR that is obviously non-functional rather than a real code belonging to anyone.

*Location is a data field, not a fixture.* Latitude, longitude, address, and transport notes are configurable; the demo ships placeholder coordinates replaced per deployment like any other content. The map component reads from the database rather than hardcoding a position. The fictional property is plausible-generic rather than modelled on any real resort.

*Photography: AI-generated imagery, and this is the right choice here rather than a compromise.* The demo property is fictional — no real resort is misrepresented, nothing is bookable, no guest can be deceived. Generation also gives what stock can't: a coherent visual identity across every shot, and exactly the angles the layout needs. §4.4's truthfulness rule is unaffected; it governs *real* properties, where a guest's booking decision depends on seeing genuine rooms. A fictional demo has no such duty.

*The hard boundary is deployment.* **Generated demo imagery must never reach a real resort's site** — that would be exactly the deception §4.4 forbids. Two guards: keep demo assets in a clearly separated directory (`/demo-assets/` or equivalent), and make "no demo imagery remains" an explicit, verified item on the client deployment checklist.

*Seeding must be a single reproducible command*, re-runnable on a fresh database, with a matching teardown. If seeding is a manual sequence of dashboard steps, it will rot within a month and the demo will stop working.

**4.9 — Admin UI is required and is a first-class part of the build.** *(source §4.7)* Unlike a portfolio site, the client edits their own content. Rooms, rates, availability blocks, offers, gallery, and bookings all need a real interface, designed for the persona in §3. This is a substantial portion of the build and must be scoped as such rather than treated as an afterthought.

## 5. Success definition

**The near-term metric is the only one that matters until a client exists:** a demo you can put in front of a resort owner that makes the booking flow obviously better than what they do today. That's what turns this from speculative into commissioned.

⚑ *Your source asked Phase 1 to convert this into measurable metrics. Here is my proposal — the thresholds are mine and are the most arbitrary numbers in this document. Adjust them; don't delete them.*

| # | Measures | Metric | Threshold |
|---|---|---|---|
| **S1** | Does anyone want it? | Signed paid engagements per demo conversation | ⚑ ≥1 signed from ≤10 conversations |
| **S2** | Is the template actually reusable? | Files changed to stand up deployment #2 | **Zero commits outside config, content, theme, and asset paths.** Any change to shared application code means §4.1 failed |
| **S3** | Can the persona in §3 actually use it? | Owner makes an unaided content edit — rate change, photo upload, date block | ⚑ ≥1 within 30 days of handover, **without contacting you** |
| **S4** | Does it displace OTA commission? | Share of confirmed bookings arriving direct vs. OTA, 90 days post-launch | ⚑ Direction of travel over 90 days; set a level only after a baseline exists |
| **S5** | Does it save the owner's time? | Messenger threads that are pure availability/rate questions | ⚑ Owner's own before/after judgment. Self-reported is fine — it's the outcome they'll actually feel |
| **S6** | Is the admin trusted? | Median time from reference submission to owner verification | ⚑ Under 24h. A rising number means the owner has stopped opening the admin |

**S2 is the one that defines the product.** Everything else measures a given deployment; S2 measures whether you built a template or an expensive one-off.

**Explicitly not success:** pageviews, session duration, gallery interaction depth, Lighthouse scores, bounce rate, follower growth. ⚑ *Performance budgets from §4.6 still get enforced as engineering gates in Phase 3 — they're pass/fail requirements, not evidence the product works.*

## 6. Key risk

### The single assumption most likely to be wrong

> **Small Philippine resorts are underserved — and will pay a project fee for a bespoke direct-booking site rather than continuing to accept OTA commission.**

Two claims are bundled here, and both are unvalidated:

**(a) The gap exists.** Cloudbeds, Little Hotelier, SiteMinder, and WordPress booking plugins all exist and all reach downmarket further than the source brief assumes they do. If a meaningful share of 8–30 room PH resorts already run a working direct-booking flow, the problem in §1 is smaller than stated.

**(b) The gap is worth money to the owner.** OTA commission is a cost that arrives *after* a booking has already been made. A project fee arrives *before*. Owners who complain fluently about commission may still not convert that complaint into an upfront payment.

**Why this and not availability integrity.** Concurrent double-booking (source §6.1) is the hardest *engineering* problem here, but it isn't an assumption — you already know it's hard and you know how to solve it. It can only sink a build; this one can sink the project. Wrong-market failure costs you the entire build; a concurrency bug costs you a sprint.

### The cheapest test that would expose it

**Stage 1 — Desk audit. Half a day, zero cost, before Phase 0.3.**
⚑ Pick 3 destination areas (e.g. Siargao, El Nido, La Union). Find 25–30 resorts in the 8–30 room range through Google Maps and Agoda. For each, record five fields: own domain (y/n) · booking mechanism (Messenger / enquiry form / OTA only / real booking engine) · engine identifiable? · GCash/QR deposit already in use? · photography quality (usable / not).

**Kill signal:** ⚑ if more than ~40% already have a working direct-booking flow, §1's premise is wrong and the segment or the pitch needs rethinking before you write a constitution.

**Stage 2 — Five owner conversations. One week, zero cost, can run alongside Phase 0.**
Ask three questions, in this order: *What do you use now, and can you show me?* · *What did the OTAs take last year?* · *What would you expect to pay for your own booking site?* Their number, unprompted, before you name one.

**Kill signal:** ⚑ if fewer than 2 of 5 name a figure within range of your intended fee, claim (b) is the problem — and the fix is a different commercial model (build-once, sell-many; revenue share; hosted with monthly fee) rather than a different product.

**Stage 3 — The price conversation.** The only real falsification test, and it needs the demo to exist. This is why §4.8's demo quality is a settled decision rather than a nice-to-have: **the demo is the test instrument for the project's central assumption.**

**Sequencing:** Stages 1 and 2 cost a week combined and can complete before you commit to the build. Do not skip them because the build is more fun than the phone calls.

### 6.4 Known risks carried forward *(engineering risks, not assumptions — from source §6.1–6.3, 6.5)*

- **(a) Availability integrity.** Two guests booking the same room for overlapping dates simultaneously is a correctness failure with a real-world cost — an owner telling someone their confirmed room doesn't exist. Date *ranges* across multiple units of one room type is meaningfully harder than appointment-slot booking. Needs explicit transaction handling; gets the most careful part of the Phase 0.4 security review.
- **(b) Fake reference numbers.** Nothing stops a guest entering an invented reference to hold a room. Mitigation is procedural, not technical: unverified holds expire, and the owner verifies before confirming. State this plainly in the guest-facing flow so expectations are correct.
- **(c) Source material quality.** A resort with phone snapshots and no drone footage cannot get the intended result. Decide whether shooting is in scope, subcontracted, or a client prerequisite **before quoting, not after.** Deferred while there's no client, but it's the first question an owner with bad photos will ask — have the answer before the Stage 2 conversations above.
- **(d) Scope.** Seven feature areas plus an admin module is not an MVP; it's a v1.0. See §8 and hold the line.

## 7. Constraints

| | |
|---|---|
| **Budget** | None to minimal |
| **Team** | One person, AI-assisted |
| **Timeline** | ⚑ **Not supplied — the one input missing from your source.** I've assumed no external deadline and a solo part-time pace. If a real date exists (a season, a specific prospect, a runway limit), it changes §8's scope cuts more than any other constraint. Please fill this in. |
| **Stack** | React + Vite + Vanilla Extract + Framer Motion + Lenis + Supabase |
| **Market** | Philippines; domestic travellers; mobile-dominant, data-constrained |
| **Legal** | Guest names, contact details, and stay dates are personal information under **RA 10173 (Data Privacy Act)**. Payment reference numbers link to financial transactions, but no card data is handled. Privacy policy, terms, and cancellation policy are required. Per deployment, **the resort is the data controller and you are the processor** — state this in the client contract. |
| **Client-facing** | The owner is non-technical (§3). Any admin flow assuming technical literacy goes unused, and the content goes stale. |

⚑ **Correction to your source:** it cites the stack as *"per the constitution."* `.specify/memory/constitution.md` is currently an unfilled template — the constitution is written in Phase 0.3, which reads *this* file. So the stack line above is an **input to** the constitution, not a citation from it. Treat it as your decision to confirm at 0.3, not as already-ratified.

## 8. Scope boundaries

### MVP — in scope

- Home: hero (§4.5) with date/guest availability search
- Accommodations: room types, galleries, bed configuration, nightly rates
- Amenities and activities as content pages
- Gallery, categorised (rooms, pool, beach, dining, grounds)
- Location and contact: address, map from DB coordinates (§4.8), transport details, enquiry form
- **Booking: availability check → hold → QR display → reference submission → owner verification → confirmation** (§4.2, §4.3)
- **Admin: rooms, rates, availability blocks, offers, gallery, content pages, bookings** (§4.9)
- Automated email to guest on booking submission and on confirmation
- Privacy policy, terms, cancellation policy (§4.7)
- **Demo resort seed dataset, single-command reproducible seeding script, and teardown** (§4.8)

### Explicitly deferred — the Later list

⚑ *Reasons are mine; your source listed the items without them. They're written so a later phase can tell whether a deferral still holds.*

| Deferred | Reason |
|---|---|
| **Promo codes and seasonal pricing rules** | ⚑ **The largest deferred item, and it will be requested early.** Pricing rules are a rules engine that touches availability, display, and booking totals simultaneously — it's the fastest way to destabilise the one subsystem carrying real correctness risk (§6.4a). Owners already vary rates by hand today. **Hold the line for v1.** |
| Live chat | ⚑ Messenger already does this and the owner is already there. Adds a channel to monitor without removing one. |
| Bookable tours and activities as separate inventory | ⚑ A second inventory model with different availability semantics. Content pages cover the sales job for v1. |
| Multi-language | ⚑ Target guest is a domestic traveller (§3); English suffices. Retrofit cost is real but not v1's problem. |
| OTA channel synchronisation | ⚑ Two-way sync with external calendars is an integration product. The premise (§1) is bookings moving *away* from OTAs, not alongside them. |
| Multi-property support under one admin | ⚑ Contradicts §4.1's one-deployment-per-resort model. Different product. |
| Automated payment verification via gateway | ⚑ Directly contradicts §4.2 — the whole legal and security position rests on never touching money. This deferral is permanent unless §4.2 is reopened. |
| Guest accounts and booking history | ⚑ Accounts add auth surface, personal data under RA 10173, and password recovery for a guest who books once a year. Email confirmation covers the actual need. |
| Reviews or ratings | ⚑ Needs volume the segment can't supply, and unmoderated reviews on the owner's own site is a support problem they didn't ask for. |
| Bespoke 3D scenes in the template core | Per §4.5 — paid add-on, kept outside the reusable core. |

### Sequencing note for Phase 1.1

Write the MVP as **one spec with each capability above as a separate user story, in priority order.** Availability and booking must be the highest-priority stories — they carry all the correctness risk, and everything else is presentational by comparison.

---

## 9. Open questions

All questions from your source are resolved:

- ~~Multi-tenant or per-client?~~ **Per-client reusable codebase** (§4.1)
- ~~First resort client?~~ **None.** The demo resort (§4.8) stands in; finding client #1 is the near-term goal (§5)
- ~~Deposit or full payment?~~ **Owner's judgment, editable guidance. The system enforces nothing** (§4.2)
- ~~Cancellation policy?~~ **Editable content with a shipped default** (§4.7)
- ~~Who supplies photography?~~ **Resolved for the demo: AI-generated** (§4.8). **Still open for the first real client** — decide before the Stage 2 conversations in §6, not after (§6.4c)
- ~~Which resort to model the demo on?~~ **None.** Location is configurable data; the property is plausible-generic (§4.8)

**Two things I need back from you before Phase 0.3:**

1. **Timeline** (§7) — the only constraint your source didn't supply.
2. **Confirm or reject the ⚑ items**, particularly the §5 thresholds and the §6 kill signals. They're the numbers most likely to be wrong and most likely to be quoted back at you three phases from now.

**Otherwise this brief is ready for Phase 0.3.**
