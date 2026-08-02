import { describe, it, expect } from 'vitest';
import { serviceClient, hasServiceRole, missingCredentials } from '../helpers/clients';

/**
 * T066 / R16 — the register must cover every store of personal data.
 *
 * WHY THIS TEST EXISTS AT ALL: erasure and export both iterate `personal_data_stores` rather
 * than naming tables (migration 0032). That design was chosen because the naming approach
 * failed three separate times during specification — erasure missing `email_deliveries`, then
 * missing `enquiries` — and each obvious fix was to add the missing name to two requirements,
 * which would have failed again on the fourth store.
 *
 * The register removed that failure mode from the FUNCTIONS. It moved it, though: a new table
 * with a `guest_email` column and no register row is silently never erased and never
 * exported, and nothing in the schema notices. This test is what notices.
 *
 * A GAP HERE IS AN RA 10173 EXPOSURE, not a tidiness problem. Failing loudly at CI is the
 * cheapest place to find it.
 */

type Gap = { table_name: string; column_name: string };

describe.skipIf(!hasServiceRole)('T066 — personal data register coverage', () => {
  const admin = serviceClient();

  it('every column that looks like personal data is registered or explicitly allowlisted', async () => {
    const { data, error } = await admin.rpc('personal_data_register_gaps');
    expect(error).toBeNull();

    const gaps = (data ?? []) as Gap[];

    expect(
      gaps,
      gaps.length === 0
        ? ''
        : `Unregistered personal-data columns found. Either add a personal_data_stores row, ` +
          `or add an allowlist entry in migration 0040 with the reason:\n` +
          gaps.map((g) => `  ${g.table_name}.${g.column_name}`).join('\n'),
    ).toEqual([]);
  });

  /**
   * The register is only useful if every row in it is actionable. A row naming a table or a
   * column that no longer exists makes `erase_guest_data` fail at run time — inside the
   * privacy path, which is the worst place to discover a typo.
   */
  it('every registered table and column actually exists', async () => {
    const { data: stores, error } = await admin.from('personal_data_stores').select('*');
    expect(error).toBeNull();
    expect(stores?.length ?? 0).toBeGreaterThan(0);

    for (const store of stores ?? []) {
      const { error: tableError } = await admin
        .from(store.table_name)
        .select(
          [...store.personal_columns, store.key_column, store.retention_column].join(','),
        )
        .limit(1);

      expect(
        tableError,
        `personal_data_stores names ${store.table_name}(${store.personal_columns.join(', ')}) ` +
          `but selecting those columns failed: ${tableError?.message}`,
      ).toBeNull();
    }
  });

  /** Disposition drives whether erasure nulls or deletes. An unknown value would do neither. */
  it('every disposition is one the erasure function handles', async () => {
    const { data: stores } = await admin.from('personal_data_stores').select('disposition');
    for (const store of stores ?? []) {
      expect(['anonymise', 'delete']).toContain(store.disposition);
    }
  });

  /**
   * Retention needs a settings column to read its window from. A register row pointing at a
   * `site_settings` column that does not exist makes `apply_retention` fail on the nightly
   * cron, where nobody is watching.
   */
  it('every retention_setting names a real site_settings column', async () => {
    const { data: stores } = await admin
      .from('personal_data_stores')
      .select('table_name, retention_setting');
    const { data: settings } = await admin.from('site_settings').select('*').single();

    for (const store of stores ?? []) {
      expect(
        Object.keys(settings ?? {}),
        `${store.table_name} reads retention from site_settings.${store.retention_setting}, which does not exist`,
      ).toContain(store.retention_setting);
    }
  });
});

describe.skipIf(hasServiceRole)('T066', () => {
  it.skip(`skipped — ${missingCredentials}`, () => undefined);
});
