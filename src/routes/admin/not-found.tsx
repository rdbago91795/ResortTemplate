import { Stack } from '../../components/layout/Stack';
import { Heading } from '../../components/content/Heading';
import { Text } from '../../components/content/Text';
import { Button } from '../../components/primitives/Button';

/**
 * Admin 404 — T063d, FR-069c.
 *
 * ══════════════════════════════════════════════════════════════════════════════════
 * DELIBERATELY SAYS NOTHING ABOUT WHETHER THE RESOURCE EXISTS.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * This is the one place the two 404s must differ, and the difference is the whole point of
 * the task.
 *
 * The guest 404 is helpful because nothing behind it is secret. This one is not, because the
 * same page has to answer all three of:
 *
 *   - no such route
 *   - a booking id that does not exist
 *   - a booking id that DOES exist and which this session may not read
 *
 * If the third produced a different message from the second, the admin surface becomes an
 * oracle: someone with a session, or with a stolen link, could walk ids and learn which
 * bookings are real from the wording alone. So all three land here and read identically.
 *
 * Same reasoning as `get_booking_by_reference` (migration 0027), where a wrong reference and
 * a wrong email are indistinguishable by construction (FR-013b), and as `LockoutNotice`.
 *
 * No "request access" action either — there is exactly one account (FR-069g), so there is
 * nobody to request it from, and offering it would imply a resource worth requesting.
 */
export function AdminNotFound() {
  return (
    <Stack gap="lg" style={{ paddingBlock: '4rem', maxWidth: '40rem' }}>
      <Heading level={1} size="h4">
        Not available
      </Heading>

      <Text tone="secondary">
        This page isn&rsquo;t available. Use the menu to get back to your bookings.
      </Text>

      <Button type="button" variant="secondary" onClick={() => (window.location.href = '/admin/bookings')}>
        Go to bookings
      </Button>
    </Stack>
  );
}
