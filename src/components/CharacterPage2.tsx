import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { FieldLabel } from './FieldLabel';
import type { Character, GearItem, SpellItem } from '../types/character';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/** Parse a comma-separated input into trimmed, non-empty tags. */
function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="tag-chips">
      {tags.map((tag, i) => (
        <span key={i} className="tag-chip">
          {tag}
        </span>
      ))}
    </div>
  );
}

interface GearCardProps {
  item: GearItem;
  editing: boolean;
  onSave: (item: GearItem) => void;
  onRemove: () => void;
}

/** A single gear card: read-only display, or an inline edit form when opened. */
function GearCard({ item, editing, onSave, onRemove }: GearCardProps) {
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

  if (editing && open) {
    return (
      <div className="item-card editing">
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
    <div className="item-card">
      <div className="item-card-head">
        <strong className="item-card-name">{item.name}</strong>
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

  const add = () => {
    if (!name.trim()) return;
    const item: GearItem = {
      id: uid(),
      name: name.trim(),
      type: type.trim() || undefined,
      tags: parseTags(tags),
      description: desc.trim() || undefined,
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
        {items.map((item) => (
          <GearCard
            key={item.id}
            item={item}
            editing={editing}
            onSave={(updated) =>
              patch({ gear: items.map((x) => (x.id === item.id ? updated : x)) })
            }
            onRemove={() => patch({ gear: items.filter((x) => x.id !== item.id) })}
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

interface SpellCardProps {
  item: SpellItem;
  editing: boolean;
  onSave: (item: SpellItem) => void;
  onRemove: () => void;
}

/** A single spell card: read-only display, or an inline edit form when opened. */
function SpellCard({ item, editing, onSave, onRemove }: SpellCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [cost, setCost] = useState(item.cost ?? '');
  const [attunements, setAttunements] = useState(item.attunements.join(', '));
  const [advancements, setAdvancements] = useState(item.advancements ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      cost: cost.trim() || undefined,
      attunements: parseTags(attunements),
      advancements: advancements.trim() || undefined,
    });
    setOpen(false);
  };

  if (editing && open) {
    return (
      <div className="item-card editing">
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
    <div className="item-card">
      <div className="item-card-head">
        <strong className="item-card-name">{item.name}</strong>
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
      {item.cost && (
        <div className="muted item-card-type">
          {t('spells.cost')}: {item.cost}
        </div>
      )}
      <TagChips tags={item.attunements} />
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
  const [advancements, setAdvancements] = useState('');
  const items = character.spells;

  const add = () => {
    if (!name.trim()) return;
    const item: SpellItem = {
      id: uid(),
      name: name.trim(),
      cost: cost.trim() || undefined,
      attunements: parseTags(attunements),
      advancements: advancements.trim() || undefined,
    };
    patch({ spells: [...items, item] });
    setName('');
    setCost('');
    setAttunements('');
    setAdvancements('');
  };

  return (
    <section className="card">
      <h2>
        <FieldLabel i18nKey="sheet.spells" en="Spells" />
      </h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item) => (
          <SpellCard
            key={item.id}
            item={item}
            editing={editing}
            onSave={(updated) =>
              patch({ spells: items.map((x) => (x.id === item.id ? updated : x)) })
            }
            onRemove={() => patch({ spells: items.filter((x) => x.id !== item.id) })}
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

interface Page2Props {
  character: Character;
  editing: boolean;
}

/** Sheet page 2: equipment and spells. */
export function CharacterPage2({ character, editing }: Page2Props) {
  return (
    <div className="stack">
      <GearSection character={character} editing={editing} />
      <SpellSection character={character} editing={editing} />
    </div>
  );
}
