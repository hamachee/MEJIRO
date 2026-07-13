import { useState } from 'react';
import type { CharacterTrick } from '../types/character';

/**
 * A trick's name with its description folded underneath. Used in both the
 * sheet's trick list and the purchase phase; safe inside a <label> — the
 * toggle stops the click from reaching the checkbox.
 */
export function TrickInfo({ trick }: { trick: CharacterTrick }) {
  const [open, setOpen] = useState(false);

  if (!trick.description) {
    return <span className="trick-name">{trick.name}</span>;
  }
  return (
    <span className="trick-info">
      <button
        type="button"
        className="trick-name-toggle"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <span className="trick-name">{trick.name}</span>
        <span className="chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <span className="muted trick-desc">{trick.description}</span>}
    </span>
  );
}
