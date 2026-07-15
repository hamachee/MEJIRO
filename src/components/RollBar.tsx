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
  const setAttribute = useRollStore((s) => s.setAttribute);
  const setSkill = useRollStore((s) => s.setSkill);
  const difficulty = useRollStore((s) => s.difficulty);
  const setDifficulty = useRollStore((s) => s.setDifficulty);
  const performRoll = useRollStore((s) => s.performRoll);

  const attrRating = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
  const skillRating = skillId ? (character.skills[skillId] ?? 0) : 0;
  const pool = attrRating + skillRating;
  const canRoll = pool > 0;

  return (
    <div className="roll-bar">
      <div className="roll-bar-pool">
        <strong className="roll-bar-total">{pool}</strong>
        <div className="roll-bar-parts">
          <select
            className="roll-bar-pick"
            aria-label={t('sheet.attributes')}
            value={attributeId ?? ''}
            onChange={(e) => setAttribute(e.target.value || null)}
          >
            <option value="">{t('sheet.attributes')}</option>
            {template.categories.map((cat) => (
              <optgroup key={cat.id} label={label(cat.label, lang)}>
                {template.attributes
                  .filter((a) => a.category === cat.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {label(a.label, lang)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {attributeId != null && (
            <span className="roll-bar-rating">{attrRating}</span>
          )}
          <span className="roll-bar-plus muted">+</span>
          <select
            className="roll-bar-pick"
            aria-label={t('sheet.skills')}
            value={skillId ?? ''}
            onChange={(e) => setSkill(e.target.value || null)}
          >
            <option value="">{t('sheet.skills')}</option>
            {template.skills.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {label(sk.label, lang)}
              </option>
            ))}
          </select>
          {skillId != null && <span className="roll-bar-rating">{skillRating}</span>}
        </div>
      </div>
      <div className="roll-bar-controls">
        <Stepper
          label={t('roller.difficulty')}
          ariaLabel={t('roller.difficulty')}
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
