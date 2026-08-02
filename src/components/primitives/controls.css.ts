import { style, styleVariants, keyframes } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

/**
 * Shared control styling — design-system.md §5.1.
 *
 * Every value references a token by name (Principle V). Transitions name only `transform`,
 * `opacity`, `background-color`, and `color`; `transition: all` would sweep in layout
 * properties and violate Principle VI by accident rather than by decision.
 *
 * `size.touchTarget` is 44px and is the floor for every interactive control, including the
 * small variants. A control that is visually small still has to be hittable on a phone,
 * which is the primary target.
 */

export const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.sm,
  minHeight: vars.size.touchTarget,
  paddingInline: vars.space.lg,
  border: '1px solid transparent',
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.body,
  fontWeight: vars.font.weight.medium,
  lineHeight: vars.font.lineHeight.snug,
  textDecoration: 'none',
  cursor: 'pointer',
  transitionProperty: 'background-color, border-color, color, opacity',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.standard,
  selectors: {
    '&:disabled, &[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.55,
    },
  },
});

export const variant = styleVariants({
  primary: {
    backgroundColor: vars.color.brand.primary,
    color: vars.color.brand.onPrimary,
    selectors: {
      '&:hover:not(:disabled)': { backgroundColor: vars.color.brand.primaryHover },
      '&:active:not(:disabled)': { backgroundColor: vars.color.brand.primaryActive },
    },
  },
  secondary: {
    backgroundColor: vars.color.brand.secondarySubtle,
    color: vars.color.brand.onSecondary,
    borderColor: vars.color.brand.secondary,
    selectors: {
      '&:hover:not(:disabled)': { backgroundColor: vars.color.brand.secondary },
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: vars.color.brand.primaryText,
    selectors: {
      '&:hover:not(:disabled)': { backgroundColor: vars.color.brand.primarySubtle },
    },
  },
  danger: {
    backgroundColor: vars.color.status.dangerBg,
    color: vars.color.status.dangerFg,
    borderColor: vars.color.status.dangerFg,
    selectors: {
      '&:hover:not(:disabled)': {
        backgroundColor: vars.color.status.dangerFg,
        color: vars.color.surface.raised,
      },
    },
  },
});

/**
 * `sm` and `md` keep the 44px minimum from `base` — only the type scale and inline padding
 * change. A 32px-tall button is a support ticket on a phone.
 */
export const size = styleVariants({
  sm: { fontSize: vars.font.size.small, paddingInline: vars.space.md },
  md: {},
  lg: { fontSize: vars.font.size.lead, paddingInline: vars.space.xl },
});

export const fullWidth = style({ width: '100%' });

/** Icon-only: square, so the touch target governs both axes. */
export const iconOnly = style({
  paddingInline: vars.space.none,
  minWidth: vars.size.touchTarget,
});

/** Visible label replaced by screen-reader text — never `display: none`, which unreads it. */
export const srOnly = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

/** Spinner shown inside a loading button. `rotate` is a transform (Principle VI). */
const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
  width: '1em',
  height: '1em',
  borderRadius: vars.radius.circle,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  animationName: spin,
  animationDuration: '640ms',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  flexShrink: 0,
});

// ── Form controls ────────────────────────────────────────────────────────────

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const label = style({
  fontSize: vars.font.size.small,
  fontWeight: vars.font.weight.medium,
  color: vars.color.content.primary,
});

export const required = style({
  color: vars.color.status.dangerFg,
  marginInlineStart: vars.space.xxs,
});

export const hint = style({
  fontSize: vars.font.size.caption,
  color: vars.color.content.secondary,
});

export const errorText = style({
  fontSize: vars.font.size.caption,
  color: vars.color.status.dangerFg,
  fontWeight: vars.font.weight.medium,
});

export const control = style({
  width: '100%',
  minHeight: vars.size.touchTarget,
  padding: `${vars.space.sm} ${vars.space.md}`,
  backgroundColor: vars.color.surface.raised,
  color: vars.color.content.primary,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.body,
  transitionProperty: 'border-color, background-color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.standard,
  selectors: {
    '&::placeholder': { color: vars.color.content.tertiary },
    '&:hover:not(:disabled)': { borderColor: vars.color.border.strong },
    '&:disabled': {
      backgroundColor: vars.color.surface.sunken,
      color: vars.color.content.tertiary,
      cursor: 'not-allowed',
    },
  },
});

/** Invalid state is border + text, never colour alone (design-system §11). */
export const controlInvalid = style({
  borderColor: vars.color.status.dangerFg,
  selectors: {
    '&:hover:not(:disabled)': { borderColor: vars.color.status.dangerFg },
  },
});

export const textarea = style({
  minHeight: 'unset',
  resize: 'vertical',
  lineHeight: vars.font.lineHeight.normal,
});

export const mono = style({
  fontFamily: vars.font.family.mono,
  textTransform: 'uppercase',
  letterSpacing: vars.font.tracking.wide,
});

// ── Choice controls ──────────────────────────────────────────────────────────

export const choiceRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minHeight: vars.size.touchTarget,
  cursor: 'pointer',
});

export const choiceInput = style({
  width: vars.space.lg,
  height: vars.space.lg,
  accentColor: vars.color.brand.primary,
  cursor: 'pointer',
  flexShrink: 0,
});

export const choiceLabel = style({
  fontSize: vars.font.size.body,
  color: vars.color.content.primary,
});

/**
 * Switch. The knob moves by `translateX` — a transform, not `left` (Principle VI).
 */
export const switchTrack = style({
  position: 'relative',
  width: '44px',
  height: vars.space.xl,
  borderRadius: vars.radius.pill,
  backgroundColor: vars.color.border.strong,
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  padding: vars.space.xxs,
  transitionProperty: 'background-color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.standard,
  selectors: {
    '&[aria-checked="true"]': { backgroundColor: vars.color.brand.primary },
    '&:disabled': { opacity: 0.55, cursor: 'not-allowed' },
  },
});

export const switchKnob = style({
  display: 'block',
  width: vars.space.lg,
  height: vars.space.lg,
  borderRadius: vars.radius.circle,
  backgroundColor: vars.color.surface.raised,
  transitionProperty: 'transform',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.standard,
  transform: 'translateX(0)',
  selectors: {
    '[aria-checked="true"] > &': { transform: 'translateX(20px)' },
  },
});

// ── Stepper ──────────────────────────────────────────────────────────────────

export const stepper = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  border: `1px solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  backgroundColor: vars.color.surface.raised,
  padding: vars.space.xxs,
});

export const stepperValue = style({
  minWidth: vars.space.xxl,
  textAlign: 'center',
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.body,
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.content.primary,
});

// ── Link ─────────────────────────────────────────────────────────────────────

export const link = style({
  color: vars.color.brand.primaryText,
  textDecorationThickness: '1px',
  textUnderlineOffset: '0.15em',
  borderRadius: vars.radius.sm,
  transitionProperty: 'color',
  transitionDuration: vars.duration.fast,
  transitionTimingFunction: vars.easing.standard,
  selectors: {
    '&:hover': { color: vars.color.brand.primaryHover },
  },
});

export const underline = styleVariants({
  always: { textDecorationLine: 'underline' },
  hover: {
    textDecorationLine: 'none',
    selectors: { '&:hover': { textDecorationLine: 'underline' } },
  },
});
