# Feature Specification: Resort Site & Direct Booking — MVP

**Feature Directory**: `specs/001-resort-direct-booking`

**Created**: 2026-07-31

**Status**: Draft — clarifications resolved, ready for `/speckit-clarify`

**Input**: User description: "Read .specify/memory/product-brief.md. Build the MVP it describes, scoped strictly to its in-scope list — anything the brief marks as deferred stays out of this spec entirely. Write each MVP capability as its own user story, in priority order, so tasks and implementation can be staged one story at a time. Cover the full lifecycle of every entity this creates: create, view, edit, delete. If any part is deliberately deferred, say so explicitly rather than omitting it."

---

## Scope Traceability

Every item on the product brief's §8 in-scope list, mapped to where it is covered. Nothing from the
brief's deferred list appears in this specification.

| Brief §8 MVP item | Covered by |
|---|---|
| Home with hero and date/guest availability search | US9 (page), US1 (search) |
| Accommodations: room types, galleries, bed configuration, nightly rates | US5 |
| Amenities and activities as content pages | US8 |
| Gallery, categorised | US7 |
| Location and contact: address, map, transport, enquiry form | US10 |
| Booking: availability check, hold, QR, reference, verification, confirmation | US1, US2, US3 |
| Admin: rooms, rates, availability blocks, gallery, content pages, bookings | US4, US5, US6, US7, US8, US11 |
| Automated email on booking submission and on confirmation | US2 (submission), US3 (confirmation) |
| Privacy policy, terms, cancellation policy | US11 |
| Seed dataset with single-command seeding and teardown | Foundational (FR-070…FR-076) |

**One capability is specified that is not on the brief's §8 list: US12, site branding.** It was added
during Phase 0.5 and confirmed twice in that session — brand colour is owner-editable data, and logo
upload is included. It is recorded here rather than assumed, because the entity does not exist unless
this specification creates it. If that is wrong, remove US12 and its entity.

**Email delivery is not a standalone user story.** The brief lists it as its own §8 item, but it has
no independently valuable journey — it is the closing beat of US2 and US3 and is specified inside
their acceptance scenarios. This is a presentation choice, not a scope reduction.

---

## User Scenarios & Testing *(mandatory)*

Two people use this product and they want different things. **The guest** is a domestic traveller on
a phone, often on mobile data, deciding between several resorts in seconds. **The owner** runs the
property in person, is not technical, and checks bookings daily between other work.

Stories are ordered so that the highest-correctness-risk work lands first, per the brief's §8
sequencing note. Each story is a vertical slice — where an entity has both a guest-facing view and an
owner-facing management screen, both are in the same story, so the story can be demonstrated end to
end without depending on a later one.

---

### User Story 1 - Search availability and hold a room (Priority: P1)

A guest arrives on the site, enters their check-in date, check-out date, and number of guests, and
sees which room types are actually free for those dates with the nightly rate and total. They pick
one, enter their name, email, and phone, and the room is held for them for a limited time while they
arrange payment.

**Why this priority**: This carries all of the correctness risk in the product. Two guests booking
overlapping dates for the same room is a failure with a real-world cost — an owner having to tell
someone their confirmed room does not exist. Everything else in the MVP is presentational by
comparison. It is also the first thing that must work in a sales demo.

**Independent Test**: Against the seeded demo resort, search a date range, confirm the results match
the seeded availability, complete a hold, and observe the room disappear from availability for those
dates. Then run two simultaneous holds for the same room and dates and confirm exactly one succeeds.

**Acceptance Scenarios**:

1. **Given** a room type with free dates, **When** a guest searches those dates for a party within
   capacity, **Then** that room type appears with its nightly rate and the total for the stay.
2. **Given** a room type whose only unit is already confirmed for overlapping dates, **When** a guest
   searches, **Then** that room type does not appear as available.
3. **Given** a party size above a room type's capacity, **When** a guest searches, **Then** that room
   type is not offered.
4. **Given** an available room, **When** the guest submits their details, **Then** a hold is created,
   a booking reference is shown, and a countdown to expiry is visible.
5. **Given** two guests submitting holds for the same room and overlapping dates at the same instant,
   **When** both are processed, **Then** exactly one hold is created and the other guest is told the
   dates were taken and shown what remains open.
6. **Given** a hold whose time has run out, **When** the expiry period passes with no reference
   submitted, **Then** the hold is released automatically without anyone acting, and those dates
   become available again.
7. **Given** a check-out date on or before the check-in date, **When** the guest searches, **Then**
   the search is refused with an explanation.
8. **Given** a check-in date in the past, **When** the guest searches, **Then** the search is refused
   with an explanation.
9. **Given** a stay spanning nights at two different rates, **When** the guest sees the total, **Then**
   it equals the sum of each night's applicable rate and a per-night breakdown is available.
10. **Given** a guest who needs more than one room, **When** they reach the room selection, **Then**
    they are told each booking covers one room and how to reserve another.
11. **Given** a search for tonight made after the property's cutoff, **When** the guest searches,
    **Then** they are told tonight is no longer bookable and offered the earliest date that is.
12. **Given** a hold created five minutes before the cutoff, **When** the guest submits their payment
    reference after it has passed, **Then** the submission is accepted.
13. **Given** a room type with one unit free and a threshold of two, **When** a guest searches,
    **Then** they are told only one remains.
14. **Given** a room type with four units free and a threshold of two, **When** a guest searches,
    **Then** they are told it is available and given no number.
15. **Given** a threshold of zero, **When** a guest searches, **Then** no count is shown at any level
    of availability.
16. **Given** a guest comparing many date ranges in quick succession, **When** they keep searching,
    **Then** they are not rate limited before a realistic comparison is finished.

---

### User Story 2 - Pay by QR and submit the payment reference (Priority: P1)

Holding the room, the guest sees the resort's own payment QR code, guidance on what to send, and a
field for the reference number their banking or e-wallet app gave them. They submit it, receive an
email acknowledging the submission, and can come back later to check the booking's status using their
reference and email address.

**Why this priority**: Without this the hold is worthless — it expires and the booking never
completes. It is also where the product's central constraint lives: no money moves through the
system, so what the guest submits is a claim, not a payment.

**Independent Test**: From an active hold, view the QR panel, submit a reference, receive the
acknowledgement email, then look the booking up by reference and email and see it awaiting
verification.

**Acceptance Scenarios**:

1. **Given** an active hold, **When** the guest views the payment step, **Then** the resort's QR
   code, the amount guidance text, and the stay total are shown together.
2. **Given** the payment step, **When** the guest reads it, **Then** it states plainly that the
   booking is not confirmed until the resort verifies the payment, and that no refund can be issued
   through the site.
3. **Given** an active hold, **When** the guest submits a well-formed reference, **Then** the booking
   moves to awaiting verification and an acknowledgement email is sent to the guest.
4. **Given** a reference containing characters outside the permitted set, or of the wrong length,
   **When** the guest submits, **Then** it is refused with an explanation of the expected format.
5. **Given** a booking awaiting verification, **When** the guest enters their reference and email on
   the lookup page, **Then** they see the booking's current status, dates, room type, and any
   remaining balance — and nothing else about the booking.
6. **Given** a wrong reference or a mismatched email, **When** submitted to the lookup page, **Then**
   no booking is revealed.
7. **Given** repeated lookup attempts beyond the permitted rate, **When** another is made, **Then**
   it is refused with a wait time and an alternative way to get help.
8. **Given** a guest who double-submits the booking form on a poor connection, **When** both requests
   arrive, **Then** only one hold exists.
9. **Given** someone with no booking, **When** they try to reach the payment QR by any means, **Then**
   it is not available to them.
10. **Given** a hold that expires while the guest is on the payment screen, **When** they try to view
    the QR again, **Then** it is no longer available and they are told the hold has expired.

---

### User Story 3 - Verify payment and confirm the booking (Priority: P1)

The owner opens the admin, sees bookings awaiting verification, checks the reference against their own
banking app, records the amount actually received, and confirms. The guest is emailed a confirmation.
If the payment never arrives or the reference is invented, the owner can reject the booking instead.

**Why this priority**: This closes the money loop and is the owner's single most important daily
action. Until it exists, no booking can reach a confirmed state and the product delivers nothing.

**Independent Test**: With a seeded booking awaiting verification, open it in the admin, enter an
amount received, confirm, and observe the state change, the recorded amount, the computed balance,
and the confirmation email to the guest.

**Acceptance Scenarios**:

1. **Given** bookings in various states, **When** the owner opens the admin, **Then** those awaiting
   verification are surfaced first, with the reference and the guest's contact details visible.
2. **Given** a booking awaiting verification, **When** the owner enters the amount received and
   confirms, **Then** the booking becomes confirmed, the amount is recorded, any remaining balance is
   shown, and a confirmation email is sent to the guest.
3. **Given** a booking awaiting verification, **When** the owner rejects it, **Then** it is cancelled,
   the dates are released, and the owner may record a reason.
4. **Given** the verification form, **When** the owner uses it, **Then** the system neither computes
   nor requires a particular amount — whatever the owner records is accepted.
5. **Given** a confirmed booking, **When** the owner reopens it, **Then** the recorded amount and
   balance are visible and the amount can be corrected.
6. **Given** a booking awaiting verification that is never acted on, **When** its extended expiry
   period passes, **Then** it expires automatically and the dates are released.
7. **Given** a confirmation email that bounces, **When** the owner opens the bookings list, **Then**
   that booking is marked as not reached and can be filtered for.
8. **Given** a booking whose email bounced, **When** the owner corrects the address and resends,
   **Then** the email is sent again and the delivery outcome updates.
9. **Given** a confirmation email that fails, **When** the owner looks at the booking, **Then** it is
   still confirmed — the failure affects notification, never the booking's state.

---

### User Story 4 - Manage bookings (Priority: P2)

The owner reviews all bookings, filters by state and date, opens any one to see the full detail,
records private notes, and cancels a booking when a guest asks.

**Why this priority**: US3 handles the critical daily action; this is the surrounding management the
owner needs once bookings accumulate. Valuable but not blocking.

**Independent Test**: With seeded bookings across every state, filter by each state, open a booking,
add a note, cancel it, and confirm the dates return to availability.

**Acceptance Scenarios**:

1. **Given** bookings across all states, **When** the owner filters by state or date range, **Then**
   only matching bookings are listed.
2. **Given** any booking, **When** the owner opens it, **Then** guest details, dates, room, state
   history, reference, amounts, and notes are all visible.
3. **Given** a confirmed booking, **When** the owner cancels it, **Then** it becomes cancelled, the
   dates are released, and the interface states that any refund is arranged outside the system.
4. **Given** any booking, **When** the owner adds a note, **Then** it is saved against the booking and
   is never visible to the guest.
5. **Given** a guest who asks to be forgotten, **When** the owner erases their personal details,
   **Then** name, email, phone, and requests are removed while the booking record itself survives for
   inventory and accounting.
6. **Given** any booking, **When** the owner looks for a delete action, **Then** none exists —
   bookings are cancelled, never destroyed.
7. **Given** a guest who phoned, **When** the owner creates a booking with their details, dates, and
   room, **Then** it is confirmed immediately without a hold or reference and those dates stop being
   bookable online.
8. **Given** dates already held or confirmed for another booking, **When** the owner tries to create a
   booking over them, **Then** it is refused and the conflict is shown.
9. **Given** a walk-in guest with no email address, **When** the owner creates the booking without
   one, **Then** it saves, no email is attempted, and the booking behaves normally in every other way.
10. **Given** bookings from both sources, **When** the owner filters or reviews them, **Then** each
    shows whether it came from the website or was entered by hand.
11. **Given** a confirmed booking, **When** the owner shifts its dates by a night, **Then** the total
    recalculates, the amount already received is unchanged, the balance updates, and the old dates
    become available.
12. **Given** a confirmed booking, **When** the owner tries to move it onto dates another booking or
    block already occupies, **Then** the change is refused and the conflict is shown.
13. **Given** a booking whose dates were changed, **When** the owner views its history, **Then** the
    previous dates, the account that changed them, and when are all visible.
13a. **Given** any booking history, **When** the owner reads it, **Then** it shows what changed and
    who changed it, and contains no guest name, email address, or phone number.
13b. **Given** a booking whose history is visible, **When** the owner looks for a way to edit or
    remove an entry, **Then** none exists.
13c. **Given** a guest whose personal details have been erased, **When** the owner inspects that
    booking's email delivery records, **Then** no recipient address remains, while the history of
    which messages were attempted and their outcomes survives.
13d. **Given** a guest who booked twice and also sent an enquiry, **When** the owner erases them by
    email address, **Then** both bookings are anonymised, both sets of delivery addresses are cleared,
    and the enquiry is deleted — from one action, not three.
13e. **Given** a booking whose checkout was more than the retention period ago, **When** the retention
    period passes with nobody acting, **Then** its personal details are removed while the reservation
    record survives.
13f. **Given** an enquiry older than its retention period, **When** that period passes, **Then** it is
    deleted without the owner doing anything.
14. **Given** a cancelled or expired booking, **When** the owner opens it, **Then** its dates and room
    cannot be changed.

---

### User Story 5 - Manage room types, units, and rates; browse accommodations (Priority: P2)

The owner creates and edits room types with descriptions, bed configuration, capacity, photographs,
and nightly rates, and records how many physical units of each type the property has. Guests browse
these as accommodation pages.

**Why this priority**: The booking flow depends on this data, but the seeded demo dataset supplies it,
so booking can be built and demonstrated first. This story replaces the seed with real management.

**Independent Test**: Create a room type with two units and a rate, see it appear in guest
accommodation listings and in availability search, edit its rate and see the change, then archive it
and see it disappear from guest-facing pages while existing bookings remain intact.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner creates a room type with name, description, bed
   configuration, capacity, and nightly rate, **Then** it appears in guest accommodation listings.
2. **Given** a room type, **When** the owner records the number of physical units, **Then**
   availability reflects that many simultaneous bookings for the same dates.
3. **Given** a room type, **When** the owner edits any field, **Then** guest-facing pages reflect the
   change without a redeployment.
4. **Given** a room type with no bookings, **When** the owner deletes it, **Then** it is removed.
5. **Given** a room type with existing bookings, **When** the owner attempts to delete it, **Then**
   deletion is refused and archiving is offered instead — archived types vanish from guest pages and
   from search while their bookings remain readable.
6. **Given** a guest on an accommodation page, **When** they view a room type, **Then** they see its
   photographs, bed configuration, capacity, nightly rate, and a way to check availability.
7. **Given** a room type, **When** the owner adds a date-range rate override with a label and rate,
   **Then** stays covering those nights are priced at that rate and stays outside them are not.
8. **Given** an existing override, **When** the owner adds another that overlaps it for the same room
   type, **Then** it is refused and the conflicting override is identified.
9. **Given** an override, **When** the owner edits or deletes it, **Then** future pricing changes and
   bookings already made at the old rate are unaffected.

---

### User Story 6 - Block dates (Priority: P2)

The owner marks dates as unavailable for maintenance, an owner's own stay, or a walk-in guest taken by
phone, so those dates stop being bookable online.

**Why this priority**: Without it the site will sell rooms the resort cannot honour. It is small, but
it is the difference between the site being trustworthy and being a liability.

**Independent Test**: Block a date range for one room unit, search those dates as a guest, confirm the
unit is unavailable, then remove the block and confirm it returns.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner blocks a date range for a room unit with a reason, **Then**
   guests cannot book that unit for those dates.
2. **Given** a block, **When** the owner edits its dates or reason, **Then** availability updates.
3. **Given** a block, **When** the owner removes it, **Then** those dates become bookable again.
4. **Given** dates already held or confirmed for a booking, **When** the owner tries to block them,
   **Then** the conflict is shown and the block is refused until the booking is dealt with.
5. **Given** the availability view, **When** the owner looks at a month, **Then** bookings and blocks
   are distinguishable at a glance.

---

### User Story 7 - Manage and browse the gallery (Priority: P3)

The owner uploads photographs, assigns each to a category, writes a short description of what it
shows, and orders them. Guests browse the gallery by category.

**Why this priority**: Photography is what a guest actually decides on, so this matters commercially —
but the booking machinery must work first.

**Independent Test**: Upload an image with a description into a category, see it in the guest gallery
under that category, reorder it, then delete it and confirm it disappears from both surfaces.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner uploads an image, **Then** they must supply a short
   description of what it shows before it can be saved.
2. **Given** an uploaded image, **When** the owner assigns a category, **Then** it appears under that
   category in the guest gallery.
3. **Given** images in a category, **When** the owner reorders them, **Then** the guest gallery shows
   the new order.
4. **Given** an image, **When** the owner deletes it, **Then** it is removed from the gallery and from
   storage.
5. **Given** a file that is not a permitted image type or exceeds the size limit, **When** upload is
   attempted, **Then** it is refused with an explanation of what is accepted.
6. **Given** a guest on the gallery page, **When** they select a category, **Then** only that
   category's images are shown, and selecting one opens a larger view.
7. **Given** a photograph attached to a room type, **When** the owner saves it, **Then** it appears on
   that room's page and in the Rooms category without a second upload.
8. **Given** such a photograph, **When** the owner reorders the Rooms category, **Then** its position
   on the room's own page is unchanged.
9. **Given** a room type with photographs, **When** the owner archives it, **Then** those photographs
   no longer appear in the guest gallery.
10. **Given** a category holding images, **When** the owner tries to delete it, **Then** the deletion
    is refused and they are directed to move or remove the images first.
11. **Given** a category with no images, **When** a guest views the gallery, **Then** that category is
    not shown at all.

---

### User Story 8 - Manage and read content pages (Priority: P3)

The owner writes and edits the amenities and activities pages. Guests read them.

**Why this priority**: Content that sells the property, but nothing depends on it.

**Independent Test**: Create a content page, publish it, view it as a guest, edit it, unpublish it and
confirm it is no longer reachable, then delete it.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner creates a content page with a title and body, **Then** it
   can be saved as a draft without being visible to guests.
2. **Given** a draft page, **When** the owner publishes it, **Then** guests can reach it.
3. **Given** a published page, **When** the owner edits and saves it, **Then** guests see the change.
4. **Given** a published page, **When** the owner unpublishes it, **Then** guests can no longer reach
   it and see a not-found response.
5. **Given** a content page, **When** the owner deletes it, **Then** it is removed.
6. **Given** a save that fails, **When** the owner is told, **Then** their unsaved text is still in
   the form.
7. **Given** the editor, **When** the owner uses the toolbar, **Then** they can apply headings, bold,
   italic, lists, and links without typing any markup by hand.
8. **Given** a body containing raw HTML, **When** the owner saves, **Then** the save is refused with a
   plain explanation of what was rejected, and no markup is ever rendered to a guest.
9. **Given** a newly created page, **When** the owner publishes it, **Then** it appears in the site's
   navigation without any further action.
10. **Given** several published pages, **When** the owner changes a page's menu position, **Then** the
    navigation order changes accordingly on the guest site.
11. **Given** enough published pages to crowd the menu, **When** the owner publishes another, **Then**
    they are warned that the navigation is becoming unusable and the page publishes anyway.

---

### User Story 9 - Home page (Priority: P3)

A guest arriving from a shared link sees a hero image of the property, the availability search, and
enough of the property's character to decide whether to look further.

**Why this priority**: The entry point matters commercially, but every capability it links to must
exist first for it to be worth building.

**Independent Test**: Load the home page on a mobile viewport, confirm the hero, the availability
search, and navigation to accommodations, gallery, and location all work.

**Acceptance Scenarios**:

1. **Given** a guest on a phone, **When** the home page loads, **Then** the hero and the availability
   search are usable without scrolling past the fold.
2. **Given** the home page, **When** the guest submits the availability search, **Then** they reach
   the results of US1.
3. **Given** the home page, **When** it is shared into a messaging app, **Then** the preview shows the
   property's name, a description, and an image.
4. **Given** the home page, **When** the guest navigates, **Then** accommodations, gallery, location,
   contact, the policies, and every published content page are all reachable.
5. **Given** the admin, **When** the owner disables a section and reorders the rest, **Then** the home
   page reflects both changes without a redeployment.
6. **Given** a section whose content the owner has not filled in, **When** a guest loads the page,
   **Then** that section hides itself rather than leaving a visible gap.
7. **Given** the section settings, **When** the owner looks for a way to disable the availability
   search, **Then** none exists.
8. **Given** the hero settings, **When** the owner chooses a still image, a video, or the layered
   depth effect, **Then** the home page uses that treatment.

---

### User Story 10 - Location, contact, and enquiries (Priority: P3)

Guests find the property's address, see where it is, read how to get there, and send an enquiry. The
owner reads and manages those enquiries.

**Why this priority**: Enquiries are the fallback for anything booking cannot answer, and location is
a common pre-booking question. Neither blocks anything else.

**Independent Test**: View the location page, send an enquiry, see it arrive in the admin, mark it
handled, and delete it.

**Acceptance Scenarios**:

1. **Given** the location page, **When** a guest views it, **Then** the address, a map showing the
   property, transport directions, phone, and email are all present.
2. **Given** the enquiry form, **When** a guest submits name, email, and a message, **Then** it is
   recorded and the guest is told it was sent.
3. **Given** repeated submissions beyond the permitted rate, **When** another is attempted, **Then**
   it is refused with a wait time and the resort's phone number.
4. **Given** enquiries exist, **When** the owner opens the admin, **Then** unhandled ones are listed
   with their message and contact details.
5. **Given** an enquiry, **When** the owner marks it handled or adds a note, **Then** the change is
   saved.
6. **Given** an enquiry, **When** the owner deletes it, **Then** it is removed.

---

### User Story 11 - Policy pages (Priority: P3)

Privacy policy, terms of service, and cancellation policy ship with sensible default text that the
owner edits rather than writes from scratch. Guests can read all three.

**Why this priority**: Legally required before launch, but the text can be edited at any point up to
that moment.

**Independent Test**: View each of the three policies as a guest, confirm the shipped default text is
present and coherent, edit one in the admin, and see the change.

**Acceptance Scenarios**:

1. **Given** a fresh deployment, **When** a guest views each policy, **Then** each contains coherent
   default text rather than a blank page or placeholder.
2. **Given** a policy, **When** the owner edits it, **Then** guests see the change.
3. **Given** the cancellation policy, **When** a guest reads it, **Then** it states plainly that no
   refund is issued through the site and that any refund is arranged directly with the resort.
4. **Given** the policies, **When** the owner looks for a delete action, **Then** none exists — the
   three policies are always present and always editable.
5. **Given** any page of the site, **When** a guest looks at the footer, **Then** all three policies
   are reachable.

---

### User Story 12 - Site branding and settings (Priority: P3)

The owner sets the property's primary and secondary colours, uploads a logo, and adjusts the settings
that govern how the site behaves — timezone, hold duration, minimum booking notice, retention
periods, session timeout, and how much availability is disclosed. The site reflects all of it without
a developer.

**Why this priority**: It is what makes the codebase reusable across clients without code changes, but
every deployment ships with working seeded branding and sensible seeded settings, so nothing is
blocked by its absence.

**Settings were added to this story during `/speckit-analyze`.** Seven requirements state that a value
"MUST be a setting the owner can change" — and while the columns and defaults existed, no story owned
the surface that changes them. Folding them in here rather than leaving them ownerless is what makes
those requirements buildable.

**Added in Phase 0.5 — not on the brief's §8 list.** See Scope Traceability.

**Independent Test**: Change the primary colour, see buttons, links, and accents update across the
guest site. Upload a logo and see it replace the wordmark. Remove it and see the wordmark return.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner picks a primary colour, **Then** the site's buttons, links,
   and accents use it, and the supporting shades are produced automatically.
2. **Given** a colour too pale to carry readable text, **When** the owner tries to save it, **Then**
   it is refused with an explanation in plain language and a preview of the problem.
3. **Given** no logo, **When** a guest views the site, **Then** the property's name is displayed as a
   wordmark and nothing looks broken or missing.
4. **Given** a logo image of a permitted type, **When** the owner uploads it, **Then** it replaces the
   wordmark across the site.
5. **Given** a file type that cannot be accepted, **When** upload is attempted, **Then** it is refused
   with guidance a non-technical owner can act on.
6. **Given** custom branding, **When** the owner resets it, **Then** the deployment's original
   branding returns.
7. **Given** the settings screen, **When** the owner changes the hold duration, the minimum booking
   notice, or the scarcity threshold, **Then** the guest-facing behaviour changes accordingly without
   a redeployment.
8. **Given** a timezone change, **When** the owner saves it, **Then** they are warned that it alters
   how every stored date is interpreted, and no existing booking's dates are shifted.
9. **Given** a retention period change, **When** the owner saves it, **Then** the published privacy
   policy reflects the new period.

---

### Edge Cases

- Two guests hold the same room for overlapping dates within milliseconds of each other.
- A guest submits an invented reference number to hold a room indefinitely.
- A hold expires while the guest is on the payment screen.
- A guest books a stay that begins before a rate override and ends inside it.
- The owner edits a rate override that current holds were priced against.
- The owner moves a confirmed booking onto dates covered by a different rate.
- The owner moves a booking to dates that a block occupies.
- The owner shortens a stay after more than the new total has already been received.
- The owner sets an override whose range is a single night, or one that starts in the past.
- A guest wants three rooms for the same dates.
- The owner blocks dates that already have a confirmed booking.
- The owner archives a room type that has future confirmed bookings.
- A guest searches dates more than a year ahead, or a stay longer than the permitted maximum.
- The owner records an amount received that is larger than the stay total.
- A guest asks to be forgotten for a booking that has not yet happened.
- A guest asks to be forgotten for a booking whose confirmation email bounced to a mistyped address.
- The owner resends a confirmation three times before it succeeds.
- A guest's email address bounces, so they never receive their confirmation.
- The owner uploads a very large photograph over a slow connection.
- A guest opens the site with no images loaded because the connection dropped mid-page.
- The property has no photographs at all on the day of launch.
- Two admin sessions edit the same booking at the same time.

---

## Requirements *(mandatory)*

**Identifier convention.** `FR-nnn` is a requirement from the original specification. A letter suffix
— `FR-021a`, `FR-021f` — is a requirement added by a later clarification or review, inserted beside
the requirement it refines rather than appended at the end. Suffixes are allocated in order and are
never reused; a gap in the letters means a requirement was withdrawn, which is recorded in
[checklists/requirements.md](checklists/requirements.md). Identifiers are permanent once written.

**Upstream documents this specification depends on.** These carry binding requirements that are *not*
restated here. A change to any of them may invalidate requirements below:

| Document | What it governs for this feature |
|---|---|
| [constitution.md](../../.specify/memory/constitution.md) | Non-negotiable principles III and VIII; the definition of done |
| [security-baseline.md](../../.specify/memory/security-baseline.md) | Access rule patterns, secrets, validation, rate-limit thresholds (FR-014a) |
| [design-system.md](../../.specify/memory/design-system.md) | Theme tokens, component inventory, state copy, motion values, accessibility detail behind FR-068 |
| [product-brief.md](../../.specify/memory/product-brief.md) | Settled decisions that must not be relitigated |

### Functional Requirements

**Availability and booking (US1, US2, US3)**

- **FR-001**: System MUST let a guest search availability by check-in date, check-out date, and number
  of guests.
- **FR-002**: System MUST show only room types that are free for the entire requested range and can
  accommodate the requested party size.
- **FR-003**: System MUST price a stay night by night — each night at the rate override covering it,
  or the room type's base nightly rate where none does — and MUST display the resulting total before
  the guest commits.
- **FR-003a**: System MUST show the guest a per-night breakdown whenever a stay spans more than one
  rate, so a total that differs from nights × the advertised rate is explained rather than surprising.
- **FR-003b**: Money MUST be held and displayed to two decimal places in Philippine Pesos, with each
  night's rate rounded before summing, so the displayed breakdown always adds up to the displayed
  total. A total the guest cannot reconcile by hand is a support message.
- **FR-002b**: When a search returns nothing, the system MUST distinguish between "no room is free for
  those dates" and "no room accommodates that many guests", because the two have different remedies —
  shift the dates, or split the party.
- **FR-002c**: The system MUST disclose how many rooms of a type remain **only when that number is at
  or below a threshold the owner sets, defaulting to 2** (C14). Above the threshold it MUST show only
  that the type is available. A threshold of zero MUST disable the disclosure entirely.
- **FR-002d**: A disclosed count MUST be the true number available at the moment of the request. It
  MUST NOT be cached, rounded, or shown when untrue — a scarcity signal is acceptable here only
  because it is a fact about the inventory.
- **FR-002e**: FR-002c MUST apply wherever availability is presented, not only in search results, so a
  guest is never told "only 1 left" on one surface and shown nothing on another.
- **FR-002a**: System MUST NOT disclose booking records or availability block records to guests.
  Availability MUST be exposed to guests only as availability — which room types are free for which
  dates — never as the underlying reservations, guest details, or block reasons that make a date
  unavailable. A guest MUST NOT be able to tell whether a date is taken by a booking or by a block.
- **FR-004**: System MUST prevent two reservations of the same physical room unit across overlapping
  dates, under simultaneous requests. This MUST hold across **all three** ways a booking is written —
  a guest's hold, an owner-created booking, and an owner changing an existing booking's dates or room
  (SC-001).
- **FR-005**: System MUST hold a room for a bounded period once a guest submits their details, and
  MUST show the guest the time remaining.
- **FR-005a**: Every booking MUST carry a reference that is unique across the deployment and not
  guessable from another — no sequential or predictable pattern. The reference plus an email address
  is what grants a guest access to their own booking (FR-013), so a guessable reference makes every
  other guest's stay dates enumerable.
- **FR-005b**: The hold period and the awaiting-verification period MUST both be settings the owner
  can change, defaulting to 30 minutes and 48 hours respectively.
- **FR-006**: System MUST release expired holds automatically, without any person acting.
- **FR-007**: System MUST release bookings awaiting verification automatically after an extended
  period, without any person acting.
- **FR-008**: System MUST record guest name, email, phone, party size, stay dates, and any special
  requests against a booking.
- **FR-009**: System MUST display the resort's payment QR code and editable amount guidance at the
  payment step.
- **FR-009a**: The payment QR MUST be reachable only from the payment step of a booking that is
  currently held or awaiting verification (C8). It MUST NOT appear on any public page and MUST NOT be
  retrievable by anyone who is not completing a booking, so that it cannot be lifted for a page
  impersonating the resort.
- **FR-009b**: When a hold expires while the guest is on the payment step, the system MUST tell them
  the hold has ended, withdraw the payment QR, and offer to search again for the same dates. It MUST
  NOT leave a payment instruction visible for a reservation that no longer exists.
- **FR-010**: System MUST state at the payment step that a booking is not confirmed until the resort
  verifies payment.
- **FR-011**: System MUST accept a payment reference number from the guest and record it against the
  booking.
- **FR-012**: System MUST NOT compute, require, or validate any particular payment amount.
- **FR-013**: System MUST let a guest retrieve their own booking's status using their reference number
  together with the email address on the booking, and MUST reveal nothing without both.
- **FR-013a**: A guest lookup MUST return **only**: booking reference, status, check-in and check-out
  dates, room type name, stay total, amount received, and balance. It MUST NOT return the guest's own
  phone number, special requests, owner notes, state history, or the room unit assigned. The list is
  stated positively so that a field added later is excluded by default rather than included by
  oversight.
- **FR-013b**: A lookup that fails MUST be indistinguishable between "no such reference" and "that
  email does not match", in both wording and response time, so the form cannot be used to discover
  which references exist.
- **FR-014**: System MUST limit repeated booking lookups, enquiries, hold attempts, sign-in attempts,
  email resends (FR-018g), and **availability searches**, and MUST tell the person how long to wait
  and how else to get help.
- **FR-014b**: The limit on availability searches MUST be generous enough that a guest comparing
  several date ranges is never impeded, and tight enough that the property's occupancy cannot be
  mapped by automated polling. This became material when FR-002c made a count disclosable; before
  that, searching only revealed what a booking attempt would reveal anyway.
- **FR-014a**: The specific limit and window for each of those actions MUST be recorded where they can
  be tested against, and MUST be changeable without a code release.
- **FR-015**: A booking MUST be in exactly one of these states: **held, awaiting verification,
  confirmed, cancelled, expired**. The system MUST NOT permit any transition other than those in the
  state model, and every transition MUST be recorded (FR-022f).
- **FR-015a**: "Available" is **not** a booking state — it describes a room unit with no live booking
  or block covering the dates in question. A room unit's availability is derived, never stored as a
  booking status.
- **FR-016**: System MUST let the owner record the amount actually received and MUST display any
  remaining balance as the difference from the stay total.
- **FR-016a**: System MUST accept an amount received that is greater than the stay total, displaying
  the balance as an overpayment rather than refusing the entry. Constitution II makes the amount the
  owner's judgment; refusing their number would be the system enforcing one.
- **FR-016b**: System MUST let the owner confirm a booking while a balance remains outstanding. A
  deposit that reserves a room is the normal case, not an exception.
- **FR-017**: System MUST let the owner confirm or reject a booking awaiting verification.
- **FR-018**: System MUST email the guest when their reference is submitted and again when the booking
  is confirmed.
- **FR-018a**: System MUST record, against each booking, whether each email was delivered, and MUST
  treat a rejected or bounced address as a failure (C5).
- **FR-018b**: System MUST show the owner which bookings have an undelivered email, and MUST let them
  filter the booking list to those, so the guest can be reached another way.
- **FR-018c**: System MUST let the owner resend either email for a booking after correcting the
  guest's email address.
- **FR-018d**: System MUST NOT block or reverse a booking state change because an email failed — the
  booking is confirmed by the owner's verification, not by the guest receiving a message.
- **FR-018e**: System MUST create an email delivery record for every send attempt, holding the
  booking, which message was sent, the address used, and the outcome once known. A resend MUST create
  a new record rather than overwrite the failed one, so the owner can see what was already tried.
- **FR-018f**: Email delivery records MUST NOT be creatable, editable, or deletable by the owner. The
  owner reads them and triggers a resend; the system writes them.
- **FR-018g**: System MUST limit how often an email can be resent for a booking, and MUST tell the
  owner how long to wait when the limit is reached. An unbounded resend is a way to flood a guest's
  inbox and to damage the resort's own ability to deliver mail at all.
- **FR-019**: System MUST ensure a repeated booking submission from the same guest attempt produces
  only one hold.
- **FR-019a**: System MUST tell a guest, at the point of choosing a room, that each booking covers one
  room and how to reserve more than one — so a group is directed rather than left to guess or to
  message the resort.
- **FR-020**: System MUST refuse a stay whose check-out is on or before check-in, whose check-in is in
  the past, or which exceeds the maximum permitted length.
- **FR-020a**: All dates, "today", and every expiry MUST be evaluated in the property's own timezone,
  which is a setting. A guest booking at 11pm from another country must get the same answer about
  what "today" means as the owner standing at the property.
- **FR-020b**: System MUST enforce a **minimum booking notice** the owner sets, defaulting to
  same-day booking permitted until **6pm property time** (C13). An owner who can receive late arrivals
  MUST be able to set it to none; one who needs preparation time MUST be able to require a day or more.
- **FR-020c**: The minimum notice MUST be evaluated **when the hold is created and at no later point**.
  A guest whose hold began before the cutoff MUST be able to complete payment and submit their
  reference after it. Re-checking at submission would take a guest's payment and then refuse the room.
- **FR-020d**: When a search falls inside the notice window, the system MUST say so and offer the
  earliest date that is bookable, rather than reporting the property as full.

**Booking management (US4)**

- **FR-021**: System MUST let the owner list bookings and filter by state and date range.
- **FR-021a**: System MUST let the owner create a booking directly, entering the guest's details, the
  room unit, the dates, and the party size (C4).
- **FR-021b**: System MUST apply the same overlap prevention to an owner-created booking as to a
  guest-created one — an owner MUST NOT be able to double-book a room unit by hand.
- **FR-021c**: System MUST let the owner confirm a booking they created immediately, recording an
  amount received, without a hold, a payment QR code, or a reference number.
- **FR-021d**: System MUST record how every booking originated — submitted by a guest online, or
  entered by the owner — so the resort can tell which bookings the site actually won.
- **FR-021f**: A booking's origin MUST be determined from who made the request, never from a value
  supplied with it. A guest MUST NOT be able to cause their own booking to be recorded as
  owner-entered, or the measure of what the site won becomes guest-editable.
- **FR-021e**: System MUST treat the guest's email address as optional on an owner-created booking.
  Where it is absent, no email is sent and the guest cannot use the online lookup; where it is
  present, both behave as they would for a guest-created booking.
- **FR-022**: System MUST show the owner the full detail of any booking, including state history.
- **FR-022a**: System MUST let the owner change the dates and the room unit of any booking that is not
  cancelled or expired (C6).
- **FR-022b**: System MUST apply the same overlap prevention to a booking change as to a new booking,
  and MUST refuse a change that would collide with another booking or a block, showing the conflict.
- **FR-022c**: System MUST recalculate the stay total when a booking's dates change, using the rates
  in force at the moment of the change, and MUST carry the amount already received across unchanged
  so that only the balance moves.
- **FR-022d**: System MUST NOT recalculate a booking's stay total when a rate or override is edited
  (FR-029d). Only a change to the stay itself re-prices it.
- **FR-022e**: System MUST record every change to a booking's dates or room in its history, with the
  acting account and the previous values.
- **FR-022f**: System MUST create a booking event automatically for every state change and every
  change to a booking's dates or room. Booking events MUST NOT be creatable, editable, or deletable
  by any person, including the owner.
- **FR-022g**: Booking events MUST NOT contain any personal information about the guest — no name,
  email address, phone number, or special requests. They record what changed, who acted, and when.
- **FR-022h**: A booking event MUST be able to record **the system** as the actor, not only an
  account, because automatic expiry changes state with nobody acting. An event with no actor at all
  would leave the audit trail unable to explain its own entries.
- **FR-022i**: When a stay is shortened below the amount already received, the system MUST show the
  resulting overpayment on the booking and MUST state that any refund is arranged outside the system.
  It MUST NOT refuse the change or silently adjust the recorded amount.
- **FR-023a**: System MUST let the owner correct a guest's name, email address, and phone number on a
  booking. FR-018c depends on this being possible; without it a bounced email can never be resent.
- **FR-023**: System MUST let the owner record private notes on a booking that are never shown to the
  guest.
- **FR-024**: System MUST let the owner cancel any booking and MUST return its dates to availability.
- **FR-025**: System MUST state, wherever a cancellation occurs, that any refund is arranged outside
  the system.
- **FR-026**: System MUST NOT provide any way to permanently delete a booking record.
**Personal data lifecycle — erasure, export, retention**

> **This block is written as a register plus rules, not as a list of places to remember.** Three
> separate reviews of this specification each found erasure and export missing a different store —
> email deliveries, then enquiries. The defect was never the individual omission; it was that the
> reach of erasure was restated at each site instead of defined once. FR-026a is the register. Every
> rule below binds to the register rather than to a list of entity names.

- **FR-026a**: The system MUST maintain a **register of personal data stores** — every place a guest's
  personal information is held. It currently contains exactly three entries:
  **bookings** (name, email, phone, special requests), **email deliveries** (recipient address), and
  **enquiries** (name, email, message). **Any entity added later that holds personal information about
  a guest MUST be added to this register in the same change that introduces it.**
- **FR-026b**: Erasure, export, and retention MUST each operate over **every** entry in the register.
  A rule that names individual stores instead of the register is defective by construction, because
  the next store added will not be covered.

- **FR-027**: System MUST let the owner erase a guest's personal information on request. Erasure is
  keyed on the guest's **email address**, which is the only identifier common to every store in the
  register — a guest who booked twice and enquired once must be erased by one action, not three.
- **FR-027a**: Erasure MUST apply to every entry in the register (FR-026a), and MUST use the
  disposition appropriate to each: **bookings** are anonymised in place so the reservation record
  survives for inventory and accounting; **email delivery** recipient addresses are cleared while the
  message kind and outcome remain; **enquiries** are deleted outright, having no business record to
  preserve.
- **FR-027b**: Erasure MUST be performed by the owner and by nobody else, and the owner MUST confirm
  they have verified the requester's identity before it proceeds — the same standard FR-028a sets for
  export, for the same reason: the system cannot prove who is asking. The erasure MUST be recorded:
  which email address, which stores were affected, when, and that identity was attested.
- **FR-027c**: After erasure, the system MUST NOT retain the erased name, email address, or phone
  number in any store in the register. This is the testable form of FR-026b, and SC-014 verifies it by
  searching every store rather than the booking alone.
- **FR-028**: System MUST let **the owner, and only the owner**, export the personal data held about
  an identified guest, in a commonly used format the guest can take elsewhere.
- **FR-028a**: The owner MUST confirm they have verified the requester's identity before an export is
  produced, and the system MUST record that the export happened, for whom, and when. Identity is
  verified by the owner outside the system — the site has no way to prove who is asking.
- **FR-028b**: An export MUST cover **every entry in the register** (FR-026a) — the same reach as
  erasure. An export that misses a store misreports what the resort holds, which is the failure mode
  that looks like compliance.
- **FR-028c**: Export MUST be keyed on the guest's email address, matching erasure (FR-027), so that
  what a guest is shown and what can then be erased are the same set of records.

**Retention** — the other half of RA 10173's obligation, which an erasure path alone does not satisfy
because it waits to be asked.

- **FR-028d**: The system MUST remove personal information from every store in the register once it is
  no longer needed, **without anyone acting**: bookings anonymised **24 months after checkout**,
  enquiries deleted **12 months after receipt**, email delivery addresses cleared with their booking.
- **FR-028e**: Both periods MUST be settings the owner can change, and the values in force MUST be
  stated in the privacy policy (FR-061), because a published retention period the system does not
  honour is worse than none.
- **FR-028f**: Retention MUST use the same dispositions as erasure (FR-027a) so that a record removed
  by the passage of time is indistinguishable from one removed on request.

**Rooms and rates (US5)**

- **FR-029**: System MUST let the owner create, view, edit, and delete room types with name,
  description, bed configuration, capacity, and a base nightly rate.
- **FR-029a**: System MUST let the owner create, view, edit, and delete date-range rate overrides
  against a room type, each carrying a start date, an end date, a nightly rate, and a label.
- **FR-029b**: System MUST refuse a rate override that overlaps an existing override for the same
  room type, **under simultaneous requests**, and MUST show which one it conflicts with. Two
  overrides that would overlap MUST NOT both be accepted, however close together they are submitted.
- **FR-029c**: System MUST NOT apply any rate automatically by rule, season, percentage, or promotion
  code. Every rate is a value the owner entered against explicit dates.
- **FR-029d**: System MUST leave bookings already made at a previous rate unchanged when a rate or
  override is edited.
- **FR-030**: System MUST let the owner record how many physical units exist of each room type, and
  MUST allow that many concurrent bookings for the same dates.
- **FR-031**: System MUST refuse deletion of a room type or unit that has bookings, and MUST offer
  archiving instead.
- **FR-032**: System MUST hide archived room types from guest-facing pages and from availability
  search while keeping their bookings readable.
- **FR-033**: System MUST let guests browse room types with photographs, bed configuration, capacity,
  and nightly rate.
- **FR-033a**: System MUST let the owner set the order in which room types appear to guests, and MUST
  present them in that order everywhere. Alphabetical or creation order puts whichever room the owner
  most wants to sell wherever chance places it.
- **FR-033b**: The room detail page MUST be assembled from a fixed catalogue of sections on the same
  terms as the home page (FR-050a, C10) — the owner enables, disables, and orders them, and every
  section obeys FR-050d and FR-050e. The section that lets a guest check availability for that room
  MUST NOT be disableable, for the same reason as FR-050c.
- **FR-034**: System MUST reflect owner edits on guest-facing pages without a redeployment.

**Availability blocks (US6)**

- **FR-035**: System MUST let the owner create, view, edit, and delete date-range blocks against a
  room unit, with a reason.
- **FR-036**: System MUST exclude blocked dates from guest availability.
- **FR-037**: System MUST refuse a block that overlaps an existing held or confirmed booking, **under
  simultaneous requests**, and MUST show the conflict. A block and a booking MUST NOT both be
  accepted for the same room unit and dates, however close together they are submitted.
- **FR-037a**: FR-037 applies equally to **changing an existing block's dates or room unit**, not only
  to creating one. Moving a block onto occupied dates is the same collision as creating one there, and
  a rule written only for creation leaves the more common action unguarded.
- **FR-038**: System MUST present bookings and blocks distinguishably in a month view.

**Gallery (US7)**

- **FR-039**: System MUST let the owner create, view, edit, and delete gallery images.
- **FR-040**: System MUST require a short description of what each image shows before it can be saved.
- **FR-041**: System MUST let the owner assign each image to a category and order images within it.
- **FR-041a**: System MUST ship five gallery categories — Rooms, Pool, Beach, Dining, Grounds — and
  MUST let the owner add, rename, reorder, and delete categories, including the shipped ones (C11).
- **FR-041b**: A photograph attached to a room type MUST appear both on that room's page and in the
  Rooms category, from a single upload. The owner MUST NOT have to upload the same image twice to
  have it in both places.
- **FR-041c**: An image that appears on more than one surface MUST carry a separate position for
  each, so its order on a room's page and its order in the gallery are set independently.
- **FR-041d**: Archiving a room type MUST also withdraw its photographs from the gallery, so a guest
  browsing Rooms never finds a room they cannot book.
- **FR-041e**: Deleting a category that still holds images MUST be refused, with the owner directed to
  move or delete those images first. A category deletion MUST NOT destroy photographs as a side
  effect.
- **FR-041f**: A category with no images MUST hide itself from the guest gallery rather than render as
  an empty heading.
- **FR-042**: System MUST accept only permitted image types within a stated size limit, and MUST
  explain what is accepted when refusing.
- **FR-043**: System MUST let guests browse the gallery by category and open a larger view of any
  image.
- **FR-044**: System MUST remove a deleted image from storage as well as from the gallery.
- **FR-044a**: System MUST tell the owner when a category has too few photographs to sell the property
  and MUST NOT block them from publishing anyway. Guidance, not a gate — an owner who cannot publish
  until they have six beach photos will publish nothing.

**Content pages (US8)**

- **FR-045**: System MUST let the owner create, view, edit, and delete content pages with a title and
  a body written in Markdown, offering at minimum headings, bold, italic, lists, and links through a
  toolbar so the owner never has to learn the syntax (C7).
- **FR-045a**: System MUST reject raw HTML in a content page body when the page is saved, telling the
  owner plainly what was refused. Rejected at the source, not cleaned up afterwards, and MUST NOT be
  rendered as markup under any circumstance.
- **FR-045b**: System MUST apply FR-045 and FR-045a to every content page, including the three policy
  pages.
- **FR-046**: System MUST let the owner save a page as a draft that guests cannot reach.
- **FR-047**: System MUST let the owner publish and unpublish a page.
- **FR-047a**: Unpublishing a page MUST also remove it from every navigation surface. A menu entry
  leading to a not-found response is worse than no entry, and the owner will not think to check.
- **FR-048**: System MUST preserve unsaved text in the editor when a save fails.
- **FR-049**: System MUST ship the amenities and activities pages as content pages with seeded
  content, present and published from first deployment.
- **FR-049a**: Content pages MUST carry a kind that determines whether they can be deleted. **Only the
  three policy pages are undeletable** (FR-059), because they are legally required. **Amenities and
  activities are ordinary content pages and the owner may delete them**, along with any page they
  create themselves.

  This resolves the conflict between FR-045 (all content pages are deletable) and FR-049 (amenities
  and activities ship with the product). Shipping them satisfies the scope requirement — the
  capability is built and the content is seeded. Whether a particular resort keeps a separate
  amenities page afterwards is a content decision, and a small property that folds amenities into its
  home page is making a reasonable one. **Undeletable means legally required, and nothing else.**
- **FR-049b**: Deleting a content page MUST remove it from every navigation surface, on the same terms
  as unpublishing (FR-047a).

**Home and navigation (US9)**

- **FR-050**: System MUST present a home page with a hero and the availability search.
- **FR-050a**: The home page MUST be assembled from a **fixed catalogue of sections** defined by the
  template (C10). The owner MUST be able to enable, disable, and reorder them. The owner MUST NOT be
  able to create new section types, add arbitrary blocks, or alter a section's internal layout.
- **FR-050b**: The hero MUST offer the owner a choice of treatment — a still image, a video, or a
  layered depth effect — selected as a setting rather than by editing code.
- **FR-050c**: The availability search MUST NOT be disableable. Every other section may be switched
  off; this one is what the site exists to do.
- **FR-050d**: Every section MUST have a defined appearance when the content it draws on is absent,
  so that enabling a section before filling it never produces a broken or empty-looking page. A
  section with nothing to show MUST hide itself rather than render a gap.
- **FR-050e**: Disabling or emptying a section MUST NOT leave a link elsewhere on the site pointing at
  something a guest cannot reach.
- **FR-051**: System MUST make the site's structural destinations — home, accommodations, gallery,
  location and contact, and all three policies — reachable from every page. These are fixed and are
  not content pages.
- **FR-051a**: Every **published** content page MUST appear in navigation automatically, without the
  owner doing anything beyond publishing it (C9). Unpublishing or deleting removes the entry
  (FR-047a, FR-049b). Amenities and activities reach the menu this way like any other content page,
  which is why they are not listed in FR-051.
- **FR-051b**: The owner MUST be able to set a page's position in the menu, and its menu label if it
  should differ from the page title, **on the page itself**. There is no separate menu-management
  screen to find, learn, or keep in step with the pages.
- **FR-051c**: The system MUST warn the owner when the number of published content pages would make
  the menu unusable, and MUST NOT prevent them from publishing anyway. Automatic navigation grows
  without limit by design; the owner should be told before it degrades, not stopped.
- **FR-052**: System MUST provide a preview image, title, and description when a page is shared into a
  messaging or social application.

**Location, contact, enquiries (US10)**

- **FR-053**: System MUST display the property's address, a map showing its position, transport
  directions, phone number, and email address.
- **FR-053a**: The map MUST be a static image with a link that opens the location in the guest's own
  maps application. An embedded third-party map would disclose every visitor's address to that
  provider, which FR-061 would then have to declare in the privacy policy.
- **FR-053b**: Transport directions MUST be owner-authored **Markdown**, subject to the same
  restriction as content pages — no raw HTML (FR-045a) — and rendered the same way. They are a
  **property setting rather than a separate page**, since they belong beside the address on the
  location page. Structured fields are not acceptable: getting to a Philippine resort involves
  ferries, tricycles, and named landmarks that no fixed schema anticipates, and the directions want
  headings and lists that a plain text field cannot carry.
- **FR-054**: System MUST read the property's position from stored configuration rather than a fixed
  value in the site.
- **FR-055**: System MUST let a guest send an enquiry with their name, email, and message.
- **FR-056**: System MUST let the owner list, view, edit, mark handled, and delete enquiries.

**Policies (US11)**

- **FR-057**: System MUST ship privacy policy, terms of service, and cancellation policy with coherent
  default text.
- **FR-058**: System MUST let the owner edit all three policies.
- **FR-059**: System MUST NOT permit deletion of the three policies.
- **FR-060**: System MUST state in the cancellation policy that no refund is issued through the site.
- **FR-061**: System MUST describe, in the privacy policy, what personal data is collected, why, how
  long it is kept, where it is stored, and how a guest exercises their rights over it.

**Branding (US12)**

- **FR-062**: System MUST let the owner set a primary and a secondary brand colour, and MUST produce
  the supporting shades automatically.
- **FR-063**: System MUST refuse a brand colour that cannot carry readable text, with an explanation a
  non-technical owner can act on.
- **FR-064**: System MUST let the owner upload a logo and a social share image, and MUST accept only
  permitted image types.
- **FR-065**: System MUST display the property's name as a wordmark when no logo has been uploaded.
- **FR-066**: System MUST let the owner reset branding to the deployment's original values.

**Cross-cutting**

- **FR-067**: System MUST present a loading, empty, error, and success state on every surface that
  reads or writes data.

**Owner-facing usability — the operational form of SC-007**

- **FR-067a**: Every action that destroys or cancels something MUST require a distinct confirmation
  that names what is about to happen in plain words, and MUST NOT be reachable by a single tap.
- **FR-067b**: Owner-facing surfaces MUST NOT display raw identifiers, database vocabulary, technical
  error text, or stack traces. An error the owner cannot act on is an error they will ignore, and then
  ignore the next one too.
- **FR-067c**: Every booking state MUST be presented with wording that says what it means for the
  owner, not only its name. "Awaiting verification" MUST read as something the owner is being asked to
  do.
- **FR-067d**: Every field whose correct value is not self-evident — deposit guidance, payment QR,
  image descriptions, brand colours — MUST carry inline guidance explaining what to enter and why it
  matters.
- **FR-067e**: The system MUST make it possible to reverse a wrongly cancelled booking without the
  guest re-booking, provided the dates are still free.

**Accessibility**

- **FR-068**: System MUST meet **WCAG 2.2 Level AA** and MUST be fully operable by keyboard alone.
- **FR-068a**: Every animation MUST have a reduced-motion alternative, and where smooth scrolling is
  active it MUST be disabled entirely under a reduced-motion preference rather than shortened.
- **FR-068b**: Every image MUST carry a description of what it shows — gallery images (FR-040), room
  type photographs, hero imagery, and the logo. Decorative images MUST be explicitly marked as
  decorative rather than left undescribed.
- **FR-068c**: The date range picker MUST be fully operable by keyboard, including moving by day and
  by month, selecting, and dismissing. It is the sole entry point to the booking flow; a guest who
  cannot use it cannot book at all.
- **FR-068d**: Every page MUST remain usable and comprehensible when images fail to load, with layout
  space reserved so content does not shift when they arrive.
- **FR-068e**: Every page MUST declare its language.
- **FR-069**: System MUST require the owner to authenticate before any management action, and MUST NOT
  offer self-service registration.
- **FR-069a**: System MUST operate with exactly one owner account per deployment, provisioned as a
  deployment step. There is no user-management screen, no invitation flow, and no second permission
  level — every authenticated action is available to that one account (C3).
- **FR-069g**: The system MUST NOT provide any way to disable or lock out the sole owner account from
  within the application. With one account per deployment, disabling it would lock the property out of
  its own admin with no route back. Recovering a compromised account is a password reset (FR-069h), not
  a disablement.
- **FR-069h**: The owner MUST be able to reset their own password by email without anyone else's
  involvement, since there is no second account to help them.
- **FR-069b**: System MUST record which account performed each state change on a booking, so the
  audit trail survives a later move to multiple accounts.
- **FR-069c**: When an unauthenticated visitor reaches an owner-only surface, the system MUST send
  them to sign in and return them to what they were attempting afterwards. It MUST NOT reveal whether
  the thing they tried to reach exists.
- **FR-069d**: The system MUST end an owner's session after a period of inactivity, defaulting to
  **30 minutes** and changeable as a setting. A resort's computer sits on a shared front desk; an
  admin left signed in is an admin anyone passing can use.
- **FR-069e**: The system MUST warn the owner before an idle session ends and MUST let them stay
  signed in, so a timeout never silently discards work in progress.
- **FR-069f**: When a session ends mid-task, the system MUST return the owner to what they were doing
  after they sign in again, and MUST NOT lose unsaved text they had entered.

**Demo dataset and deployment (Foundational)**

- **FR-070**: System MUST include a complete demo dataset for a plausible fictional property with a
  coherent identity.
- **FR-071**: Demo dataset MUST include four to six room types with genuinely different rates and
  capacities.
- **FR-072**: Demo dataset MUST include realistic availability, including dates already booked, and at
  least one rate that differs by season.
- **FR-073**: Demo dataset MUST include at least one booking in every state named in FR-015.
- **FR-074**: Demo dataset MUST include a payment QR placeholder that is visibly non-functional and
  belongs to no real person.
- **FR-075**: System MUST seed the demo dataset with a single repeatable command that succeeds against
  an empty database, with a matching command to remove it.
- **FR-076**: System MUST keep demo imagery separately identifiable so that a deployment check can
  confirm none of it remains on a real property's site.

### Key Entities

- **Booking**: A reservation of **exactly one** room unit for a date range (C2). Holds guest name,
  email *(optional when entered by the owner — C4)*, phone, party size, dates, special requests,
  state, **origin** (submitted online or entered by the owner), payment reference, stay total, amount
  received, private owner notes, the acting account per state change, **the delivery outcome of each
  email sent to the guest** (C5), and timestamps for each state change. A group booking several rooms
  produces several independent bookings.
- **Room type**: A category of accommodation — name, description, bed configuration, capacity, **base
  nightly rate**, photographs, publication and archival status.
- **Room unit**: A single physical room of a given type. What availability is actually calculated
  against.
- **Rate override**: A date range, a nightly rate, and a label, belonging to one room type (C1).
  Overrides the base rate for nights it covers. Overrides for the same room type may not overlap.
  There is no rule, season, or percentage behind it — it is a value the owner typed against dates.
- **Availability block**: A date range during which a room unit cannot be booked, with a reason.
- **Enquiry**: A message from a guest — name, email, message, handled state, owner note. **A personal
  data store** (FR-026a): deleted outright on erasure, and after 12 months by retention.
- **Gallery category**: A grouping in the guest gallery — name, position, and whether it shipped with
  the template or the owner added it (C11). Five ship seeded; all are renameable, reorderable, and
  deletable once empty.
- **Gallery image**: A photograph with a description of what it shows, a category, an optional room
  type it belongs to, and **a separate position for each surface it appears on** (C11) — one for the
  room's page, one for the gallery.
- **Content page**: Owner-authored page with a title, a **Markdown** body (C7), an address, a
  publication state, a **menu position and optional menu label** (C9), and a **kind** that governs
  deletability (FR-049a). Amenities, activities, and
  the three policies are all content pages; only the policies cannot be deleted. Raw HTML is never
  stored and never rendered.
- **Page section**: One entry in the fixed catalogue of sections available on a composed page (C10) —
  which page it belongs to, which section type it is, whether the owner has it enabled, and its
  position. Section types are defined by the template; the owner may not create new ones.
- **Site branding**: The property's primary and secondary colours, derived shades, logo images, and
  social share image. Exactly one per deployment.
- **Site settings**: Property name, address, position, transport notes, contact details, payment QR
  image, deposit guidance text, and hold duration. Exactly one per deployment.
- **Booking event**: One immutable entry in a booking's history. Records what changed — state
  transition, dates, room unit — with the previous and new values, which account acted, and when.
  Created by the system as a side effect of every booking change; never authored, edited, or removed
  by anyone. **Holds no personal information**: no guest name, email, phone, or special requests. It
  describes what happened to a reservation, never who the guest was.
- **Email delivery**: One record per attempt to email a guest, created when the message is sent and
  updated when the outcome is known — delivered, bounced, or rejected. Records which booking and
  which message (submission acknowledgement or confirmation), the address it was sent to, the
  outcome, and when. A resend after a corrected address creates a new record rather than overwriting
  the failed one, so the owner can see what was tried.
- **Owner account**: The single authenticated person who manages the property (C3). Exactly one per
  deployment, created as a deployment step, never through the site. Carries a role designation that
  has one value in this release, so that additional accounts can be introduced later without
  rewriting access rules.

### CRUD Completeness

| Entity | Create | Read | Update | Delete | Deferral / substitution reason |
|---|---|---|---|---|---|
| Booking | ☑ guest online; ☑ owner in admin (C4) | ☑ owner; guest sees own | ☑ owner | ☒ | **Deliberate.** Cancellation is a state change (FR-024); the record survives for inventory and accounting. Personal-data erasure (FR-027) removes the person, not the row |
| Room type | ☑ | ☑ | ☑ | ☑ *conditional* | Hard delete only when no bookings reference it; otherwise archive (FR-031, FR-032) |
| Room unit | ☑ | ☑ | ☑ | ☑ *conditional* | Same condition as room type |
| Rate override | ☑ | ☑ | ☑ | ☑ | Deleting one returns those nights to the base rate; bookings already made keep their price (FR-029d) |
| Availability block | ☑ | ☑ | ☑ | ☑ | |
| Booking event | ☑ **system only** | ☑ owner | ☒ | ☒ | **Deliberate.** An audit trail nobody can author, alter, or remove is the only kind worth keeping. Written as a side effect of booking changes (FR-022f). Holds no personal fields, so it carries no erasure or retention obligation (FR-022g) |
| Email delivery | ☑ **system only** | ☑ owner | ☑ **system only** — outcome arrives after sending | ☒ | **Deliberate.** The owner reads it to see who was not reached and resends; they never author or delete a delivery record. A resend creates a new record (FR-018e). Holds the recipient address, so erasure reaches it (FR-027a) |
| Enquiry | ☑ guest | ☑ owner | ☑ owner | ☑ owner | **A personal data store** (FR-026a). Deleted on erasure (FR-027a) and automatically after 12 months (FR-028d) |
| Gallery category | ☑ owner-added | ☑ | ☑ rename, reorder | ☑ *conditional* | Five ship seeded (C11). Deletion refused while images remain, so photographs are never destroyed as a side effect (FR-041e) |
| Gallery image | ☑ | ☑ | ☑ | ☑ | Delete removes the stored file too (FR-044). Carries a separate position per surface (FR-041c) |
| Content page | ☑ | ☑ | ☑ | ☑ | Includes amenities and activities, which ship seeded but are ordinary deletable pages (FR-049a) |
| Policy page | ☒ | ☑ | ☑ | ☒ | **Deliberate.** All three exist from first deployment and are legally required; they are edited, never created or destroyed (FR-057, FR-059). **Undeletable means legally required, and nothing else** (FR-049a) |
| Page section | ☒ *seeded from the template catalogue* | ☑ | ☑ enable, disable, reorder | ☒ | **Deliberate (C10).** Section types are defined by the template, so there is nothing for the owner to create or destroy — only to turn on, turn off, and arrange. A disabled section is not a deleted one |
| Site branding | ☒ | ☑ | ☑ | ☑ *as reset* | **Deliberate.** Exactly one exists per deployment; delete means reset to the deployment's seeded values (FR-066) |
| Site settings | ☒ | ☑ | ☑ | ☒ | **Deliberate.** Exactly one exists per deployment and the site cannot function without it |
| Owner account | ☒ *deployment step* | ☑ own profile | ☑ own profile | ☒ | **Deliberate (C3).** Exactly one account per deployment, provisioned outside the app (FR-069a). Nothing to create, list, or delete in-app; the owner may view and update their own profile and password |

### Surface State Coverage

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Availability results | ☑ | ☑ no rooms for those dates | ☑ | ☑ |
| Booking hold submission | ☑ | — | ☑ incl. dates-taken-while-booking | ☑ |
| Payment / reference submission | ☑ | — | ☑ | ☑ |
| Guest booking lookup | ☑ | ☑ not found | ☑ incl. rate limited | ☑ |
| Accommodations list & detail | ☑ | ☑ | ☑ | ☑ |
| Gallery (guest) | ☑ | ☑ | ☑ | ☑ |
| Content & policy pages | ☑ | ☑ | ☑ | ☑ |
| Home page | ☑ | — | ☑ | ☑ |
| Location & enquiry form | ☑ | — | ☑ incl. rate limited | ☑ |
| Admin sign-in | ☑ | — | ☑ incl. lockout | ☑ |
| Admin bookings list & detail | ☑ | ☑ | ☑ | ☑ |
| Admin create booking | ☑ | — | ☑ incl. overlap conflict | ☑ |
| Admin verification form | ☑ | — | ☑ | ☑ |
| Admin room types & units | ☑ | ☑ | ☑ | ☑ |
| Admin rate overrides | ☑ | ☑ no overrides set | ☑ incl. overlap refusal | ☑ |
| Admin availability calendar | ☑ | ☑ | ☑ | ☑ |
| Admin gallery & upload | ☑ | ☑ | ☑ | ☑ |
| Admin content pages | ☑ | ☑ | ☑ | ☑ |
| Admin enquiries | ☑ | ☑ | ☑ | ☑ |
| Admin branding | ☑ | ☑ no logo | ☑ incl. contrast refusal | ☑ |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Under 200 simultaneous booking attempts for the same room and overlapping dates, exactly
  one succeeds and no room is ever double-booked. This holds across **all three** ways a booking is
  written — a guest's hold, an owner-created booking, and an owner moving an existing booking's dates
  — and across a block created at the same instant. Verified by the procedure in
  [quickstart.md](quickstart.md) V1, run against each of the three paths in isolation and against all
  of them interleaved.
- **SC-002**: A guest can go from arriving on the home page to a held room with a reference submitted
  in under 4 minutes on a phone, without contacting anyone.
- **SC-003**: 95% of guests who begin the booking form complete the hold step.
- **SC-004**: The home page and accommodation pages become usable within 4 seconds, and show their
  main image within 2.5 seconds, measured on a **4× CPU-throttled mobile profile over a 1.6 Mbps /
  750 kbps / 150 ms connection** — so that two people measuring it independently get the same answer.
- **SC-004a**: Admin surfaces meet the same measurement on the same profile, with one relaxation: the
  bookings list may take up to 6 seconds with a year of bookings present. The owner opens it daily on
  the same phone the guests use.
- **SC-005**: Every hold that goes unpaid is released automatically within 5 minutes of its expiry,
  with no human action, verified over a continuous 72-hour run.
- **SC-006**: The owner can find a booking awaiting verification and confirm it in under 60 seconds
  from opening the admin, on a phone.
- **SC-007**: A non-technical person completes all three tasks below unaided. **Verified by observed
  trial, not by inspection** (C12).

  **Participant**: one person who works in or runs a small hospitality business, is not technically
  trained, has not seen this admin before, and **is not the developer**. A developer trialling their
  own build proves nothing.

  **Tasks**, given as outcomes and never as instructions:
  1. "Add a new room called Garden Suite that sleeps two people and costs ₱3,500 a night."
  2. "Put a photo of the beach on the website."
  3. "Charge ₱4,200 a night for Christmas week instead."

  **Conditions**: no written guide, no verbal help, no developer intervention. Observed throughout.

  **Pass**: all three completed. Every point of hesitation is recorded, whether or not the task
  succeeded — a task completed after two minutes of searching is a pass and a finding.

  **If no suitable participant is available, this criterion is reported as unverified.** It is never
  marked passed on the developer's own attempt.
- **SC-008**: Every management action in the CRUD table above can be completed on a phone.
- **SC-009**: Standing up a second property requires changing only configuration, content, and imagery
  — no change to shared application code.
- **SC-010**: The demo dataset seeds successfully into an empty database with one command, and every
  booking state is represented and demonstrable.
- **SC-011**: Every interactive element is reachable and operable by keyboard alone, and all text meets
  the contrast threshold for its size.
- **SC-012**: No page requires horizontal scrolling at 360px wide.
- **SC-013**: A guest who submits an invented payment reference never obtains a confirmed booking.
- **SC-018**: No booking record, block reason, or payment QR can be obtained by someone browsing the
  site without an active booking of their own.
- **SC-015**: A stay spanning a rate boundary is charged the sum of its nights' rates, verified
  against a hand-calculated figure for a stay that starts outside an override and ends inside it.
- **SC-016**: The owner can add a seasonal rate for a date range in under 60 seconds without
  written instructions.
- **SC-017**: Every guest who does not receive a booking email is visible to the owner within one
  hour of the failure, without the owner having to look for it.
- **SC-014**: A guest's personal details can be erased on request within one working day, and the
  booking record survives that erasure intact. After erasure, **no copy of the guest's name, email
  address, or phone number remains in any store in the register (FR-026a)** — verified by searching
  every store, including ones the register gained after this criterion was written.
- **SC-019**: Personal information older than its retention period is gone without anyone having
  acted, verified by seeding records past the threshold and observing them removed on the next
  scheduled run.
- **SC-020**: An owner's session left idle on a shared device cannot be used to reach any management
  surface after the inactivity period.

---

## Clarifications

### Session 2026-07-31

- Q: How do rates vary across dates? → A: Base nightly rate per room type, plus manually entered date-range overrides
- Q: Can one booking cover more than one room? → A: No — one room per booking; a group makes several bookings
- Q: Does the MVP need more than one admin login, with differing access levels? → A: One owner account, no in-app user management
- Q: Can the owner create a booking directly for a phone or walk-in guest? → A: Yes — same booking record, entered by the owner, confirmable without a reference
- Q: When an email to a guest fails to arrive, should the owner be told? → A: Yes — record the delivery outcome on the booking and flag failures in the admin
- Q: Can the owner change a confirmed booking's dates or room? → A: Yes, on any non-terminal booking, under the same overlap prevention; total recalculates, amount received carries over
- Q: What can the owner put in a content page body — plain text, Markdown, or HTML? → A: Markdown, with raw HTML rejected at save
- Q: Is the payment QR code public, or only visible to a guest holding a room? → A: Only to a guest holding a room
- Q: How does a guest find a content page the owner created? → A: Published pages appear in navigation automatically, positioned from the page itself
- Q: Is the home page and room detail content fixed by the template or assembled by the owner? → A: Fixed sections the owner can toggle and reorder; no free-form page builder
- Q: Are gallery categories fixed or owner-defined, and do room photographs belong to the gallery? → A: Five shipped categories plus owner-added ones; room photographs appear in Rooms automatically, ordered separately per surface
- Q: How is "a non-technical owner can work the admin unaided" verified? → A: Stop adding requirements; SC-007 becomes a named observed trial with three tasks and one participant who is not the developer
- Q: How far ahead must a guest book — is same-day booking allowed? → A: Owner-set minimum notice, defaulting to same-day until 6pm property time; evaluated when the hold is created
- Q: Should guests see how many rooms of a type remain? → A: Only at or below a configurable threshold, default 2; zero turns it off

**C1 — How rates vary across dates: a base nightly rate per room type, plus manually entered
date-range overrides.**

The owner types a date range and a rate — "Dec 15 – Jan 5, ₱6,500" — and that is all. There is no
rules engine, no named seasons, no automatic application, and nothing computed from a percentage.
This satisfies the brief's §4.8 requirement that the demo show a seasonal rate variation while
keeping "seasonal pricing rules" (§8) deferred, because an override is **data the owner entered**
rather than a rule the system applies.

A stay is priced night by night: each night takes an override rate if one covers it, otherwise the
room type's base rate. The total is the sum. A stay crossing a boundary is therefore priced correctly
without anyone deciding which rate "wins" for the whole stay.

**Overlapping overrides for the same room type are refused.** Allowing them would require a
precedence rule, and a precedence rule is the first piece of the pricing engine that was deferred.

**C14 — Remaining-room counts are shown only at or below a configurable threshold, defaulting to 2.**

At or below the threshold a guest sees the real number — "only 1 left". Above it they see that the
room type is available and nothing more. Setting the threshold to zero disables the disclosure
entirely, so one setting spans never, sometimes, and always.

**Why not simply hide the count.** Binary availability is already occupancy disclosure — "unavailable
on 24 December" says the property is full that night. There is no version of a booking site that
leaks nothing, so the question is granularity, not disclosure. A threshold discloses the tail while a
poller learns only "few" or "not few" on every other date, which is far weaker than the exact
occupancy curve an always-on count would hand over.

**And it repairs something C2 created.** One room per booking means a family needing three rooms makes
three bookings. With no count they book one, book a second, and discover on the third that only two
existed — a dead-end the one-room decision introduced and this closes at the moment it would occur.

**The scarcity signal is real, which is the distinction that matters here.** "Only 1 left" is a fact
about the inventory, not manufactured urgency. That is the line between this and the OTA pattern the
product is positioned against, and it holds only while the number is true — so it is read from
availability at request time and never cached, softened, or rounded.

**C13 — Minimum booking notice is a setting, defaulting to same-day until 6pm property time.**

A resort that can take a guest off a midnight ferry sets it to zero. One that needs a day to prepare
a room sets it to 24 hours. A fixed rule would be wrong for one of them, and the owner is the only
person who knows which they are.

**The cutoff is evaluated when the hold is created, never when the payment reference is submitted.**
A guest who starts a booking at 5:55pm keeps their full hold and can complete it at 6:15pm. The
alternative — re-checking at submission — takes payment and then refuses the room, which is the worst
available version of this failure and the one most likely to be built by accident.

**C12 — Admin usability stops being specified further and becomes an observed trial.**

FR-067a–e are the checkable part and are considered complete: confirmation before destructive
actions, no raw identifiers or technical error text, state names that say what the owner must do,
inline guidance on non-obvious fields, and reversal of a wrongly cancelled booking. No further
requirements will be written to chase SC-007.

What remains is not specifiable, because it is a claim about how a real person behaves in front of an
interface they have not seen. So SC-007 is rewritten as a procedure with a pass condition rather than
an assertion.

**The honest cost, recorded rather than glossed:** this needs a participant who is not the developer.
A solo builder cannot self-administer it — they know where everything is, and their success proves
nothing. If no suitable person is available before the first client, **SC-007 stays open and is
reported as unverified rather than quietly assumed**. That is worse than a criterion that can be
self-checked, and better than one that reads as passing because nobody tried.

It earns its place despite that: the brief's §3 is explicit that an admin the owner abandons means
the content goes stale and the site dies. That failure deserves a criterion even while it is pending.

**C11 — Five shipped gallery categories plus any the owner adds. A room's photographs appear in the
Rooms category automatically, ordered separately on each surface.**

The template ships Rooms, Pool, Beach, Dining, and Grounds; the owner may add more. A photograph
attached to a room type appears both on that room's page and in the Rooms category **without being
uploaded twice** — which is the whole point, since uploading the same picture to two places is
exactly the kind of duplicated effort a non-technical owner will simply skip, leaving one surface
empty.

**Ordering is per surface, and this is the part that would otherwise be got wrong.** The photograph
that best sells a specific room is not necessarily the one that should lead the Rooms category. A
single order shared by both means one surface always gets an order chosen for the other, so each
carries its own.

**Consequences settled here rather than during implementation:**

- Archiving a room type removes its photographs from the gallery too. A guest browsing Rooms must not
  find a room they cannot book (FR-032).
- Categories are deletable, including the shipped five — a property with no restaurant should not be
  stuck with a Dining category. Deleting one that still holds images is refused until they are moved
  or removed, so photographs are never destroyed as a side effect.
- An empty category hides itself rather than rendering as a heading with nothing under it, on the
  same principle as FR-050d.

**C10 — The home page and room detail page are built from a fixed catalogue of sections that the
owner turns on, off, and reorders. There is no page builder.**

The template defines which sections exist and how each one looks inside; the owner decides which
appear and in what order. Hero treatment — image, video, or depth-parallax — is one of those choices.

A page builder was rejected because the owner this product is built for learned computers through
consumer social apps, and a builder is the surface most likely to be abandoned half-configured,
leaving a worse page than a fixed layout would have produced. A fully fixed layout was rejected the
other way: at 8–30 rooms these properties differ enough that a resort with no restaurant should not
be showing a dining section it cannot fill.

**Two constraints keep this from becoming a way to break the product:**

- The availability search cannot be switched off. It is what the site exists to do.
- Every section must degrade to something coherent when its content is missing, so enabling a section
  before filling it never produces a broken page.

**The accepted cost**: this is the largest of the three options to build. Every section needs an
enabled state, an order, and a defined appearance when empty.

**C9 — Published content pages reach navigation automatically.**

No separate menu-management screen. The owner publishes a page and it appears; they set its position
and optional menu label on the page itself. Unpublishing or deleting removes it.

For an owner whose mental model comes from consumer social apps, "publish it and it appears" is the
behaviour they already expect. A menu-management screen is a second thing to discover, learn, and
keep in step with the pages — and the failure mode is silent: a page published, invisible, and the
owner certain they did it right.

**The accepted cost**: the menu grows without limit. At this property size that is six to eight pages
and fine, but nothing stops an owner creating twenty. FR-051c requires a warning past the point where
the menu stops working, and deliberately does not block publishing — the owner's site, the owner's
call.

**C8 — The payment QR is reachable only from an active booking's payment step.**

Not published on a public page, not fetchable by address alone. A guest who is holding a room sees it
exactly when they need it; nobody else can retrieve it.

The concern is impersonation: a lifted QR on a page dressed up as the resort takes money from someone
who then blames the resort. Gating it costs a real guest nothing — they already have to reach the
payment step — while making automated harvesting require a completed booking, which is rate-limited
and leaves a record.

**The protection is partial and should be understood as such.** Every guest who has ever stayed has
seen this code, and GCash and Maya codes encode a merchant identity the resort hands out in person
constantly. This raises the cost of scraping; it does not make the code secret. It is scraping
friction, not a confidentiality boundary, and if it proves costly at plan time it is a reasonable
thing to revisit.

**C7 — Content page bodies are Markdown. Raw HTML is rejected when the page is saved.**

The owner gets headings, bold, italic, lists, and links — the formatting an amenities page actually
needs — through a small toolbar that writes Markdown. Raw HTML is refused at the point of saving, not
cleaned up afterwards.

The reason is that a stored HTML flaw in this application is not defacement. Per the constitution's
own reasoning, the owner's session is readable by any script running on the page, so owner-authored
HTML that survives to be re-displayed is an account takeover of the only account there is. Rejecting
HTML at the source means there is no script to sanitise and no sanitiser to keep patched — the class
of bug is absent rather than defended against.

This applies to every content page, including the three policy pages.

**C6 — The owner can change a booking's dates and room after confirmation.**

Permitted on any booking that is not cancelled or expired, under the same overlap prevention that
governs every other write. Cancel-and-recreate is what an owner would otherwise be forced into, and
it destroys the payment reference, the recorded amount, and the history — the exact record the manual
verification process depends on.

**This refines C1's frozen-total rule rather than contradicting it.** Two different events were being
conflated:

- **A rate or override is edited** → existing bookings keep their captured total. The guest was
  quoted a price and it must not move underneath them (FR-029d).
- **The stay itself changes** → the total recalculates from the new dates at the rates in force when
  the change is made. The guest is buying a different stay.

The amount already received carries over untouched, so the balance simply moves. This distinction is
easy to implement backwards and is the reason it is written down here rather than left to the plan.

**C5 — Email delivery outcomes are recorded on the booking and failures are surfaced to the owner.**

Every booking shows whether the guest was actually reached, and undelivered ones are filterable so
the owner can phone instead. Hard bounces from a mistyped address count as failures.

The whole booking loop ends in an email, and a silent failure produces the worst outcome available:
the owner sees a confirmed booking, the guest believes they were never confirmed, and neither knows
the other's state until someone phones. Mistyped addresses on a phone keyboard are routine, not rare.

No application-level retry layer. Providers already retry transient failures internally; the failures
that survive to be reported are permanent ones a retry would not fix. What the owner needs is to
know, not for the system to try harder.

**C4 — The owner can create a booking directly for a phone or walk-in guest.**

It is the same booking record a guest would create, entered by the owner, and confirmable
immediately without a hold, a QR code, or a reference number. Availability blocks remain for genuine
non-guest reasons: maintenance, the owner's own use.

The reason is that blocks and bookings both make a room unavailable, which is fine while a block
means *nobody is staying here*. The moment a block also means *a guest is staying here but we hold no
record of them*, occupancy has two competing sources of truth and the one carrying real guests is the
one with no name attached. It also makes the brief's own success measure — direct bookings that would
otherwise have gone through an OTA — impossible to count, which FR-021d now fixes by recording how
every booking originated.

**Owner-created bookings are subject to exactly the same overlap prevention as guest bookings.** An
owner must not be able to double-book by hand any more than two guests can by accident.

**C3 — One owner account per deployment, with no in-app user management.**

The brief's persona is a single owner-operator running the property in person, and Phase 0.4 already
anticipated this by defining a role field it deliberately left with one value. No user-management
screen, no invitations, no permission matrix to design or test.

**The known cost, accepted deliberately:** a property with any staff at all will share the login,
which costs the audit trail and the ability to revoke one person's access. FR-069b blunts this by
recording the acting account on every booking state change, so the trail exists the day a second
account is introduced. Adding accounts later — all with identical access — is a small change;
adding a permission matrix later is not.

**C2 — One booking covers exactly one room. A group makes several bookings.**

The smallest correctness surface, and the one every Phase 0 artifact already assumed. A family taking
three rooms creates three bookings, receives three references, and the owner verifies each.

**The known cost, accepted deliberately:** groups are common at 8–30 rooms, and a guest who cannot
express "three rooms" will fall back to Messenger — which is the behaviour the product exists to
remove. FR-019a exists to blunt that: the booking flow tells a guest plainly how to book more than
one room rather than leaving them to guess. Multi-room bookings are a candidate for the first
post-launch feature.

---

## Assumptions

Recorded defaults where the brief was silent and a reasonable answer existed. Correct any that are
wrong before planning.

**Six assumptions were promoted to requirements** during the gate review, because they carried
requirement-strength consequences and nothing outside this list obliged anyone to honour them:
timezone (→ FR-020a), hold and awaiting durations (→ FR-005b), the static map (→ FR-053a), rate-limit
thresholds (→ FR-014a), document language (→ FR-068e), and money rounding (→ FR-003b). They remain
below as context; the requirement is now the binding statement.

1. **Availability is calculated against individual physical room units**, not a count per type. A
   property with four Garden Villas has four bookable units, so four guests can hold that type for the
   same dates and a fifth cannot.
2. **A guest can look up their own booking with reference plus email.** Not an account — guest accounts
   are deferred. Without this a guest has no way to check status, which would drive exactly the
   Messenger traffic the product removes.
3. **A guest cannot cancel their own booking through the site.** They contact the resort, and the owner
   cancels. This keeps every booking write in the owner's hands.
4. **The stay total is computed and displayed** — the sum of each night's applicable rate (C1) — even
   though no payment amount is enforced. A remaining balance is meaningless without it, and the brief
   calls for the balance.
4a. **The stay total is captured on the booking when it is created, and moves only when the stay
   moves** (C6). Editing a rate or an override never re-prices an existing booking (FR-022d,
   FR-029d); changing a booking's dates does re-price it, at the rates in force at that moment
   (FR-022c). The amount already received is never recalculated.
5. **Deposit guidance is a single editable text for the whole property**, not per room type.
6. **Hold duration is a configurable setting**, defaulting to 30 minutes; bookings awaiting
   verification expire after a longer configurable period, defaulting to 48 hours.
7. **Maximum stay length is 30 nights** and searches are permitted up to 12 months ahead.
8. **The map is a static image with a link to open the location in a maps application.** An embedded
   third-party map would send every visitor's address to that provider, which the privacy policy would
   then have to disclose.
9. **Currency is Philippine Pesos; times are Asia/Manila.** Check-in and check-out times are
   configurable settings displayed to guests, and a stay occupies nights, not hours.
10. **Amenities and activities are content pages**, per the brief's wording — not structured or
    bookable inventory, which is deferred.
11. **The site is English-only.** Multi-language is deferred.
12. **The seed dataset is replaced, not edited, for a real deployment** — swapping it is the day-one
    deployment step the brief describes.
13. **All technical decisions are governed by the constitution and the security baseline** and are not
    restated here; this specification describes only what the product does.

### Explicitly deferred — restated so nothing is silently dropped

Every item below is on the brief's deferred list and is **absent from this specification by
intention**: promo codes and seasonal pricing rules, live chat, bookable tours and activities as
separate inventory, multi-language, OTA channel synchronisation, multi-property support under one
admin, automated payment verification through any gateway, guest accounts and booking history, reviews
or ratings, and bespoke 3D scenes.
