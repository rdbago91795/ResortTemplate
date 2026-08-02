// teardown.ts — T052. Removes everything seed.ts created, and nothing else.
//
// Run:  pnpm seed:teardown
//
// TWO THINGS IT MUST NOT TOUCH:
//
//   1. The deployment baseline from migration 0038 — settings singleton, branding, page
//      sections, gallery categories, the three policy pages, amenities, activities. Tearing
//      down the demo must leave a site that still works, not one that raises
//      `settings_missing` on the next request. Settings are RESET to the 0038 placeholders
//      rather than deleted.
//
//   2. The local demo-assets/ directory. Those files are T054's input, checked into the
//      repo. This removes the uploaded OBJECTS in the demo-assets bucket, not the sources —
//      otherwise re-running the seed after a teardown would have nothing to upload.
//
// Re-running the seed after this must leave no orphaned objects (FR-075), which is why
// storage is cleared by listing the bucket rather than by replaying the DEMO_IMAGES list: a
// file removed from that list between runs would otherwise be stranded in the bucket forever.

import { createClient } from '@supabase/supabase-js';
import { ROOM_TYPE_SLUGS, DEMO_STORAGE_BUCKET, BASELINE_SETTINGS } from './demo.ts';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing credentials. SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY ' +
      'must be set. See .env.example.',
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const fail = (label: string, error: { message: string } | null): void => {
  if (error) {
    console.error(`  ✗ ${label}: ${error.message}`);
    process.exit(1);
  }
};

async function main(): Promise<void> {
  console.log('Removing the demo property…\n');

  // ---- Storage: list what is actually there, not what we think we uploaded -----------
  const { data: objects, error: listError } = await db.storage
    .from(DEMO_STORAGE_BUCKET)
    .list('demo', { limit: 1000 });
  fail('list demo objects', listError);

  if (objects && objects.length > 0) {
    const paths = objects.map((o: { name: string }) => `demo/${o.name}`);
    const { error } = await db.storage.from(DEMO_STORAGE_BUCKET).remove(paths);
    fail('remove demo objects', error);
    console.log(`  ✓ ${paths.length} storage objects removed from ${DEMO_STORAGE_BUCKET}`);
  } else {
    console.log('  · no storage objects to remove');
  }

  // The placeholder QR lives in the private payment-assets bucket, not demo-assets.
  const { data: qrObjects } = await db.storage.from('payment-assets').list('demo', { limit: 100 });
  if (qrObjects && qrObjects.length > 0) {
    const { error } = await db.storage
      .from('payment-assets')
      .remove(qrObjects.map((o: { name: string }) => `demo/${o.name}`));
    fail('remove demo payment QR', error);
    await db.from('site_settings').update({ payment_qr_path: null }).eq('id', true);
    console.log(`  ✓ ${qrObjects.length} object(s) removed from payment-assets`);
  }

  const { error: imagesError } = await db
    .from('gallery_images')
    .delete()
    .like('storage_path', 'demo/%');
  fail('delete gallery_images', imagesError);
  console.log('  ✓ gallery image rows removed (categories kept — they are baseline)');

  // ---- Find the demo room types and their units --------------------------------------
  const { data: types, error: typesError } = await db
    .from('room_types')
    .select('id')
    .in('slug', [...ROOM_TYPE_SLUGS]);
  fail('read room_types', typesError);

  const typeIds = (types ?? []).map((t: { id: string }) => t.id);

  if (typeIds.length === 0) {
    console.log('  · no demo room types found — nothing further to remove');
  } else {
    const { data: units, error: unitsError } = await db
      .from('room_units')
      .select('id')
      .in('room_type_id', typeIds);
    fail('read room_units', unitsError);

    const unitIds = (units ?? []).map((u: { id: string }) => u.id);

    if (unitIds.length > 0) {
      // Bookings cascade to room_occupancy, booking_events, and email_deliveries.
      const { error } = await db.from('bookings').delete().in('room_unit_id', unitIds);
      fail('delete bookings', error);

      // Blocks cascade to their own room_occupancy rows.
      const { error: blockError } = await db
        .from('availability_blocks')
        .delete()
        .in('room_unit_id', unitIds);
      fail('delete availability_blocks', blockError);

      // Belt and braces: room_units is RESTRICTed by room_occupancy, so a stray row would
      // block the next step with a foreign-key error rather than a clear message.
      const { error: occError } = await db
        .from('room_occupancy')
        .delete()
        .in('room_unit_id', unitIds);
      fail('delete room_occupancy', occError);

      console.log('  ✓ bookings, blocks, and occupancy removed');
    }

    const { error: overridesError } = await db
      .from('rate_overrides')
      .delete()
      .in('room_type_id', typeIds);
    fail('delete rate_overrides', overridesError);

    const { error: unitDeleteError } = await db
      .from('room_units')
      .delete()
      .in('room_type_id', typeIds);
    fail('delete room_units', unitDeleteError);

    const { error: typeDeleteError } = await db.from('room_types').delete().in('id', typeIds);
    fail('delete room_types', typeDeleteError);

    console.log(`  ✓ ${typeIds.length} room types, their units and rates removed`);
  }

  // ---- Settings back to the deployment placeholders ----------------------------------
  const { error: settingsError } = await db
    .from('site_settings')
    .update({ ...BASELINE_SETTINGS, scarcity_threshold: 2 })
    .eq('id', true);
  fail('reset site_settings', settingsError);
  console.log('  ✓ settings reset to the deployment placeholders');

  console.log('\nDone. The baseline (policies, sections, categories, branding) is untouched.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
