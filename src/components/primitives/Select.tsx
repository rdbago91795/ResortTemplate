import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import * as s from './controls.css';
import { FormField } from './FormField';
import { describedBy } from './describedBy';

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> & {
  id: string;
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  /** Shown as a disabled first option — a select with no chosen value must look unchosen. */
  placeholder?: string;
};

/**
 * A native `<select>`, deliberately. A custom listbox has to reimplement type-ahead, mobile
 * wheel pickers, and the whole keyboard contract; the native control has all of it and is
 * what a guest on a phone already knows how to use.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, options, hint, error, required, placeholder, className, ...rest },
  ref,
) {
  const classes = [s.control, error ? s.controlInvalid : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        id={id}
        className={classes}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
});
