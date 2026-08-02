-- 0038_template_baseline.sql — NOT IN THE TASK LIST. Added because the schema does not work
-- without it.
--
-- ======================================================================================
-- SIX MIGRATIONS SAID "SHIPS SEEDED". NONE OF THEM INSERTED ANYTHING.
-- ======================================================================================
--
-- Found while writing T051. Every one of these tables was empty:
--
--   site_settings       0 rows -> search_availability, write_booking, and price_stay all
--                       raise `settings_missing`. The site cannot answer a single request.
--   site_branding       0 rows -> no brand colours to push into the theme contract
--   page_sections       0 rows -> set_page_section is UPDATE-only, so every call raises
--                       `unknown_section`. The home page has no sections at all
--   gallery_categories  0 rows -> 0015 says "Five ship seeded (C11)"
--   content_pages       0 rows -> FR-057/FR-059 require three policies to exist from first
--                       deployment; FR-049a expects amenities and activities seeded
--
-- THIS IS DEPLOYMENT DATA, NOT DEMO DATA, and the distinction decides where it lives:
--
--   * a real resort deploying this template needs every row below, and never runs the demo
--     seed at all
--   * `pnpm seed:teardown` (T052) removes what T051 created — it must NOT remove these, or
--     tearing down the demo would leave a site that cannot serve a request
--
-- So it is a migration. T051 seeds the fictional property ON TOP of this.
--
-- Every insert is ON CONFLICT DO NOTHING: re-running never clobbers an owner's edits.

-- ---- Settings singleton ---------------------------------------------------------------
-- Placeholders the owner overwrites in admin. Present so the site answers requests on the
-- first boot rather than erroring until someone fills a form.

insert into public.site_settings (
  id, property_name, address, latitude, longitude, contact_phone, contact_email
) values (
  true, 'Your Property Name', 'Set your address in Settings', 9.8482, 126.0458,
  '+63', 'hello@example.com'
) on conflict (id) do nothing;

-- ---- Branding singleton ---------------------------------------------------------------
-- The design system's default palette. These are DATA, not tokens: the owner changes primary
-- and secondary in admin and the theme contract picks them up at runtime via setElementVars.

insert into public.site_branding (
  id, primary_hex, primary_hover_hex, primary_active_hex, primary_text_hex,
  primary_subtle_hex, on_primary_hex, on_primary_subtle_hex,
  secondary_hex, secondary_subtle_hex, on_secondary_hex
) values (
  true,
  '#0A4E58',  -- petrol teal: water with depth in it, not postcard turquoise
  '#073B43', '#052C32', '#0A4E58', '#DCE9E9', '#FFFFFF', '#073B43',
  '#C9DCD4',  -- capiz celadon
  '#EDF3F0', '#151A18'
) on conflict (id) do nothing;

-- ---- The fixed section catalogue (C10, FR-050a, FR-033b) ------------------------------
--
-- NOTE: the spec fixes the RULES for this catalogue (owner enables/disables/reorders, cannot
-- create types, availability cannot be switched off) but never enumerates the sections
-- themselves. Derived from FR-050 (hero + availability search), FR-051 (accommodations,
-- gallery, location and contact are structural destinations), and US9 scenario 4. Flagged in
-- the completion report as a derived list rather than a specified one.

insert into public.page_sections (page, section_type, enabled, position) values
  ('home', 'hero',                true, 0),
  ('home', 'availability_search', true, 1),   -- cannot be disabled (FR-050c)
  ('home', 'accommodations',      true, 2),
  ('home', 'gallery',             true, 3),
  ('home', 'location',            true, 4),
  ('home', 'contact',             true, 5),

  ('room_detail', 'room_gallery',      true, 0),
  ('room_detail', 'room_overview',     true, 1),
  ('room_detail', 'room_availability', true, 2),   -- cannot be disabled (FR-033b)
  ('room_detail', 'room_rates',        true, 3)
on conflict (page, section_type) do nothing;

-- ---- The five shipped gallery categories (FR-041a, C11) --------------------------------
-- is_shipped marks them as arriving with the template. All five stay renameable, reorderable,
-- and deletable once empty — shipped does not mean protected (only policy pages are that).

insert into public.gallery_categories (name, slug, position, is_shipped) values
  ('Rooms',  'rooms',  0, true),
  ('Pool',   'pool',   1, true),
  ('Beach',  'beach',  2, true),
  ('Dining', 'dining', 3, true),
  ('Grounds','grounds',4, true)
on conflict (slug) do nothing;

-- ---- Content pages ---------------------------------------------------------------------
--
-- page_kind = 'policy' is what makes a page undeletable (FR-049a, FR-059). Amenities and
-- activities ship seeded but are ordinary 'content' pages the owner may delete.
--
-- Default text is coherent and publishable, NOT legal advice. security-baseline.md records
-- ten items for a lawyer to review before launch; the privacy policy and terms below are the
-- drafts it describes, and the placeholders in braces must be filled in.

insert into public.content_pages
  (slug, page_kind, title, menu_label, menu_position, body_markdown, published_at) values

('privacy-policy', 'policy', 'Privacy Policy', 'Privacy', 100,
'## Who we are

This site is operated by {Property Name}, {Address}. We are the personal information
controller for the data described below, as those terms are used in the Philippine Data
Privacy Act of 2012 (RA 10173).

## What we collect

When you make a booking we collect your name, email address, phone number, the dates and room
you booked, and any notes you choose to add. When you send an enquiry we collect your name,
email address, and your message. We do not collect payment card details — payment is arranged
directly with us and never passes through this site.

## Why we collect it

To hold your room, to contact you about your stay, and to keep the records a business is
required to keep. We do not sell your information and we do not use it for advertising.

## How long we keep it

Booking records are anonymised 24 months after your stay ends. Enquiries are deleted 12 months
after they are sent.

## Your rights

You may ask us what we hold about you, ask us to correct it, or ask us to erase it. Write to
{contact email} and we will respond within a reasonable period. Erasure removes your personal
details from our records; we keep the booking itself, without your details, because we are
required to.

## Where your data is stored

On servers in Singapore, operated by our hosting provider on our behalf.

## Complaints

If you believe we have mishandled your information you may complain to us at {contact email},
or to the National Privacy Commission at privacy.gov.ph.',
now()),

('terms-of-service', 'policy', 'Terms of Service', 'Terms', 101,
'## Booking through this site

A booking made here is a request to reserve a room for the dates you choose. Your room is held
for a short period while you arrange payment. If we do not receive your payment reference
within that period, the hold lapses and the dates return to general availability.

A booking is confirmed only when we have checked the payment and marked it confirmed. Until
then, the dates are held but not guaranteed.

## Payment

Payment is arranged directly with us using the details shown when you book. No payment is
taken through this site, and this site never handles card details.

## Rates and availability

Rates shown are per night for the room and dates selected, and include any seasonal rate in
force for those dates. Availability is shown in real time and can change between your search
and your booking.

## What we ask of you

Give us accurate contact details, so we can reach you about your stay. Tell us in advance if
your plans change.

## Limits

We are responsible for providing the accommodation you booked. We are not responsible for
travel to and from the property, for weather, or for events outside our control.

## Changes

We may update these terms. The version on this page at the time of your booking is the one
that applies to it.

## Governing law

These terms are governed by the laws of the Republic of the Philippines.',
now()),

('cancellation-policy', 'policy', 'Cancellation Policy', 'Cancellation', 102,
'## Cancelling a booking

To cancel, contact us directly using the details on our contact page. Please tell us as early
as you can — an early cancellation lets us offer the room to someone else.

## Refunds

**No refund is issued through this site.** This site does not process payments and cannot
return them. Any refund, and whether one applies at all, is arranged directly with us.

## Changing dates

If your plans shift, contact us before your arrival date. We will move your booking to new
dates where we have availability, and will tell you if the rate for the new dates differs.

## If we cancel

If we have to cancel your booking, we will contact you as soon as we know and arrange a full
refund of anything you have paid us directly.

## No-shows

If you do not arrive and have not contacted us, we treat the booking as cancelled and the room
is released.',
now()),

('amenities', 'content', 'Amenities', 'Amenities', 10,
'Describe what the property offers here — the pool, the kitchen, the wifi, the things a guest
would want to know before booking.

Delete this page if you would rather not have it. It is an ordinary content page.',
null),

('activities', 'content', 'Activities', 'Activities', 11,
'Describe what there is to do nearby — surfing, island hopping, the lagoon, wherever your
guests actually go.

Delete this page if you would rather not have it. It is an ordinary content page.',
null)

on conflict (slug) do nothing;
