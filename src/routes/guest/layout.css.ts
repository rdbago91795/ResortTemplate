import { style } from '@vanilla-extract/css';

export const frame = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100dvh',
});

/** Grows so the footer sits at the bottom on short pages rather than mid-screen. */
export const main = style({ flex: 1 });
