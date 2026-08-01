import { globalStyle } from '@vanilla-extract/css';
import { vars } from './contract.css';
import { media } from './breakpoints';

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
});

globalStyle('html', {
  WebkitTextSizeAdjust: '100%',
  // Lenis handles smooth scroll on desktop guest routes and is destroyed under reduced
  // motion. CSS smooth scrolling would fight it, so it is deliberately absent here.
  scrollBehavior: 'auto',
});

globalStyle('body', {
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.body,
  lineHeight: vars.font.lineHeight.normal,
  color: vars.color.content.primary,
  backgroundColor: vars.color.surface.base,
  WebkitFontSmoothing: 'antialiased',
  // SC-012: no page may require horizontal scrolling at 360px.
  overflowX: 'hidden',
});

globalStyle('img, picture, video, canvas, svg', {
  display: 'block',
  maxWidth: '100%',
});

globalStyle('input, button, textarea, select', {
  font: 'inherit',
  color: 'inherit',
});

globalStyle('h1, h2, h3, h4, h5, h6', {
  fontWeight: vars.font.weight.regular,
  lineHeight: vars.font.lineHeight.tight,
});

/**
 * Focus. Constitution: never `outline: none` without a replacement — the ring is a token
 * so there is no reason to invent one.
 */
globalStyle(':focus-visible', {
  outline: `1px solid ${vars.color.border.focus}`,
  outlineOffset: '2px',
  boxShadow: vars.shadow.focus,
});

globalStyle(':focus:not(:focus-visible)', {
  outline: 'none',
});

/**
 * Reduced motion (Principle VI). Framer Motion's `MotionConfig reducedMotion="user"` covers
 * the DOM; this covers anything animating through CSS. Lenis is destroyed rather than
 * shortened — see src/scroll/lenis.ts.
 */
globalStyle('*, *::before, *::after', {
  '@media': {
    [media.reducedMotion]: {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      // `scroll-behavior` is not overridden here: `html` already sets `auto`, and Lenis is
      // destroyed rather than shortened under reduced motion (src/scroll/lenis.ts).
    },
  },
});

/** Skip link — first in tab order, visible only on focus (design-system.md §11.2). */
globalStyle('.skip-link', {
  position: 'absolute',
  left: '-9999px',
  top: vars.space.sm,
  zIndex: vars.zIndex.toast,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  backgroundColor: vars.color.surface.raised,
  color: vars.color.brand.primaryText,
  borderRadius: vars.radius.md,
});

globalStyle('.skip-link:focus', {
  left: vars.space.sm,
});
