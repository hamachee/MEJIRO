import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useGmRollStore } from '../store/gmRollStore';
import { useWide } from '../lib/useWide';
import { CampaignSheet } from './CampaignSheet';
import { CampaignTemplatesPage } from './CampaignTemplatesPage';
import { CampaignTricksPage } from './CampaignTricksPage';
import { GmRollBar } from './GmRollBar';
import { GmRollResult } from './GmRollResult';
import { GmTrickPurchase } from './GmTrickPurchase';

export function CampaignView() {
  const { id } = useParams();
  const { t } = useTranslation();
  const active = useCampaignStore((s) => s.active);
  const open = useCampaignStore((s) => s.open);
  const resetFor = useGmRollStore((s) => s.resetFor);
  const result = useGmRollStore((s) => s.result);
  const clearResult = useGmRollStore((s) => s.clearResult);
  const [page, setPage] = useState<1 | 2 | 3>(1);
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
      <GmTrickPurchase campaign={active} />
      <button onClick={clearResult}>{t('common.close')}</button>
    </>
  );

  return (
    <div className="character-view">
      <div className="toolbar">
        <Link to="/gm" className="back-link">
          ← {t('sheet.back')}
        </Link>
      </div>

      <nav className="page-tabs" aria-label="campaign pages">
        <button
          className={`page-tab ${page === 1 ? 'active' : ''}`}
          onClick={() => setPage(1)}
        >
          {t('sheet.page1')}
        </button>
        <button
          className={`page-tab ${page === 2 ? 'active' : ''}`}
          onClick={() => setPage(2)}
        >
          {t('gm.templates')}
        </button>
        <button
          className={`page-tab ${page === 3 ? 'active' : ''}`}
          onClick={() => setPage(3)}
        >
          {t('tricks.title')}
        </button>
      </nav>

      <div className={`play-layout ${wide && result ? 'with-result' : ''}`}>
        {page === 1 && <CampaignSheet campaign={active} />}
        {page === 2 && <CampaignTemplatesPage campaign={active} />}
        {page === 3 && <CampaignTricksPage campaign={active} />}
        {wide && result && <aside className="result-col stack">{resultPanel}</aside>}
      </div>

      <GmRollBar campaign={active} />

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
