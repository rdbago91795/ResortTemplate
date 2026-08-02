import * as s from './Logo.css';
import type { LogoAssets } from './logoAssets';

/**
 * The four slots live in ./logoAssets.ts alongside `canUseTransparentHeader`, which derives
 * the header treatment from them (§3.5).
 *
 * SVG IS BANNED and enforced at the bucket (`allowed_mime_types`, migration 0037), not here:
 * an SVG is a script container, and the logo is the one image an owner is most likely to have
 * as one.
 */
export type LogoProps = {
  assets: LogoAssets;
  variant?: 'primary' | 'inverse' | 'mark';
  height?: number;
  linkToHome?: boolean;
  className?: string;
};

/**
 * Logo with wordmark fallback — design-system.md §3.5.
 *
 * ⚠ CALLERS NEVER BRANCH. The whole value of this component is that "does a logo exist?" is
 * answered once, here. Every surface that shows the property's identity — header, footer,
 * mobile drawer, share card — asks for a `Logo` and gets something sensible back.
 *
 * The wordmark is the property name set in the display face. It is a real fallback, not a
 * placeholder box: a small resort that never uploads a logo should look deliberate rather
 * than unfinished.
 *
 * `alt` on the image is the stored `logo_wide_alt` where present, and the property name
 * otherwise. It is never empty — this is a link to the home page as well as a picture, and an
 * unlabelled link is announced as its URL.
 */
export function Logo({
  assets,
  variant = 'primary',
  height = 32,
  linkToHome = true,
  className,
}: LogoProps) {
  const src =
    variant === 'inverse'
      ? (assets.inverseUrl ?? assets.wideUrl)
      : variant === 'mark'
        ? (assets.markUrl ?? assets.wideUrl)
        : assets.wideUrl;

  const content = src ? (
    <img
      src={src}
      alt={assets.wideAlt || assets.propertyName}
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={s.image}
    />
  ) : (
    <span
      className={[s.wordmark, variant === 'inverse' ? s.wordmarkInverse : ''].filter(Boolean).join(' ')}
      style={{ fontSize: `${Math.round(height * 0.6)}px` }}
    >
      {assets.propertyName}
    </span>
  );

  if (!linkToHome) return <span className={className}>{content}</span>;

  return (
    <a href="/" className={[s.link, className ?? ''].filter(Boolean).join(' ')}>
      {content}
    </a>
  );
}
