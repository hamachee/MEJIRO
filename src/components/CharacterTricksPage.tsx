import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { IconClose } from './icons';
import { ListImportExport } from './ListImportExport';
import { TrickInfo } from './TrickInfo';
import { formatTrickCost } from '../lib/trickCost';
import type { Character, CharacterTrick } from '../types/character';

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
  const [cost, setCost] = useState<CharacterTrick['cost']>(1);
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
              ownerName={character.name}
              onChange={(next) => patch({ tricks: next })}
            />
          </>
        )}
      </section>
    </div>
  );
}
