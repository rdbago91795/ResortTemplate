import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';
import { media } from '../../styles/breakpoints';

export const header = style({
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: vars.zIndex.header,
  minHeight: vars.size.headerHeight,
  display: 'flex',
  alignItems: 'center',
  transitionProperty: 'background-color, border-color',
  transitionDuration: vars.duration.base,
  transitionTimingFunction: vars.easing.standard,
});

export const headerTone = styleVariants({
  solid: {
    backgroundColor: vars.color.surface.raised,
    borderBlockEnd: `1px solid ${vars.color.border.subtle}`,
  },
  /** Only reachable when an inverse logo exists — see canUseTransparentHeader (§3.5). */
  transparent: {
    backgroundColor: 'transparent',
    borderBlockEnd: '1px solid transparent',
  },
});

export const headerInner = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.lg,
  width: '100%',
});

/** The desktop nav is hidden below `md`; the drawer takes over. */
export const desktopNav = style({
  display: 'none',
  '@media': {
    [media.md]: { display: 'flex', alignItems: 'center', gap: vars.space.lg },
  },
});

export const navLink = style({
  color: 'inherit',
  textDecoration: 'none',
  fontSize: vars.font.size.small,
  fontWeight: vars.font.weight.medium,
  paddingBlock: vars.space.xs,
  borderBlockEnd: '2px solid transparent',
  selectors: {
    '&:hover': { borderBlockEndColor: vars.color.brand.primary },
    '&[aria-current="page"]': { borderBlockEndColor: vars.color.brand.primary },
  },
});

export const menuButton = style({
  '@media': {
    [media.md]: { display: 'none' },
  },
});

// ── Drawer ───────────────────────────────────────────────────────────────────

export const drawerScrim = style({
  position: 'fixed',
  inset: 0,
  zIndex: vars.zIndex.overlay,
  backgroundColor: vars.color.surface.scrim,
});

export const drawer = style({
  position: 'fixed',
  insetBlock: 0,
  insetInlineEnd: 0,
  zIndex: vars.zIndex.modal,
  width: 'min(20rem, 85vw)',
  backgroundColor: vars.color.surface.raised,
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  overflowY: 'auto',
});

export const drawerHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
});

export const drawerNav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const drawerLink = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: vars.size.touchTarget,
  color: vars.color.content.primary,
  textDecoration: 'none',
  fontSize: vars.font.size.body,
  borderRadius: vars.radius.md,
  paddingInline: vars.space.sm,
  selectors: {
    '&:hover': { backgroundColor: vars.color.brand.primarySubtle },
    '&[aria-current="page"]': {
      backgroundColor: vars.color.brand.primarySubtle,
      fontWeight: vars.font.weight.medium,
    },
  },
});

// ── Footer ───────────────────────────────────────────────────────────────────

export const footer = style({
  backgroundColor: vars.color.surface.inverse,
  color: vars.color.content.inverse,
  paddingBlock: vars.space.xxl,
  marginBlockStart: 'auto',
});

export const footerGrid = style({
  display: 'grid',
  gap: vars.space.xl,
  gridTemplateColumns: '1fr',
  '@media': {
    [media.md]: { gridTemplateColumns: 'repeat(3, 1fr)' },
  },
});

export const footerHeading = style({
  fontSize: vars.font.size.caption,
  textTransform: 'uppercase',
  letterSpacing: vars.font.tracking.wide,
  opacity: 0.7,
  marginBlockEnd: vars.space.sm,
});

export const footerList = style({
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
});

export const footerLink = style({
  color: 'inherit',
  fontSize: vars.font.size.small,
  textDecorationLine: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: vars.space.xxl,
  selectors: {
    '&:hover': { textDecorationLine: 'underline' },
  },
});

export const footerBottom = style({
  marginBlockStart: vars.space.xl,
  paddingBlockStart: vars.space.lg,
  borderBlockStart: `1px solid ${vars.color.border.strong}`,
  fontSize: vars.font.size.caption,
  opacity: 0.7,
});
