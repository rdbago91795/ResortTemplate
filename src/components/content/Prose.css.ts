import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

/**
 * Owner-authored Markdown produces plain tags with no class hooks, so this is the one place
 * `globalStyle` is the right tool rather than a shortcut — every rule is scoped under the
 * generated `prose` class, so nothing leaks.
 */
export const prose = style({
  color: vars.color.content.primary,
  fontSize: vars.font.size.body,
  lineHeight: vars.font.lineHeight.relaxed,
  maxWidth: vars.size.proseMax,
});

globalStyle(`${prose} > * + *`, {
  marginBlockStart: vars.space.lg,
});

globalStyle(`${prose} h1, ${prose} h2, ${prose} h3, ${prose} h4`, {
  fontFamily: vars.font.family.display,
  fontWeight: vars.font.weight.semibold,
  lineHeight: vars.font.lineHeight.tight,
  letterSpacing: vars.font.tracking.tight,
  marginBlockStart: vars.space.xxl,
});

globalStyle(`${prose} h2`, { fontSize: vars.font.size.h3 });
globalStyle(`${prose} h3`, { fontSize: vars.font.size.h4 });
globalStyle(`${prose} h4`, { fontSize: vars.font.size.lead });

globalStyle(`${prose} a`, {
  color: vars.color.brand.primaryText,
  textDecorationThickness: '1px',
  textUnderlineOffset: '0.15em',
});

globalStyle(`${prose} strong`, { fontWeight: vars.font.weight.semibold });

globalStyle(`${prose} ul, ${prose} ol`, {
  paddingInlineStart: vars.space.xl,
});

globalStyle(`${prose} li + li`, { marginBlockStart: vars.space.sm });

globalStyle(`${prose} blockquote`, {
  paddingInlineStart: vars.space.lg,
  borderInlineStart: `2px solid ${vars.color.brand.secondary}`,
  color: vars.color.content.secondary,
  fontStyle: 'italic',
});

globalStyle(`${prose} code`, {
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.small,
  backgroundColor: vars.color.surface.sunken,
  padding: `${vars.space.xxs} ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
});

globalStyle(`${prose} hr`, {
  border: 'none',
  borderTop: `1px solid ${vars.color.border.subtle}`,
  marginBlock: vars.space.xxl,
});

/** Wide content must scroll in its own box — the page body never scrolls sideways (SC-012). */
globalStyle(`${prose} pre`, {
  overflowX: 'auto',
  backgroundColor: vars.color.surface.sunken,
  padding: vars.space.lg,
  borderRadius: vars.radius.md,
});
