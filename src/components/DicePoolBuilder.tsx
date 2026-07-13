import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';
import type { Stat, SystemTemplate } from '../types/template';

interface Props {
  character: Character;
  template: SystemTemplate;
}

export function DicePoolBuilder({ character, template }: Props) {
  const { t } = useTranslation();
  const lang = useLang();

  const attributeId = useRollStore((s) => s.attributeId);
  const skillId = useRollStore((s) => s.skillId);
  const enhancement = useRollStore((s) => s.enhancement);
  const difficulty = useRollStore((s) => s.difficulty);
  const setAttribute = useRollStore((s) => s.setAttribute);
  const setSkill = useRollStore((s) => s.setSkill);
  const setEnhancement = useRollStore((s) => s.setEnhancement);
  const setDifficulty = useRollStore((s) => s.setDifficulty);
  const performRoll = useRollStore((s) => s.performRoll);

  const attrRating = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
  const skillRating = skillId ? (character.skills[skillId] ?? 0) : 0;
  const pool = attrRating + skillRating;
  const canRoll = pool > 0 || enhancement > 0;

  const toggleGrid = (
    stats: Stat[],
    selected: string | null,
    onSelect: (id: string) => void,
    ratingOf: (id: string) => number,
  ) => (
    <div className="toggle-grid">
      {stats.map((stat) => (
        <button
          key={stat.id}
          className={`toggle ${selected === stat.id ? 'active' : ''}`}
          onClick={() => onSelect(stat.id)}
        >
          <span>{label(stat.label, lang)}</span>
          <span className="toggle-rating">{ratingOf(stat.id)}</span>
        </button>
      ))}
    </div>
  );

  return (
    <section className="card">
      <h2>{t('roller.title')}</h2>

      <h3 className="group-title">{t('roller.attribute')}</h3>
      {toggleGrid(
        template.attributes,
        attributeId,
        setAttribute,
        (id) => character.attributes[id] ?? 0,
      )}

      <h3 className="group-title">{t('roller.skill')}</h3>
      {toggleGrid(
        template.skills,
        skillId,
        setSkill,
        (id) => character.skills[id] ?? 0,
      )}

      <div className="form-row">
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
      </div>

      <div className="pool-summary">
        <div className="pool-total">
          <span className="muted">{t('roller.pool')}</span>
          <strong>{pool}</strong>
        </div>
        <button
          className="primary roll-button"
          disabled={!canRoll}
          onClick={() => performRoll(template, character)}
        >
          🎲 {t('roller.roll')}
        </button>
      </div>
      {!canRoll && <p className="muted">{t('roller.selectPrompt')}</p>}
    </section>
  );
}
