import { useState } from 'react';
import { Container } from './Container';
import { MobileNav } from './MobileNav';
import { IconButton } from '../primitives/IconButton';
import { Logo } from '../content/Logo';
import { canUseTransparentHeader } from '../content/logoAssets';
import type { LogoAssets } from '../content/logoAssets';
import type { NavItem } from './navigation';
import * as s from './navigation.css';

export type SiteHeaderProps = {
  assets: LogoAssets;
  items: NavItem[];
  currentPath?: string;
  sticky?: boolean;
  /**
   * The page wants a transparent header over a hero. It is a REQUEST, not a decision — see
   * below.
   */
  preferTransparent?: boolean;
};

/**
 * Guest header — design-system.md §5.6.
 *
 * ⚠ TRANSPARENCY IS DERIVED, NEVER PASSED (§3.5). `preferTransparent` says what the page
 * would like; `canUseTransparentHeader` decides, and it says no unless an inverse logo
 * exists.
 *
 * The reason is concrete: a transparent header sits over a hero photograph, which is usually
 * dark. A property that has not uploaded an inverse logo has only its dark primary one, and
 * rendering that on a dark photograph makes the property's own name invisible on its own home
 * page. Deriving it means no call site can opt into that by passing the wrong flag — the
 * asset's existence is the condition.
 */
export function SiteHeader({
  assets,
  items,
  currentPath,
  sticky = true,
  preferTransparent = false,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const transparent = preferTransparent && canUseTransparentHeader(assets);
  const classes = [s.header, s.headerTone[transparent ? 'transparent' : 'solid']]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <header className={classes} style={sticky ? undefined : { position: 'static' }}>
        <Container>
          <div className={s.headerInner}>
            <Logo assets={assets} variant={transparent ? 'inverse' : 'primary'} />

            <nav className={s.desktopNav} aria-label="Site">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={s.navLink}
                  aria-current={currentPath === item.href ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <IconButton
              type="button"
              label="Open menu"
              className={s.menuButton}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </IconButton>
          </div>
        </Container>
      </header>

      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        currentPath={currentPath}
        title={assets.propertyName}
      />
    </>
  );
}
