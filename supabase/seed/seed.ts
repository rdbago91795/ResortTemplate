// seed.ts — T051. The fictional demo property.
//
// Run:  pnpm seed
//
// Needs SUPABASE_SERVICE_ROLE_KEY. The service role bypasses RLS, which is exactly why this
// is a Node script and never anything the browser loads: the key must not reach frontend
// code (constitution IX). `pnpm seed` passes --env-file-if-exists=.env.local, and .env* is
// gitignored.
//
// WHAT THIS SEEDS ON TOP OF, NOT INSTEAD OF: migration 0038 installs the deployment baseline
// (settings singleton, branding, page sections, gallery categories, the three policies).
// This script adds the demo property. `pnpm seed:teardown` removes only what is here.
//
// BOOKINGS ARE WRITTEN DIRECTLY, NOT THROUGH write_booking. The RPC derives origin from the
// caller and refuses `hold` from an admin and `create_confirmed` from a guest — correct for
// real traffic, but it cannot produce a booking in every state on demand (FR-073). So the
// seed writes rows and their room_occupancy directly. The exclusion constraint still
// adjudicates: if the demo data overlaps itself, this script fails rather than producing a
// fixture that could not have arisen in real use.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ROOM_TYPES,
  RATE_OVERRIDES,
  DEMO_IMAGES,
  DEMO_SETTINGS,
  DEMO_STORAGE_BUCKET,
} from './demo.ts';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing credentials.\n' +
      '  SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
      '  Add SUPABASE_SERVICE_ROLE_KEY to .env.local — Dashboard > Project Settings > API.\n' +
      '  It is gitignored. Never put it in a VITE_ variable: that would ship it to the browser.',
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const IMAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'demo-assets');

/** Dates relative to today, so the demo is never stale. */
const day = (offset: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

const fail = (label: string, error: { message: string } | null): void => {
  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
    process.exit(1);
  }
};

async function main(): Promise<void> {
  console.log('Seeding Balai Amihan…\n');

  // ---- Settings and branding -------------------------------------------------------
  // The singleton already exists (migration 0038). This overwrites the placeholders.
  const { error: settingsError } = await db
    .from('site_settings')
    .update({ ...DEMO_SETTINGS, scarcity_threshold: 2 })
    .eq('id', true);
  fail('site_settings', settingsError);
  console.log('  ✓ settings point at the demo property');

  // ---- Room types and units ---------------------------------------------------------
  const typeIdBySlug = new Map<string, string>();

  for (const type of ROOM_TYPES) {
    const { data, error } = await db
      .from('room_types')
      .upsert(
        {
          slug: type.slug,
          name: type.name,
          description: type.description,
          bed_configuration: type.bedConfiguration,
          max_occupancy: type.maxOccupancy,
          base_nightly_rate: type.baseNightlyRate,
          sort_order: type.sortOrder,
          published_at: new Date().toISOString(),
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    fail(`room_type ${type.slug}`, error);
    typeIdBySlug.set(type.slug, data!.id);

    for (const [index, label] of type.units.entries()) {
      const { error: unitError } = await db
        .from('room_units')
        .upsert(
          { room_type_id: data!.id, label, sort_order: index, active: true },
          { onConflict: 'room_type_id,label' },
        );
      fail(`room_unit ${label}`, unitError);
    }
  }
  const unitCount = ROOM_TYPES.reduce((n, t) => n + t.units.length, 0);
  console.log(`  ✓ ${ROOM_TYPES.length} room types, ${unitCount} units`);

  // ---- Seasonal rates (FR-072) ------------------------------------------------------
  for (const override of RATE_OVERRIDES) {
    const startsOn = day(override.monthsAhead * 30);
    const { error } = await db.from('rate_overrides').insert({
      room_type_id: typeIdBySlug.get(override.roomTypeSlug),
      label: override.label,
      starts_on: startsOn,
      ends_on: day(override.monthsAhead * 30 + override.nights),
      nightly_rate: override.rate,
    });
    // An overlapping override is refused by an exclusion constraint. Ignore only that.
    if (error && !error.message.includes('rate_overrides_no_overlap')) {
      fail(`rate_override ${override.label}`, error);
    }
  }
  console.log(`  ✓ ${RATE_OVERRIDES.length} seasonal rate overrides`);

  // ---- Units, for placing bookings ---------------------------------------------------
  const { data: units, error: unitsError } = await db
    .from('room_units')
    .select('id, label, room_type_id')
    .order('sort_order');
  fail('read room_units', unitsError);

  const unitsOfType = (slug: string) =>
    units!.filter((u: { room_type_id: string }) => u.room_type_id === typeIdBySlug.get(slug));

  // ---- A booking in every state (FR-073) ---------------------------------------------
  //
  // Non-terminal bookings get a room_occupancy row and therefore hold their dates.
  // Cancelled and expired ones deliberately do NOT — that is what "the dates came back"
  // means, and a demo where a cancelled booking still blocked a room would be misleading.

  const bookings = [
    {
      ref: 'BAM1000001', unit: unitsOfType('kubo-garden')[0],
      status: 'confirmed', origin: 'online',
      checkIn: day(12), checkOut: day(15), guests: 2,
      name: 'Marisol Reyes', email: 'marisol.reyes@example.com', phone: '+63 917 555 0101',
      total: 9600, received: 4800, occupies: true,
    },
    {
      ref: 'BAM1000002', unit: unitsOfType('capiz-suite')[0],
      status: 'awaiting_verification', origin: 'online',
      checkIn: day(20), checkOut: day(23), guests: 2,
      name: 'Tomas Delgado', email: 'tomas.delgado@example.com', phone: '+63 918 555 0102',
      total: 14400, received: null, occupies: true,
      paymentReference: 'GC-8842-1190', holdHours: 48,
    },
    {
      ref: 'BAM1000003', unit: unitsOfType('beachfront-cabana')[0],
      status: 'held', origin: 'online',
      checkIn: day(31), checkOut: day(33), guests: 2,
      name: 'Aiko Tanaka', email: 'aiko.tanaka@example.com', phone: '+63 919 555 0103',
      total: 14400, received: null, occupies: true,
      holdMinutes: 22,
    },
    {
      ref: 'BAM1000004', unit: unitsOfType('amihan-loft')[0],
      status: 'cancelled', origin: 'online',
      checkIn: day(9), checkOut: day(11), guests: 4,
      name: 'Ruben Salcedo', email: 'ruben.salcedo@example.com', phone: '+63 920 555 0104',
      total: 13000, received: null, occupies: false,
    },
    {
      ref: 'BAM1000005', unit: unitsOfType('kubo-garden')[1],
      status: 'expired', origin: 'online',
      checkIn: day(6), checkOut: day(8), guests: 2,
      name: 'Grace Villanueva', email: 'grace.villanueva@example.com', phone: '+63 921 555 0105',
      total: 6400, received: null, occupies: false,
    },
    {
      // Owner-created: a phone booking. origin 'owner' exercises the other intake path (C4).
      ref: 'BAM1000006', unit: unitsOfType('family-bahay')[0],
      status: 'confirmed', origin: 'owner',
      checkIn: day(40), checkOut: day(45), guests: 6,
      name: 'The Ocampo family', email: 'ocampo.family@example.com', phone: '+63 922 555 0106',
      total: 47000, received: 47000, occupies: true,
    },
  ];

  for (const b of bookings) {
    if (!b.unit) continue;

    const holdExpiresAt =
      b.holdMinutes !== undefined
        ? new Date(Date.now() + b.holdMinutes * 60_000).toISOString()
        : b.holdHours !== undefined
          ? new Date(Date.now() + b.holdHours * 3_600_000).toISOString()
          : null;

    const { data: row, error } = await db
      .from('bookings')
      .upsert(
        {
          room_unit_id: b.unit.id,
          booking_reference: b.ref,
          status: b.status,
          origin: b.origin,
          check_in: b.checkIn,
          check_out: b.checkOut,
          guests: b.guests,
          guest_name: b.name,
          guest_email: b.email,
          guest_phone: b.phone,
          stay_total: b.total,
          amount_received: b.received,
          payment_reference: b.paymentReference ?? null,
          hold_expires_at: holdExpiresAt,
        },
        { onConflict: 'booking_reference' },
      )
      .select('id')
      .single();
    fail(`booking ${b.ref}`, error);

    if (b.occupies) {
      const { error: occError } = await db.from('room_occupancy').upsert(
        {
          room_unit_id: b.unit.id,
          source: 'booking',
          booking_id: row!.id,
          stay_range: `[${b.checkIn},${b.checkOut})`,
        },
        { onConflict: 'booking_id' },
      );
      fail(`occupancy for ${b.ref}`, occError);
    }

    const { error: eventError } = await db.from('booking_events').insert({
      booking_id: row!.id,
      event_type: 'created',
      new_values: { status: b.status, origin: b.origin },
    });
    fail(`booking_event for ${b.ref}`, eventError);
  }
  console.log(`  ✓ ${bookings.length} bookings covering every state`);

  // ---- A maintenance block, so availability is not uniformly open --------------------
  const blockUnit = unitsOfType('capiz-suite')[1];
  if (blockUnit) {
    const { data: block, error } = await db
      .from('availability_blocks')
      .insert({
        room_unit_id: blockUnit.id,
        reason: 'Repainting the ventanilla frames',
        starts_on: day(16),
        ends_on: day(19),
      })
      .select('id')
      .single();
    if (!error && block) {
      await db.from('room_occupancy').insert({
        room_unit_id: blockUnit.id,
        source: 'block',
        block_id: block.id,
        stay_range: `[${day(16)},${day(19)})`,
      });
      console.log('  ✓ one maintenance block');
    }
  }

  // ---- Imagery (T054 supplies the files) ---------------------------------------------
  const { data: categories } = await db.from('gallery_categories').select('id, slug');
  const categoryIdBySlug = new Map(
    (categories ?? []).map((c: { slug: string; id: string }) => [c.slug, c.id]),
  );

  let uploaded = 0;
  const missing: string[] = [];

  for (const [index, image] of DEMO_IMAGES.entries()) {
    let bytes: Buffer;
    try {
      bytes = await readFile(join(IMAGE_DIR, image.file));
    } catch {
      missing.push(image.file);
      continue;
    }

    const path = `demo/${image.file}`;
    const { error: uploadError } = await db.storage
      .from(DEMO_STORAGE_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    fail(`upload ${image.file}`, uploadError);

    const { error: imageError } = await db.from('gallery_images').upsert(
      {
        category_id: categoryIdBySlug.get(image.category),
        room_type_id: image.roomTypeSlug ? typeIdBySlug.get(image.roomTypeSlug) : null,
        storage_path: path,
        alt_text: image.alt,
        gallery_position: index,
        room_position: image.roomTypeSlug ? 0 : null,
        published_at: new Date().toISOString(),
      },
      { onConflict: 'storage_path' },
    );
    fail(`gallery_image ${image.file}`, imageError);
    uploaded += 1;
  }

  // ---- The placeholder payment QR (FR-076) -------------------------------------------
  //
  // Goes into payment-assets, which is PRIVATE and has no read policy for any role. Even
  // seeded, it is not reachable by URL — a guest sees it only through a signed URL issued
  // after their booking is confirmed (C8).
  try {
    const qr = await readFile(join(IMAGE_DIR, 'payment-qr-placeholder.png'));
    const { error } = await db.storage
      .from('payment-assets')
      .upload('demo/payment-qr-placeholder.png', qr, {
        contentType: 'image/png',
        upsert: true,
      });
    fail('upload payment QR', error);
    await db
      .from('site_settings')
      .update({ payment_qr_path: 'demo/payment-qr-placeholder.png' })
      .eq('id', true);
    console.log('  ✓ placeholder payment QR uploaded to payment-assets (private)');
  } catch {
    missing.push('payment-qr-placeholder.png');
  }

  if (uploaded > 0) console.log(`  ✓ ${uploaded} images uploaded to ${DEMO_STORAGE_BUCKET}`);
  if (missing.length > 0) {
    console.log(
      `  ! ${missing.length} image(s) not found in demo-assets/ and skipped:\n` +
        missing.map((m) => `      ${m}`).join('\n') +
        '\n    See demo-assets/README.md. The seed is otherwise complete.',
    );
  }

  console.log('\nDone. Run `pnpm seed:teardown` to remove everything above.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
