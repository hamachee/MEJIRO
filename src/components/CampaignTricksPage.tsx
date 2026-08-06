import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconCopy, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';
import { SendConfirmPopover } from './SendConfirmPopover';
import { TrickInfo } from './TrickInfo';
import { TrickCostSelect } from './TrickCostSelect';
import { formatTrickCost } from '../lib/trickCost';
import { useSendableCard } from '../lib/useSendableCard';
import type { Campaign } from '../types/campaign';
import type { CharacterTrick } from '../types/character';

/** A single trick row: read-only, or an inline edit form when opened. */
function TrickRow({
  trick,
  index,
  campaign,
  onSave,
  onRemove,
  onDuplicate,
  dragHandleProps,
  dragItemProps,
}: {
  trick: CharacterTrick;
  index: number;
  campaign: Campaign;
  onSave: (trick: CharacterTrick) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<CharacterTrick>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<CharacterTrick>>['itemProps'];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sendable = useSendableCard({
    webhookUrl: campaign.webhookUrl,
    embedColor: campaign.embedColor,
    title: `${t('send.trickItem')}: ${trick.name} · ${formatTrickCost(trick.cost)} ${t('send.hits')}`,
    buildContent: () => trick.description ?? '',
  });
  const sendableHere = sendable.active && !open;
  const [name, setName] = useState(trick.name);
  const [cost, setCost] = useState<CharacterTrick['cost']>(trick.cost);
  const [desc, setDesc] = useState(trick.description ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({ ...trick, name: name.trim(), cost, description: desc.trim() || undefined });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (open) {
    return (
      <li className={`named-item named-item-editing ${drag.className}`} data-drag-index={index}>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('tricks.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <TrickCostSelect value={cost} onChange={setCost} />
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('tricks.descPlaceholder')}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </div>
        <div className="form-row">
          <button className="primary" onClick={save}>
            {t('sheet.save')}
          </button>
          <button onClick={() => setOpen(false)}>{t('common.cancel')}</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`named-item ${sendableHere ? 'sendable-active' : ''} ${drag.className}`} data-drag-index={index}>
      <div className="named-item-row">
        <span className="drag-handle" {...dragHandleProps(index)} />
        <span className="trick-name-cost">
          <TrickInfo trick={trick} />
          <span className="trick-cost">
            · {t('tricks.cost')} {formatTrickCost(trick.cost)}
          </span>
        </span>
        <div className="item-card-actions">
          <button className="chip ghost" aria-label={`duplicate ${trick.name}`} onClick={onDuplicate}>
            <IconCopy />
          </button>
          <button className="chip ghost" aria-label={`edit ${trick.name}`} onClick={() => setOpen(true)}>
            <IconEdit />
          </button>
          <button className="chip ghost" aria-label={`remove ${trick.name}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>
      {sendableHere && (
        <div className="sendable-overlay" onClick={sendable.openConfirm}>
          <SendConfirmPopover
            confirm={sendable.confirm}
            popoverRef={sendable.popoverRef}
            cancel={sendable.cancel}
            send={sendable.send}
            status={sendable.status}
            error={sendable.error}
          />
        </div>
      )}
    </li>
  );
}

/** Tricks tab: the GM's own trick list, laid out like the adversary templates tab. */
export function CampaignTricksPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [adding, setAdding] = useState(false);
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
        <h2>
          <FieldLabel i18nKey="tricks.title" en="Tricks" />
        </h2>
        <p className="muted hint">{t('tricks.manageHint')}</p>
        <div className="form-row">
          <button className="primary" onClick={() => setAdding((v) => !v)}>
            {adding ? <><IconClose /> {t('common.cancel')}</> : `+ ${t('tricks.add')}`}
          </button>
        </div>
        <ListImportExport
          kind="tricks"
          items={tricks}
          ownerName={campaign.name}
          onChange={(next) => patch({ tricks: next })}
        />
        {adding && (
          <>
            <div className="form-row">
              <input
                className="grow"
                placeholder={t('tricks.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <TrickCostSelect value={cost} onChange={setCost} />
              <button className="primary" onClick={add}>{t('tricks.add')}</button>
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
        {tricks.length === 0 && <p className="muted">—</p>}
      </section>
      {tricks.length > 0 && (
        <ul className="named-list">
          {tricks.map((tr, i) => (
            <TrickRow
              key={tr.id}
              trick={tr}
              index={i}
              campaign={campaign}
              onSave={(updated) =>
                patch({ tricks: tricks.map((x) => (x.id === updated.id ? updated : x)) })
              }
              onRemove={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
              onDuplicate={() =>
                patch({
                  tricks: [...tricks, { ...tr, id: uid(), name: `${tr.name}${t('common.copySuffix')}` }],
                })
              }
              dragHandleProps={handleProps}
              dragItemProps={itemProps}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
