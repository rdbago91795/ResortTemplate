import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Select } from '../primitives/Select';
import * as s from './admin.css';

export type FilterDefinition =
  | { id: string; label: string; kind: 'search'; placeholder?: string }
  | { id: string; label: string; kind: 'select'; options: { value: string; label: string }[] }
  | { id: string; label: string; kind: 'date' };

export type FilterBarProps = {
  filters: FilterDefinition[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onClear: () => void;
};

/**
 * The filter row every admin list shares — design-system.md §5.6.
 *
 * Clear is always present and always enabled when anything is set. A filtered list that looks
 * empty is the single most common "the data is gone" support question, and the fix has to be
 * visible on the same screen rather than requiring the admin to remember which control they
 * touched.
 *
 * Filters are declared as data rather than composed as children so each list describes what
 * it filters by, and every list gets the same layout, the same clear behaviour, and the same
 * labelling without restating it.
 */
export function FilterBar({ filters, values, onChange, onClear }: FilterBarProps) {
  const active = Object.values(values).some((value) => value !== '');

  return (
    <div className={s.filterBar} role="search">
      {filters.map((filter) => (
        <div key={filter.id} className={s.filterField}>
          {filter.kind === 'select' ? (
            <Select
              id={`filter-${filter.id}`}
              label={filter.label}
              options={filter.options}
              value={values[filter.id] ?? ''}
              placeholder="Any"
              onChange={(e) => onChange(filter.id, e.target.value)}
            />
          ) : (
            <Input
              id={`filter-${filter.id}`}
              label={filter.label}
              type={filter.kind === 'date' ? 'date' : 'search'}
              placeholder={filter.kind === 'search' ? filter.placeholder : undefined}
              value={values[filter.id] ?? ''}
              onChange={(e) => onChange(filter.id, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className={s.filterActions}>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!active}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
