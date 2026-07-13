import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import type { CardItem, Character } from '../types/character';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

/**
 * A card-style list (gear, spells): each entry is a small card with a name
 * and free-text description. Always editable — inventories and prepared
 * spells change mid-session.
 */
function CardListSection({
  title,
  items,
  onChange,
}: {
  title: string;
  items: CardItem[];
  onChange: (items: CardItem[]) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const add = () => {
    if (!name.trim()) return;
    onChange([
      ...items,
      { id: uid(), name: name.trim(), description: desc.trim() || undefined },
    ]);
    setName('');
    setDesc('');
  };

  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p className="muted">—</p>}
      <div className="card-grid">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-card-head">
              <strong className="item-card-name">{item.name}</strong>
              <button
                className="chip ghost"
                aria-label={`remove ${item.name}`}
                onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              >
                ✕
              </button>
            </div>
            {item.description && (
              <p className="muted item-card-desc">{item.description}</p>
            )}
          </div>
        ))}
      </div>
      <div className="form-row">
        <input
          placeholder={t('sheet.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          className="grow"
          placeholder={t('tricks.descPlaceholder')}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add}>{t('sheet.add')}</button>
      </div>
    </section>
  );
}

/** Sheet page 2: equipment and spells. */
export function CharacterPage2({ character }: { character: Character }) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);

  return (
    <div className="stack">
      <CardListSection
        title={t('sheet.gear')}
        items={character.gear}
        onChange={(gear) => patch({ gear })}
      />
      <CardListSection
        title={t('sheet.spells')}
        items={character.spells}
        onChange={(spells) => patch({ spells })}
      />
    </div>
  );
}
