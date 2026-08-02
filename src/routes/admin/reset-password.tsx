import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { emailSchema } from '../../lib/schemas';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { Container } from '../../components/layout/Container';
import { Stack } from '../../components/layout/Stack';
import { Heading } from '../../components/content/Heading';
import { Text } from '../../components/content/Text';
import { InlineAlert } from '../../components/feedback/InlineAlert';

/**
 * ══════════════════════════════════════════════════════════════════════════════════
 * THE ONLY RECOVERY PATH THERE IS — FR-069h.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * FR-069g forbids disabling the owner account, and there is no second admin. If the owner
 * loses their password, this page is the entire recovery story. That makes it worth more care
 * than a reset form usually gets.
 *
 * ── 1. Email enumeration protection ──────────────────────────────────────────
 *
 * The response is IDENTICAL whether or not the address has an account, including when
 * Supabase returns an error. A form that says "no account with that email" tells an attacker
 * which address to spend their effort on — and with exactly one account in the system, that
 * is most of the work done for them.
 *
 * The error is swallowed deliberately. `LockoutNotice` takes the same line for the same
 * reason.
 *
 * ── 2. Redirect allowlist, no wildcards ──────────────────────────────────────
 *
 * `redirectTo` MUST be an exact URL that is also on Supabase's Redirect URLs allowlist
 * (Dashboard → Authentication → URL Configuration). A wildcard entry such as
 * `https://example.com/*` lets an open redirect anywhere on the origin carry the recovery
 * token to an attacker: the token arrives in the URL fragment, so anything that can read the
 * landing page can read it.
 *
 * The value is built from a compile-time constant, never from `window.location` or a query
 * parameter — deriving it from the current page is what turns an open redirect into account
 * takeover.
 *
 * ⚠ OPERATOR STEP, not a code change: add exactly this URL to the allowlist, and remove any
 * wildcard entries. Nothing in this file can enforce that.
 *
 * ── 3. Short, single-use token ───────────────────────────────────────────────
 *
 * Supabase recovery tokens are single-use and expire; the lifetime is a project setting
 * (Auth → Email → OTP expiry). Set it to an hour or less. The default is longer than this
 * account justifies.
 */
const RESET_REDIRECT = `${import.meta.env.VITE_SITE_URL ?? ''}/admin/reset-password/confirm`;

export function ResetPasswordRoute() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    setError(undefined);
    setBusy(true);

    // The result is intentionally discarded. See "email enumeration protection" above:
    // success and failure must be indistinguishable to the person at the keyboard.
    await supabase.auth
      .resetPasswordForEmail(parsed.data, { redirectTo: RESET_REDIRECT })
      .catch(() => undefined);

    setBusy(false);
    setSent(true);
  }

  return (
    <Container size="prose">
      <Stack gap="lg" style={{ paddingBlock: '4rem' }}>
        <Heading level={1} size="h3">
          Reset your password
        </Heading>

        {sent ? (
          <InlineAlert tone="info" title="Check your email">
            If an account exists for that address, a reset link is on its way. The link works
            once and expires shortly — request another if it has been a while.
          </InlineAlert>
        ) : (
          <>
            <Text tone="secondary">
              Enter the email address for the property&rsquo;s account and we will send a link to
              set a new password.
            </Text>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
              noValidate
            >
              <Stack gap="lg">
                <Input
                  id="reset-email"
                  label="Email address"
                  type="email"
                  autoComplete="username"
                  value={email}
                  error={error}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" loading={busy}>
                  Send reset link
                </Button>
              </Stack>
            </form>
          </>
        )}
      </Stack>
    </Container>
  );
}
