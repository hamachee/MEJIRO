import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconClose, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';
import { TrickInfo } from './TrickInfo';
import { formatTrickCost } from '../lib/trickCost';
import type { Campaign } from '../types/campaign';
import type { CharacterTrick } from '../types/character';

/** Tricks tab: the GM's own trick list, editable via its own edit toggle. */
export function CampaignTricksPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState<CharacterTrick['cost']>(1);
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
          cost,
          description: desc.trim() || undefined,
        },
      ],
    });
    setName('');
    setCost(1);
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
            {editing ? <><IconCheck /> {t('sheet.done')}</> : <><IconEdit /> {t('sheet.edit')}</>}
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
                      · {t('tricks.cost')} {formatTrickCost(tr.cost)}
                    </span>
                  </span>
                  {editing && (
                    <button
                      className="chip ghost"
                      aria-label={`remove ${tr.name}`}
                      onClick={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
                    >
                      <IconClose />
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
                <select
                  value={cost}
                  onChange={(e) => setCost(e.target.value === 'variable' ? 'variable' : Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value="variable">1~3</option>
                </select>
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
            <ListImportExport
              kind="tricks"
              items={tricks}
              ownerName={campaign.name}
              onChange={(next) => patch({ tricks: next })}
            />
          </>
        )}
      </section>
    </div>
  );
}
