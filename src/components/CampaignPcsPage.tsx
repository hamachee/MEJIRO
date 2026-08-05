import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import {
  blankAccursedPC,
  isPcInstance,
  type AccursedPC,
  type Campaign,
} from '../types/campaign';
import { StatTrack } from './AdversaryCard';
import { ConditionEditor } from './ConditionEditor';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconClose, IconEdit } from './icons';
import { Stepper } from './Stepper';
import { TurnMarker } from './TurnMarker';

/**
 * A PC's armor/injury track: armor boxes | injury boxes (Bloodied extension
 * included, at the front) | Taken Out — the same unlabeled compact strip as
 * an adversary card, always markable.
 */
function PcTrack({
  pc,
  onPatch,
}: {
  pc: AccursedPC;
  onPatch: (patch: Partial<AccursedPC>) => void;
}) {
  const injuryCount = Math.max(0, pc.injuryBoxes + pc.extraBoxes);
  const armorCount = Math.max(0, pc.armorRating);
  return (
    <StatTrack
      armorRating={armorCount}
      injuryBoxes={injuryCount}
      interactive={{
        marked: Math.min(pc.marked, injuryCount),
        armorMarked: Math.min(pc.armorMarked, armorCount),
        takenOut: pc.takenOut,
        onToggleMarked: (n) => onPatch({ marked: Math.max(0, Math.min(n, injuryCount)) }),
        onToggleArmorMarked: (n) =>
          onPatch({ armorMarked: Math.max(0, Math.min(n, armorCount)) }),
        onToggleTakenOut: () => onPatch({ takenOut: !pc.takenOut }),
      }}
    />
  );
}

/**
 * One roster entry on the Accursed tab: a full-width card split into two
 * columns — identity/track/conditions/note on the left, a large free-notes
 * area on the right. Structural stats (lineage, armor, box counts) sit
 * behind the card's edit toggle; the track, conditions and notes stay live.
 */
function PcRosterCard({
  pc,
  deployed,
  onPatch,
  onDeployToggle,
  onRemove,
}: {
  pc: AccursedPC;
  deployed: boolean;
  onPatch: (patch: Partial<AccursedPC>) => void;
  onDeployToggle: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
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
                  label={t('gm.injuryBoxes')}
                  ariaLabel={t('gm.injuryBoxes')}
                  value={pc.injuryBoxes}
                  onChange={(n) => onPatch({ injuryBoxes: n })}
                />
                <Stepper
                  label={t('sheet.extraBoxes')}
                  ariaLabel={t('sheet.extraBoxes')}
                  value={pc.extraBoxes}
                  onChange={(n) => onPatch({ extraBoxes: n })}
                />
              </div>
            </>
          ) : (
            <div className="muted pc-lineage">
              {[pc.lineage, pc.family].filter(Boolean).join(' / ') || '—'}
            </div>
          )}
          <PcTrack pc={pc} onPatch={onPatch} />
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
  index,
  onPatch,
  onRemove,
  dragHandleProps,
  dragItemProps,
  turn,
}: {
  pc: AccursedPC;
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
      <div className="curse-line">
        <Stepper
          label={<FieldLabel i18nKey="gm.initiative" en="Initiative" />}
          ariaLabel={t('gm.initiative')}
          value={pc.initiative}
          onChange={(n) => onPatch({ initiative: n })}
        />
      </div>
      <PcTrack pc={pc} onPatch={onPatch} />
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

/** Accursed tab: the GM's simplified PC roster. */
export function CampaignPcsPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const [name, setName] = useState('');
  const { pcs, instances } = campaign;

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
          <FieldLabel i18nKey="gm.accursed" en="Accursed" />
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
          deployed={instances.some((i) => isPcInstance(i) && i.pcId === pc.id)}
          onPatch={(p) => patchPc(pc.id, p)}
          onDeployToggle={() => toggleDeploy(pc)}
          onRemove={() => remove(pc)}
        />
      ))}
    </div>
  );
}
