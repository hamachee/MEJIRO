import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { FieldLabel } from './FieldLabel';
import type { Character } from '../types/character';

const DOTS_PER_GROUP = 5;

/** Split a dot count into groups of five, e.g. 12 -> [5, 5, 2]. */
function expGroups(value: number): number[] {
  const groups: number[] = [];
  for (let remaining = value; remaining > 0; remaining -= DOTS_PER_GROUP) {
    groups.push(Math.min(DOTS_PER_GROUP, remaining));
  }
  return groups;
}

interface Props {
  character: Character;
}

/**
 * Sticky bar at the bottom of the sheet, shown only in edit mode (in the
 * same slot the roll bar occupies in play mode). +/- steps total EXP; every
 * point earned stays visible as a filled dot, clustered five to a group —
 * there's no "unfilled" state since EXP has no fixed cap.
 */
export function ExpTracker({ character }: Props) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const exp = character.exp;

  const setExp = (n: number) => patch({ exp: Math.max(0, n) });

  return (
    <div className="exp-bar">
      <span className="field-label">
        <FieldLabel i18nKey="sheet.exp" en="EXP" />
      </span>
      <div className="curse-controls">
        <button
          aria-label={`− ${t('sheet.exp')}`}
          disabled={exp <= 0}
          onClick={() => setExp(exp - 1)}
        >
          −
        </button>
        <span className="exp-value">{exp}</span>
        <button aria-label={`+ ${t('sheet.exp')}`} onClick={() => setExp(exp + 1)}>
          +
        </button>
      </div>
      <span className="dots exp-dots">
        {expGroups(exp).map((n, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className="exp-divider" aria-hidden="true">
                |
              </span>
            )}
            {Array.from({ length: n }, (_, j) => (
              <span key={j} className="dot filled" />
            ))}
          </Fragment>
        ))}
      </span>
    </div>
  );
}
