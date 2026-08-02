import * as s from './controls.css';
import { IconButton } from './IconButton';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
};

/**
 * Guest count. Two buttons and a live value rather than a number input, because a numeric
 * keypad for a value between 1 and 6 is more work than two taps, and because it makes the
 * bounds visible: the button disables at the limit instead of silently rejecting.
 *
 * `aria-live="polite"` on the value so the new count is announced after a tap — the buttons
 * keep focus, so without it a screen-reader user gets no feedback at all.
 */
export function Stepper({ value, onChange, min, max, label, disabled }: StepperProps) {
  const clamp = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div className={s.stepper} role="group" aria-label={label}>
      <IconButton
        type="button"
        label={`Decrease ${label}`}
        size="sm"
        onClick={() => clamp(value - 1)}
        disabled={disabled || value <= min}
      >
        −
      </IconButton>

      <span className={s.stepperValue} aria-live="polite">
        {value}
      </span>

      <IconButton
        type="button"
        label={`Increase ${label}`}
        size="sm"
        onClick={() => clamp(value + 1)}
        disabled={disabled || value >= max}
      >
        +
      </IconButton>
    </div>
  );
}
