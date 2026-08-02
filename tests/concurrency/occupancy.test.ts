import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  serviceClient,
  anonClient,
  hasServiceRole,
  missingCredentials,
  isoDate,
} from '../helpers/clients';

/**
 * ══════════════════════════════════════════════════════════════════════════════════
 * SC-001. THE GUARANTEE THE WHOLE SCHEMA IS SHAPED AROUND.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * One room unit, one set of dates, 200 simultaneous claims. Exactly one may succeed.
 *
 * This is not a test of application logic. `room_occupancy` carries
 *
 *     exclude using gist (room_unit_id with =, stay_range with &&)
 *
 * and the constraint is what makes the answer correct under concurrency — a `select … where
 * not exists` check in the RPC would race no matter how carefully it was written. What this
 * suite proves is that every writer actually goes through that constraint.
 *
 * ⚠ PARAMETERISED OVER THE WRITER SET ON PURPOSE. FR-004, FR-037 and FR-037a are one
 * guarantee spanning four writers: a guest hold, an owner-created booking, an owner moving a
 * booking, and an owner placing a block. US4 and US6 EXTEND `WRITERS` below rather than
 * writing their own concurrency test — four separate tests would drift, and three of them
 * would quietly stop being run.
 *
 * The two exercised here are the two reachable in Foundational. The other two are listed with
 * their task numbers so the gap is visible rather than forgotten.
 */

type Writer = {
  name: string;
  /** Fires one claim. Resolves true when this caller won the unit. */
  claim: (ctx: Fixture, index: number) => Promise<boolean>;
};

type Fixture = {
  admin: SupabaseClient;
  anon: SupabaseClient;
  roomTypeId: string;
  roomUnitId: string;
  checkIn: string;
  checkOut: string;
};

const WRITERS: Writer[] = [
  {
    name: 'guest hold (write_booking hold)',
    claim: async (ctx) => {
      const { error } = await ctx.anon.rpc('write_booking', {
        p_action: 'hold',
        p_payload: {
          room_type_id: ctx.roomTypeId,
          check_in: ctx.checkIn,
          check_out: ctx.checkOut,
          guests: 2,
          guest_name: 'Concurrency Probe',
          guest_email: 'probe@example.com',
          guest_phone: '+63 900 000 0000',
        },
      });
      return !error;
    },
  },
  {
    name: 'direct occupancy insert (the constraint itself)',
    claim: async (ctx, index) => {
      // Inserts straight into room_occupancy with the service role, bypassing every RPC and
      // every RLS policy. If this ever lets two through, the constraint is not doing its job
      // and nothing built on top of it can be trusted.
      const { data: booking, error: bookingError } = await ctx.admin
        .from('bookings')
        .insert({
          room_unit_id: ctx.roomUnitId,
          booking_reference: `CNC${String(index).padStart(7, '0')}`,
          status: 'held',
          origin: 'owner',
          check_in: ctx.checkIn,
          check_out: ctx.checkOut,
          guests: 2,
          guest_name: 'Direct Probe',
          stay_total: 1000,
        })
        .select('id')
        .single();

      if (bookingError || !booking) return false;

      const { error } = await ctx.admin.from('room_occupancy').insert({
        room_unit_id: ctx.roomUnitId,
        source: 'booking',
        booking_id: booking.id,
        stay_range: `[${ctx.checkIn},${ctx.checkOut})`,
      });

      return !error;
    },
  },
  // US4  (T0xx) adds: owner create_confirmed
  // US6  (T0xx) adds: owner change_stay onto these dates
  // US6  (T0xx) adds: owner upsert_availability_block over these dates
];

const CLAIMS = 200;

describe.skipIf(!hasServiceRole)('SC-001 — one unit, one date range, many claimants', () => {
  const admin = serviceClient();
  const anon = anonClient();
  let roomTypeId = '';
  let roomUnitId = '';
  const slug = `concurrency-probe-${Date.now()}`;

  beforeAll(async () => {
    const { data: type, error: typeError } = await admin
      .from('room_types')
      .insert({
        name: 'Concurrency Probe',
        slug,
        max_occupancy: 4,
        base_nightly_rate: 1000,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (typeError) throw typeError;
    roomTypeId = type.id;

    // EXACTLY ONE UNIT. With two, two claims succeeding would be correct, and the test would
    // prove nothing.
    const { data: unit, error: unitError } = await admin
      .from('room_units')
      .insert({ room_type_id: roomTypeId, label: 'Probe Unit', sort_order: 0, active: true })
      .select('id')
      .single();
    if (unitError) throw unitError;
    roomUnitId = unit.id;
  });

  afterAll(async () => {
    if (!roomUnitId) return;
    await admin.from('bookings').delete().eq('room_unit_id', roomUnitId);
    await admin.from('room_occupancy').delete().eq('room_unit_id', roomUnitId);
    await admin.from('room_units').delete().eq('id', roomUnitId);
    await admin.from('room_types').delete().eq('id', roomTypeId);
  });

  for (const writer of WRITERS) {
    it(`${writer.name}: exactly one of ${CLAIMS} simultaneous claims succeeds`, async () => {
      const checkIn = isoDate(60 + WRITERS.indexOf(writer) * 10);
      const checkOut = isoDate(62 + WRITERS.indexOf(writer) * 10);
      const ctx: Fixture = { admin, anon, roomTypeId, roomUnitId, checkIn, checkOut };

      // Promise.all, not a loop — the point is that they are in flight together. Sequential
      // requests would pass against a naive check-then-insert and prove nothing.
      const results = await Promise.all(
        Array.from({ length: CLAIMS }, (_, i) => writer.claim(ctx, i)),
      );

      const winners = results.filter(Boolean).length;
      expect(winners).toBe(1);

      // …and the database agrees, not just the return values.
      const { count } = await admin
        .from('room_occupancy')
        .select('*', { count: 'exact', head: true })
        .eq('room_unit_id', roomUnitId)
        .overlaps('stay_range', `[${checkIn},${checkOut})`);

      expect(count).toBe(1);

      await admin.from('bookings').delete().eq('room_unit_id', roomUnitId);
      await admin.from('room_occupancy').delete().eq('room_unit_id', roomUnitId);
    });
  }

  /**
   * `[)` semantics: check-out is the morning the guest leaves, so the next guest may arrive
   * the same day. Proving ACCEPTANCE matters as much as proving refusal — a constraint that
   * refused this would cost the property a night on every turnover, and would look like
   * correct behaviour in a test that only checked overlaps are blocked.
   */
  it('accepts same-day turnover into the same unit', async () => {
    const first = { in: isoDate(120), out: isoDate(123) };
    const second = { in: isoDate(123), out: isoDate(126) };

    for (const [i, stay] of [first, second].entries()) {
      const { data: booking, error } = await admin
        .from('bookings')
        .insert({
          room_unit_id: roomUnitId,
          booking_reference: `TRN${String(i).padStart(7, '0')}`,
          status: 'confirmed',
          origin: 'owner',
          check_in: stay.in,
          check_out: stay.out,
          guests: 2,
          guest_name: 'Turnover Probe',
          stay_total: 1000,
        })
        .select('id')
        .single();
      expect(error).toBeNull();

      const { error: occError } = await admin.from('room_occupancy').insert({
        room_unit_id: roomUnitId,
        source: 'booking',
        booking_id: booking!.id,
        stay_range: `[${stay.in},${stay.out})`,
      });
      expect(occError).toBeNull();
    }

    await admin.from('bookings').delete().eq('room_unit_id', roomUnitId);
    await admin.from('room_occupancy').delete().eq('room_unit_id', roomUnitId);
  });
});

describe.skipIf(hasServiceRole)('SC-001', () => {
  it.skip(`skipped — ${missingCredentials}`, () => undefined);
});
