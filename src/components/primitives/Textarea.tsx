import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import * as s from './controls.css';
import { FormField } from './FormField';
import { describedBy } from './describedBy';

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  rows?: number;
  maxLength?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, required, rows = 4, className, ...rest },
  ref,
) {
  const classes = [s.control, s.textarea, error ? s.controlInvalid : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={classes}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        {...rest}
      />
    </FormField>
  );
});
