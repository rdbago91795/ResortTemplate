import { Container } from './Container';
import { Logo } from '../content/Logo';
import type { LogoAssets } from '../content/logoAssets';
import type { NavItem } from './navigation';
import * as s from './navigation.css';

export type SiteFooterProps = {
  assets: LogoAssets;
  /** All three, always. US11 scenario 5 is explicit that the footer is where they live. */
  policies: NavItem[];
  primary: NavItem[];
  contact: {
    address: string;
    phone: string;
    email: string;
  };
};

/**
 * Contact, policies, and business identity — design-system.md §5.6, FR-051.
 *
 * ⚠ ALL THREE POLICIES, ON EVERY PAGE. US11 scenario 5: "Given any page of the site, when a
 * guest looks at the footer, then all three policies are reachable." They are legally
 * required (FR-057, FR-059), which is also why they cannot be deleted — `page_kind='policy'`
 * has no delete path in the admin.
 *
 * The address and phone use `address` and `tel:` markup rather than plain text, so a guest on
 * a phone taps to call and a screen reader announces the block as contact information.
 */
export function SiteFooter({ assets, policies, primary, contact }: SiteFooterProps) {
  return (
    <footer className={s.footer}>
      <Container>
        <div className={s.footerGrid}>
          <div>
            <Logo assets={assets} variant="inverse" linkToHome={false} />
            <address className={s.footerBottom} style={{ fontStyle: 'normal', marginBlockStart: 0 }}>
              {contact.address}
              <br />
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={s.footerLink}>
                {contact.phone}
              </a>
              <br />
              <a href={`mailto:${contact.email}`} className={s.footerLink}>
                {contact.email}
              </a>
            </address>
          </div>

          <nav aria-label="Site">
            <p className={s.footerHeading}>Explore</p>
            <ul className={s.footerList}>
              {primary.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={s.footerLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Policies">
            <p className={s.footerHeading}>Policies</p>
            <ul className={s.footerList}>
              {policies.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={s.footerLink}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={s.footerBottom}>
          © {new Date().getFullYear()} {assets.propertyName}
        </p>
      </Container>
    </footer>
  );
}
