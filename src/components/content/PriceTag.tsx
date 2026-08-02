import * as s from './content.css';

export type PriceTagProps = {
  amount: number;
  currency?: string;
  suffix?: string;
  className?: string;
};

/**
 * Money, in tabular figures.
 *
 * Formatting goes through `Intl.NumberFormat` with an explicit `en-PH` locale rather than the
 * browser's. A guest browsing from Germany would otherwise see `3.500,00` for three and a
 * half thousand pesos — the property's prices are quoted the property's way, and this is one
 * of the few cases where following the visitor's locale is the wrong answer.
 */
export function PriceTag({ amount, currency = 'PHP', suffix, className }: PriceTagProps) {
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={[s.price, className ?? ''].filter(Boolean).join(' ')}>
      {formatted}
      {suffix && <span className={s.priceSuffix}>{suffix}</span>}
    </span>
  );
}
