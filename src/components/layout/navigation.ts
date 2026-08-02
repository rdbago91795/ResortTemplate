/**
 * The navigation model, shared by `SiteHeader`, `MobileNav`, and `SiteFooter`.
 *
 * FR-051 fixes five STRUCTURAL destinations that are not content pages: home,
 * accommodations, gallery, location and contact, and the three policies. FR-051a then adds
 * every published content page automatically (C9) — the owner publishes, and the entry
 * appears, with no separate menu screen to keep in step (FR-051b).
 *
 * Keeping both in one type is what makes FR-050e checkable: a link must never point at
 * something a guest cannot reach, and that is far easier to guarantee when one function
 * builds the whole menu than when each surface assembles its own.
 */
export type NavItem = {
  href: string;
  label: string;
  /** Structural links are fixed; content links come from `content_pages` (FR-051a). */
  kind: 'structural' | 'content' | 'policy';
};

/** FR-051. Deliberately not configurable — these exist on every deployment. */
export const STRUCTURAL_NAV: NavItem[] = [
  { href: '/', label: 'Home', kind: 'structural' },
  { href: '/accommodations', label: 'Rooms', kind: 'structural' },
  { href: '/gallery', label: 'Gallery', kind: 'structural' },
  { href: '/location', label: 'Location', kind: 'structural' },
];

export type PublishedPage = {
  slug: string;
  menuLabel: string | null;
  title: string;
  menuPosition: number;
  pageKind: 'content' | 'policy';
};

/**
 * Builds the guest menu.
 *
 * Policies are excluded from the main menu and rendered in the footer instead (FR-051, US11
 * scenario 5: "all three policies are reachable" from the footer). Putting them in the header
 * alongside Rooms and Gallery would push the things a guest came for off a phone screen.
 *
 * FR-051c: the caller warns above `MENU_WARN_AT` but is never prevented from publishing —
 * automatic navigation grows without limit by design.
 */
export const MENU_WARN_AT = 8;

export function buildGuestNav(pages: PublishedPage[]): {
  primary: NavItem[];
  policies: NavItem[];
  overflowing: boolean;
} {
  const content = pages
    .filter((page) => page.pageKind === 'content')
    .sort((a, b) => a.menuPosition - b.menuPosition)
    .map<NavItem>((page) => ({
      href: `/${page.slug}`,
      label: page.menuLabel || page.title,
      kind: 'content',
    }));

  const policies = pages
    .filter((page) => page.pageKind === 'policy')
    .sort((a, b) => a.menuPosition - b.menuPosition)
    .map<NavItem>((page) => ({
      href: `/${page.slug}`,
      label: page.menuLabel || page.title,
      kind: 'policy',
    }));

  const primary = [...STRUCTURAL_NAV, ...content];

  return { primary, policies, overflowing: primary.length > MENU_WARN_AT };
}

/**
 * The eleven admin destinations — T063 exists because the design system defines `AdminShell`'s
 * `nav` prop but nothing supplies it, and without this the eleven routes cannot be reached
 * from one another.
 */
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/bookings', label: 'Bookings', kind: 'structural' },
  { href: '/admin/enquiries', label: 'Enquiries', kind: 'structural' },
  { href: '/admin/rooms', label: 'Rooms', kind: 'structural' },
  { href: '/admin/rates', label: 'Rates', kind: 'structural' },
  { href: '/admin/availability', label: 'Availability', kind: 'structural' },
  { href: '/admin/gallery', label: 'Gallery', kind: 'structural' },
  { href: '/admin/content', label: 'Pages', kind: 'structural' },
  { href: '/admin/sections', label: 'Home layout', kind: 'structural' },
  { href: '/admin/branding', label: 'Branding', kind: 'structural' },
  { href: '/admin/settings', label: 'Settings', kind: 'structural' },
  { href: '/admin/privacy', label: 'Guest data', kind: 'structural' },
];
