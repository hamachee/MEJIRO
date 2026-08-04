import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';
import { TrickInfo } from './TrickInfo';
import { TrickCostSelect } from './TrickCostSelect';
import { formatTrickCost } from '../lib/trickCost';
import type { Character, CharacterTrick } from '../types/character';

/** A single trick row: read-only, or an inline edit form when opened. */
function TrickRow({
  trick,
  index,
  editing,
  onSave,
  onRemove,
  dragHandleProps,
  dragItemProps,
}: {
  trick: CharacterTrick;
  index: number;
  editing: boolean;
  onSave: (trick: CharacterTrick) => void;
  onRemove: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<CharacterTrick>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<CharacterTrick>>['itemProps'];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(trick.name);
  const [cost, setCost] = useState<CharacterTrick['cost']>(trick.cost);
  const [desc, setDesc] = useState(trick.description ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({ ...trick, name: name.trim(), cost, description: desc.trim() || undefined });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (editing && open) {
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
    <li className={`named-item ${drag.className}`} data-drag-index={index}>
      <div className="named-item-row">
        {editing && <span className="drag-handle" {...dragHandleProps(index)} />}
        <span className="trick-name-cost">
          <TrickInfo trick={trick} />
          <span className="trick-cost">
            · {t('tricks.cost')} {formatTrickCost(trick.cost)}
          </span>
        </span>
        {editing && (
          <div className="item-card-actions">
            <button className="chip ghost" aria-label={`edit ${trick.name}`} onClick={() => setOpen(true)}>
              <IconEdit />
            </button>
            <button className="chip ghost" aria-label={`remove ${trick.name}`} onClick={onRemove}>
              <IconClose />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

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
          {tricks.map((tr, i) => (
            <TrickRow
              key={tr.id}
              trick={tr}
              index={i}
              editing={editing}
              onSave={(updated) =>
                patch({ tricks: tricks.map((x) => (x.id === updated.id ? updated : x)) })
              }
              onRemove={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
              dragHandleProps={handleProps}
              dragItemProps={itemProps}
            />
          ))}
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
              <TrickCostSelect value={cost} onChange={setCost} />
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
