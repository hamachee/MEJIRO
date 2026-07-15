import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { FieldLabel } from './FieldLabel';
import { TagChips } from './TagChips';
import { CurseCard } from './CharacterSheet';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { useDragReorder } from '../lib/useDragReorder';
import type { Character, SpellItem } from '../types/character';

interface SpellCardProps {
  item: SpellItem;
  index: number;
  editing: boolean;
  onSave: (item: SpellItem) => void;
  onRemove: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<SpellItem>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<SpellItem>>['itemProps'];
}

/** A single spell card: read-only display, or an inline edit form when opened. */
function SpellCard({
  item,
  index,
  editing,
  onSave,
  onRemove,
  dragHandleProps,
  dragItemProps,
}: SpellCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
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
      {item.cost && (
        <div className="muted item-card-type">
          {t('spells.cost')}: {item.cost}
        </div>
      )}
      <TagChips tags={item.attunements} />
      {item.effect && <p className="muted item-card-desc">{item.effect}</p>}
      {item.advancements && <p className="muted item-card-desc">{item.advancements}</p>}
    </div>
  );
}

function SpellSection({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [attunements, setAttunements] = useState('');
  const [effect, setEffect] = useState('');
  const [advancements, setAdvancements] = useState('');
  const items = character.spells;
  const { handleProps, itemProps } = useDragReorder(items, (next) => patch({ spells: next }));

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
    <section className="card">
      <h2>
        <FieldLabel i18nKey="sheet.spells" en="Spells" />
      </h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item, i) => (
          <SpellCard
            key={item.id}
            item={item}
            index={i}
            editing={editing}
            onSave={(updated) =>
              patch({ spells: items.map((x) => (x.id === item.id ? updated : x)) })
            }
            onRemove={() => patch({ spells: items.filter((x) => x.id !== item.id) })}
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
            <button onClick={add}>{t('sheet.add')}</button>
          </div>
        </>
      )}
    </section>
  );
}

interface SpellsPageProps {
  character: Character;
  editing: boolean;
}

/** Spells tab: curse dice/entanglement up top (spending curse dice fuels spell effects), then the spell list. */
export function CharacterSpellsPage({ character, editing }: SpellsPageProps) {
  return (
    <div className="stack">
      <CurseCard character={character} editing={editing} />
      <SpellSection character={character} editing={editing} />
    </div>
  );
}
