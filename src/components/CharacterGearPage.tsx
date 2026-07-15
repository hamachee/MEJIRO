import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { FieldLabel } from './FieldLabel';
import { TagChips } from './TagChips';
import { InjuryCard } from './CharacterSheet';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { useDragReorder } from '../lib/useDragReorder';
import type { Character, GearItem } from '../types/character';
import type { SystemTemplate } from '../types/template';

interface GearCardProps {
  item: GearItem;
  index: number;
  editing: boolean;
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
  onSave,
  onRemove,
  dragHandleProps,
  dragItemProps,
}: GearCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
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
    <div className={`item-card ${drag.className}`} data-drag-index={index}>
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
              {item.favorite ? '★' : '☆'}
            </button>
          )}
          {editing && (
            <div className="item-card-actions">
              <button
                className="chip ghost"
                aria-label={`edit ${item.name}`}
                onClick={() => setOpen(true)}
              >
                ✏️
              </button>
              <button className="chip ghost" aria-label={`remove ${item.name}`} onClick={onRemove}>
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      {item.type && <div className="muted item-card-type">{item.type}</div>}
      <TagChips tags={item.tags} />
      {item.description && <p className="muted item-card-desc">{item.description}</p>}
    </div>
  );
}

function GearSection({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [tags, setTags] = useState('');
  const [desc, setDesc] = useState('');
  const items = character.gear;
  const { handleProps, itemProps } = useDragReorder(items, (next) => patch({ gear: next }));

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
    <section className="card">
      <h2>
        <FieldLabel i18nKey="sheet.gear" en="Gear" />
      </h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item, i) => (
          <GearCard
            key={item.id}
            item={item}
            index={i}
            editing={editing}
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
        </>
      )}
    </section>
  );
}

interface GearPageProps {
  character: Character;
  editing: boolean;
  template: SystemTemplate;
}

/** Gear tab: a compact injuries tracker up top, then the gear list. */
export function CharacterGearPage({ character, editing, template }: GearPageProps) {
  return (
    <div className="stack">
      <InjuryCard character={character} template={template} variant="compact" />
      <GearSection character={character} editing={editing} />
    </div>
  );
}
