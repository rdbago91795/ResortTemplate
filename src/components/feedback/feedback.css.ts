import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';
import { media } from '../../styles/breakpoints';

const pulse = keyframes({
  '0%, 100%': { opacity: 0.45 },
  '50%': { opacity: 0.85 },
});

export const skeleton = style({
  backgroundColor: vars.color.surface.sunken,
  borderRadius: vars.radius.md,
  animationName: pulse,
  animationDuration: '1400ms',
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
  '@media': {
    // Opacity-only already, but a loop that never stops is its own accessibility problem.
    [media.reducedMotion]: { animationName: 'none', opacity: 0.6 },
  },
});

export const skeletonVariant = styleVariants({
  text: { height: vars.font.size.body, width: '100%' },
  block: { height: vars.space.huge, width: '100%' },
  card: { height: '260px', width: '100%' },
  row: { height: vars.space.xxl, width: '100%' },
});

export const skeletonGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
  display: 'inline-block',
  borderRadius: vars.radius.circle,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  animationName: spin,
  animationDuration: '640ms',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
});

export const spinnerSize = styleVariants({
  sm: { width: vars.space.lg, height: vars.space.lg },
  md: { width: vars.space.xl, height: vars.space.xl },
  lg: { width: vars.space.xxl, height: vars.space.xxl },
});

// ── Empty / error ────────────────────────────────────────────────────────────

export const state = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: vars.space.md,
  padding: vars.space.xxl,
  borderRadius: vars.radius.lg,
});

export const stateEmpty = style({
  backgroundColor: vars.color.surface.sunken,
  border: `1px dashed ${vars.color.border.default}`,
});

export const stateError = style({
  backgroundColor: vars.color.status.dangerBg,
  border: `1px solid ${vars.color.status.dangerFg}`,
});

export const stateTitle = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.h4,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.content.primary,
});

export const stateBody = style({
  fontSize: vars.font.size.body,
  color: vars.color.content.secondary,
  maxWidth: '52ch',
});

// ── InlineAlert ──────────────────────────────────────────────────────────────

export const alert = style({
  display: 'flex',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  borderInlineStart: '3px solid',
  fontSize: vars.font.size.small,
});

export const alertTone = styleVariants({
  info: {
    backgroundColor: vars.color.status.infoBg,
    color: vars.color.status.infoFg,
    borderInlineStartColor: vars.color.status.infoFg,
  },
  success: {
    backgroundColor: vars.color.status.successBg,
    color: vars.color.status.successFg,
    borderInlineStartColor: vars.color.status.successFg,
  },
  warning: {
    backgroundColor: vars.color.status.warningBg,
    color: vars.color.status.warningFg,
    borderInlineStartColor: vars.color.status.warningFg,
  },
  danger: {
    backgroundColor: vars.color.status.dangerBg,
    color: vars.color.status.dangerFg,
    borderInlineStartColor: vars.color.status.dangerFg,
  },
});

export const alertBody = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xxs });
export const alertTitle = style({ fontWeight: vars.font.weight.semibold });

// ── Toast ────────────────────────────────────────────────────────────────────

export const toastRegion = style({
  position: 'fixed',
  insetBlockEnd: vars.space.lg,
  insetInlineStart: vars.space.lg,
  insetInlineEnd: vars.space.lg,
  zIndex: vars.zIndex.toast,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  pointerEvents: 'none',
  '@media': {
    [media.md]: { insetInlineStart: 'auto', maxWidth: '420px' },
  },
});

export const toast = style({
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.sm,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.lg,
  backgroundColor: vars.color.surface.raised,
  border: `1px solid ${vars.color.border.default}`,
  fontSize: vars.font.size.small,
});

// ── Dialog ───────────────────────────────────────────────────────────────────

export const scrim = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.zIndex.modal,
  backgroundColor: vars.color.surface.scrim,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
});

export const dialog = style({
  width: '100%',
  maxWidth: '32rem',
  backgroundColor: vars.color.surface.raised,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.lg,
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const dialogTitle = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.h4,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.content.primary,
});

export const dialogBody = style({
  fontSize: vars.font.size.body,
  color: vars.color.content.secondary,
});

export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  justifyContent: 'flex-end',
});
