import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SiteHeader } from '../../components/layout/SiteHeader';
import { SiteFooter } from '../../components/layout/SiteFooter';
import { buildGuestNav } from '../../components/layout/navigation';
import type { PublishedPage } from '../../components/layout/navigation';
import type { LogoAssets } from '../../components/content/logoAssets';
import { applyBranding, isValidBranding } from '../../brand/applyBranding';
import type { Branding } from '../../brand/applyBranding';
import { startLenis, stopLenis } from '../../scroll/lenis';
import * as s from './layout.css';

export type GuestLayoutProps = {
  assets: LogoAssets;
  branding: Branding;
  pages: PublishedPage[];
  contact: { address: string; phone: string; email: string };
  currentPath?: string;
  /** Home page over a hero. Header transparency is still DERIVED — see SiteHeader. */
  preferTransparentHeader?: boolean;
  children: ReactNode;
};

/**
 * The shell around every guest route — T063c.
 *
 * ⚠ NOT WIRED TO A ROUTER, because none is chosen. `plan.md` names no routing library, and
 * the `_layout` filename is a convention borrowed from file-based routers rather than a
 * commitment to one. This is a component that takes `children`, so any router can mount it —
 * and US1 (T071 onward) is where the route table is built and the choice has to be made.
 *
 * Three things it owns, all of which would otherwise be duplicated per route:
 *
 *   1. BRANDING, applied once. `applyBranding` uses `setElementVars`, never
 *      `assignInlineVars` — see that file for why the difference is a silent CSP failure.
 *   2. LENIS, started here and destroyed on unmount. Desktop guest routes only: the admin
 *      never gets smooth scroll, and `startLenis` itself refuses under reduced motion
 *      (Principle VI requires it fully disabled, not shortened).
 *   3. THE MENU, built once by `buildGuestNav` so header and footer cannot disagree about
 *      what is reachable (FR-050e).
 */
export function GuestLayout({
  assets,
  branding,
  pages,
  contact,
  currentPath,
  preferTransparentHeader = false,
  children,
}: GuestLayoutProps) {
  useEffect(() => {
    if (isValidBranding(branding)) applyBranding(branding);
  }, [branding]);

  useEffect(() => {
    startLenis();
    return () => stopLenis();
  }, []);

  const { primary, policies } = buildGuestNav(pages);

  return (
    <div className={s.frame}>
      {/* First in tab order. Styled by the global `.skip-link` rule (global.css.ts §11.2). */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <SiteHeader
        assets={assets}
        items={primary}
        currentPath={currentPath}
        preferTransparent={preferTransparentHeader}
      />

      <main id="main" className={s.main}>
        {children}
      </main>

      <SiteFooter assets={assets} primary={primary} policies={policies} contact={contact} />
    </div>
  );
}
