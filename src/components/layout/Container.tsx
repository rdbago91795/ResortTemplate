import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import * as s from './layout.css';

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  size?: 'prose' | 'default' | 'wide' | 'full';
  as?: ElementType;
  children: ReactNode;
};

/** Max-width plus gutters. `prose` is the reading measure from the token contract. */
export function Container({
  size = 'default',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: ContainerProps) {
  const classes = [s.containerBase, s.container[size], className ?? ''].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
