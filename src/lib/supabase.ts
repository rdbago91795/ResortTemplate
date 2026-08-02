import { createClient } from '@supabase/supabase-js';

/**
 * The browser client.
 *
 * ⚠ ANON KEY ONLY. The service role key must never appear in anything Vite bundles — it
 * bypasses every RLS policy in the database. `.env.example` states the rule and the reason:
 * Vite inlines every `VITE_`-prefixed variable into the client bundle at build time, so a
 * secret with that prefix is not hidden, it is published.
 *
 * The anon key being public is the premise of the whole model, not a compromise in it. Its
 * safety comes entirely from Row Level Security — which is why every table has RLS enabled
 * with an explicit policy per operation per role, and why the tables a guest must never read
 * (`bookings`, `availability_blocks`, `room_occupancy`) have zero anon policies rather than
 * restrictive ones. `tests/rls/anon-access.test.ts` is the proof.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. Copy .env.example to .env.local.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // The admin is a single long-lived owner account (FR-069). Persisting and auto-refreshing
    // is what makes the idle-timeout warning in AdminShell meaningful rather than a race with
    // token expiry.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Maps a Postgres error to the message a guest or owner should see.
 *
 * Every RPC in this system raises named errors (`hold_expired`, `no_availability`,
 * `stale_record`, `html_not_allowed`…) rather than letting a constraint violation reach the
 * client raw. This is the single place those names become sentences, so the same failure
 * never gets two different wordings on two screens.
 *
 * ⚠ THE DEFAULT IS DELIBERATELY VAGUE. An unmapped database error can carry table names,
 * column names, and constraint names; passing `error.message` through would leak the schema
 * to anyone who can trigger it.
 */
const RPC_MESSAGES: Record<string, string> = {
  no_availability: 'Those dates are no longer open. Try shifting a night either way.',
  hold_expired: 'That hold has expired and the dates were released. Search again to rebook.',
  dates_unavailable: 'Another booking or block already covers those dates.',
  block_conflicts_booking: 'A booking already covers those dates.',
  rate_overlap: 'Another seasonal rate already covers those dates.',
  stale_record: 'Someone else changed this while you had it open. Reload and try again.',
  invalid_transition: 'That booking is not in a state where this is possible.',
  booking_terminal: 'That booking is already cancelled or expired.',
  booking_not_found: 'No booking matches that reference.',
  invalid_date_range: 'The check-out date must be after the check-in date.',
  invalid_guest_count: 'That number of guests does not fit this room.',
  check_in_in_past: 'That check-in date has already passed.',
  stay_too_long: 'Stays are limited to 30 nights. Contact us for anything longer.',
  too_far_ahead: 'Bookings open 12 months ahead.',
  too_soon: 'That date is too soon to book online.',
  unknown_room_type: 'That room is no longer available.',
  html_not_allowed: 'This field takes Markdown. Remove the HTML and use the toolbar instead.',
  invalid_timezone: 'That is not a recognised timezone.',
  not_authorised: 'You do not have permission to do that.',
  identity_not_attested: 'Confirm you have verified this person before continuing.',
  settings_missing: 'Site settings have not been set up yet.',
  section_required: 'The availability search cannot be switched off.',
  unknown_section: 'That page section does not exist.',
};

export function rpcErrorMessage(error: { message?: string } | null | undefined): string {
  if (!error?.message) return 'Something went wrong. Try again in a moment.';

  for (const [code, message] of Object.entries(RPC_MESSAGES)) {
    if (error.message.includes(code)) return message;
  }

  return 'Something went wrong. Try again in a moment.';
}
