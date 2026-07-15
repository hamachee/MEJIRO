import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { TrickInfo } from './TrickInfo';
import type { Character } from '../types/character';

/** Tricks tab: the character's own trick list, editable in edit mode. */
export function CharacterTricksPage({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const [name, setName] = useState('');
  // Held as a string so clearing the field doesn't snap to a sticky "0"
  // (the "01" problem); parsed and clamped only when the trick is added.
  const [cost, setCost] = useState('1');
  const [desc, setDesc] = useState('');
  const { tricks } = character;
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
        <h2>
          <FieldLabel i18nKey="tricks.title" en="Tricks" />
        </h2>
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
                {editing && <span className="drag-handle" {...handleProps(i)} />}
                <span className="named-name">
                  <TrickInfo trick={tr} />
                </span>
                <span className="trick-cost">
                  {t('tricks.cost')} {tr.cost}
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
