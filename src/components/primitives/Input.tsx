import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import * as s from './controls.css';
import { FormField } from './FormField';
import { describedBy } from './describedBy';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Renders in the mono, uppercased treatment — booking and payment references. */
  monospace?: boolean;
};

/**
 * Single-line text.
 *
 * `aria-invalid` is set from `error` rather than from any internal validity state, so the
 * announced state and the visible state can never disagree — there is one source.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, required, monospace, className, ...rest },
  ref,
) {
  const classes = [s.control, error ? s.controlInvalid : '', monospace ? s.mono : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <input
        ref={ref}
        id={id}
        className={classes}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        {...rest}
      />
    </FormField>
  );
});
