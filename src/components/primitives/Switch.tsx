import * as s from './controls.css';

export type SwitchProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Rendered beside the label — the "why this is off" line on a disabled toggle. */
  hint?: string;
};

/**
 * A `button` with `role="switch"`, not a styled checkbox.
 *
 * The distinction is announced: a switch reads as "on/off" and takes effect immediately,
 * where a checkbox reads as "checked" and usually waits for a submit. Section enable/disable
 * takes effect on save, but publish toggles do not — using the right role is what tells a
 * screen-reader user which kind they are touching.
 *
 * The knob moves by `translateX` (see controls.css.ts) — Principle VI forbids animating
 * `left`.
 */
export function Switch({ id, label, checked, onChange, disabled, hint }: SwitchProps) {
  return (
    <div className={s.choiceRow}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={s.switchTrack}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className={s.switchKnob} />
      </button>

      <label className={s.choiceLabel} htmlFor={id}>
        {label}
      </label>

      {hint && (
        <span className={s.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}
