import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { getTemplate } from '../templates';
import { useWide } from '../lib/useWide';
import { CharacterSheet } from './CharacterSheet';
import { CharacterPage2 } from './CharacterPage2';
import { CharacterPage3 } from './CharacterPage3';
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
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const wide = useWide();

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

  const resultPanel = result && (
    <>
      <RollResult />
      <TrickPurchase character={active} />
      <button onClick={clearResult}>{t('common.close')}</button>
    </>
  );

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

      {/* Bookmark-style tabs on the left margin switch sheet pages. */}
      <nav className="page-tabs" aria-label="sheet pages">
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
          {t('sheet.page2')}
        </button>
        <button
          className={`page-tab ${page === 3 ? 'active' : ''}`}
          onClick={() => setPage(3)}
        >
          {t('sheet.page3')}
        </button>
      </nav>

      {/* Desktop: the result sits in a sticky side column next to the sheet.
          Mobile: it opens as a modal over the sheet. */}
      <div className={`play-layout ${wide && result ? 'with-result' : ''}`}>
        {page === 1 && (
          <CharacterSheet character={active} template={template} editing={editing} />
        )}
        {page === 2 && <CharacterPage2 character={active} editing={editing} />}
        {page === 3 && <CharacterPage3 character={active} editing={editing} />}
        {wide && result && <aside className="result-col stack">{resultPanel}</aside>}
      </div>

      {!editing && <RollBar character={active} template={template} />}

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
