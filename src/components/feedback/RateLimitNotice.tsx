import { InlineAlert } from './InlineAlert';
import { Link } from '../primitives/Link';

export type RateLimitNoticeProps = {
  retryAfterMinutes: number;
  /** How to reach a human when waiting is not acceptable — a real booking cannot wait. */
  fallbackContact?: { label: string; href: string };
};

/**
 * Too many attempts — design-system.md §5.4, FR-014.
 *
 * ALWAYS OFFERS A WAY THROUGH. Rate limiting protects the property from enumeration, but a
 * guest who mistyped their reference three times is not an attacker, and a booking site that
 * answers a real customer with a locked door and nothing else has cost the resort the sale
 * the rate limiter was protecting.
 *
 * The wait is stated in minutes rather than a countdown: a ticking timer invites staring at
 * it, and the number is approximate anyway.
 */
export function RateLimitNotice({ retryAfterMinutes, fallbackContact }: RateLimitNoticeProps) {
  return (
    <InlineAlert tone="warning" title="Too many attempts">
      Wait about {retryAfterMinutes} {retryAfterMinutes === 1 ? 'minute' : 'minutes'} and try
      again.
      {fallbackContact && (
        <>
          {' '}
          If you need help sooner, <Link href={fallbackContact.href}>{fallbackContact.label}</Link>.
        </>
      )}
    </InlineAlert>
  );
}
