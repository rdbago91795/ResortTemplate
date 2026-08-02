import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * These suites talk to the real database. There is no mock layer and deliberately so — every
 * guarantee they check (an exclusion constraint, an RLS policy, a register) lives in Postgres,
 * and a mock would assert that the mock behaves, which is worth nothing.
 *
 * `environment: 'node'` because none of them touch the DOM.
 *
 * Credentials come from `.env.local` via `loadEnv`, the same file `pnpm seed` reads. The
 * suites skip themselves with a clear message when the service-role key is absent rather than
 * failing with a connection error.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      // The concurrency suite fires 200 requests; the default 5s is not enough on a
      // free-tier project in another region.
      testTimeout: 60_000,
      hookTimeout: 60_000,
      // Suites share fixtures in one database, so they must not interleave.
      fileParallelism: false,
      env: {
        SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
        SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || '',
      },
    },
  };
});
