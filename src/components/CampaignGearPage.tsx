import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useUiStore } from '../store/uiStore';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconClose, IconEdit, IconStar } from './icons';
import { TagChips } from './TagChips';
import { ListImportExport } from './ListImportExport';
import { SendConfirmPopover } from './SendConfirmPopover';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { useDragReorder } from '../lib/useDragReorder';
import { useSendableCard } from '../lib/useSendableCard';
import type { Campaign } from '../types/campaign';
import type { GearItem } from '../types/character';

interface GearCardProps {
  item: GearItem;
  index: number;
  editing: boolean;
  campaign: Campaign;
  onSave: (item: GearItem) => void;
  onRemove: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<GearItem>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<GearItem>>['itemProps'];
}

/** A single gear card: read-only display, or an inline edit form when opened. */
function GearCard({
  item,
  index,
  editing,
  campaign,
  onSave,
  onRemove,
  dragHandleProps,
  dragItemProps,
}: GearCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sendable = useSendableCard({
    webhookUrl: campaign.webhookUrl,
    embedColor: campaign.embedColor,
    title: `${t('sheet.gear')}: ${item.name}`,
    buildContent: () =>
      [
        item.tags.length > 0 && item.tags.map((tag) => `\`${tag}\``).join(' '),
        item.description,
      ]
        .filter(Boolean)
        .join('\n'),
  });
  const sendableHere = sendable.active && !editing;
  const [name, setName] = useState(item.name);
  const [type, setType] = useState(item.type ?? '');
  const [tags, setTags] = useState(item.tags.join(', '));
  const [desc, setDesc] = useState(item.description ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      type: type.trim() || undefined,
      tags: parseTags(tags),
      description: desc.trim() || undefined,
    });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (editing && open) {
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
            placeholder={t('gear.typePlaceholder')}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('gear.tagsPlaceholder')}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('tricks.descPlaceholder')}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
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
          {editing && <span className="drag-handle" {...dragHandleProps(index)} />}
          <strong className="item-card-name">{item.name}</strong>
        </div>
        <div className="item-card-controls">
          {!editing && (
            <button
              className={`chip ghost fav-toggle ${item.favorite ? 'active' : ''}`}
              aria-label={item.favorite ? `unfavorite ${item.name}` : `favorite ${item.name}`}
              aria-pressed={item.favorite}
              onClick={() => onSave({ ...item, favorite: !item.favorite })}
            >
              <IconStar filled={item.favorite} />
            </button>
          )}
          {editing && (
            <div className="item-card-actions">
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
          )}
        </div>
      </div>
      {item.type && <div className="muted item-card-type">{item.type}</div>}
      <TagChips tags={item.tags} />
      {item.description && <p className="muted item-card-desc">{item.description}</p>}
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

/** Gear tab: the GM's own shared gear reference list, editable via its own edit toggle. */
export function CampaignGearPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const setSendModeActive = useUiStore((s) => s.setSendModeActive);
  const [editing, setEditing] = useState(false);
  // This tab has no global edit toggle to piggyback on (each GM tab edits
  // its own list independently), so entering edit mode forces send mode
  // off directly rather than through useUiStore's editingActive path.
  const toggleEditing = () =>
    setEditing((v) => {
      if (!v) setSendModeActive(false);
      return !v;
    });
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [tags, setTags] = useState('');
  const [desc, setDesc] = useState('');
  const items = campaign.gear;
  const { handleProps, itemProps } = useDragReorder(items, (next) => patch({ gear: next }), 'grid');

  const add = () => {
    if (!name.trim()) return;
    const item: GearItem = {
      id: uid(),
      name: name.trim(),
      type: type.trim() || undefined,
      tags: parseTags(tags),
      description: desc.trim() || undefined,
      favorite: false,
    };
    patch({ gear: [...items, item] });
    setName('');
    setType('');
    setTags('');
    setDesc('');
  };

  return (
    <div className="stack">
      <section className="card">
        <div className="item-card-head">
          <h2 className="grow">
            <FieldLabel i18nKey="sheet.gear" en="Gear" />
          </h2>
          <button className={editing ? 'primary' : ''} onClick={toggleEditing}>
            {editing ? <><IconCheck /> {t('sheet.done')}</> : <><IconEdit /> {t('sheet.edit')}</>}
          </button>
        </div>
        {items.length === 0 && <p className="muted">—</p>}
        <div className="card-grid">
          {items.map((item, i) => (
            <GearCard
              key={item.id}
              item={item}
              index={i}
              editing={editing}
              campaign={campaign}
              onSave={(updated) =>
                patch({ gear: items.map((x) => (x.id === item.id ? updated : x)) })
              }
              onRemove={() => patch({ gear: items.filter((x) => x.id !== item.id) })}
              dragHandleProps={handleProps}
              dragItemProps={itemProps}
            />
          ))}
        </div>
        {editing && (
          <>
            <div className="form-row">
              <input
                placeholder={t('sheet.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <input
                placeholder={t('gear.typePlaceholder')}
                value={type}
                onChange={(e) => setType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <input
                className="grow"
                placeholder={t('gear.tagsPlaceholder')}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
            </div>
            <div className="form-row">
              <input
                className="grow"
                placeholder={t('tricks.descPlaceholder')}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
              />
              <button onClick={add}>{t('sheet.add')}</button>
            </div>
            <ListImportExport
              kind="gear"
              items={items}
              ownerName={campaign.name}
              onChange={(next) => patch({ gear: next })}
            />
          </>
        )}
      </section>
    </div>
  );
}
