import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

export const link = style({
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  borderRadius: vars.radius.sm,
});

export const image = style({ display: 'block', width: 'auto' });

export const wordmark = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: vars.font.tracking.tight,
  fontStretch: vars.font.width.expanded,
  color: vars.color.content.primary,
  whiteSpace: 'nowrap',
});

export const wordmarkInverse = style({ color: vars.color.content.inverse });
