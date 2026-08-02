import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';
import { media } from '../../styles/breakpoints';

/** Container widths — design-system.md §5.2. `prose` is the reading measure, not a guess. */
export const container = styleVariants({
  prose: { maxWidth: vars.size.proseMax },
  default: { maxWidth: vars.size.containerMax },
  wide: { maxWidth: '1600px' },
  full: { maxWidth: 'none' },
});

export const containerBase = style({
  width: '100%',
  marginInline: 'auto',
  paddingInline: vars.space.lg,
  '@media': {
    [media.md]: { paddingInline: vars.space.xl },
  },
});

export const stack = style({ display: 'flex', flexDirection: 'column' });

export const row = style({ display: 'flex', flexDirection: 'row' });

export const wrap = style({ flexWrap: 'wrap' });

export const sectionTone = styleVariants({
  base: { backgroundColor: vars.color.surface.base, color: vars.color.content.primary },
  sunken: { backgroundColor: vars.color.surface.sunken, color: vars.color.content.primary },
  inverse: { backgroundColor: vars.color.surface.inverse, color: vars.color.content.inverse },
});

export const section = style({
  paddingBlock: vars.space.xxl,
  '@media': {
    [media.md]: { paddingBlock: vars.space.huge },
  },
});

/**
 * THE SIGNATURE — a row of capiz cells doing a hairline rule's job (design-system §0, §4).
 *
 * `scaleX` from the left on draw-in, never `width` (Principle VI). The cells themselves only
 * ever animate opacity, via the `paneReveal` variant.
 */
export const paneBand = style({
  display: 'grid',
  gap: vars.space.xxs,
  width: '100%',
  transformOrigin: 'left',
});

export const paneBandHeight = styleVariants({
  sm: { height: vars.space.sm },
  md: { height: vars.space.md },
});

export const pane = style({
  backgroundColor: vars.color.pane.fill,
  borderTop: `1px solid ${vars.color.pane.edge}`,
});

/**
 * The reveal/layout grid. design-system §4 fixes this to exactly three places — hero reveal,
 * gallery layout, and section dividers — so the motif stays a signature rather than becoming
 * a texture applied everywhere.
 */
export const paneGrid = style({
  display: 'grid',
  gap: vars.space.xs,
  width: '100%',
});
