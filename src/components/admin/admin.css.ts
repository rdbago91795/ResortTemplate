import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';
import { media } from '../../styles/breakpoints';

// ── Shell ────────────────────────────────────────────────────────────────────

export const shell = style({
  display: 'grid',
  minHeight: '100dvh',
  gridTemplateRows: 'auto 1fr',
  '@media': {
    [media.lg]: { gridTemplateColumns: '16rem 1fr', gridTemplateRows: 'auto 1fr' },
  },
});

export const sidebar = style({
  display: 'none',
  '@media': {
    [media.lg]: {
      display: 'flex',
      flexDirection: 'column',
      gap: vars.space.xs,
      gridRow: '1 / -1',
      padding: vars.space.lg,
      backgroundColor: vars.color.surface.sunken,
      borderInlineEnd: `1px solid ${vars.color.border.subtle}`,
    },
  },
});

export const sidebarBrand = style({
  paddingBlockEnd: vars.space.lg,
  marginBlockEnd: vars.space.sm,
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
});

export const navLink = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: vars.size.touchTarget,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  color: vars.color.content.secondary,
  textDecoration: 'none',
  fontSize: vars.font.size.small,
  selectors: {
    '&:hover': { backgroundColor: vars.color.surface.raised, color: vars.color.content.primary },
    '&[aria-current="page"]': {
      backgroundColor: vars.color.brand.primarySubtle,
      color: vars.color.brand.onPrimarySubtle,
      fontWeight: vars.font.weight.medium,
    },
  },
});

export const topbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  minHeight: vars.size.headerHeight,
  paddingInline: vars.space.lg,
  backgroundColor: vars.color.surface.raised,
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
});

export const menuButton = style({
  '@media': { [media.lg]: { display: 'none' } },
});

export const main = style({
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  '@media': {
    [media.md]: { padding: vars.space.xl },
  },
});

export const userChip = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontSize: vars.font.size.small,
  color: vars.color.content.secondary,
});

// ── FormPanel ────────────────────────────────────────────────────────────────

export const panel = style({
  backgroundColor: vars.color.surface.raised,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  display: 'flex',
  flexDirection: 'column',
});

export const panelHeader = style({
  padding: vars.space.lg,
  borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
});

export const panelTitle = style({
  fontFamily: vars.font.family.display,
  fontSize: vars.font.size.h4,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.content.primary,
});

export const panelBody = style({
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

/**
 * The action bar sticks to the bottom of the viewport on a long form. An admin editing a
 * content page should never have to scroll to the end to find Save.
 */
export const panelActions = style({
  position: 'sticky',
  insetBlockEnd: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: vars.space.lg,
  backgroundColor: vars.color.surface.raised,
  borderBlockStart: `1px solid ${vars.color.border.subtle}`,
  borderEndStartRadius: vars.radius.lg,
  borderEndEndRadius: vars.radius.lg,
});

export const dirtyFlag = style({
  marginInlineEnd: 'auto',
  fontSize: vars.font.size.caption,
  color: vars.color.content.secondary,
});

// ── FilterBar ────────────────────────────────────────────────────────────────

export const filterBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: vars.space.md,
  padding: vars.space.md,
  backgroundColor: vars.color.surface.sunken,
  border: `1px solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.md,
});

export const filterField = style({
  flex: '1 1 12rem',
  minWidth: 0,
});

export const filterActions = style({
  display: 'flex',
  gap: vars.space.sm,
  marginInlineStart: 'auto',
});
