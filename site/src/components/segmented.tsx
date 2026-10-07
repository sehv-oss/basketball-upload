import type * as React from 'react';

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
}: SegmentedProps<TValue>): React.ReactElement {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const handleOnClick = (): void => onChange(option.value);

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={handleOnClick}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
