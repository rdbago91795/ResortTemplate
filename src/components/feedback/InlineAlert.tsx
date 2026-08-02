import type { ReactNode } from 'react';
import * as s from './feedback.css';

export type InlineAlertProps = {
  tone: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
};

/** Tone carries a glyph as well as a colour — WCAG 1.4.1, same rule as `StatusBadge`. */
const GLYPH: Record<InlineAlertProps['tone'], string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '✕',
};

/**
 * In-context notice — design-system.md §5.4.
 *
 * `danger` and `warning` get `role="alert"` (assertive) because they report something that
 * just went wrong; `info` and `success` get `role="status"` (polite) so a confirmation does
 * not interrupt whatever the user is currently reading.
 */
export function InlineAlert({ tone, title, children }: InlineAlertProps) {
  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div className={[s.alert, s.alertTone[tone]].join(' ')} role={assertive ? 'alert' : 'status'}>
      <span aria-hidden="true">{GLYPH[tone]}</span>
      <div className={s.alertBody}>
        {title && <span className={s.alertTitle}>{title}</span>}
        <div>{children}</div>
      </div>
    </div>
  );
}
