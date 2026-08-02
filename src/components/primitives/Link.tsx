import { forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import * as s from './controls.css';

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  external?: boolean;
  underline?: 'always' | 'hover';
};

/**
 * Navigation. Anything that performs an action is a `Button` instead — the distinction is
 * what lets a keyboard user predict whether Space or Enter is the key, and what lets
 * middle-click open a real destination in a new tab.
 *
 * `external` adds `rel="noopener noreferrer"`. `noopener` is the security half: without it
 * the opened page gets a `window.opener` handle back into this one.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, external = false, underline = 'always', className, children, ...rest },
  ref,
) {
  const classes = [s.link, s.underline[underline], className ?? ''].filter(Boolean).join(' ');

  return (
    <a
      ref={ref}
      href={href}
      className={classes}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
      {external && <span className={s.srOnly}> (opens in a new tab)</span>}
    </a>
  );
});
