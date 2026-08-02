import { fontFace } from '@vanilla-extract/css';

/**
 * ⚠ IMPORTED, NOT WRITTEN AS A PATH STRING. This is the part that was wrong before.
 *
 * These previously read `url("/src/assets/fonts/Archivo-Variable.woff2")` — a literal string.
 * Vite cannot see inside a string, so it emitted the path verbatim and warned
 * "didn't resolve at build time". `/src/...` does not exist in `dist/`, so all three faces
 * would have 404'd in production while working perfectly in dev, where the source tree is
 * still being served.
 *
 * Importing them makes Vite treat each as an asset: it hashes the file, emits it into
 * `dist/assets/`, and substitutes the real URL here.
 *
 * `vite/client` (referenced from src/vite-env.d.ts) declares `*.woff2` as a string module,
 * so these need no extra ambient declaration.
 */
import archivoUrl from '../assets/fonts/Archivo-Variable.woff2';
import publicSansUrl from '../assets/fonts/PublicSans-Variable.woff2';
import dmMonoUrl from '../assets/fonts/DMMono-Regular.woff2';

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
 * All three are OFL-licensed and self-hosted from Google's CDN releases: Archivo v25 (88 KB,
 * variable), Public Sans v21 (26 KB, variable), DM Mono v16 (15 KB, single weight). Latin
 * subset only — the property is in the Philippines and the site is in English.
 */

const archivo = fontFace([
  {
    src: `url(${archivoUrl}) format("woff2-variations")`,
    fontWeight: '400 700',
    fontStyle: 'normal',
    fontStretch: '100% 125%',
    fontDisplay: 'swap',
  },
]);

const publicSans = fontFace([
  {
    src: `url(${publicSansUrl}) format("woff2-variations")`,
    fontWeight: '400 700',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
]);

const dmMono = fontFace([
  {
    src: `url(${dmMonoUrl}) format("woff2")`,
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
