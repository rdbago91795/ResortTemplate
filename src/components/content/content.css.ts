import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

export const heading = style({
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.font.lineHeight.tight,
  letterSpacing: vars.font.tracking.tight,
  color: 'inherit',
});

export const headingSize = styleVariants({
  caption: { fontSize: vars.font.size.caption },
  small: { fontSize: vars.font.size.small },
  body: { fontSize: vars.font.size.body },
  lead: { fontSize: vars.font.size.lead },
  h4: { fontSize: vars.font.size.h4 },
  h3: { fontSize: vars.font.size.h3 },
  h2: { fontSize: vars.font.size.h2 },
  h1: { fontSize: vars.font.size.h1 },
  display: {
    fontSize: vars.font.size.display,
    // Archivo's width axis — expanded echoes the ventanilla's horizontal banding (§3.2).
    fontStretch: vars.font.width.expanded,
  },
});

export const headingFamily = styleVariants({
  display: { fontFamily: vars.font.family.display },
  body: { fontFamily: vars.font.family.body },
});

export const text = style({
  fontFamily: vars.font.family.body,
  lineHeight: vars.font.lineHeight.normal,
});

export const textSize = headingSize;

export const textTone = styleVariants({
  primary: { color: vars.color.content.primary },
  secondary: { color: vars.color.content.secondary },
  tertiary: { color: vars.color.content.tertiary },
});

// ── StatusBadge ──────────────────────────────────────────────────────────────

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.xxs,
  borderRadius: vars.radius.pill,
  fontSize: vars.font.size.caption,
  fontWeight: vars.font.weight.medium,
  whiteSpace: 'nowrap',
});

export const badgeSize = styleVariants({
  sm: { fontSize: vars.font.size.caption },
  md: { fontSize: vars.font.size.small, paddingBlock: vars.space.xs },
});

/**
 * Booking state colours come from the contract, not from this component (contract.css.ts
 * §color.booking). The five states appear in the admin table, the admin detail panel, and the
 * guest tracker; left to each surface they drift, and drift on a state machine that governs
 * money is a support call.
 */
export const badgeState = styleVariants({
  held: { backgroundColor: vars.color.booking.heldBg, color: vars.color.booking.heldFg },
  awaiting_verification: {
    backgroundColor: vars.color.booking.awaitingBg,
    color: vars.color.booking.awaitingFg,
  },
  confirmed: {
    backgroundColor: vars.color.booking.confirmedBg,
    color: vars.color.booking.confirmedFg,
  },
  cancelled: {
    backgroundColor: vars.color.booking.cancelledBg,
    color: vars.color.booking.cancelledFg,
  },
  expired: { backgroundColor: vars.color.booking.expiredBg, color: vars.color.booking.expiredFg },
});

// ── PriceTag ─────────────────────────────────────────────────────────────────

export const price = style({
  fontFamily: vars.font.family.mono,
  // Tabular figures so a column of prices aligns on the decimal. Proportional digits in a
  // rates table are the reason money columns look crooked.
  fontVariantNumeric: 'tabular-nums',
  fontWeight: vars.font.weight.medium,
  color: vars.color.content.primary,
});

export const priceSuffix = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.caption,
  fontWeight: vars.font.weight.regular,
  color: vars.color.content.secondary,
  marginInlineStart: vars.space.xxs,
});
