import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import { attributesByCategory } from '../templates';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';
import { Stepper } from './Stepper';

const BONUS_DICE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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
  const bonusDice = useRollStore((s) => s.bonusDice);
  const setBonusDice = useRollStore((s) => s.setBonusDice);
  const difficulty = useRollStore((s) => s.difficulty);
  const setDifficulty = useRollStore((s) => s.setDifficulty);
  const performRoll = useRollStore((s) => s.performRoll);

  const attrRating = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
  const skillRating = skillId ? (character.skills[skillId] ?? 0) : 0;
  const pool = attrRating + skillRating + bonusDice;
  const canRoll = pool > 0;

  // Sorted by the label actually shown, not template order, so the
  // dropdown reads A-Z in whichever language is active.
  const sortedSkills = useMemo(
    () =>
      template.skills
        .map((sk) => ({ id: sk.id, name: label(sk.label, lang) }))
        .sort((a, b) => a.name.localeCompare(b.name, lang)),
    [template.skills, lang],
  );

  return (
    <div className="roll-bar">
      <div className="roll-bar-pool">
        <strong className="roll-bar-total">{pool}</strong>
        <div className="roll-bar-parts">
          <select
            className="roll-bar-pick"
            aria-label={t('sheet.skills')}
            value={skillId ?? ''}
            onChange={(e) => setSkill(e.target.value || null)}
          >
            <option value="">{t('sheet.skills')}</option>
            {sortedSkills.map((sk) => (
              <option key={sk.id} value={sk.id}>
                {sk.name}
              </option>
            ))}
          </select>
          {skillId != null && <span className="roll-bar-rating">{skillRating}</span>}
          <span className="roll-bar-plus muted">+</span>
          <select
            className="roll-bar-pick"
            aria-label={t('sheet.attributes')}
            value={attributeId ?? ''}
            onChange={(e) => setAttribute(e.target.value || null)}
          >
            <option value="">{t('sheet.attributes')}</option>
            {template.categories.map((cat) => (
              <optgroup key={cat.id} label={label(cat.label, lang)}>
                {(attributesByCategory(template).get(cat.id) ?? []).map((a) => (
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
            className="roll-bar-pick roll-bar-bonus"
            aria-label={t('roller.bonusDice')}
            title={t('roller.bonusDice')}
            value={bonusDice}
            onChange={(e) => setBonusDice(Number(e.target.value))}
          >
            {BONUS_DICE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
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
