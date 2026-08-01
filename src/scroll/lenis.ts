import Lenis from 'lenis';

/**
 * Smooth scroll — design-system.md §8.
 *
 * Lenis is OFF in three cases, and each is a deliberate decision rather than an oversight:
 *
 *   1. `prefers-reduced-motion: reduce` — DESTROYED, not shortened. Principle VI says so
 *      explicitly. Setting `duration: 0` would leave the wheel handler installed and still
 *      intercepting, which is not "disabled".
 *   2. Touch-primary devices — smoothed touch fights native momentum and reads as LAG on a
 *      mid-range Android. Under Principle VII, mobile perception beats desktop refinement.
 *   3. Every `/admin` route — the admin is a tool. Nobody wants their bookings table to
 *      glide, and it makes long tables feel slower to reach.
 *
 * So in practice: desktop guest marketing pages only.
 *
 * ⚠ `position: sticky` — Lenis v1 scrolls the window by default, so sticky survives. It
 * breaks when Lenis is given a custom wrapper carrying a transform, because a transformed
 * ancestor becomes the containing block and sticky silently stops sticking. Do not wrap the
 * app in a transformed container, and verify every sticky element with Lenis active.
 */

const options = {
  duration: 1.1,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,
  wheelMultiplier: 1,
  gestureOrientation: 'vertical' as const,
};

let instance: Lenis | null = null;
let rafId: number | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isTouchPrimary(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/** Returns true when Lenis actually started. */
export function startLenis(pathname: string = window.location.pathname): boolean {
  if (instance) return true;
  if (prefersReducedMotion() || isTouchPrimary() || isAdminRoute(pathname)) return false;

  instance = new Lenis(options);

  const raf = (time: number) => {
    instance?.raf(time);
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);

  return true;
}

export function stopLenis(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  instance?.destroy();
  instance = null;
}

export function getLenis(): Lenis | null {
  return instance;
}
