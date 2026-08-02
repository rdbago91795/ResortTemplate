import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/**
 * True when the suite can run at all. Used with `describe.skipIf` so a missing key produces
 * "skipped: SUPABASE_SERVICE_ROLE_KEY not set" rather than a wall of connection errors that
 * looks like the database is broken.
 */
export const hasServiceRole = Boolean(url && serviceKey);
export const hasAnon = Boolean(url && anonKey);

export const missingCredentials =
  'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to run the database suites.';

/** Bypasses RLS. Fixture setup and teardown only — never used to assert access control. */
export function serviceClient(): SupabaseClient {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * The key a browser gets. Everything about access control is asserted through THIS client,
 * because it is the one an attacker has: it is published in the bundle by design.
 */
export function anonClient(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** ISO date `n` days from today. */
export function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Crockford base32 reference, matching `bookings_booking_reference_check`.
 *
 * The alphabet excludes I, L, O and U — a probe using `PROBE00001` was rejected during Phase
 * 2 for containing an O, and the demo seed shipped `BLA…` references that the constraint
 * refused. Both were caught by the constraint doing its job; this helper stops the test suite
 * from making the same mistake a third time.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function testReference(prefix = 'TST'): string {
  let out = prefix;
  while (out.length < 12) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}
