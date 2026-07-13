import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';
import type { Stat, SystemTemplate } from '../types/template';
import { ResourceTracker } from './ResourceTracker';

function groupByCategory(stats: Stat[]): Record<string, Stat[]> {
  return stats.reduce<Record<string, Stat[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
}

interface StatRowProps {
  stat: Stat;
  value: number;
  onAdjust: (delta: number) => void;
}

function StatRow({ stat, value, onAdjust }: StatRowProps) {
  const lang = useLang();
  return (
    <div className="stat-row">
      <span className="stat-label">{label(stat.label, lang)}</span>
      <div className="stepper">
        <button
          aria-label={`- ${label(stat.label, lang)}`}
          onClick={() => onAdjust(-1)}
          disabled={value <= 0}
        >
          −
        </button>
        <span className="stat-value">{value}</span>
        <button
          aria-label={`+ ${label(stat.label, lang)}`}
          onClick={() => onAdjust(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

interface Props {
  character: Character;
  template: SystemTemplate;
}

export function SheetEditor({ character, template }: Props) {
  const { t } = useTranslation();
  const lang = useLang();
  const rename = useCharacterStore((s) => s.rename);
  const adjustStat = useCharacterStore((s) => s.adjustStat);

  const categoryLabel = (id: string) =>
    label(template.categories.find((c) => c.id === id)?.label ?? { en: id }, lang);

  const attrGroups = groupByCategory(template.attributes);
  const skillGroups = groupByCategory(template.skills);

  return (
    <div className="stack">
      <section className="card">
        <label className="field">
          <span className="field-label">{t('sheet.rename')}</span>
          <input
            defaultValue={character.name}
            onBlur={(e) => rename(e.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h2>{t('sheet.attributes')}</h2>
        {template.categories.map((cat) =>
          attrGroups[cat.id]?.length ? (
            <div key={cat.id} className="stat-group">
              <h3 className="group-title">{categoryLabel(cat.id)}</h3>
              {attrGroups[cat.id].map((stat) => (
                <StatRow
                  key={stat.id}
                  stat={stat}
                  value={character.attributes[stat.id] ?? 0}
                  onAdjust={(d) => adjustStat('attributes', stat.id, d)}
                />
              ))}
            </div>
          ) : null,
        )}
      </section>

      <section className="card">
        <h2>{t('sheet.skills')}</h2>
        {template.categories.map((cat) =>
          skillGroups[cat.id]?.length ? (
            <div key={cat.id} className="stat-group">
              <h3 className="group-title">{categoryLabel(cat.id)}</h3>
              {skillGroups[cat.id].map((stat) => (
                <StatRow
                  key={stat.id}
                  stat={stat}
                  value={character.skills[stat.id] ?? 0}
                  onAdjust={(d) => adjustStat('skills', stat.id, d)}
                />
              ))}
            </div>
          ) : null,
        )}
      </section>

      <ResourceTracker character={character} template={template} />
    </div>
  );
}
