import { describe, it, expect } from 'vitest';
import { anonClient, hasAnon, missingCredentials } from '../helpers/clients';

/**
 * The anon key is PUBLISHED — Vite inlines it into the bundle, by design. Everything that
 * keeps a guest out of the booking book is enforced server-side, so this suite uses exactly
 * the key an attacker has and checks what it can reach.
 *
 * ══════════════════════════════════════════════════════════════════════════════════
 * AMENDED FROM T065 AS WRITTEN. The task asked for "zero rows rather than an error".
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * That phrasing assumes ONE gate — RLS — where a table with no matching policy returns an
 * empty result, and an error would confirm the table exists.
 *
 * This schema has TWO gates, and migration 0020 says so in as many words:
 *
 *     ⚠ RLS IS THE ROW GATE. `GRANT` IS THE TABLE GATE. BOTH ARE REQUIRED (baseline §1.1).
 *     A table with perfect policies but a blanket grant still leaks through any operation the
 *     policies did not anticipate.
 *
 * `anon` therefore has no SELECT grant on these tables at all, so the request is refused at
 * the privilege layer with `42501` before RLS is consulted. Verified: the readable tables
 * (`room_types`, `content_pages`, `site_settings`) DO carry the grant, so this is a deliberate
 * per-table decision, not a blanket omission.
 *
 * Making the original assertion pass would have meant granting SELECT back and relying on RLS
 * alone — deleting the second gate to satisfy a test. So the assertion was amended instead,
 * with the decision recorded rather than quietly reinterpreted.
 *
 * WHAT IS ASSERTED NOW: no rows reach anon, by either gate. Both outcomes are acceptable; a
 * row is not. That is the guarantee FR-002a actually depends on — a guest learns availability
 * and never occupancy — and it holds whichever layer does the refusing.
 *
 * The information-disclosure concern behind the original wording is real but small: `42501`
 * confirms the table exists. PostgREST already advertises far more than that through its
 * OpenAPI document, and the table names are visible in the client bundle's RPC calls. Trading
 * a second enforcement layer for that is a bad exchange.
 *
 * → security-baseline.md §1.1 and the T065 task text should be amended to match.
 */

/** FR-002a: a guest learns availability, never occupancy. These three carry occupancy. */
const FORBIDDEN_TABLES = [
  'bookings',
  'availability_blocks',
  'room_occupancy',
  'booking_events',
  'email_deliveries',
  'enquiries',
  'admin_users',
  'personal_data_stores',
  'rate_limit_events',
  'webhook_events',
] as const;

/** Published content a guest is meant to read. Included so the suite proves RLS is not simply off. */
const READABLE_TABLES = ['room_types', 'gallery_categories', 'content_pages', 'site_settings'] as const;

describe.skipIf(!hasAnon)('RLS — what an anonymous visitor can reach', () => {
  const anon = anonClient();

  for (const table of FORBIDDEN_TABLES) {
    it(`${table}: yields no rows to an anonymous caller`, async () => {
      const { data, error } = await anon.from(table).select('*').limit(5);

      // Refused at the GRANT gate (42501) or emptied by the RLS gate. Either is fine.
      // A row is not, and neither is any other error code — an unexpected failure here
      // usually means the table is missing rather than protected.
      if (error) {
        expect(
          error.code,
          `${table} was refused with ${error.code}: ${error.message}. Expected 42501 ` +
            `(no table grant) or no error at all with an empty result.`,
        ).toBe('42501');
      } else {
        expect(data, `${table} returned rows to anon`).toEqual([]);
      }
    });
  }

  /**
   * The amendment above is only sound while the grants really are revoked. If someone later
   * runs `grant select on bookings to anon`, the loop still passes — RLS would return `[]` —
   * and the second gate would be gone with nothing complaining.
   *
   * This is what complains.
   */
  it('the table gate is still in place on every forbidden table', async () => {
    for (const table of FORBIDDEN_TABLES) {
      const { error: anonError } = await anon.from(table).select('*').limit(1);
      expect(
        anonError?.code,
        `${table} no longer refuses anon at the grant layer. Migration 0020 revokes these ` +
          `deliberately (baseline §1.1) — if the grant was restored on purpose, update this ` +
          `test and the baseline together.`,
      ).toBe('42501');
    }
  });

  for (const table of READABLE_TABLES) {
    it(`${table}: readable, proving RLS is enforcing rather than absent`, async () => {
      const { error } = await anon.from(table).select('*').limit(1);
      expect(error).toBeNull();
    });
  }

  /**
   * The corollary: writes must be refused. A readable table with an open write policy is a
   * worse bug than an unreadable one, and it would not show up in the checks above.
   */
  it('refuses an anonymous insert into room_types', async () => {
    const { error } = await anon
      .from('room_types')
      .insert({ name: 'x', slug: 'rls-probe', max_occupancy: 2, base_nightly_rate: 1 });
    expect(error).not.toBeNull();
  });

  it('refuses an anonymous insert into bookings — write_booking is the only path', async () => {
    const { error } = await anon.from('bookings').insert({
      booking_reference: 'RLSPROBE001',
      status: 'confirmed',
      origin: 'online',
      check_in: '2027-01-01',
      check_out: '2027-01-02',
      guests: 1,
      stay_total: 0,
    });
    expect(error).not.toBeNull();
  });

  /**
   * `search_availability` is the ONLY channel by which availability reaches a guest, and it
   * must return availability without ever disclosing what occupies the rest.
   */
  it('search_availability is callable and leaks no occupancy detail', async () => {
    const { data, error } = await anon.rpc('search_availability', {
      p_check_in: '2027-06-01',
      p_check_out: '2027-06-03',
      p_guests: 2,
    });

    expect(error).toBeNull();

    const serialised = JSON.stringify(data ?? {});
    for (const leak of ['booking_id', 'guest_email', 'guest_name', 'block_id', 'reason']) {
      expect(serialised, `search_availability must not disclose ${leak}`).not.toContain(leak);
    }
  });

  /** FR-013b: a wrong reference and a wrong email must be indistinguishable. */
  it('get_booking_by_reference returns not_found for a reference that cannot exist', async () => {
    const { data, error } = await anon.rpc('get_booking_by_reference', {
      p_reference: 'ZZZZZZZZZZ',
      p_email: 'nobody@example.com',
    });

    expect(error).toBeNull();
    expect((data as { status?: string } | null)?.status).toBe('not_found');
  });

  /** Privacy RPCs are admin-only; anon must not reach them even to be told no politely. */
  it('refuses erase_guest_data to an anonymous caller', async () => {
    const { error } = await anon.rpc('erase_guest_data', {
      p_email: 'someone@example.com',
      p_identity_verified: true,
    });
    expect(error).not.toBeNull();
  });
});

describe.skipIf(hasAnon)('RLS', () => {
  it.skip(`skipped — ${missingCredentials}`, () => undefined);
});
