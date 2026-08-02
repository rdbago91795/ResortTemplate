import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { vars } from '../../styles/contract.css';
import * as s from './content.css';

export type TextProps = HTMLAttributes<HTMLElement> & {
  size?: keyof typeof vars.font.size;
  tone?: 'primary' | 'secondary' | 'tertiary';
  as?: ElementType;
  children: ReactNode;
};

/**
 * Body copy.
 *
 * `tone: 'tertiary'` is marked in the contract as "large text and non-essential content only
 * — marginal contrast by design". It is not a general-purpose muted colour; using it for form
 * hints or error detail fails WCAG AA at body size.
 */
export function Text({
  size = 'body',
  tone = 'primary',
  as: Tag = 'p',
  className,
  children,
  ...rest
}: TextProps) {
  const classes = [s.text, s.textSize[size], s.textTone[tone], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
