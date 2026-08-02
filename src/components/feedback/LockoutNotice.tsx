import { InlineAlert } from './InlineAlert';

export type LockoutNoticeProps = {
  retryAfterMinutes: number;
};

/**
 * Auth lockout — design-system.md §5.4, FR-069.
 *
 * Deliberately says nothing about whether the email exists, whether the password was close,
 * or how many attempts remain. This is the sign-in surface for the property's ONLY account
 * (FR-069g forbids disabling it, and there is no second admin), so every extra word here is
 * a word an attacker can use to tell "wrong password" from "no such account".
 *
 * No fallback contact either, unlike `RateLimitNotice`: the person locked out of the admin is
 * the person the contact details would reach.
 */
export function LockoutNotice({ retryAfterMinutes }: LockoutNoticeProps) {
  return (
    <InlineAlert tone="danger" title="Sign-in temporarily locked">
      Too many sign-in attempts. Try again in about {retryAfterMinutes}{' '}
      {retryAfterMinutes === 1 ? 'minute' : 'minutes'}.
    </InlineAlert>
  );
}
