import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * `reducedMotion="user"` makes Framer drop transform animations and keep opacity, following
 * the OS preference (Principle VI).
 *
 * It does NOT cover two things, both handled by hand:
 *   - Lenis must be DESTROYED, not shortened — src/scroll/lenis.ts
 *   - HoldTimer must stop its continuous bar and let the number carry the signal
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
