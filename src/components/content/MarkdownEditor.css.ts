import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

export const wrapper = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.xxs,
  padding: vars.space.xxs,
  backgroundColor: vars.color.surface.sunken,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
});

export const toolbarSpacer = style({ marginInlineStart: 'auto' });

export const preview = style({
  minHeight: '18rem',
  padding: vars.space.lg,
  backgroundColor: vars.color.surface.raised,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  overflowY: 'auto',
});

export const previewEmpty = style({
  color: vars.color.content.tertiary,
  fontSize: vars.font.size.small,
});
