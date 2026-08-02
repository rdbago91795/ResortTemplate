import { useEffect, useRef, useState } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'focus'] as const;

export type IdleState = 'active' | 'warning' | 'expired';

/**
 * Idle timeout for the admin session — FR-069d–f.
 *
 * `idleMinutes` comes from `site_settings.session_idle_minutes`, not a constant: the owner
 * sets it, and a resort where the laptop sits on a reception desk wants something very
 * different from one where it lives in a locked office.
 *
 * ⚠ THIS IS A COURTESY, NOT A SECURITY BOUNDARY. It signs the browser out; it cannot expire
 * the JWT, which stays valid until Supabase says otherwise. Anyone treating this as the
 * control that protects the admin has the threat model wrong — the real boundary is RLS plus
 * token lifetime, and this reduces the window in which an unattended screen is usable.
 *
 * The warning fires a minute before the end so the owner can stay signed in mid-task. Signing
 * someone out silently while they are typing a booking note is how work gets lost.
 */
export function useIdleTimeout(
  idleMinutes: number,
  onExpire: () => void,
  warningSeconds = 60,
): { state: IdleState; secondsRemaining: number; stayActive: () => void } {
  const [state, setState] = useState<IdleState>('active');
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  // Both refs start empty and are filled in effects. `useRef(Date.now())` would call an
  // impure function during render, and assigning `expireRef.current` during render mutates a
  // ref while React is rendering — the compiler's purity and refs rules both reject it, and
  // in Strict Mode the double render makes the second one genuinely wrong.
  const lastActivity = useRef<number>(0);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    lastActivity.current = Date.now();

    function markActive() {
      lastActivity.current = Date.now();
      setState((current) => (current === 'active' ? current : 'active'));
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }

    const idleMs = idleMinutes * 60_000;
    const warnMs = warningSeconds * 1000;

    // One interval rather than a chain of timeouts: a laptop that sleeps freezes timeouts,
    // and polling elapsed time gets the right answer on wake instead of resuming a stale one.
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;

      if (elapsed >= idleMs) {
        setState('expired');
        expireRef.current();
      } else if (elapsed >= idleMs - warnMs) {
        setState('warning');
        setSecondsRemaining(Math.max(0, Math.ceil((idleMs - elapsed) / 1000)));
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive);
    };
  }, [idleMinutes, warningSeconds]);

  return {
    state,
    secondsRemaining,
    stayActive: () => {
      lastActivity.current = Date.now();
      setState('active');
    },
  };
}
