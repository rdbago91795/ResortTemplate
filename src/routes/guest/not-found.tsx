import { Container } from '../../components/layout/Container';
import { Stack } from '../../components/layout/Stack';
import { Heading } from '../../components/content/Heading';
import { Text } from '../../components/content/Text';
import { Button } from '../../components/primitives/Button';
import { Link } from '../../components/primitives/Link';
import type { NavItem } from '../../components/layout/navigation';

export type GuestNotFoundProps = {
  /** Somewhere to go instead — the structural destinations, which always exist. */
  suggestions?: NavItem[];
};

/**
 * Guest 404 — T063d, FR-047 and FR-049b.
 *
 * ⚠ REACHED BY UNPUBLISHING, NOT ONLY BY MISTYPING. A content page that is unpublished
 * (FR-047a) or deleted (FR-049b) stops resolving, and any link a guest already has — from a
 * message, a bookmark, a search result — lands here. That is the common case, not the rare
 * one, so this page is written for someone who followed a link that used to work rather than
 * someone who typed a URL badly.
 *
 * Hence: no blame, no "check the address", and real destinations rather than a bare "go
 * home". FR-050e is the same principle applied to internal links — nothing on the site should
 * point at something a guest cannot reach; this page catches the links that are not ours.
 *
 * The availability search is offered because it is the one thing every visitor came for, and
 * FR-050c makes it the one section guaranteed to exist.
 */
export function GuestNotFound({ suggestions = [] }: GuestNotFoundProps) {
  return (
    <Container size="prose">
      <Stack gap="lg" style={{ paddingBlock: '5rem' }}>
        <Heading level={1} size="h3">
          That page isn&rsquo;t here
        </Heading>

        <Text tone="secondary">
          It may have been taken down, or the link may be out of date. Everything else is still
          where it was.
        </Text>

        <Button type="button" onClick={() => (window.location.href = '/')}>
          Check availability
        </Button>

        {suggestions.length > 0 && (
          <Stack gap="xs" as="nav" aria-label="Suggested pages">
            {suggestions.map((item) => (
              <Link key={item.href} href={item.href} underline="hover">
                {item.label}
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
