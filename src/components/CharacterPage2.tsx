import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
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
      <h2>{t('sheet.gear')}</h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-card-head">
              <strong className="item-card-name">{item.name}</strong>
              {editing && (
                <button
                  className="chip ghost"
                  aria-label={`remove ${item.name}`}
                  onClick={() =>
                    patch({ gear: items.filter((x) => x.id !== item.id) })
                  }
                >
                  ✕
                </button>
              )}
            </div>
            {item.type && <div className="muted item-card-type">{item.type}</div>}
            <TagChips tags={item.tags} />
            {item.description && (
              <p className="muted item-card-desc">{item.description}</p>
            )}
          </div>
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
      <h2>{t('sheet.spells')}</h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-card-head">
              <strong className="item-card-name">{item.name}</strong>
              {editing && (
                <button
                  className="chip ghost"
                  aria-label={`remove ${item.name}`}
                  onClick={() =>
                    patch({ spells: items.filter((x) => x.id !== item.id) })
                  }
                >
                  ✕
                </button>
              )}
            </div>
            {item.cost && (
              <div className="muted item-card-type">
                {t('spells.cost')}: {item.cost}
              </div>
            )}
            <TagChips tags={item.attunements} />
            {item.advancements && (
              <p className="muted item-card-desc">{item.advancements}</p>
            )}
          </div>
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
