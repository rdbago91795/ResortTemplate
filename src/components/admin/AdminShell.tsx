import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../primitives/Button';
import { IconButton } from '../primitives/IconButton';
import { MobileNav } from '../layout/MobileNav';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { InlineAlert } from '../feedback/InlineAlert';
import { ADMIN_NAV } from '../layout/navigation';
import type { NavItem } from '../layout/navigation';
import { useIdleTimeout } from './useIdleTimeout';
import * as s from './admin.css';

export type AdminShellProps = {
  /** Defaults to all eleven destinations — see the note below. */
  nav?: NavItem[];
  currentPath?: string;
  user: { email: string };
  propertyName: string;
  /** `site_settings.session_idle_minutes` (FR-069d). */
  idleMinutes: number;
  onSignOut: () => void;
  children: ReactNode;
};

/**
 * The admin frame — design-system.md §5.6, T063.
 *
 * ⚠ THIS TASK EXISTS BECAUSE THE DESIGN SYSTEM DEFINES `nav` AND NOTHING SUPPLIED IT. The
 * eleven admin routes could not otherwise be reached from one another — each would be a URL
 * you had to know. `ADMIN_NAV` (components/layout/navigation.ts) is that list, and it is the
 * default here so no route can mount the shell with a partial menu.
 *
 * Sidebar above 1024px, drawer below — the same `MobileNav` the guest side uses, so the focus
 * trap is not written twice.
 *
 * FR-069d–f in three parts:
 *   - `useIdleTimeout` counts inactivity against the owner's own setting
 *   - the warning is a dialog with a "Stay signed in" action, not a silent sign-out
 *   - `onSignOut` is the caller's, because ending a session is `supabase.auth.signOut()` plus
 *     whatever navigation the (still unchosen) router does
 */
export function AdminShell({
  nav = ADMIN_NAV,
  currentPath,
  user,
  propertyName,
  idleMinutes,
  onSignOut,
  children,
}: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { state, secondsRemaining, stayActive } = useIdleTimeout(idleMinutes, onSignOut);

  return (
    <div className={s.shell}>
      <nav className={s.sidebar} aria-label="Admin">
        <div className={s.sidebarBrand}>
          <strong>{propertyName}</strong>
        </div>
        {nav.map((item) => (
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

      <header className={s.topbar}>
        <IconButton
          type="button"
          label="Open menu"
          className={s.menuButton}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </IconButton>

        <span className={s.userChip}>
          <span>{user.email}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </span>
      </header>

      <main className={s.main}>
        {state === 'warning' && (
          <InlineAlert tone="warning" title="You will be signed out shortly">
            No activity for a while. Signing out in {secondsRemaining} seconds.
          </InlineAlert>
        )}
        {children}
      </main>

      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={nav}
        currentPath={currentPath}
        title="Admin"
      />

      <ConfirmDialog
        open={state === 'warning'}
        title="Still there?"
        body={`You have been inactive, so this session will end in ${secondsRemaining} seconds. Anything unsaved will be lost.`}
        confirmLabel="Stay signed in"
        cancelLabel="Sign out now"
        tone="primary"
        onConfirm={stayActive}
        onCancel={onSignOut}
      />
    </div>
  );
}
