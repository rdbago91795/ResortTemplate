import * as s from './feedback.css';

export type SkeletonProps = {
  variant?: 'text' | 'block' | 'card' | 'row';
  count?: number;
  className?: string;
};

/**
 * Loading placeholder shaped like the thing that is coming.
 *
 * A skeleton that does not match the final layout causes the same visible jump a missing
 * skeleton does — it just delays it. The variants correspond to the four shapes this app
 * actually loads: a line of text, a block, a room card, a table row.
 *
 * `aria-hidden` with a single live-region announcement from the caller: N pulsing rectangles
 * announced individually is noise. The caller owns the "Loading rooms…" message.
 */
export function Skeleton({ variant = 'text', count = 1, className }: SkeletonProps) {
  const classes = [s.skeleton, s.skeletonVariant[variant], className ?? '']
    .filter(Boolean)
    .join(' ');

  if (count === 1) return <div className={classes} aria-hidden="true" />;

  return (
    <div className={s.skeletonGroup} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={classes} />
      ))}
    </div>
  );
}
