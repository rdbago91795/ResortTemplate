import { Card } from '../content/Card';
import { PriceTag } from '../content/PriceTag';
import { Text } from '../content/Text';
import * as s from './BookingSummary.css';

export type StayRange = { checkIn: string; checkOut: string };

export type BookingSummaryProps = {
  roomTypeName: string;
  range: StayRange;
  guests: number;
  stayTotal: number;
  /** Nightly breakdown from `price_stay` — shown so a seasonal rate is never a surprise. */
  nights?: { date: string; rate: number }[];
  /** The deposit line from site_settings. Guidance, never an enforced amount (FR-016a). */
  guidanceAmount?: number;
  guidanceText?: string;
};

const dayFormat = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function nightCount(range: StayRange): number {
  const ms = new Date(range.checkOut).getTime() - new Date(range.checkIn).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * What the guest is reserving — design-system.md §5.5.
 *
 * The nightly breakdown is shown rather than folded into a total, because rates vary by
 * season (`rate_overrides`) and a guest who sees only "₱19,600" for a stay that crosses into
 * peak season has no way to check the arithmetic. `price_stay` already returns the breakdown;
 * hiding it would be a deliberate choice to be less clear.
 *
 * The deposit line is labelled guidance. FR-016a makes the amount the owner's to accept — the
 * system never enforces it, so the summary must not imply a required payment.
 *
 * Dates render as `daterange [)`: check-out is the morning you leave and is not a night, so
 * the count comes from the difference, not from counting labels.
 */
export function BookingSummary({
  roomTypeName,
  range,
  guests,
  stayTotal,
  nights,
  guidanceAmount,
  guidanceText,
}: BookingSummaryProps) {
  const count = nightCount(range);

  return (
    <Card elevation="raised" className={s.card}>
      <div className={s.header}>
        <p className={s.roomName}>{roomTypeName}</p>
        <Text size="small" tone="secondary">
          {dayFormat.format(new Date(range.checkIn))} → {dayFormat.format(new Date(range.checkOut))}
        </Text>
        <Text size="small" tone="secondary">
          {count} {count === 1 ? 'night' : 'nights'} · {guests}{' '}
          {guests === 1 ? 'guest' : 'guests'}
        </Text>
      </div>

      {nights && nights.length > 0 && (
        <ul className={s.nights}>
          {nights.map((night) => (
            <li key={night.date} className={s.nightRow}>
              <span>{dayFormat.format(new Date(night.date))}</span>
              <PriceTag amount={night.rate} />
            </li>
          ))}
        </ul>
      )}

      <div className={s.totalRow}>
        <span className={s.totalLabel}>Total</span>
        <PriceTag amount={stayTotal} />
      </div>

      {guidanceAmount !== undefined && (
        <div className={s.guidance}>
          <span>
            To reserve, send <PriceTag amount={guidanceAmount} />
          </span>
          {guidanceText && (
            <Text size="caption" tone="secondary">
              {guidanceText}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}
