import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGmRollStore, type AdversaryPool } from '../store/gmRollStore';
import { parseTags } from '../lib/tags';
import { desperationPool, type AdversaryInstance, type AdversaryStats } from '../types/campaign';
import type { useDragReorder } from '../lib/useDragReorder';
import { ConditionEditor } from './ConditionEditor';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconClose, IconCopy, IconEdit } from './icons';
import { Stepper } from './Stepper';
import { TagChips } from './TagChips';
import { TurnMarker } from './TurnMarker';

/**
 * A "Primary N" style pool readout, hidden when the rating is 0. Without
 * `onClick` (a template, not a card on the table) it's a plain static
 * badge; with it, a selectable button — same look either way.
 */
function PoolButton({
  label,
  rating,
  selected,
  onClick,
}: {
  label: ReactNode;
  rating: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (rating <= 0) return null;
  const content = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{rating}</span>
    </>
  );
  if (!onClick) {
    return <span className="sheet-stat">{content}</span>;
  }
  return (
    <button className={`sheet-stat ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      {content}
    </button>
  );
}

/**
 * Two label/value pairs on one line (e.g. Defense · Integrity); each pair
 * hidden when its value is 0, whole line hidden when both are.
 */
function StatLinePair({ items }: { items: { label: ReactNode; value: number }[] }) {
  const visible = items.filter((i) => i.value > 0);
  if (visible.length === 0) return null;
  return (
    <div className="curse-line">
      {visible.map((i, idx) => (
        <span className="stat-pair" key={idx}>
          <span className="field-label">{i.label}</span>
          <span className="stat-value">{i.value}</span>
        </span>
      ))}
    </div>
  );
}

/** A label/free-text pair, hidden when the text is empty. */
function TextLine({ label, text }: { label: ReactNode; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="curse-line">
      <span className="field-label">{label}</span>
      <span className="stat-value">{text}</span>
    </div>
  );
}

/**
 * Controlled fields for an adversary's full stat block, in the order shared
 * by the template form, the template summary, and a deployed card's inline
 * editor: pools -> Enhancement -> Defense/Integrity -> injury boxes ->
 * armor -> qualities -> dread power -> special.
 */
export function AdversaryStatsFields({
  stats,
  onChange,
}: {
  stats: AdversaryStats;
  onChange: <K extends keyof AdversaryStats>(key: K, value: AdversaryStats[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.primaryPool" en="Primary" />}
          ariaLabel={t('gm.primaryPool')}
          value={stats.primaryPool}
          onChange={(n) => onChange('primaryPool', n)}
        />
        <Stepper
          label={<FieldLabel i18nKey="gm.secondaryPool" en="Secondary" />}
          ariaLabel={t('gm.secondaryPool')}
          value={stats.secondaryPool}
          onChange={(n) => onChange('secondaryPool', n)}
        />
        <div className="field">
          <span className="field-label"><FieldLabel i18nKey="gm.desperationPool" en="Desperation" /></span>
          <span className="stat-value">{desperationPool(stats.primaryPool)}</span>
        </div>
      </div>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label"><FieldLabel i18nKey="gm.enhancement" en="Enhancement" /></span>
          <input
            className="grow"
            placeholder={t('gm.enhancementPlaceholder')}
            value={stats.enhancement}
            onChange={(e) => onChange('enhancement', e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.defense" en="Defense" />}
          ariaLabel={t('gm.defense')}
          value={stats.defense}
          onChange={(n) => onChange('defense', n)}
        />
        <Stepper
          label={<FieldLabel i18nKey="gm.integrity" en="Integrity" />}
          ariaLabel={t('gm.integrity')}
          value={stats.integrity}
          onChange={(n) => onChange('integrity', n)}
        />
      </div>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.injuryBoxes" en="Injury boxes" />}
          ariaLabel={t('gm.injuryBoxes')}
          value={stats.injuryBoxes}
          onChange={(n) => onChange('injuryBoxes', n)}
        />
      </div>
      <div className="form-row">
        <label className="field-check">
          <input type="checkbox" checked={stats.hasArmor} onChange={(e) => onChange('hasArmor', e.target.checked)} />
          <span><FieldLabel i18nKey="gm.armor" en="Armor" /></span>
        </label>
        {stats.hasArmor && (
          <Stepper
            label={t('gm.armorRating')}
            ariaLabel={t('gm.armorRating')}
            value={stats.armorRating}
            onChange={(n) => onChange('armorRating', n)}
          />
        )}
      </div>
      {stats.hasArmor && (
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('gm.armorTagsPlaceholder')}
            value={stats.armorTags}
            onChange={(e) => onChange('armorTags', e.target.value)}
          />
        </div>
      )}
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.qualities')}
          value={stats.qualities}
          onChange={(e) => onChange('qualities', e.target.value)}
        />
      </div>
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.dreadPower')}
          value={stats.dreadPower}
          onChange={(e) => onChange('dreadPower', e.target.value)}
        />
      </div>
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.special')}
          value={stats.special}
          onChange={(e) => onChange('special', e.target.value)}
        />
      </div>
    </>
  );
}

/**
 * Armor and injury boxes on one track, armor first and split from injury —
 * and injury split again from the trailing Taken Out box — by a divider, so
 * it doesn't read as a stray extra injury box. Both box groups are static
 * outlines for a template (nothing to mark yet); a deployed card passes
 * `interactive` to make armor and injury independently click-to-mark, plus
 * the Taken Out toggle.
 */
function StatTrack({
  armorRating,
  injuryBoxes,
  interactive,
}: {
  armorRating: number;
  injuryBoxes: number;
  interactive?: {
    marked: number;
    armorMarked: number;
    takenOut: boolean;
    onToggleMarked: (n: number) => void;
    onToggleArmorMarked: (n: number) => void;
    onToggleTakenOut: () => void;
  };
}) {
  const { t } = useTranslation();
  const armorCount = Math.max(0, armorRating);
  const injuryCount = Math.max(0, injuryBoxes);
  if (armorCount === 0 && injuryCount === 0 && !interactive) return null;
  const marked = interactive ? Math.min(interactive.marked, injuryCount) : 0;
  const armorMarked = interactive ? Math.min(interactive.armorMarked, armorCount) : 0;

  return (
    <div className="injury-track">
      {Array.from({ length: armorCount }, (_, i) => {
        if (!interactive) return <span key={`armor${i}`} className="armor-box" />;
        const position = i + 1;
        const isMarked = i < armorMarked;
        return (
          <button
            key={`armor${i}`}
            className={`armor-box ${isMarked ? 'marked' : ''}`}
            aria-label={`${t('gm.armor')} ${position}`}
            onClick={() => interactive.onToggleArmorMarked(armorMarked === position ? position - 1 : position)}
          />
        );
      })}
      {armorCount > 0 && injuryCount > 0 && (
        <span className="track-divider" aria-hidden="true">
          |
        </span>
      )}
      {Array.from({ length: injuryCount }, (_, i) => {
        if (!interactive) return <span key={`injury${i}`} className="injury-box" />;
        const position = i + 1;
        const isMarked = i < marked;
        return (
          <button
            key={`injury${i}`}
            className={`injury-box ${isMarked ? 'marked' : ''}`}
            aria-label={`${position}`}
            onClick={() => interactive.onToggleMarked(marked === position ? position - 1 : position)}
          />
        );
      })}
      {interactive && (armorCount > 0 || injuryCount > 0) && (
        <span className="track-divider" aria-hidden="true">
          |
        </span>
      )}
      {interactive && (
        <span className={`injury-level terminal ${interactive.takenOut ? 'lit' : ''}`}>
          <span className="injury-level-label" aria-hidden="true">
            <FieldLabel i18nKey="sheet.takenOut" en="Taken Out" />
          </span>
        </span>
      )}
      {interactive && (
        <button
          className={`injury-box taken-out-box ${interactive.takenOut ? 'marked' : ''}`}
          aria-label={t('sheet.takenOut')}
          onClick={interactive.onToggleTakenOut}
        />
      )}
    </div>
  );
}

/**
 * Read-only stat block shared by a template card and a deployed card's
 * non-editing view: pools -> Enhancement -> Defense/Integrity -> armor tags
 * -> armor/injury track -> qualities/dread power/special. `pools` and
 * `track` are omitted for a template (nothing to select or mark yet) and
 * supplied for a deployed card.
 */
export function AdversaryStatBody({
  stats,
  pools,
  track,
}: {
  stats: AdversaryStats;
  pools?: { isSelected: (pool: AdversaryPool) => boolean; onSelect: (pool: AdversaryPool) => void };
  track?: {
    marked: number;
    armorMarked: number;
    takenOut: boolean;
    onToggleMarked: (n: number) => void;
    onToggleArmorMarked: (n: number) => void;
    onToggleTakenOut: () => void;
  };
}) {
  const { t } = useTranslation();
  const armorTags = stats.hasArmor ? parseTags(stats.armorTags) : [];
  type DetailRow = { key: string; label: ReactNode; text: string };
  const detailRow = (key: string, text: string, label: ReactNode): DetailRow | null =>
    text.trim() ? { key, label, text } : null;
  const details = [
    detailRow('qualities', stats.qualities, <FieldLabel i18nKey="gm.qualities" en="Qualities" />),
    detailRow('dreadPower', stats.dreadPower, <FieldLabel i18nKey="gm.dreadPower" en="Dread power" />),
    detailRow('special', stats.special, <FieldLabel i18nKey="gm.special" en="Special" />),
  ].filter((d): d is DetailRow => d !== null);

  return (
    <>
      <div className="adversary-pools">
        <PoolButton
          label={<FieldLabel i18nKey="gm.primaryPool" en="Primary" />}
          rating={stats.primaryPool}
          selected={pools?.isSelected('primary')}
          onClick={pools && (() => pools.onSelect('primary'))}
        />
        <PoolButton
          label={<FieldLabel i18nKey="gm.secondaryPool" en="Secondary" />}
          rating={stats.secondaryPool}
          selected={pools?.isSelected('secondary')}
          onClick={pools && (() => pools.onSelect('secondary'))}
        />
        <PoolButton
          label={<FieldLabel i18nKey="gm.desperationPool" en="Desperation" />}
          rating={desperationPool(stats.primaryPool)}
          selected={pools?.isSelected('desperation')}
          onClick={pools && (() => pools.onSelect('desperation'))}
        />
      </div>

      <TextLine label={<FieldLabel i18nKey="gm.enhancement" en="Enhancement" />} text={stats.enhancement} />
      <StatLinePair
        items={[
          { label: <FieldLabel i18nKey="gm.defense" en="Defense" />, value: stats.defense },
          { label: <FieldLabel i18nKey="gm.integrity" en="Integrity" />, value: stats.integrity },
        ]}
      />

      {stats.hasArmor && armorTags.length > 0 && (
        <div className="curse-line">
          <span className="field-label">
            <FieldLabel i18nKey="gm.armor" en="Armor" />
          </span>
          <TagChips tags={armorTags} />
        </div>
      )}

      {details.length > 0 && (
        <details className="fold">
          <summary>{t('gm.details')}</summary>
          {details.map((d) => (
            <p key={d.key} className="muted item-card-desc">
              <span className="field-label">{d.label}</span> {d.text}
            </p>
          ))}
        </details>
      )}

      <StatTrack
        armorRating={stats.hasArmor ? stats.armorRating : 0}
        injuryBoxes={stats.injuryBoxes}
        interactive={track}
      />
    </>
  );
}

interface Props {
  instance: AdversaryInstance;
  index: number;
  onChange: (updated: AdversaryInstance) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<AdversaryInstance>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<AdversaryInstance>>['itemProps'];
  /** Turn-tracker wiring: whether this card is the current turn, and the ◤ toggle. */
  turn: { current: boolean; onToggle: () => void };
}

/** Grow a textarea's height to fit its content, no scrollbar or manual resize needed. */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function AdversaryCard({
  instance,
  index,
  onChange,
  onRemove,
  onDuplicate,
  dragHandleProps,
  dragItemProps,
  turn,
}: Props) {
  const { t } = useTranslation();
  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const select = useGmRollStore((s) => s.select);
  const [editing, setEditing] = useState(false);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  // Size to the loaded memo on mount; typing after that is handled by onInput.
  useLayoutEffect(() => autoGrow(memoRef.current), [instance.memo]);

  const { stats } = instance;
  const boxes = Math.max(0, stats.injuryBoxes);
  const marked = Math.min(instance.marked, boxes);
  const armorBoxes = stats.hasArmor ? Math.max(0, stats.armorRating) : 0;
  const armorMarked = Math.min(instance.armorMarked, armorBoxes);

  const isSelected = (pool: AdversaryPool) =>
    selectedInstanceId === instance.id && selectedPool === pool;

  const setMarked = (n: number) => onChange({ ...instance, marked: Math.max(0, Math.min(n, boxes)) });
  const setArmorMarked = (n: number) =>
    onChange({ ...instance, armorMarked: Math.max(0, Math.min(n, armorBoxes)) });

  const drag = dragItemProps(index);

  return (
    <div
      className={`item-card adversary-card ${instance.takenOut ? 'taken-out' : ''} ${turn.current ? 'current-turn' : ''} ${drag.className}`}
      data-drag-index={index}
    >
      <TurnMarker current={turn.current} onToggle={turn.onToggle} label={instance.label} />
      <div className="item-card-head">
        <div className="item-card-title grow">
          <span className="drag-handle" {...dragHandleProps(index)} />
          {editing ? (
            <input
              className="grow named-name adversary-label"
              defaultValue={instance.label}
              onBlur={(e) => onChange({ ...instance, label: e.target.value.trim() || instance.label })}
            />
          ) : (
            <span className="grow adversary-label">{instance.label}</span>
          )}
        </div>
        <div className="item-card-actions">
          <button className="chip ghost" aria-label={`duplicate ${instance.label}`} onClick={onDuplicate}>
            <IconCopy />
          </button>
          <button
            className="chip ghost"
            aria-label={editing ? `done editing ${instance.label}` : `edit ${instance.label}`}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? <IconCheck /> : <IconEdit />}
          </button>
          <button className="chip ghost" aria-label={`remove ${instance.label}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>

      {editing ? (
        <AdversaryStatsFields
          stats={stats}
          onChange={(key, value) => onChange({ ...instance, stats: { ...instance.stats, [key]: value } })}
        />
      ) : (
        <AdversaryStatBody
          stats={stats}
          pools={{ isSelected, onSelect: (pool) => select(instance.id, pool) }}
          track={{
            marked,
            armorMarked,
            takenOut: instance.takenOut,
            onToggleMarked: setMarked,
            onToggleArmorMarked: setArmorMarked,
            onToggleTakenOut: () => onChange({ ...instance, takenOut: !instance.takenOut }),
          }}
        />
      )}

      <ConditionEditor
        conditions={instance.conditions}
        onChange={(next) => onChange({ ...instance, conditions: next })}
      />

      <textarea
        ref={memoRef}
        className="grow adversary-memo"
        rows={1}
        placeholder={t('gm.memoPlaceholder')}
        defaultValue={instance.memo}
        onInput={(e) => autoGrow(e.currentTarget)}
        onBlur={(e) => onChange({ ...instance, memo: e.target.value })}
      />
    </div>
  );
}
