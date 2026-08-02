import type { HTMLAttributes, ReactNode } from 'react';
import * as s from './layout.css';
import { PaneBand } from './PaneBand';

export type SectionProps = HTMLAttributes<HTMLElement> & {
  tone?: 'base' | 'sunken' | 'inverse';
  /** Renders the signature pane band above the section (design-system §4). */
  divider?: boolean;
  children: ReactNode;
};

/**
 * A page section with its vertical padding and optional signature divider.
 *
 * Renders a real `<section>`. A landmark needs an accessible name to be useful, so callers
 * that want one pass `aria-labelledby` pointing at their own heading — generating a name here
 * would produce a page of identically-named regions, which is worse than none.
 */
export function Section({
  tone = 'base',
  divider = false,
  className,
  children,
  ...rest
}: SectionProps) {
  const classes = [s.section, s.sectionTone[tone], className ?? ''].filter(Boolean).join(' ');
  return (
    <>
      {divider && <PaneBand />}
      <section className={classes} {...rest}>
        {children}
      </section>
    </>
  );
}
