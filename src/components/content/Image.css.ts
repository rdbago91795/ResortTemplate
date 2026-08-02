import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';
import { media } from '../../styles/breakpoints';

export const frame = style({
  display: 'block',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  backgroundColor: vars.color.surface.sunken,
});

export const img = style({
  display: 'block',
  width: '100%',
  height: '100%',
  // Only opacity transitions. The blur placeholder is a separate element that fades out —
  // animating `filter` on the real image would repaint the full layer every frame (VI).
  transitionProperty: 'opacity',
  transitionDuration: vars.duration.slow,
  transitionTimingFunction: vars.easing.entrance,
  opacity: 1,
  '@media': {
    [media.reducedMotion]: { transitionDuration: vars.duration.instant },
  },
});

export const imgLoading = style({ opacity: 0 });

export const blur = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  // The blur is baked into the placeholder asset, not applied as a CSS filter here — a
  // `filter` that has to be animated away is exactly what Principle VI rules out.
  transform: 'scale(1.04)',
});
