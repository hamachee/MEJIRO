import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';
import type { ResourceDef, SystemTemplate } from '../types/template';

interface Props {
  character: Character;
  template: SystemTemplate;
}

const STEPS = [-3, -1, 1, 3];

export function ResourceTracker({ character, template }: Props) {
  const { t } = useTranslation();
  const lang = useLang();
  const applyDelta = useCharacterStore((s) => s.applyResourceDelta);
  const undo = useCharacterStore((s) => s.undoResource);

  const row = (def: ResourceDef) => {
    const state = character.resources[def.id] ?? { value: def.default, log: [] };
    const canUndo = state.log.length > 0;
    return (
      <div key={def.id} className="resource">
        <div className="resource-head">
          <span className="resource-label">{label(def.label, lang)}</span>
          <span className="resource-value">
            {state.value}
            {def.max !== undefined && <span className="muted"> / {def.max}</span>}
          </span>
        </div>
        <div className="resource-controls">
          {STEPS.map((d) => (
            <button
              key={d}
              className="chip"
              onClick={() => applyDelta(def.id, d, def.max)}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
          <button
            className="chip ghost"
            disabled={!canUndo}
            onClick={() => undo(def.id)}
          >
            ↺ {t('resource.undo')}
          </button>
        </div>
        {canUndo && (
          <div className="resource-log muted">
            {state.log
              .slice(-5)
              .map((c) => (c.delta > 0 ? `+${c.delta}` : `${c.delta}`))
              .join('  ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="card">
      <h2>{t('sheet.resources')}</h2>
      {template.resources.map(row)}
    </section>
  );
}
