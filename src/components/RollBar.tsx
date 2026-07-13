import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';

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
  const enhancement = useRollStore((s) => s.enhancement);
  const difficulty = useRollStore((s) => s.difficulty);
  const curseDice = useRollStore((s) => s.curseDice);
  const complication = useRollStore((s) => s.complication);
  const setEnhancement = useRollStore((s) => s.setEnhancement);
  const setDifficulty = useRollStore((s) => s.setDifficulty);
  const setCurseDice = useRollStore((s) => s.setCurseDice);
  const setComplication = useRollStore((s) => s.setComplication);
  const performRoll = useRollStore((s) => s.performRoll);

  const attr = template.attributes.find((a) => a.id === attributeId);
  const skill = template.skills.find((s) => s.id === skillId);
  const attrRating = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
  const skillRating = skillId ? (character.skills[skillId] ?? 0) : 0;
  const pool = attrRating + skillRating;
  const canRoll = pool > 0 || enhancement > 0;

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
        {template.dice.curseDice && (
          <label className="field">
            <span className="field-label">{t('roller.curseDice')}</span>
            <input
              type="number"
              min={0}
              max={pool}
              value={Math.min(curseDice, pool)}
              onChange={(e) => setCurseDice(Number(e.target.value))}
            />
          </label>
        )}
        <label className="field">
          <span className="field-label">{t('roller.enhancement')}</span>
          <input
            type="number"
            min={0}
            value={enhancement}
            onChange={(e) => setEnhancement(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('roller.difficulty')}</span>
          <input
            type="number"
            min={0}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('roller.complication')}</span>
          <input
            type="number"
            min={0}
            max={3}
            value={complication}
            onChange={(e) => setComplication(Number(e.target.value))}
          />
        </label>
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
