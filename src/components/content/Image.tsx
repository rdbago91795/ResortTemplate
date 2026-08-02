import { useState } from 'react';
import type { CSSProperties } from 'react';
import * as s from './Image.css';

/** Widths generated for `srcset`. Capped at 2400 — the bucket rejects anything larger anyway. */
const WIDTHS = [400, 800, 1200, 1600, 2400] as const;

export type ImageProps = {
  /** Public URL or storage path. Format suffixes are derived from it, see `variantUrl`. */
  src: string;
  /**
   * REQUIRED, no default — design-system.md §5.3, FR-068b.
   *
   * §11.3 turns this into a database requirement: `gallery_images.alt_text` is NOT NULL with
   * a length check, and `ImageUploader` sets `requireAltText: true`. Three layers, because
   * alt text is the one accessibility property that cannot be inferred later. Decorative
   * images pass `alt=""` explicitly — a deliberate empty string, not a missing prop.
   */
  alt: string;
  /** `sizes` attribute. Wrong `sizes` wastes the whole `srcset`, so it has no default. */
  sizes: string;
  /** CSS aspect-ratio, e.g. `'3 / 2'`. Reserves layout before load — this is the CLS fix. */
  aspect?: string;
  /** Above the fold: eager + high priority. Everything else lazy-loads. */
  priority?: boolean;
  placeholder?: 'blur' | 'none';
  /** Low-quality placeholder URL, shown until the full image decodes. */
  blurSrc?: string;
  fit?: CSSProperties['objectFit'];
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Derives a format/width variant URL.
 *
 * Convention: the transform pipeline serves `name.jpg` as `name.<width>.<ext>`. Kept in one
 * function so the naming scheme is changed in one place rather than at every call site.
 */
function variantUrl(src: string, width: number, ext: 'avif' | 'webp' | 'jpg'): string {
  const base = src.replace(/\.(avif|webp|jpe?g|png)$/i, '');
  return `${base}.${width}.${ext}`;
}

function srcSet(src: string, ext: 'avif' | 'webp' | 'jpg'): string {
  return WIDTHS.map((w) => `${variantUrl(src, w, ext)} ${w}w`).join(', ');
}

/**
 * THE PERFORMANCE WORKHORSE — design-system.md §5.3.
 *
 * Principle VII makes the image pipeline a core requirement, and on a gallery-heavy resort
 * site every performance number is decided by whether this component is used consistently or
 * bypassed "just this once". So it owns all of it:
 *
 *   - AVIF → WebP → JPEG `<source>` ordering. The browser takes the first it understands, so
 *     the order IS the preference; reversing it silently serves JPEG to everyone.
 *   - `srcset` + `sizes`, so a phone never downloads a 2400px file
 *   - `loading="lazy"` except when `priority` — a lazy hero delays the LCP element
 *   - `decoding="async"` so decode does not block the main thread
 *   - explicit `aspect-ratio` reserving layout, which is what stops the page jumping
 *   - blur-up placeholder, cross-faded on load
 *
 * The placeholder swap animates opacity and scale only (`blurUp` in motion/variants.ts).
 * Animating `filter: blur()` is the obvious implementation and is forbidden by Principle VI —
 * it repaints the whole layer every frame.
 */
export function Image({
  src,
  alt,
  sizes,
  aspect,
  priority = false,
  placeholder = 'none',
  blurSrc,
  fit = 'cover',
  className,
  width,
  height,
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const showBlur = placeholder === 'blur' && blurSrc && !loaded;

  return (
    <span
      className={[s.frame, className ?? ''].filter(Boolean).join(' ')}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      {showBlur && (
        <img src={blurSrc} alt="" aria-hidden="true" className={s.blur} style={{ objectFit: fit }} />
      )}

      <picture>
        <source type="image/avif" srcSet={srcSet(src, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet(src, 'webp')} sizes={sizes} />
        <img
          src={variantUrl(src, 1200, 'jpg')}
          srcSet={srcSet(src, 'jpg')}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          // `fetchPriority` is the React 19 spelling; it lands as fetchpriority in the DOM.
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={[s.img, placeholder === 'blur' && !loaded ? s.imgLoading : '']
            .filter(Boolean)
            .join(' ')}
          style={{ objectFit: fit }}
        />
      </picture>
    </span>
  );
}
