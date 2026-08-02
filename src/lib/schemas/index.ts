import { z } from 'zod';

/**
 * ══════════════════════════════════════════════════════════════════════════════════
 * SHARED WITH THE SERVER, NEVER INSTEAD OF IT — plan.md, constitution VIII.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * Everything here is also enforced in the database — as a CHECK constraint, inside a
 * `security definer` function, or by an RLS policy. These schemas exist to tell the guest
 * what is wrong *before* a round trip, not to decide whether it is allowed.
 *
 * The distinction matters because a client validator is trivially bypassed: anyone can call
 * `/rest/v1/rpc/write_booking` directly with the anon key, which is public by design. If a
 * rule only exists here, it does not exist.
 *
 * Where a rule below has a database counterpart, the counterpart is named. If you change one,
 * change both — a client that accepts what the server rejects produces a form that fails on
 * submit with no explanation attached to any field.
 */

/** `bookings_booking_reference_check`: Crockford base32, which excludes I, L, O and U. */
export const bookingReferenceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10,}$/,
    'A booking reference is at least 10 characters and never contains I, L, O or U.',
  );

/** `bookings_payment_reference_check`. Deliberately loose — every wallet formats differently. */
export const paymentReferenceSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{4,40}$/, 'Enter the reference exactly as your payment app shows it.');

/**
 * Email. Normalised to lowercase HERE as well as by the database trigger
 * (`normalise_email`, migration 0031), so what the guest sees echoed back matches what is
 * stored. The trigger is the guarantee; this is the courtesy.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Enter an email address we can reach you at.');

/** No format check: Philippine numbers arrive as +63, 0917, and 63917 and all are valid. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a number we can reach you on.')
  .max(32);

export const guestNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter the name the booking is under.')
  .max(120);

/** ISO date, `YYYY-MM-DD`. Matches the `date` columns; no time zone, because a stay has none. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.');

/**
 * `bookings_dates_ordered` and `bookings_stay_length` in the database; `too_far_ahead` and
 * `too_soon` are decided by `search_availability` against `site_settings`, which is why they
 * are NOT here — they depend on server state this schema cannot see.
 */
export const stayRangeSchema = z
  .object({ checkIn: isoDateSchema, checkOut: isoDateSchema })
  .refine((v) => v.checkOut > v.checkIn, {
    message: 'Check-out must be after check-in.',
    path: ['checkOut'],
  })
  .refine(
    (v) => {
      const nights =
        (new Date(v.checkOut).getTime() - new Date(v.checkIn).getTime()) / 86_400_000;
      return nights <= 30;
    },
    { message: 'Stays are limited to 30 nights. Contact us for anything longer.', path: ['checkOut'] },
  );

/** Upper bound is checked against the stored `room_types.max_occupancy` server-side. */
export const guestCountSchema = z.number().int().min(1, 'At least one guest.').max(20);

export const availabilitySearchSchema = z.object({
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: guestCountSchema,
});

export const holdRequestSchema = z.object({
  roomTypeId: z.string().uuid(),
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: guestCountSchema,
  guestName: guestNameSchema,
  guestEmail: emailSchema,
  guestPhone: phoneSchema,
  guestNotes: z.string().trim().max(2000).optional(),
});

/** RLS-P6: the lookup needs BOTH, and failure is indistinguishable between them (FR-013b). */
export const bookingLookupSchema = z.object({
  reference: bookingReferenceSchema,
  email: emailSchema,
});

/** `enquiries_insert_anon` policy enforces exactly these lengths. */
export const enquirySchema = z.object({
  fullName: z.string().trim().min(1, 'Tell us your name.').max(120),
  email: emailSchema,
  message: z.string().trim().min(1, 'What would you like to ask?').max(2000),
});

/** `content_pages_slug_check`. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,80}$/, 'Use lowercase letters, numbers and hyphens only.');

/**
 * Markdown body. The HTML check mirrors `public.reject_raw_html` (migration 0030) — note the
 * NON-capturing group, which was a real bug in the server version: a capturing group makes
 * `substring()` return the group rather than the match, so `<script>` reported NULL.
 *
 * The server rejection is the gate. This is what puts the message next to the field.
 */
const RAW_HTML = /<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?\/?>/;

export const markdownSchema = z
  .string()
  .max(50_000)
  .refine((value) => !RAW_HTML.test(value), {
    message: 'This field takes Markdown. Remove the HTML and use the toolbar instead.',
  });

export const contentPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, 'Give the page a title.').max(200),
  menuLabel: z.string().trim().min(1).max(40).optional(),
  menuPosition: z.number().int().min(0).default(0),
  bodyMarkdown: markdownSchema,
  published: z.boolean().default(false),
});

/** `site_branding_*_hex_check` on all ten columns. */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex colour, like #0A4E58.');

/**
 * `site_settings` ranges. Each has a CHECK constraint behind it; `save_site_settings` raises
 * `invalid_range` when one fails, which `rpcErrorMessage` maps.
 *
 * Retention months are `.min(1)`, not `.min(0)`: the database forbids 0, so retention cannot
 * be switched off. That is deliberate and worth not "fixing" here.
 */
export const siteSettingsSchema = z.object({
  propertyName: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactPhone: phoneSchema,
  contactEmail: emailSchema,
  transportNotes: markdownSchema.optional(),
  depositGuidance: z.string().trim().max(500).optional(),
  timezone: z.string().trim().min(1),
  holdMinutes: z.number().int().min(1).max(1440),
  awaitingHours: z.number().int().min(1).max(336),
  minNoticeHours: z.number().int().min(0).max(720),
  sameDayCutoffHour: z.number().int().min(0).max(23),
  scarcityThreshold: z.number().int().min(0).max(50),
  sessionIdleMinutes: z.number().int().min(5).max(480),
  bookingRetentionMonths: z.number().int().min(1).max(120),
  enquiryRetentionMonths: z.number().int().min(1).max(120),
});

export const roomTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name the room type.').max(120),
  slug: slugSchema,
  description: z.string().trim().max(4000).optional(),
  bedConfiguration: z.string().trim().max(200).optional(),
  maxOccupancy: z.number().int().min(1).max(20),
  baseNightlyRate: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

/** `rate_overrides_no_overlap` is an exclusion constraint — overlap is a SERVER decision. */
export const rateOverrideSchema = z
  .object({
    roomTypeId: z.string().uuid(),
    label: z.string().trim().min(1, 'Name this rate.').max(120),
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
    nightlyRate: z.number().min(0),
  })
  .refine((v) => v.endsOn > v.startsOn, {
    message: 'The end date must be after the start date.',
    path: ['endsOn'],
  });

/** Same shape, and `occupancy_no_overlap` is likewise the server's call. */
export const availabilityBlockSchema = z
  .object({
    roomUnitId: z.string().uuid(),
    reason: z.string().trim().min(1, 'Say why these dates are blocked.').max(200),
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
  })
  .refine((v) => v.endsOn > v.startsOn, {
    message: 'The end date must be after the start date.',
    path: ['endsOn'],
  });

/** `gallery_images_alt_text_check`. §11.3 makes alt text a database requirement, not a hint. */
export const galleryImageSchema = z.object({
  categoryId: z.string().uuid(),
  roomTypeId: z.string().uuid().optional(),
  altText: z
    .string()
    .trim()
    .min(1, 'Describe the photograph for someone who cannot see it.')
    .max(300),
  galleryPosition: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export type HoldRequest = z.infer<typeof holdRequestSchema>;
export type BookingLookup = z.infer<typeof bookingLookupSchema>;
export type Enquiry = z.infer<typeof enquirySchema>;
export type ContentPage = z.infer<typeof contentPageSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type RoomType = z.infer<typeof roomTypeSchema>;
export type RateOverride = z.infer<typeof rateOverrideSchema>;
export type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;
export type GalleryImage = z.infer<typeof galleryImageSchema>;
