import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import * as s from './controls.css';
import { FieldError } from './FormField';

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  id: string;
  label: string;
  error?: string;
};

/**
 * Checkbox and Radio share one implementation because they differ only in `type` and in
 * whose job grouping is. Radios must be wrapped in a `fieldset` with a `legend` by the
 * caller — a lone radio is meaningless, and generating the group here would hide that.
 */
function makeChoice(type: 'checkbox' | 'radio') {
  return forwardRef<HTMLInputElement, ChoiceProps>(function Choice(
    { id, label, error, className, ...rest },
    ref,
  ) {
    return (
      <div>
        <label className={s.choiceRow} htmlFor={id}>
          <input
            ref={ref}
            id={id}
            type={type}
            className={[s.choiceInput, className ?? ''].filter(Boolean).join(' ')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />
          <span className={s.choiceLabel}>{label}</span>
        </label>
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </div>
    );
  });
}

export const Checkbox = makeChoice('checkbox');
export const Radio = makeChoice('radio');
