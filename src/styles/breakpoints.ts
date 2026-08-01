/**
 * Breakpoints are PLAIN CONSTANTS, deliberately outside the theme contract.
 *
 * CSS custom properties do not work inside media query conditions. A contract token in an
 * `@media` test silently never matches, and the failure presents as "the responsive layout
 * is broken" rather than "the token is invalid" — which is a considerably worse afternoon.
 *
 * This is the one place Principle V's "reference the token" instruction must NOT be
 * followed. Anything consumed by `@media` or `@supports` belongs here.
 *
 * design-system.md §3.3
 */
export const bp = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** `@media` query strings, ready to use as Vanilla Extract `@media` keys. */
export const media = {
  sm: `screen and (min-width: ${bp.sm}px)`,
  md: `screen and (min-width: ${bp.md}px)`,
  lg: `screen and (min-width: ${bp.lg}px)`,
  xl: `screen and (min-width: ${bp.xl}px)`,
  /** Mobile is the design target; this is the enhancement boundary, not the default. */
  desktop: `screen and (min-width: ${bp.lg}px)`,
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;
