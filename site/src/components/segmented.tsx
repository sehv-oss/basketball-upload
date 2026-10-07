import type { ReactElement } from 'react';

interface SegmentedProps<TValue extends string> {
  label: string;
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
}

export function Segmented<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<TValue>): ReactElement {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
