import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
});

export const roomName = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.h4,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.content.primary,
});

export const nights = style({
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  paddingBlock: vars.space.sm,
  borderBlock: `1px solid ${vars.color.border.subtle}`,
});

export const nightRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.md,
  fontSize: vars.font.size.small,
  color: vars.color.content.secondary,
});

export const totalRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.md,
  fontSize: vars.font.size.lead,
});

export const totalLabel = style({
  fontWeight: vars.font.weight.medium,
  color: vars.color.content.primary,
});

export const guidance = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xxs,
  padding: vars.space.md,
  backgroundColor: vars.color.brand.primarySubtle,
  color: vars.color.brand.onPrimarySubtle,
  borderRadius: vars.radius.md,
  fontSize: vars.font.size.small,
});
