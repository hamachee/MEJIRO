import { useState } from 'react';

interface Props {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
}

/**
 * A `− [value] +` counter with double-click-to-type editing, matching the
 * EXP tracker / Free Roll pool interaction (same `.curse-controls` /
 * `.exp-value` styling, just outside their sticky-bar / selectable-card
 * contexts).
 */
export function Counter({ value, onChange, ariaLabel }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const setValue = (n: number) => onChange(Math.max(0, n));
  const startEditing = () => setDraft(String(value));
  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (!Number.isNaN(n)) setValue(n);
    }
    setDraft(null);
  };

  return (
    <div className="curse-controls">
      <button aria-label={`− ${ariaLabel}`} disabled={value <= 0} onClick={() => setValue(value - 1)}>
        −
      </button>
      {draft !== null ? (
        <input
          type="number"
          className="exp-value"
          inputMode="numeric"
          min={0}
          autoFocus
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') setDraft(null);
          }}
        />
      ) : (
        <span
          className="exp-value"
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onDoubleClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startEditing();
            }
          }}
        >
          {value}
        </span>
      )}
      <button aria-label={`+ ${ariaLabel}`} onClick={() => setValue(value + 1)}>
        +
      </button>
    </div>
  );
}
