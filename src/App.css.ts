import { style } from '@vanilla-extract/css';
import { vars } from './styles/contract.css';
import { media } from './styles/breakpoints';

/**
 * Every value below references a token by its exact name (Principle V). No raw hex, no bare
 * pixel spacing. If a needed value has no token, the token is added to the contract first —
 * never inlined "just this once".
 */

export const shell = style({
  maxWidth: vars.size.containerMax,
  margin: '0 auto',
  padding: vars.space.xl,
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: vars.space.lg,
  '@media': {
    [media.md]: { padding: vars.space.huge },
  },
});

export const eyebrow = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.caption,
  letterSpacing: vars.font.tracking.wide,
  textTransform: 'uppercase',
  color: vars.color.content.secondary,
});

export const heading = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.h1,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: vars.font.tracking.tight,
  lineHeight: vars.font.lineHeight.tight,
  color: vars.color.content.primary,
  // Archivo's width axis — Expanded echoes the ventanilla's horizontal banding.
  fontStretch: vars.font.width.expanded,
});

/** The signature pane band — a row of capiz cells doing a hairline rule's job. */
export const band = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: vars.space.xxs,
  height: vars.space.sm,
  '@media': {
    [media.md]: { height: vars.space.md },
  },
});

export const pane = style({
  backgroundColor: vars.color.pane.fill,
  borderTop: `1px solid ${vars.color.pane.edge}`,
});

export const body = style({
  fontSize: vars.font.size.body,
  color: vars.color.content.secondary,
  maxWidth: vars.size.proseMax,
});
