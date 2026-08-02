import * as s from './feedback.css';
import * as controls from '../primitives/controls.css';

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  /** Screen-reader text. Omit only when an adjacent live region already says it. */
  label?: string;
  className?: string;
};

/**
 * In-action only — design-system.md §5.4 is explicit that this is never page-level.
 *
 * A full-page spinner tells the guest nothing about what is coming and how much of it. Page
 * and section loading uses `Skeleton`, which reserves the real layout. This is for the inside
 * of a button, or a small area that is refreshing in place.
 */
export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <span className={className}>
      <span className={[s.spinner, s.spinnerSize[size]].join(' ')} aria-hidden="true" />
      {label && (
        <span className={controls.srOnly} role="status">
          {label}
        </span>
      )}
    </span>
  );
}
