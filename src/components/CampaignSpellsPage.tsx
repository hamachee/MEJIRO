import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconCopy, IconEdit, IconStar } from './icons';
import { TagChips } from './TagChips';
import { ListImportExport } from './ListImportExport';
import { SendConfirmPopover } from './SendConfirmPopover';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { useDragReorder } from '../lib/useDragReorder';
import { useSendableCard } from '../lib/useSendableCard';
import type { Campaign } from '../types/campaign';
import type { SpellItem } from '../types/character';

interface SpellCardProps {
  item: SpellItem;
  index: number;
  campaign: Campaign;
  onSave: (item: SpellItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<SpellItem>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<SpellItem>>['itemProps'];
}

/** A single spell card: read-only display, or an inline edit form when opened. */
function SpellCard({
  item,
  index,
  campaign,
  onSave,
  onRemove,
  onDuplicate,
  dragHandleProps,
  dragItemProps,
}: SpellCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sendable = useSendableCard({
    webhookUrl: campaign.webhookUrl,
    embedColor: campaign.embedColor,
    title: `${t('send.spellItem')}: ${item.name}`,
    buildContent: () =>
      [
        item.cost && `**${item.cost}**`,
        item.attunements.length > 0 && item.attunements.map((tag) => `\`${tag}\``).join(' '),
        item.effect,
        item.advancements,
      ]
        .filter(Boolean)
        .join('\n'),
  });
  const sendableHere = sendable.active && !open;
  const [name, setName] = useState(item.name);
  const [cost, setCost] = useState(item.cost ?? '');
  const [attunements, setAttunements] = useState(item.attunements.join(', '));
  const [effect, setEffect] = useState(item.effect ?? '');
  const [advancements, setAdvancements] = useState(item.advancements ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      cost: cost.trim() || undefined,
      attunements: parseTags(attunements),
      effect: effect.trim() || undefined,
      advancements: advancements.trim() || undefined,
    });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (open) {
    return (
      <div className={`item-card editing ${drag.className}`} data-drag-index={index}>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder={t('spells.costPlaceholder')}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('spells.attunementsPlaceholder')}
            value={attunements}
            onChange={(e) => setAttunements(e.target.value)}
          />
        </div>
        <div className="form-row">
          <textarea
            className="grow"
            rows={2}
            placeholder={t('spells.effectPlaceholder')}
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
          />
        </div>
        <div className="form-row">
          <textarea
            className="grow"
            rows={2}
            placeholder={t('spells.advancementsPlaceholder')}
            value={advancements}
            onChange={(e) => setAdvancements(e.target.value)}
          />
        </div>
        <div className="form-row">
          <button className="primary" onClick={save}>
            {t('sheet.save')}
          </button>
          <button onClick={() => setOpen(false)}>{t('common.cancel')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`item-card ${sendableHere ? 'sendable-active' : ''} ${drag.className}`} data-drag-index={index}>
      <div className="item-card-head">
        <div className="item-card-title">
          <span className="drag-handle" {...dragHandleProps(index)} />
          <strong className="item-card-name">{item.name}</strong>
        </div>
        <div className="item-card-controls">
          <button
            className={`chip ghost fav-toggle ${item.favorite ? 'active' : ''}`}
            aria-label={item.favorite ? `unfavorite ${item.name}` : `favorite ${item.name}`}
            aria-pressed={item.favorite}
            onClick={() => onSave({ ...item, favorite: !item.favorite })}
          >
            <IconStar filled={item.favorite} />
          </button>
          <div className="item-card-actions">
            <button className="chip ghost" aria-label={`duplicate ${item.name}`} onClick={onDuplicate}>
              <IconCopy />
            </button>
            <button
              className="chip ghost"
              aria-label={`edit ${item.name}`}
              onClick={() => setOpen(true)}
            >
              <IconEdit />
            </button>
            <button className="chip ghost" aria-label={`remove ${item.name}`} onClick={onRemove}>
              <IconClose />
            </button>
          </div>
        </div>
      </div>
      {item.cost && (
        <div className="muted item-card-type">
          {t('spells.cost')}: {item.cost}
        </div>
      )}
      <TagChips tags={item.attunements} />
      {item.effect && <p className="muted item-card-desc">{item.effect}</p>}
      {item.advancements && <p className="muted item-card-desc">{item.advancements}</p>}
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
    </div>
  );
}

/** Spells tab: the GM's own shared spell reference list, laid out like the adversary templates tab. */
export function CampaignSpellsPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [attunements, setAttunements] = useState('');
  const [effect, setEffect] = useState('');
  const [advancements, setAdvancements] = useState('');
  const items = campaign.spells;
  const { handleProps, itemProps } = useDragReorder(items, (next) => patch({ spells: next }), 'grid');

  const add = () => {
    if (!name.trim()) return;
    const item: SpellItem = {
      id: uid(),
      name: name.trim(),
      cost: cost.trim() || undefined,
      attunements: parseTags(attunements),
      effect: effect.trim() || undefined,
      advancements: advancements.trim() || undefined,
      favorite: false,
    };
    patch({ spells: [...items, item] });
    setName('');
    setCost('');
    setAttunements('');
    setEffect('');
    setAdvancements('');
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>
          <FieldLabel i18nKey="sheet.spells" en="Spells" />
        </h2>
        <div className="form-row">
          <button className="primary" onClick={() => setAdding((v) => !v)}>
            {adding ? <><IconClose /> {t('common.cancel')}</> : `+ ${t('sheet.add')}`}
          </button>
        </div>
        <ListImportExport
          kind="spells"
          items={items}
          ownerName={campaign.name}
          onChange={(next) => patch({ spells: next })}
        />
        {adding && (
          <>
            <div className="form-row">
              <input
                placeholder={t('sheet.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <input
                placeholder={t('spells.costPlaceholder')}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <input
                className="grow"
                placeholder={t('spells.attunementsPlaceholder')}
                value={attunements}
                onChange={(e) => setAttunements(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
            </div>
            <div className="form-row">
              <textarea
                className="grow"
                rows={2}
                placeholder={t('spells.effectPlaceholder')}
                value={effect}
                onChange={(e) => setEffect(e.target.value)}
              />
            </div>
            <div className="form-row">
              <textarea
                className="grow"
                rows={2}
                placeholder={t('spells.advancementsPlaceholder')}
                value={advancements}
                onChange={(e) => setAdvancements(e.target.value)}
              />
              <button className="primary" onClick={add}>{t('sheet.add')}</button>
            </div>
          </>
        )}
        {items.length === 0 && <p className="muted">—</p>}
      </section>
      {items.length > 0 && (
        <div className="card-grid">
          {items.map((item, i) => (
            <SpellCard
              key={item.id}
              item={item}
              index={i}
              campaign={campaign}
              onSave={(updated) =>
                patch({ spells: items.map((x) => (x.id === item.id ? updated : x)) })
              }
              onRemove={() => patch({ spells: items.filter((x) => x.id !== item.id) })}
              onDuplicate={() =>
                patch({
                  spells: [...items, { ...item, id: uid(), name: `${item.name}${t('common.copySuffix')}` }],
                })
              }
              dragHandleProps={handleProps}
              dragItemProps={itemProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
