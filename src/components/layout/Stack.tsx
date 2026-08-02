import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { vars } from '../../styles/contract.css';
import * as s from './layout.css';

type Space = keyof typeof vars.space;

export type StackProps = HTMLAttributes<HTMLElement> & {
  gap?: Space;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  as?: ElementType;
  children: ReactNode;
};

/**
 * Vertical rhythm.
 *
 * `gap` is typed as `keyof vars.space`, so a wrong name is a compile error rather than an
 * `undefined` that silently collapses to no gap. That is the whole argument for the typed
 * contract (Principle V), applied to a prop instead of a stylesheet.
 *
 * The gap goes through the `style` attribute, which is fine: it is a var() reference, not a
 * secret, and the CSP concern in Principle IX is about `assignInlineVars` emitting a style
 * attribute the `style-src` policy blocks. A plain inline `gap` is not affected — but see
 * src/brand/applyBranding.ts for the case where it is.
 */
export function Stack({
  gap = 'md',
  align,
  justify,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: StackProps) {
  return (
    <Tag
      className={[s.stack, className ?? ''].filter(Boolean).join(' ')}
      style={{ gap: vars.space[gap], alignItems: align, justifyContent: justify, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export type RowProps = StackProps & { wrap?: boolean };

/** Horizontal, wraps by default — a row that overflows at 360px is the commonest layout bug. */
export function Row({
  gap = 'md',
  align = 'center',
  justify,
  wrap: shouldWrap = true,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}: RowProps) {
  const classes = [s.row, shouldWrap ? s.wrap : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Tag
      className={classes}
      style={{ gap: vars.space[gap], alignItems: align, justifyContent: justify, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
