import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../../styles/contract.css';

export const card = style({
  position: 'relative',
  backgroundColor: vars.color.surface.raised,
  borderRadius: vars.radius.lg,
  overflow: 'hidden',
});

export const elevation = styleVariants({
  flat: { border: `1px solid ${vars.color.border.subtle}` },
  raised: { boxShadow: vars.shadow.md, border: '1px solid transparent' },
});

export const interactive = style({
  cursor: 'pointer',
  // The card scales on hover (transform). Any stretched link inside sits above this.
  selectors: {
    '&:focus-within': { borderColor: vars.color.border.focus },
  },
});
