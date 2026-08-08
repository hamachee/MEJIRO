import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import { useDragReorder } from '../lib/useDragReorder';
import { getTemplate } from '../templates';
import {
  blankAccursedPC,
  isPcInstance,
  type AccursedPC,
  type Campaign,
} from '../types/campaign';
import type { InjuryLevel } from '../types/template';
import { ConditionEditor } from './ConditionEditor';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconClose, IconEdit } from './icons';
import { Stepper } from './Stepper';
import { TurnMarker } from './TurnMarker';

/** A PC's Bloodied extension can add at most this many boxes. */
const MAX_EXTRA_BOXES = 2;

/**
 * The non-terminal injury levels of the campaign's system template — the
 * same structure a real character sheet uses — with a single flat 7-box
 * level as the fallback for templates without a structured track. Taken
 * Out is never one of these boxes; it's the track's own separate toggle.
 */
export function pcInjuryLevels(campaign: Campaign): InjuryLevel[] {
  const levels = getTemplate(campaign.templateId)?.injuryTrack?.levels;
  const track = levels?.filter((l) => !l.terminal) ?? [];
  return track.length > 0 ? track : [{ boxes: 7, label: { en: '', ko: '' } }];
}

/**
 * A PC's armor/injury track: armor boxes, then the injury levels from the
 * system template (Bloodied extension boxes at the front), then Taken Out —
 * the character sheet's grouped track with a `|` divider standing in for
 * each level label.
 */
function PcTrack({
  pc,
  levels,
  onPatch,
}: {
  pc: AccursedPC;
  levels: InjuryLevel[];
  onPatch: (patch: Partial<AccursedPC>) => void;
}) {
  const { t } = useTranslation();
  const groups = levels.map((l, i) => (i === 0 ? l.boxes + pc.extraBoxes : l.boxes));
  const total = groups.reduce((sum, n) => sum + n, 0);
  const armorCount = Math.max(0, pc.armorRating);
  const marked = Math.min(pc.marked, total);
  const armorMarked = Math.min(pc.armorMarked, armorCount);

  const setMarked = (n: number) => onPatch({ marked: Math.max(0, Math.min(n, total)) });
  const setArmorMarked = (n: number) =>
    onPatch({ armorMarked: Math.max(0, Math.min(n, armorCount)) });

  const injuryBox = (absIndex: number) => {
    const position = absIndex + 1;
    const isMarked = absIndex < marked;
    return (
      <button
        key={absIndex}
        className={`injury-box ${isMarked ? 'marked' : ''}`}
        aria-label={`${position}`}
        onClick={() => setMarked(marked === position ? position - 1 : position)}
      />
    );
  };

  let offset = 0;
  return (
    <div className="injury-track">
      {Array.from({ length: armorCount }, (_, i) => {
        const position = i + 1;
        const isMarked = i < armorMarked;
        return (
          <button
            key={`armor${i}`}
            className={`armor-box ${isMarked ? 'marked' : ''}`}
            aria-label={`${t('gm.armor')} ${position}`}
            onClick={() => setArmorMarked(armorMarked === position ? position - 1 : position)}
          />
        );
      })}
      {groups.map((count, gi) => {
        const start = offset;
        offset += count;
        return (
          <Fragment key={gi}>
            {(gi > 0 || armorCount > 0) && (
              <span className="track-divider" aria-hidden="true">
                |
              </span>
            )}
            {Array.from({ length: count }, (_, j) => injuryBox(start + j))}
          </Fragment>
        );
      })}
      <span className="track-divider" aria-hidden="true">
        |
      </span>
      <span className={`injury-level terminal ${pc.takenOut ? 'lit' : ''}`}>
        <span className="injury-level-label" aria-hidden="true">
          <FieldLabel i18nKey="sheet.takenOut" en="Taken Out" />
        </span>
      </span>
      <button
        className={`injury-box taken-out-box ${pc.takenOut ? 'marked' : ''}`}
        aria-label={t('sheet.takenOut')}
        onClick={() => onPatch({ takenOut: !pc.takenOut })}
      />
    </div>
  );
}

/**
 * One roster entry on the Crew tab: a full-width card split into two
 * columns — identity/track/conditions/note on the left, a large free-notes
 * area on the right. Structural stats (lineage, armor, the Bloodied
 * extension) sit behind the card's edit toggle; the track, conditions and
 * notes stay live.
 */
function PcRosterCard({
  pc,
  levels,
  deployed,
  onPatch,
  onDeployToggle,
  onRemove,
}: {
  pc: AccursedPC;
  levels: InjuryLevel[];
  deployed: boolean;
  onPatch: (patch: Partial<AccursedPC>) => void;
  onDeployToggle: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const [editing, setEditing] = useState(false);

  return (
    <section className={`item-card pc-card ${pc.takenOut ? 'taken-out' : ''}`}>
      <div className="item-card-head">
        {editing ? (
          <input
            className="grow named-name adversary-label"
            defaultValue={pc.name}
            onBlur={(e) => onPatch({ name: e.target.value.trim() || pc.name })}
          />
        ) : (
          <span className="grow adversary-label">{pc.name}</span>
        )}
        <div className="item-card-actions">
          <button className="chip ghost" aria-pressed={deployed} onClick={onDeployToggle}>
            {deployed ? t('gm.undeploy') : t('gm.deploy')}
          </button>
          <button
            className="chip ghost"
            aria-label={editing ? `done editing ${pc.name}` : `edit ${pc.name}`}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? <IconCheck /> : <IconEdit />}
          </button>
          <button className="chip ghost" aria-label={`remove ${pc.name}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>
      <div className="pc-card-body">
        <div className="pc-card-left">
          {editing ? (
            <>
              <div className="form-row">
                <label className="field grow">
                  <span className="field-label">{t('sheet.lineage')}</span>
                  <input
                    defaultValue={pc.lineage}
                    onBlur={(e) => onPatch({ lineage: e.target.value.trim() })}
                  />
                </label>
                <label className="field grow">
                  <span className="field-label">{t('sheet.family')}</span>
                  <input
                    defaultValue={pc.family}
                    onBlur={(e) => onPatch({ family: e.target.value.trim() })}
                  />
                </label>
              </div>
              <div className="form-row">
                <Stepper
                  label={t('gm.armorRating')}
                  ariaLabel={t('gm.armorRating')}
                  value={pc.armorRating}
                  onChange={(n) =>
                    onPatch({ armorRating: n, armorMarked: Math.min(pc.armorMarked, n) })
                  }
                />
                <Stepper
                  label={`${label(levels[0].label, lang)} ${t('sheet.extraBoxes')}`.trim()}
                  ariaLabel={t('sheet.extraBoxes')}
                  value={pc.extraBoxes}
                  max={MAX_EXTRA_BOXES}
                  onChange={(n) => onPatch({ extraBoxes: n })}
                />
              </div>
            </>
          ) : (
            <div className="muted pc-lineage">
              {[pc.lineage, pc.family].filter(Boolean).join(' / ') || '—'}
            </div>
          )}
          <PcTrack pc={pc} levels={levels} onPatch={onPatch} />
          <ConditionEditor
            conditions={pc.conditions}
            onChange={(next) => onPatch({ conditions: next })}
          />
          <input
            className="grow"
            placeholder={t('gm.memoPlaceholder')}
            defaultValue={pc.note}
            onBlur={(e) => onPatch({ note: e.target.value })}
          />
        </div>
        <div className="pc-card-right">
          <textarea
            className="grow pc-memo"
            rows={8}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={pc.memo}
            onBlur={(e) => onPatch({ memo: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * A deployed PC on the GM table. No dice pools — PCs roll on their own
 * sheets — just Initiative for the turn order plus the live track,
 * conditions and one-line note, all read from and written to the roster
 * entry itself so the tab and the table can never disagree.
 */
export function PcTableCard({
  pc,
  levels,
  index,
  onPatch,
  onRemove,
  dragHandleProps,
  dragItemProps,
  turn,
}: {
  pc: AccursedPC;
  levels: InjuryLevel[];
  index: number;
  onPatch: (patch: Partial<AccursedPC>) => void;
  onRemove: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<unknown>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<unknown>>['itemProps'];
  turn: { current: boolean; onToggle: () => void };
}) {
  const { t } = useTranslation();
  const drag = dragItemProps(index);

  return (
    <div
      className={`item-card adversary-card ${pc.takenOut ? 'taken-out' : ''} ${turn.current ? 'current-turn' : ''} ${drag.className}`}
      data-drag-index={index}
    >
      <TurnMarker current={turn.current} onToggle={turn.onToggle} label={pc.name} />
      <div className="item-card-head">
        <div className="item-card-title grow">
          <span className="drag-handle" {...dragHandleProps(index)} />
          <span className="grow adversary-label">{pc.name}</span>
        </div>
        <div className="item-card-actions">
          <button className="chip ghost" aria-label={`remove ${pc.name}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>
      <div className="card-line">
        <Stepper
          label={<FieldLabel i18nKey="gm.initiative" en="Initiative" />}
          ariaLabel={t('gm.initiative')}
          value={pc.initiative}
          onChange={(n) => onPatch({ initiative: n })}
        />
      </div>
      <PcTrack pc={pc} levels={levels} onPatch={onPatch} />
      <ConditionEditor
        conditions={pc.conditions}
        onChange={(next) => onPatch({ conditions: next })}
      />
      <input
        className="grow"
        placeholder={t('gm.memoPlaceholder')}
        defaultValue={pc.note}
        onBlur={(e) => onPatch({ note: e.target.value })}
      />
    </div>
  );
}

/** Crew tab: the GM's simplified PC roster. */
export function CampaignPcsPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [name, setName] = useState('');
  const { pcs, instances } = campaign;
  const levels = pcInjuryLevels(campaign);

  const patchPc = (id: string, p: Partial<AccursedPC>) =>
    patch({ pcs: pcs.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  const add = () => {
    if (!name.trim()) return;
    patch({ pcs: [...pcs, blankAccursedPC(uid(), name.trim())] });
    setName('');
  };

  const toggleDeploy = (pc: AccursedPC) => {
    const existing = instances.find((i) => isPcInstance(i) && i.pcId === pc.id);
    patch({
      instances: existing
        ? instances.filter((i) => i.id !== existing.id)
        : [...instances, { id: uid(), pcId: pc.id }],
    });
  };

  const remove = (pc: AccursedPC) => {
    if (!confirm(t('gm.confirmDeletePc'))) return;
    patch({
      pcs: pcs.filter((x) => x.id !== pc.id),
      instances: instances.filter((i) => !isPcInstance(i) || i.pcId !== pc.id),
    });
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>
          <FieldLabel i18nKey="gm.crew" en="Crew" />
        </h2>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button className="primary" onClick={add}>
            {t('gm.addPc')}
          </button>
        </div>
        {pcs.length === 0 && <p className="muted">{t('gm.noPcs')}</p>}
      </section>
      {pcs.map((pc) => (
        <PcRosterCard
          key={pc.id}
          pc={pc}
          levels={levels}
          deployed={instances.some((i) => isPcInstance(i) && i.pcId === pc.id)}
          onPatch={(p) => patchPc(pc.id, p)}
          onDeployToggle={() => toggleDeploy(pc)}
          onRemove={() => remove(pc)}
        />
      ))}
    </div>
  );
}
