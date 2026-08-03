import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useGmRollStore } from '../store/gmRollStore';
import { useWide } from '../lib/useWide';
import { CampaignSheet } from './CampaignSheet';
import { GmRollBar } from './GmRollBar';
import { GmRollResult } from './GmRollResult';

export function CampaignView() {
  const { id } = useParams();
  const { t } = useTranslation();
  const active = useCampaignStore((s) => s.active);
  const open = useCampaignStore((s) => s.open);
  const resetFor = useGmRollStore((s) => s.resetFor);
  const result = useGmRollStore((s) => s.result);
  const clearResult = useGmRollStore((s) => s.clearResult);
  const [editing, setEditing] = useState(false);
  const wide = useWide();

  useEffect(() => {
    if (id) open(id);
  }, [id, open]);

  useEffect(() => {
    resetFor();
  }, [id, resetFor]);

  if (!active) {
    return (
      <div className="card">
        <p className="muted">…</p>
        <Link to="/gm">{t('sheet.back')}</Link>
      </div>
    );
  }

  const resultPanel = result && (
    <>
      <GmRollResult campaign={active} />
      <button onClick={clearResult}>{t('common.close')}</button>
    </>
  );

  return (
    <div className="character-view">
      <div className="toolbar">
        <Link to="/gm" className="back-link">
          ← {t('sheet.back')}
        </Link>
        <div className="toolbar-actions">
          <button
            className={editing ? 'primary' : ''}
            onClick={() => setEditing(!editing)}
          >
            {editing ? `✓ ${t('sheet.done')}` : `✏️ ${t('sheet.edit')}`}
          </button>
        </div>
      </div>

      <div className={`play-layout ${wide && result ? 'with-result' : ''}`}>
        <CampaignSheet campaign={active} editing={editing} />
        {wide && result && <aside className="result-col stack">{resultPanel}</aside>}
      </div>

      {!editing && <GmRollBar campaign={active} />}

      {!wide && result && (
        <div className="modal-scrim" onClick={clearResult}>
          <div
            className="modal stack"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {resultPanel}
          </div>
        </div>
      )}
    </div>
  );
}
