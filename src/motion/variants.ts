import type { Variants } from 'framer-motion';

/**
 * Named motion variants — design-system.md §7.
 *
 * CONSTITUTION VI: only `transform` and `opacity` animate. Every variant below obeys it,
 * so it is never a judgement call at the call site. Animating `width`, `top`, or `filter`
 * forces layout or paint and drops frames.
 *
 * Reduced motion is handled by `MotionConfig reducedMotion="user"` (see ./config.tsx),
 * which drops transforms and keeps opacity. Two things it does NOT cover and which are
 * handled by hand: Lenis must be destroyed (src/scroll/lenis.ts), and HoldTimer must stop
 * its continuous bar.
 */

export const ease = {
  standard: [0.2, 0, 0, 1],
  entrance: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
  emphasis: [0.34, 1.26, 0.64, 1],
} as const;

/**
 * SIGNATURE — capiz panes light in sequence. Opacity only.
 * There is no version of this motif that needs to animate width or filter, which is part
 * of why it earns its place (design-system.md §0).
 */
export const paneReveal: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.44, delay: i * 0.07, ease: ease.entrance },
  }),
};

/** Section content arriving on scroll. */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: ease.entrance } },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Route change. Short — this sits between the guest and what they came for. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: ease.entrance } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease: ease.exit } },
};

export const cardHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: ease.standard } },
  tap: { scale: 0.985, transition: { duration: 0.12, ease: ease.standard } },
};

/** Spread onto any pressable control. */
export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.12, ease: ease.standard },
} as const;

/** Image arrival. Scale masks the placeholder swap; never animate `filter`. */
export const blurUp: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease.entrance } },
};

/** Mobile booking sheet. */
export const sheetUp: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: ease.entrance } },
  exit: { opacity: 0, y: '100%', transition: { duration: 0.2, ease: ease.exit } },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: ease.standard } },
};

export const toastEnter: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: ease.emphasis } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: ease.exit } },
};

/** PaneBand draw-in. `scaleX` from the left — a transform, not a width. */
export const bandDraw: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.64, ease: ease.entrance } },
};

/** Skeletons. Opacity loop only. */
export const skeletonPulse = {
  animate: {
    opacity: [0.45, 0.85, 0.45],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
} as const;
