import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as s from './controls.css';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /**
   * REQUIRED — design-system.md §5.1 marks this as the screen-reader text.
   *
   * An icon-only control with no accessible name is announced as "button" and nothing else.
   * There is no sensible default, so there is no default.
   */
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  type: 'button' | 'submit' | 'reset';
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, children, ...rest },
  ref,
) {
  const classes = [s.base, s.variant[variant], s.size[size], s.iconOnly, className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} {...rest}>
      <span aria-hidden="true">{children}</span>
      <span className={s.srOnly}>{label}</span>
    </button>
  );
});
