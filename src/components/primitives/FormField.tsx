import type { ReactNode } from 'react';
import * as s from './controls.css';

export type FormFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

/**
 * Label + control + hint + error, with the `aria-describedby` wiring done once.
 *
 * The ids are derived from the control's `id` rather than generated, so the control can name
 * them without a context or a ref: `describedBy(id, { hint, error })` in ./describedBy.ts
 * produces exactly the same string this renders. Two places computing one value is a bug
 * waiting to happen, so both call the same function.
 */
export function FormField({ id, label, hint, error, required, children }: FormFieldProps) {
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={id}>
        {label}
        {required && (
          <span className={s.required} aria-hidden="true">
            *
          </span>
        )}
        {required && <span className={s.srOnly}> (required)</span>}
      </label>

      {hint && (
        <span className={s.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}

      {children}

      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

export type FieldErrorProps = {
  id: string;
  children: ReactNode;
};

/**
 * One error, wired to `aria-describedby`.
 *
 * `role="alert"` so a validation failure arriving after submit is announced. Without it a
 * screen-reader user tabs back through the form to discover what happened.
 */
export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <span className={s.errorText} id={id} role="alert">
      {children}
    </span>
  );
}

