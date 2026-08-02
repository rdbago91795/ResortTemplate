import { describe, it, expect } from 'vitest';
import { serviceClient, hasServiceRole, missingCredentials } from '../helpers/clients';

/**
 * T067 — security-baseline.md §1.5, run as a test instead of by hand before every deploy.
 *
 * ══════════════════════════════════════════════════════════════════════════════════
 * THE BASELINE'S QUERY DOES NOT PASS AGAINST A CORRECT SCHEMA, AND THAT IS A REAL
 * DISCREPANCY RATHER THAN A BUG IN EITHER.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * §1.5 requires an empty result and lists "RLS enabled but zero policies" as a finding,
 * describing it as "a silent full-deny that presents as a mysteriously empty page".
 *
 * That is true of a table a client is meant to read. It is exactly the INTENDED state of an
 * RLS-P4 server-only table: `admin_users`, `personal_data_stores`, `rate_limit_events` and
 * `webhook_events` are reachable only through `security definer` functions, and giving any of
 * them a client policy would widen access rather than fix anything.
 *
 * So the allowlist below is not the test being lenient — it is the one place the two readings
 * are reconciled, in the open, with the reason attached. Any OTHER table in that state is a
 * genuine finding and fails.
 *
 * Flagged for the baseline to be amended: §1.5 should carve out P4 tables explicitly.
 */
const DELIBERATE_DENY_ALL = new Set([
  'admin_users', // RLS-P4. Reached only via is_admin() / has_role(), both security definer.
  'personal_data_stores', // RLS-P4. Read by erase_guest_data and apply_retention only.
  'rate_limit_events', // RLS-P4. Written by check_rate_limit; a client must never read it.
  'webhook_events', // RLS-P4. Written by the email webhook with the service role.
]);

type Finding = { relname: string; problem: string };

describe.skipIf(!hasServiceRole)('T067 — RLS schema audit', () => {
  const admin = serviceClient();

  it('reports no findings beyond the deliberate server-only tables', async () => {
    const { data, error } = await admin.rpc('rls_audit');
    expect(error).toBeNull();

    const findings = (data ?? []) as Finding[];

    const real = findings.filter(
      (f) =>
        !(f.problem === 'RLS enabled but zero policies' && DELIBERATE_DENY_ALL.has(f.relname)),
    );

    expect(
      real,
      `Unexpected RLS findings:\n${real.map((f) => `  ${f.relname}: ${f.problem}`).join('\n')}`,
    ).toEqual([]);
  });

  /**
   * The allowlist must not rot. If a P4 table gains a policy, or is dropped, the entry is
   * stale and the next person to read this file would be misled about why it is here.
   */
  it('every allowlisted table is still in the deny-all state the allowlist claims', async () => {
    const { data } = await admin.rpc('rls_audit');
    const findings = (data ?? []) as Finding[];

    const actuallyDenyAll = new Set(
      findings.filter((f) => f.problem === 'RLS enabled but zero policies').map((f) => f.relname),
    );

    for (const table of DELIBERATE_DENY_ALL) {
      expect(
        actuallyDenyAll.has(table),
        `${table} is allowlisted as deliberately deny-all but no longer is. Remove it from the allowlist.`,
      ).toBe(true);
    }
  });

  it('no table has RLS disabled', async () => {
    const { data } = await admin.rpc('rls_audit');
    const findings = (data ?? []) as Finding[];
    expect(findings.filter((f) => f.problem === 'RLS not enabled')).toEqual([]);
  });
});

describe.skipIf(hasServiceRole)('T067', () => {
  it.skip(`skipped — ${missingCredentials}`, () => undefined);
});
