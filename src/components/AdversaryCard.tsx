import { useTranslation } from 'react-i18next';
import { useGmRollStore, type AdversaryPool } from '../store/gmRollStore';
import { parseTags } from '../lib/tags';
import { desperationPool, type AdversaryInstance, type Campaign } from '../types/campaign';
import { TagChips } from './TagChips';

/** A "Primary N" style pool button, hidden when the rating is 0. */
function PoolButton({
  label,
  rating,
  selected,
  onClick,
}: {
  label: string;
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
function StatLine({ label, value }: { label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <div className="curse-line">
      <span className="field-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

interface Props {
  campaign: Campaign;
  instance: AdversaryInstance;
  onChange: (updated: AdversaryInstance) => void;
  onRemove: () => void;
}

export function AdversaryCard({ campaign, instance, onChange, onRemove }: Props) {
  const { t } = useTranslation();
  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const select = useGmRollStore((s) => s.select);

  const template = campaign.templates.find((tpl) => tpl.id === instance.templateId);

  if (!template) {
    return (
      <div className="item-card">
        <div className="item-card-head">
          <strong className="item-card-name">{instance.label}</strong>
          <button className="chip ghost" aria-label={`remove ${instance.label}`} onClick={onRemove}>
            ✕
          </button>
        </div>
        <p className="muted item-card-desc">{t('gm.templateMissing')}</p>
      </div>
    );
  }

  const { stats } = template;
  const boxes = Math.max(0, stats.integrity);
  const marked = Math.min(instance.marked, boxes);
  const armorTags = stats.hasArmor ? parseTags(stats.armorTags) : [];
  const details = [
    stats.qualities.trim() && { label: t('gm.qualities'), text: stats.qualities },
    stats.dreadPower.trim() && { label: t('gm.dreadPower'), text: stats.dreadPower },
    stats.special.trim() && { label: t('gm.special'), text: stats.special },
  ].filter((d): d is { label: string; text: string } => Boolean(d));

  const isSelected = (pool: AdversaryPool) =>
    selectedInstanceId === instance.id && selectedPool === pool;

  const setMarked = (n: number) => onChange({ ...instance, marked: Math.max(0, Math.min(n, boxes)) });

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

      <div className="adversary-pools">
        <PoolButton
          label={t('gm.primaryPool')}
          rating={stats.primaryPool}
          selected={isSelected('primary')}
          onClick={() => select(instance.id, 'primary')}
        />
        <PoolButton
          label={t('gm.secondaryPool')}
          rating={stats.secondaryPool}
          selected={isSelected('secondary')}
          onClick={() => select(instance.id, 'secondary')}
        />
        <PoolButton
          label={t('gm.desperationPool')}
          rating={desperationPool(stats.primaryPool)}
          selected={isSelected('desperation')}
          onClick={() => select(instance.id, 'desperation')}
        />
      </div>

      <StatLine label={t('gm.enhancement')} value={stats.enhancement} />
      <StatLine label={t('gm.defense')} value={stats.defense} />
      <StatLine label={t('gm.integrity')} value={stats.integrity} />

      {armorTags.length > 0 && (
        <div className="curse-line">
          <span className="field-label">{t('gm.armor')}</span>
          <TagChips tags={armorTags} />
        </div>
      )}

      {details.length > 0 && (
        <details className="fold">
          <summary>{t('gm.details')}</summary>
          {details.map((d) => (
            <p key={d.label} className="muted item-card-desc">
              <span className="field-label">{d.label}</span> {d.text}
            </p>
          ))}
        </details>
      )}

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
