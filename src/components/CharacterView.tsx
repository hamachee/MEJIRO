import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { getTemplate } from '../templates';
import { SheetEditor } from './SheetEditor';
import { DicePoolBuilder } from './DicePoolBuilder';
import { RollResult } from './RollResult';
import { TrickPurchase } from './TrickPurchase';

export function CharacterView() {
  const { id } = useParams();
  const { t } = useTranslation();
  const active = useCharacterStore((s) => s.active);
  const open = useCharacterStore((s) => s.open);
  const resetFor = useRollStore((s) => s.resetFor);
  const result = useRollStore((s) => s.result);

  useEffect(() => {
    if (id) open(id);
  }, [id, open]);

  const template = active ? getTemplate(active.templateId) : undefined;

  useEffect(() => {
    if (template) resetFor(template);
  }, [template, resetFor]);

  if (!active || !template) {
    return (
      <div className="card">
        <p className="muted">…</p>
        <Link to="/">{t('sheet.back')}</Link>
      </div>
    );
  }

  return (
    <div className="character-view">
      <div className="toolbar">
        <Link to="/" className="back-link">
          ← {t('sheet.back')}
        </Link>
      </div>
      <div className="two-col">
        <div className="col">
          <SheetEditor character={active} template={template} />
        </div>
        <div className="col">
          <DicePoolBuilder character={active} template={template} />
          {result && (
            <>
              <RollResult template={template} />
              <TrickPurchase character={active} template={template} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
