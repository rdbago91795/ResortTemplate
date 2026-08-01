# Product Brief — Resort Site & Direct Booking Template

**File location:** `.specify/memory/product-brief.md`
**Feeds:** Phase 0.3 (constitution), 0.4 (security baseline), 0.5 (design system), and 1.1 (`/speckit.specify`) of the Spec Kit chain.

**Inference marker:** sections marked ⚑ contain reasoning I supplied rather than facts you gave me. Correct them before they harden into a spec — a wrong assumption here becomes expensive three phases later.

---

## 1. Problem

Small and mid-size Philippine resorts are visible almost entirely through Facebook pages and OTA listings. That costs them twice: OTAs take a commission on every booking, and a Facebook page can't convey what a property actually feels like to stay at — which is the entire basis on which someone chooses one resort over another.

The alternatives don't fit. Hotel management platforms are priced and shaped for properties with front-desk staff and revenue managers. Generic website builders produce sites that look like website builders. Neither serves an 8-to-30-room resort whose owner answers enquiries personally. ⚑ *Market characterisation is my inference — the idea chain's Step 4 would test it with real evidence before you build on it.*

## 2. The idea

> **MY IDEA:** A reusable web application for Philippine resorts, deployed per client, combining a visually rich marketing site with direct booking. Guests browse rooms, amenities, and galleries, check availability for their dates, and reserve — paying a deposit or full amount by scanning the resort's own QR code and submitting the payment reference number. The resort owner manages rooms, rates, availability, offers, and bookings through an admin area, and confirms each booking after verifying payment. Content is fully data-driven so one codebase serves any resort through configuration rather than code changes.

*(This block pastes into `/speckit.specify`.)*

## 3. Target user

**Two distinct users with genuinely different needs — this drives most of the architecture.**

**The guest** — a domestic traveller researching on a phone, often on mobile data, deciding between several resorts. Judges within seconds on whether the property looks worth the money. Wants to see real rooms, understand the total cost, and book without a phone call or a Messenger thread.

**The resort owner or manager** — non-technical, likely managing the property in person. Updates rates seasonally, blocks dates, adds photos after a renovation, checks new bookings daily. Will not open a database dashboard. The admin has to be usable by someone who learned computers through Facebook.

**Your buyer is the owner. Your conversion depends on the guest.** A site the owner loves that guests bounce from has failed, and vice versa.

## 4. Settled design decisions

Do not relitigate these in later phases.

**4.1 — Deployed per client, not multi-tenant SaaS. Confirmed.** One codebase, one deployment per resort, each with its own domain, branding, and database. No shared tenancy, no subscription billing, no cross-resort user accounts. Reuse comes from configuration and theming, not from serving many resorts off one instance.

The reasoning: multi-tenant means building tenant isolation, billing, onboarding, and support before the first client is served — that's a company, not a project. Per-client deployment lets you charge project fees, matches how resorts want their own domain, and lets the cinematic quality vary per property.

**4.2 — You never touch money.** The resort's QR code is displayed; the guest pays the resort directly through GCash, Maya, or InstaPay; the guest submits the reference number. No card data, no payment gateway, no funds held. This is a significant legal and security advantage and should not be traded away for convenience later.

The consequence: **payment verification is manual and asynchronous.** A booking is not confirmed when payment is claimed — it's confirmed when the owner verifies the reference against their own payment app. The booking state machine must reflect this honestly.

**The system never enforces an amount.** Since verification is manual, the amount due is the owner's judgment, displayed as editable guidance ("50% deposit to reserve" or "full payment required") rather than computed and validated. Don't build percentage logic, partial-payment rules, or amount validation — there is nothing to validate against.

What the system does record: on verification, the owner enters the amount actually received, and any remaining balance is shown on the booking. That's a field and a subtraction, not a payments subsystem.

**4.3 — Booking states are explicit, and holds expire.** Availability moves through: available → held (guest is completing booking) → awaiting verification (reference submitted) → confirmed (owner verified) → cancelled or expired. Holds must expire automatically, or abandoned bookings will silently consume inventory.

**4.4 — Real photography carries the property; treatment carries the feeling.** Guests are evaluating a specific place, so rooms, pools, and views must be genuine photographs. Cinematic techniques — scroll-driven reveals, depth parallax, shader transitions — apply to how real images are presented, never as a substitute for them. This is a truthfulness constraint, not an aesthetic preference.

**4.5 — The template ships with a configurable hero, not bespoke 3D per client.** ⚑ *My inference.* Baseline supports image, video, or depth-parallax hero treatment selected by configuration. Heavy custom 3D work is a paid add-on for a specific client, kept outside the reusable core — otherwise every client's custom scene becomes template maintenance forever.

**4.6 — Mobile is the primary target.** PH traffic is mobile-dominant and often on constrained data. A gallery-heavy site that takes eight seconds on a mid-range Android has failed regardless of how it looks on a laptop. Image pipeline — AVIF/WebP, responsive sizes, blur-up placeholders, lazy loading — is a core requirement, not an optimisation pass.

**4.9 — Cancellation policy is editable content with a shipped default.** The template ships a reasonable default the owner edits rather than writes from scratch — most won't have one written down, and a blank field stays blank.

Because no money moves through the system, a cancellation is a booking state change and nothing more. Any refund is arranged between resort and guest outside the app. The policy text must say so plainly, so a guest doesn't expect an automatic refund that will never arrive.

**4.8 — A complete fictional demo resort ships with the codebase.** There is no client yet, so the seed dataset isn't scaffolding to be thrown away — it is the product's only visible form until a real resort exists. It has three jobs, and each raises the bar on it:

1. **It's the sales demo.** A prospective resort owner is shown this. If it looks like placeholder data, the demo sells nothing
2. **It's the development target.** Every feature is built and judged against it
3. **It's the deployment test.** Swapping this dataset for a real resort's is exactly what happens on day one of a client project. If that swap requires code changes, §4.1's reusability claim is false

Requirements: a plausible named property with a coherent identity, 4-6 room types with genuinely different rates and capacities, real-looking availability including some already-booked dates, at least one seasonal rate variation, sample bookings across every state in §4.3 (held, awaiting verification, confirmed, cancelled, expired), amenity and activity content, and a placeholder payment QR that is obviously non-functional rather than a real code belonging to anyone.

**Location is a data field, not a fixture.** Latitude, longitude, address, and transport notes are all configurable — the demo ships with placeholder coordinates that get replaced per deployment like any other content. The map component reads from the database rather than hardcoding a position. The fictional property is plausible-generic rather than modelled on any real resort, since none of its specifics are baked into code.

Photography: **AI-generated imagery, and this is the right choice here rather than a compromise.** The demo property is fictional — there is no real resort being misrepresented, nothing is bookable, and no guest can be deceived. Generation also gives what stock can't: a coherent visual identity across every shot, and exactly the angles the layout needs.

§4.4's truthfulness rule is unaffected. It governs *real* properties, where a guest's booking decision depends on seeing genuine rooms. A fictional demo has no such duty.

**The hard boundary is deployment.** Generated demo imagery must never reach a real resort's site — that would be exactly the deception §4.4 forbids. Two guards: keep demo assets in a clearly separated directory (`/demo-assets/` or equivalent), and make "no demo imagery remains" an explicit item on the client deployment checklist, verified rather than assumed.

**Seeding must be a single reproducible command**, re-runnable on a fresh database, with a matching teardown. If seeding is a manual sequence of dashboard steps, it will rot within a month and the demo will stop working.

**4.7 — Admin UI is required.** Unlike a portfolio, the client edits their own content. Rooms, rates, availability, offers, gallery, and bookings all need a real interface. This is a substantial portion of the build and should be scoped as such rather than treated as an afterthought.

## 5. Success definition

**For the resort:** direct bookings that would otherwise have gone through an OTA, and hours not spent answering availability questions in Messenger.

**For you:** a second resort deploying the same codebase with only configuration and content changes. If the second deployment needs code changes, the template failed at the thing it exists to do.

**Before any client exists**, the honest near-term success metric is different: a demo you can put in front of a resort owner that makes the booking flow obviously better than what they do today. That's what turns this from speculative into commissioned, and it's the only metric that matters until it happens.

⚑ Phase 1 should convert these into 1-2 measurable metrics.

## 6. Key risks

**6.1 — Availability integrity is the hard technical problem.** Two guests booking the same room for overlapping dates simultaneously is a correctness failure with a real-world cost — an owner having to tell someone their confirmed room doesn't exist. Date *ranges* over multiple units of the same room type is meaningfully harder than the appointment-slot booking you've built before. This needs explicit transaction handling and deserves the most careful part of the security review.

**6.2 — Fake reference numbers.** Nothing stops a guest entering an invented reference to hold a room. Mitigation is procedural rather than technical: unverified bookings expire, and the owner verifies before confirming. Worth stating plainly in the guest-facing flow so expectations are correct.

**6.3 — Source material quality.** The template's value depends on good photography. A resort with phone snapshots and no drone footage cannot get the intended result. Decide whether shooting is in scope, subcontracted, or a client prerequisite — before quoting, not after.

With no client yet this is deferred but not gone: the demo uses licensed imagery, so the first real deployment is where it lands. Worth deciding the answer before the sales conversation, since it's the first question an owner with bad photos will ask.

**6.4 — Competition is real and unvalidated.** ⚑ Cloudbeds, Little Hotelier, SiteMinder, and WordPress booking plugins all exist. The bet is that they're priced and shaped for larger properties, leaving small PH resorts underserved. **That bet is not validated.** Before building, check what resorts in your target range actually use today and what they pay — this is precisely what the idea chain's Step 4 exists for.

**6.5 — Scope.** Seven feature areas plus an admin module is not an MVP; it's a v1.0. See §8.

## 7. Constraints

- **Budget:** none to minimal
- **Team:** one person, AI-assisted
- **Stack:** React + Vite + Vanilla Extract + Framer Motion + Lenis + Supabase, per the constitution
- **Market:** Philippines
- **Legal:** guest names, contact details, and stay dates are personal information under RA 10173. Payment reference numbers link to financial transactions but no card data is handled. Privacy policy, terms, and a cancellation policy are required. Per deployment, the resort is the data controller and you are the processor — worth stating in your client contract
- **Client-facing:** the owner is non-technical. Any admin flow that assumes technical literacy will go unused, and the content will go stale

## 8. Scope boundaries

**MVP — in scope:**
- Home with hero and a date/guest availability search
- Accommodations: room types, galleries, bed configuration, nightly rates
- Amenities and activities as content pages
- Gallery, categorised (rooms, pool, beach, dining, grounds)
- Location and contact: address, map, transport details, enquiry form
- Booking: availability check, hold, QR display, reference submission, owner verification, confirmation
- Admin: manage rooms, rates, availability blocks, gallery, content pages, and bookings
- Automated email to guest on booking submission and on confirmation
- Privacy policy, terms, cancellation policy
- **Seed dataset for the demo resort, with a single-command reproducible seeding script and teardown** (§4.8)

**Explicitly deferred — the Later list:**
- Promo codes and seasonal pricing rules (§8 note: this is the largest deferred item and will be requested early — hold the line for v1)
- Live chat
- Bookable tours and activities as separate inventory
- Multi-language
- OTA channel synchronisation
- Multi-property support under one admin
- Automated payment verification through any gateway
- Guest accounts and booking history
- Reviews or ratings
- Bespoke 3D scenes in the template core (per §4.5)

**Sequencing note for Phase 1.1:** write the MVP as one spec with each capability above as a separate user story, in priority order. Availability and booking should be the highest-priority stories — they carry all the correctness risk, and everything else is presentational by comparison.

---

## 9. Open questions to resolve before Phase 1.1

~~1. Multi-tenant or per-client?~~ **Resolved:** per-client reusable codebase (§4.1).
~~2. Do you have a first resort client?~~ **Resolved:** no. The demo resort in §4.8 stands in, and finding a first client is the near-term goal in §5.

~~3. Deposit or full payment?~~ **Resolved:** the owner's judgment, displayed as editable guidance. The system enforces nothing (§4.2).
~~4. Cancellation policy?~~ **Resolved:** editable content with a shipped default (§4.9).
~~5. Who supplies photography?~~ **Resolved for the demo:** AI-generated (§4.8). Still open for the first real client — decide before that sales conversation (§6.3).
~~6. Which resort to model the demo on?~~ **Resolved:** none. Location is configurable data; the fictional property is plausible-generic (§4.8).

**All open questions are resolved. This brief is ready for Phase 0.3.**
