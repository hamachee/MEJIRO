import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useGmRollStore } from '../store/gmRollStore';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { desperationPool, type AdversaryStats } from '../types/campaign';
import type { Campaign } from '../types/campaign';
import { FieldLabel } from './FieldLabel';
import { AdversaryCard } from './AdversaryCard';

/** Shorten a free-text field for the summary line; full text lives in the edit form. */
function truncate(s: string, max = 24): string {
  const trimmed = s.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/**
 * A multi-line summary for a template row — grouped and ordered to match the
 * edit form and a deployed card: pools together, Enhancement on its own line
 * (it's a note, not a number), Defense/Integrity together, injury boxes on
 * their own line, then Armor and the remaining free-text fields each on
 * their own line. Rendered with `white-space: pre-wrap`, so the "\n" joins
 * below become real line breaks.
 */
export function statSummary(stats: AdversaryStats, t: (key: string) => string): string {
  const armorTags = stats.hasArmor ? parseTags(stats.armorTags) : [];

  const poolsLine = [
    stats.primaryPool > 0 ? `${t('gm.primaryPool')} ${stats.primaryPool}` : null,
    stats.secondaryPool > 0 ? `${t('gm.secondaryPool')} ${stats.secondaryPool}` : null,
    desperationPool(stats.primaryPool) > 0
      ? `${t('gm.desperationPool')} ${desperationPool(stats.primaryPool)}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const survivalLine = [
    stats.defense > 0 ? `${t('gm.defense')} ${stats.defense}` : null,
    stats.integrity > 0 ? `${t('gm.integrity')} ${stats.integrity}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const injuryLine = stats.injuryBoxes > 0 ? `${t('gm.injuryBoxes')} ${stats.injuryBoxes}` : '';

  const armorLine =
    stats.hasArmor && (stats.armorRating > 0 || armorTags.length > 0)
      ? `${t('gm.armor')}: ${[
          stats.armorRating > 0 ? stats.armorRating : null,
          armorTags.length > 0 ? `(${armorTags.join(', ')})` : null,
        ]
          .filter(Boolean)
          .join(' ')}`
      : '';

  const lines = [
    poolsLine,
    stats.enhancement.trim() ? `${t('gm.enhancement')}: ${truncate(stats.enhancement)}` : '',
    survivalLine,
    injuryLine,
    armorLine,
    stats.qualities.trim() ? `${t('gm.qualities')}: ${truncate(stats.qualities)}` : '',
    stats.dreadPower.trim() ? `${t('gm.dreadPower')}: ${truncate(stats.dreadPower)}` : '',
    stats.special.trim() ? `${t('gm.special')}: ${truncate(stats.special)}` : '',
  ].filter((line) => line.length > 0);

  return lines.join('\n') || '—';
}

/**
 * An always-visible free dice pool for one-off rolls that don't fit any
 * adversary's regular pools, shared by the whole campaign — a numeric value
 * with +/- steppers (click) and a double-click-to-type field, same
 * interaction as the sheet's EXP tracker. The whole control doubles as a
 * selectable button for the roll bar; the inner stepper/value controls stop
 * the click from also toggling selection.
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

function AddInstanceRow({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { templates, instances } = campaign;
  const [templateId, setTemplateId] = useState('');
  const selectedTemplate = templates.find((tpl) => tpl.id === templateId);

  const add = () => {
    const template = templates.find((tpl) => tpl.id === templateId);
    if (!template) return;
    // Stats are copied now, not linked — count by label prefix instead of a template id.
    const count = instances.filter(
      (i) => i.label === template.name || i.label.startsWith(`${template.name} #`),
    ).length;
    const label = count === 0 ? template.name : `${template.name} #${count + 1}`;
    patch({
      instances: [
        ...instances,
        {
          id: uid(),
          label,
          stats: { ...template.stats },
          memo: '',
          conditions: [],
          marked: 0,
          takenOut: false,
        },
      ],
    });
    setTemplateId('');
  };

  if (templates.length === 0) return null;

  return (
    <section className="card">
      <div className="form-row">
        <select
          className="grow"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          aria-label={t('gm.pickTemplate')}
        >
          <option value="">{t('gm.pickTemplate')}</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
        <button className="primary" disabled={!templateId} onClick={add}>
          {t('sheet.add')}
        </button>
      </div>
      {selectedTemplate && (
        <p className="muted item-card-desc">{statSummary(selectedTemplate.stats, t)}</p>
      )}
    </section>
  );
}

function CampaignSettingsCard({ campaign, editing }: { campaign: Campaign; editing: boolean }) {
  const { t } = useTranslation();
  const rename = useCampaignStore((s) => s.rename);
  const patch = useCampaignStore((s) => s.patch);
  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const select = useGmRollStore((s) => s.select);

  const customPoolControl = (
    <CustomPoolControl
      value={campaign.customPool}
      selected={selectedInstanceId === null && selectedPool === 'custom'}
      onSelect={() => select(null, 'custom')}
      onChange={(n) => patch({ customPool: n })}
    />
  );

  if (!editing) {
    return (
      <section className="card identity">
        <h1>{campaign.name}</h1>
        {customPoolControl}
      </section>
    );
  }

  return (
    <section className="card identity">
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.rename')}</span>
          <input defaultValue={campaign.name} onBlur={(e) => rename(e.target.value)} />
        </label>
      </div>
      {customPoolControl}
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('gm.webhook')}</span>
          <input
            type="url"
            placeholder="https://discord.com/api/webhooks/…"
            defaultValue={campaign.webhookUrl}
            onBlur={(e) => patch({ webhookUrl: e.target.value.trim() })}
          />
        </label>
      </div>
    </section>
  );
}

interface Props {
  campaign: Campaign;
  editing: boolean;
}

export function CampaignSheet({ campaign, editing }: Props) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { instances } = campaign;

  return (
    <div className="stack">
      <CampaignSettingsCard campaign={campaign} editing={editing} />
      <AddInstanceRow campaign={campaign} />
      {instances.length === 0 ? (
        <p className="muted">{t('gm.noAdversaries')}</p>
      ) : (
        <div className="card-grid">
          {instances.map((instance) => (
            <AdversaryCard
              key={instance.id}
              instance={instance}
              editing={editing}
              onChange={(updated) =>
                patch({ instances: instances.map((x) => (x.id === updated.id ? updated : x)) })
              }
              onRemove={() => patch({ instances: instances.filter((x) => x.id !== instance.id) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
