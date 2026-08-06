import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconCopy, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';
import { SendConfirmPopover } from './SendConfirmPopover';
import { TrickInfo } from './TrickInfo';
import { TrickCostSelect } from './TrickCostSelect';
import { formatTrickCost } from '../lib/trickCost';
import { useSendableCard } from '../lib/useSendableCard';
import type { Character, CharacterTrick } from '../types/character';

/** A single trick row: read-only, or an inline edit form when opened. */
function TrickRow({
  trick,
  index,
  editing,
  character,
  onSave,
  onRemove,
  onDuplicate,
  dragHandleProps,
  dragItemProps,
}: {
  trick: CharacterTrick;
  index: number;
  editing: boolean;
  character: Character;
  onSave: (trick: CharacterTrick) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<CharacterTrick>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<CharacterTrick>>['itemProps'];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sendable = useSendableCard({
    webhookUrl: character.webhookUrl,
    embedColor: character.embedColor,
    title: `${t('send.trickItem')}: ${trick.name} · ${formatTrickCost(trick.cost)} ${t('send.hits')}`,
    buildContent: () => trick.description ?? '',
  });
  const sendableHere = sendable.active && !open;
  const [name, setName] = useState(trick.name);
  const [cost, setCost] = useState<CharacterTrick['cost']>(trick.cost);
  const [desc, setDesc] = useState(trick.description ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({ ...trick, name: name.trim(), cost, description: desc.trim() || undefined });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (open) {
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
    <li className={`named-item ${sendableHere ? 'sendable-active' : ''} ${drag.className}`} data-drag-index={index}>
      <div className="named-item-row">
        {editing && <span className="drag-handle" {...dragHandleProps(index)} />}
        <span className="trick-name-cost">
          <TrickInfo trick={trick} />
          <span className="trick-cost">
            · {t('tricks.cost')} {formatTrickCost(trick.cost)}
          </span>
        </span>
        <div className="item-card-actions">
          <button className="chip ghost" aria-label={`duplicate ${trick.name}`} onClick={onDuplicate}>
            <IconCopy />
          </button>
          <button className="chip ghost" aria-label={`edit ${trick.name}`} onClick={() => setOpen(true)}>
            <IconEdit />
          </button>
          <button className="chip ghost" aria-label={`remove ${trick.name}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>
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
              character={character}
              onSave={(updated) =>
                patch({ tricks: tricks.map((x) => (x.id === updated.id ? updated : x)) })
              }
              onRemove={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
              onDuplicate={() =>
                patch({
                  tricks: [...tricks, { ...tr, id: uid(), name: `${tr.name}${t('common.copySuffix')}` }],
                })
              }
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
          </>
        )}
        <ListImportExport
          kind="tricks"
          items={tricks}
          ownerName={character.name}
          onChange={(next) => patch({ tricks: next })}
        />
      </section>
    </div>
  );
}
