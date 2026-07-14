import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';
import { Stepper } from './Stepper';

interface Props {
  character: Character;
  template: SystemTemplate;
}

/**
 * Sticky bar at the bottom of the sheet: shows the pool built from the
 * stats tapped on the sheet, plus curse dice / enhancement / difficulty
 * inputs and the roll button.
 */
export function RollBar({ character, template }: Props) {
  const { t } = useTranslation();
  const lang = useLang();

  const attributeId = useRollStore((s) => s.attributeId);
  const skillId = useRollStore((s) => s.skillId);
  const difficulty = useRollStore((s) => s.difficulty);
  const setDifficulty = useRollStore((s) => s.setDifficulty);
  const performRoll = useRollStore((s) => s.performRoll);

  const attr = template.attributes.find((a) => a.id === attributeId);
  const skill = template.skills.find((s) => s.id === skillId);
  const attrRating = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
  const skillRating = skillId ? (character.skills[skillId] ?? 0) : 0;
  const pool = attrRating + skillRating;
  const canRoll = pool > 0;

  const poolText = [
    attr ? `${label(attr.label, lang)} ${attrRating}` : null,
    skill ? `${label(skill.label, lang)} ${skillRating}` : null,
  ]
    .filter(Boolean)
    .join(' + ');

  return (
    <div className="roll-bar">
      <div className="roll-bar-pool">
        <strong className="roll-bar-total">{pool}</strong>
        <span className="muted roll-bar-parts">
          {poolText || t('roller.selectPrompt')}
        </span>
      </div>
      <div className="roll-bar-controls">
        <Stepper
          label={t('roller.difficulty')}
          value={difficulty}
          onChange={setDifficulty}
        />
        <button
          className="primary roll-button"
          disabled={!canRoll}
          onClick={() => performRoll(template, character)}
        >
          🎲 {t('roller.roll')}
        </button>
      </div>
    </div>
  );
}
