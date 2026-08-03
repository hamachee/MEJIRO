import { useState } from 'react';
import type { CharacterTrick } from '../types/character';

/**
 * A trick's name with its description folded underneath, using the same
 * native details/summary affordance as the template list. Kept controlled:
 * in the purchase phase this sits inside the checkbox <label>, where a
 * summary click's default action would also toggle the checkbox — so the
 * click is intercepted and the fold toggled manually.
 */
export function TrickInfo({ trick }: { trick: CharacterTrick }) {
  const [open, setOpen] = useState(false);

  if (!trick.description) {
    return <span className="trick-name">{trick.name}</span>;
  }
  return (
    <details className="trick-fold" open={open}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {trick.name}
      </summary>
      <span className="muted trick-desc">{trick.description}</span>
    </details>
  );
}
