import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as s from './controls.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /**
   * REQUIRED, with no default — design-system.md §5.1.
   *
   * "A button that submits a form nobody expected is the most common form bug in this kind of
   * app." Making it required means every call site states its intent, and the compiler asks.
   */
  type: 'button' | 'submit' | 'reset';
};

/**
 * The one action control. Anything that performs an action is this; anything that navigates
 * is `Link`.
 *
 * `loading` keeps the button mounted and its width stable — swapping in a different element
 * would move everything after it, and a layout shift under the user's finger at the moment
 * they tap is how double-submits happen.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    iconStart,
    iconEnd,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  const classes = [
    s.base,
    s.variant[variant],
    s.size[size],
    fullWidth ? s.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={s.spinner} aria-hidden="true" /> : iconStart}
      {children}
      {!loading && iconEnd}
    </button>
  );
});
