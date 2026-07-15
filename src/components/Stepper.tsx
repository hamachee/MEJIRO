import type { ReactNode } from 'react';

interface Props {
  label: ReactNode;
  ariaLabel: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

/** A labelled (−) n (+) control — friendlier than a free number field on touch. */
export function Stepper({
  label,
  ariaLabel,
  value,
  onChange,
  min = 0,
  max,
}: Props) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="stepper">
        <button
          aria-label={`− ${ariaLabel}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className="stat-value">{value}</span>
        <button
          aria-label={`+ ${ariaLabel}`}
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
