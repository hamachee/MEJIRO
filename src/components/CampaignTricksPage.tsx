import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { TrickInfo } from './TrickInfo';
import type { Campaign } from '../types/campaign';

/** Tricks tab: the GM's own trick list, editable via its own edit toggle. */
export function CampaignTricksPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  // Held as a string so clearing the field doesn't snap to a sticky "0".
  const [cost, setCost] = useState('1');
  const [desc, setDesc] = useState('');
  const { tricks } = campaign;
  const { handleProps, itemProps } = useDragReorder(tricks, (next) =>
    patch({ tricks: next }),
  );

  const add = () => {
    if (!name.trim()) return;
    patch({
      tricks: [
        ...tricks,
        {
          id: uid(),
          name: name.trim(),
          cost: Math.max(1, Number(cost) || 1),
          description: desc.trim() || undefined,
        },
      ],
    });
    setName('');
    setCost('1');
    setDesc('');
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="item-card-head">
          <h2 className="grow">
            <FieldLabel i18nKey="tricks.title" en="Tricks" />
          </h2>
          <button className={editing ? 'primary' : ''} onClick={() => setEditing((v) => !v)}>
            {editing ? `✓ ${t('sheet.done')}` : `✏️ ${t('sheet.edit')}`}
          </button>
        </div>
        <p className="muted hint">{t('tricks.manageHint')}</p>
        <ul className="named-list">
          {tricks.map((tr, i) => {
            const dragProps = itemProps(i);
            return (
              <li
                key={tr.id}
                className={`named-item ${dragProps.className}`}
                data-drag-index={dragProps['data-drag-index']}
              >
                <div className="named-item-row">
                  {editing && <span className="drag-handle" {...handleProps(i)} />}
                  <span className="trick-name-cost">
                    <TrickInfo trick={tr} />
                    <span className="trick-cost">
                      · {t('tricks.cost')} {tr.cost}
                    </span>
                  </span>
                  {editing && (
                    <button
                      className="chip ghost"
                      aria-label={`remove ${tr.name}`}
                      onClick={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {editing && (
          <>
            <div className="form-row">
              <input
                className="grow"
                placeholder={t('tricks.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <label className="field">
                <span className="field-label">{t('tricks.cost')}</span>
                <input
                  type="number"
                  min={1}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </label>
              <button onClick={add}>{t('tricks.add')}</button>
            </div>
            <div className="form-row">
              <input
                className="grow"
                placeholder={t('tricks.descPlaceholder')}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
