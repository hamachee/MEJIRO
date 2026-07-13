import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { getTemplate } from '../templates';
import { CharacterSheet } from './CharacterSheet';
import { RollBar } from './RollBar';
import { RollResult } from './RollResult';
import { TrickPurchase } from './TrickPurchase';

export function CharacterView() {
  const { id } = useParams();
  const { t } = useTranslation();
  const active = useCharacterStore((s) => s.active);
  const open = useCharacterStore((s) => s.open);
  const resetFor = useRollStore((s) => s.resetFor);
  const result = useRollStore((s) => s.result);
  const clearResult = useRollStore((s) => s.clearResult);
  const [editing, setEditing] = useState(false);

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
        <button
          className={editing ? 'primary' : ''}
          onClick={() => setEditing(!editing)}
        >
          {editing ? `✓ ${t('sheet.done')}` : `✏️ ${t('sheet.edit')}`}
        </button>
      </div>

      <CharacterSheet character={active} template={template} editing={editing} />

      {!editing && <RollBar character={active} template={template} />}

      {result && (
        <div className="modal-scrim" onClick={clearResult}>
          <div
            className="modal stack"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <RollResult template={template} />
            <TrickPurchase character={active} template={template} />
            <button onClick={clearResult}>{t('common.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
