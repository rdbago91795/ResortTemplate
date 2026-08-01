import { fontFace } from '@vanilla-extract/css';

/**
 * Typography — design-system.md §3.3.
 *
 * Three families, all self-hosted so `font-src 'self'` holds (security-baseline.md §4.5).
 * Three is a real cost on mobile data; it is paid for by route-scoped loading:
 *
 *   body    — Public Sans, preloaded, used everywhere
 *   display — Archivo, h1/h2/display only, `font-display: swap`
 *   mono    — DM Mono, admin and confirmation routes only. Never loaded on a browse-only
 *             guest session.
 *
 * Mono is not decorative. A payment reference is a code the guest reads off one app and
 * types into another, and the owner then compares against a third — monospace with tabular
 * figures is the difference between `0`/`O` and a support message.
 *
 * ⚠ THE .woff2 FILES ARE NOT PRESENT. They must be downloaded and placed in
 * `src/assets/fonts/` before the build will resolve these faces. See the completion report.
 */

const archivo = fontFace([
  {
    src: 'url("/src/assets/fonts/Archivo-Variable.woff2") format("woff2-variations")',
    fontWeight: '400 700',
    fontStyle: 'normal',
    fontStretch: '100% 125%',
    fontDisplay: 'swap',
  },
]);

const publicSans = fontFace([
  {
    src: 'url("/src/assets/fonts/PublicSans-Variable.woff2") format("woff2-variations")',
    fontWeight: '400 700',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
]);

const dmMono = fontFace([
  {
    src: 'url("/src/assets/fonts/DMMono-Regular.woff2") format("woff2")',
    fontWeight: '400',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
]);

/** Consumed by the theme's `font.family` group. */
export const fontFamily = {
  display: `${archivo}, ui-sans-serif, system-ui, sans-serif`,
  body: `${publicSans}, ui-sans-serif, system-ui, sans-serif`,
  mono: `${dmMono}, ui-monospace, "SF Mono", Menlo, monospace`,
} as const;
