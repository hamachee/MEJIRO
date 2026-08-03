import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useGmRollStore, type AdversaryPool } from '../store/gmRollStore';
import { parseTags } from '../lib/tags';
import { uid } from '../lib/uid';
import { desperationPool, type AdversaryInstance } from '../types/campaign';
import { FieldLabel } from './FieldLabel';
import { TagChips } from './TagChips';

/** A "Primary N" style pool button, hidden when the rating is 0. */
function PoolButton({
  label,
  rating,
  selected,
  onClick,
}: {
  label: ReactNode;
  rating: number;
  selected: boolean;
  onClick: () => void;
}) {
  if (rating <= 0) return null;
  return (
    <button className={`sheet-stat ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{rating}</span>
    </button>
  );
}

/** A simple label/value pair, hidden when the value is 0. */
function StatLine({ label, value }: { label: ReactNode; value: number }) {
  if (value <= 0) return null;
  return (
    <div className="curse-line">
      <span className="field-label">{label}</span>
      <span className="stat-value">{value}</span>
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
 * An always-visible free dice pool for one-off rolls that don't fit the
 * card's regular pools — a numeric value with +/- steppers (click) and a
 * double-click-to-type field, same interaction as the sheet's EXP tracker.
 * The whole control doubles as a selectable button for the roll bar; the
 * inner stepper/value controls stop the click from also toggling selection.
 */
function CustomPoolControl({
  value,
  selected,
  onSelect,
  onChange,
}: {
  value: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (n: number) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);

  const setValue = (n: number) => onChange(Math.max(0, n));
  const startEditing = () => setDraft(String(value));
  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (!Number.isNaN(n)) setValue(n);
    }
    setDraft(null);
  };

  return (
    <div
      className={`custom-pool ${selected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="field-label">
        <FieldLabel i18nKey="gm.customPool" en="Free roll" />
      </span>
      <div className="curse-controls" onClick={(e) => e.stopPropagation()}>
        <button aria-label={`− ${t('gm.customPool')}`} disabled={value <= 0} onClick={() => setValue(value - 1)}>
          −
        </button>
        {draft !== null ? (
          <input
            type="number"
            className="exp-value"
            inputMode="numeric"
            min={0}
            autoFocus
            aria-label={t('gm.customPool')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') setDraft(null);
            }}
          />
        ) : (
          <span
            className="exp-value"
            role="button"
            tabIndex={0}
            aria-label={t('gm.customPool')}
            onDoubleClick={startEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEditing();
              }
            }}
          >
            {value}
          </span>
        )}
        <button aria-label={`+ ${t('gm.customPool')}`} onClick={() => setValue(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

interface Props {
  instance: AdversaryInstance;
  onChange: (updated: AdversaryInstance) => void;
  onRemove: () => void;
}

/** Grow a textarea's height to fit its content, no scrollbar or manual resize needed. */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export function AdversaryCard({ instance, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const select = useGmRollStore((s) => s.select);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  // Size to the loaded memo on mount; typing after that is handled by onInput.
  useLayoutEffect(() => autoGrow(memoRef.current), [instance.memo]);
  const [conditionName, setConditionName] = useState('');

  const { stats } = instance;
  const boxes = Math.max(0, stats.injuryBoxes);
  const marked = Math.min(instance.marked, boxes);
  const armorTags = stats.hasArmor ? parseTags(stats.armorTags) : [];
  type DetailRow = { key: string; label: ReactNode; text: string };
  const detailRow = (key: string, text: string, label: ReactNode): DetailRow | null =>
    text.trim() ? { key, label, text } : null;
  const details = [
    detailRow('qualities', stats.qualities, <FieldLabel i18nKey="gm.qualities" en="Qualities" />),
    detailRow('dreadPower', stats.dreadPower, <FieldLabel i18nKey="gm.dreadPower" en="Dread power" />),
    detailRow('special', stats.special, <FieldLabel i18nKey="gm.special" en="Special" />),
  ].filter((d): d is DetailRow => d !== null);

  const isSelected = (pool: AdversaryPool) =>
    selectedInstanceId === instance.id && selectedPool === pool;

  const setMarked = (n: number) => onChange({ ...instance, marked: Math.max(0, Math.min(n, boxes)) });

  const addCondition = () => {
    if (!conditionName.trim()) return;
    onChange({
      ...instance,
      conditions: [...instance.conditions, { id: uid(), name: conditionName.trim() }],
    });
    setConditionName('');
  };

  const box = (absIndex: number) => {
    const isMarked = absIndex < marked;
    const position = absIndex + 1;
    return (
      <button
        key={absIndex}
        className={`injury-box ${isMarked ? 'marked' : ''}`}
        aria-label={`${position}`}
        onClick={() => setMarked(marked === position ? position - 1 : position)}
      />
    );
  };

  return (
    <div className="item-card adversary-card">
      <div className="item-card-head">
        <input
          className="grow named-name adversary-label"
          defaultValue={instance.label}
          onBlur={(e) => onChange({ ...instance, label: e.target.value.trim() || instance.label })}
        />
        <button className="chip ghost" aria-label={`remove ${instance.label}`} onClick={onRemove}>
          ✕
        </button>
      </div>

      <CustomPoolControl
        value={instance.customPool}
        selected={isSelected('custom')}
        onSelect={() => select(instance.id, 'custom')}
        onChange={(n) => onChange({ ...instance, customPool: n })}
      />

      <div className="adversary-pools">
        <PoolButton
          label={<FieldLabel i18nKey="gm.primaryPool" en="Primary" />}
          rating={stats.primaryPool}
          selected={isSelected('primary')}
          onClick={() => select(instance.id, 'primary')}
        />
        <PoolButton
          label={<FieldLabel i18nKey="gm.secondaryPool" en="Secondary" />}
          rating={stats.secondaryPool}
          selected={isSelected('secondary')}
          onClick={() => select(instance.id, 'secondary')}
        />
        <PoolButton
          label={<FieldLabel i18nKey="gm.desperationPool" en="Desperation" />}
          rating={desperationPool(stats.primaryPool)}
          selected={isSelected('desperation')}
          onClick={() => select(instance.id, 'desperation')}
        />
      </div>

      <TextLine label={<FieldLabel i18nKey="gm.enhancement" en="Enhancement" />} text={stats.enhancement} />
      <StatLine label={<FieldLabel i18nKey="gm.defense" en="Defense" />} value={stats.defense} />
      <StatLine label={<FieldLabel i18nKey="gm.integrity" en="Integrity" />} value={stats.integrity} />

      {stats.hasArmor && (stats.armorRating > 0 || armorTags.length > 0) && (
        <div className="curse-line">
          <span className="field-label">
            <FieldLabel i18nKey="gm.armor" en="Armor" />
          </span>
          {stats.armorRating > 0 && <span className="stat-value">{stats.armorRating}</span>}
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

      <div>
        <span className="field-label">{t('sheet.conditions')}</span>
        <div className="condition-chips">
          {instance.conditions.length === 0 && <span className="muted">—</span>}
          {instance.conditions.map((c) => (
            <span key={c.id} className="condition">
              {c.name}
              <button
                aria-label={`remove ${c.name}`}
                onClick={() =>
                  onChange({ ...instance, conditions: instance.conditions.filter((x) => x.id !== c.id) })
                }
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.namePlaceholder')}
            value={conditionName}
            onChange={(e) => setConditionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCondition()}
          />
          <button onClick={addCondition}>{t('sheet.add')}</button>
        </div>
      </div>

      <textarea
        ref={memoRef}
        className="grow adversary-memo"
        rows={1}
        placeholder={t('gm.memoPlaceholder')}
        defaultValue={instance.memo}
        onInput={(e) => autoGrow(e.currentTarget)}
        onBlur={(e) => onChange({ ...instance, memo: e.target.value })}
      />

      <div className="injury-track">
        {Array.from({ length: boxes }, (_, i) => box(i))}
        <button
          className={`injury-box ${instance.takenOut ? 'marked' : ''}`}
          aria-label={t('sheet.takenOut')}
          onClick={() => onChange({ ...instance, takenOut: !instance.takenOut })}
        />
      </div>
    </div>
  );
}
