import type { HTMLAttributes, ReactNode } from 'react';
import { vars } from '../../styles/contract.css';
import * as s from './content.css';

type SizeToken = keyof typeof vars.font.size;

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** The semantic level — governs document outline, not appearance. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** The visual size — governs appearance, not outline. */
  size?: SizeToken;
  family?: 'display' | 'body';
  children: ReactNode;
};

/**
 * Semantic level and visual size are decoupled on purpose.
 *
 * A page must not skip heading levels, and a section's first heading is usually an `h2`
 * regardless of how large it should look. Coupling the two forces a choice between a correct
 * outline and a correct design, and the outline always loses. Here neither has to.
 */
export function Heading({ level, size, family = 'display', className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  const visual: SizeToken = size ?? (['h1', 'h2', 'h3', 'h4', 'lead', 'body'] as const)[level - 1];

  const classes = [s.heading, s.headingSize[visual], s.headingFamily[family], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
