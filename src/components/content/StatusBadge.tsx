import * as s from './content.css';

export type BookingState =
  | 'held'
  | 'awaiting_verification'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

/**
 * ICON **AND** TEXT, NEVER COLOUR ALONE — design-system.md §5.3.
 *
 * WCAG 1.4.1: colour must not be the only means of conveying information. On a booking state
 * machine that governs money this is not a formality — a red/green distinction is invisible
 * to roughly one man in twelve, and "confirmed" versus "cancelled" is the difference between
 * a guest arriving and a guest turned away.
 *
 * So each state carries a glyph and a word. The colour is the third signal, not the first.
 * The glyphs are text characters rather than an icon font: no extra request, no FOUT, and
 * they inherit `currentColor` for free.
 */
const STATE: Record<BookingState, { glyph: string; label: string }> = {
  held: { glyph: '◷', label: 'Held' },
  awaiting_verification: { glyph: '◐', label: 'Awaiting verification' },
  confirmed: { glyph: '✓', label: 'Confirmed' },
  cancelled: { glyph: '✕', label: 'Cancelled' },
  expired: { glyph: '⊘', label: 'Expired' },
};

export type StatusBadgeProps = {
  state: BookingState;
  size?: 'sm' | 'md';
};

export function StatusBadge({ state, size = 'sm' }: StatusBadgeProps) {
  const { glyph, label } = STATE[state];

  return (
    <span className={[s.badge, s.badgeSize[size], s.badgeState[state]].join(' ')}>
      {/* The glyph is decorative: the word beside it already says the same thing, and a
          screen reader announcing "circle with a line through it Expired" is noise. */}
      <span aria-hidden="true">{glyph}</span>
      {label}
    </span>
  );
}
