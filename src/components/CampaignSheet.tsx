import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import {
  blankAdversaryStats,
  desperationPool,
  type AdversaryStats,
  type AdversaryTemplate,
} from '../types/campaign';
import type { Campaign } from '../types/campaign';
import { Stepper } from './Stepper';
import { FieldLabel } from './FieldLabel';
import { AdversaryCard } from './AdversaryCard';

/** Shorten a free-text field for the summary line; full text lives in the edit form. */
function truncate(s: string, max = 24): string {
  const trimmed = s.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** A full "Primary 5 · Integrity 3 · …" summary line — every non-zero/non-empty field. */
function statSummary(stats: AdversaryStats, t: (key: string) => string): string {
  const armorTags = stats.hasArmor ? parseTags(stats.armorTags) : [];
  const armorPart =
    stats.hasArmor && (stats.armorRating > 0 || armorTags.length > 0)
      ? `${t('gm.armor')}${stats.armorRating > 0 ? ` ${stats.armorRating}` : ''}${
          armorTags.length > 0 ? ` (${armorTags.join(', ')})` : ''
        }`
      : null;
  const parts = [
    stats.primaryPool > 0 ? `${t('gm.primaryPool')} ${stats.primaryPool}` : null,
    stats.secondaryPool > 0 ? `${t('gm.secondaryPool')} ${stats.secondaryPool}` : null,
    desperationPool(stats.primaryPool) > 0
      ? `${t('gm.desperationPool')} ${desperationPool(stats.primaryPool)}`
      : null,
    stats.enhancement.trim() ? `${t('gm.enhancement')} ${truncate(stats.enhancement)}` : null,
    stats.defense > 0 ? `${t('gm.defense')} ${stats.defense}` : null,
    stats.integrity > 0 ? `${t('gm.integrity')} ${stats.integrity}` : null,
    stats.injuryBoxes > 0 ? `${t('gm.injuryBoxes')} ${stats.injuryBoxes}` : null,
    armorPart,
    stats.qualities.trim() ? `${t('gm.qualities')} ${truncate(stats.qualities)}` : null,
    stats.dreadPower.trim() ? `${t('gm.dreadPower')} ${truncate(stats.dreadPower)}` : null,
    stats.special.trim() ? `${t('gm.special')} ${truncate(stats.special)}` : null,
  ].filter(Boolean);
  return parts.join(' · ') || '—';
}

/** Shared form fields for creating or editing an adversary template. */
function AdversaryTemplateForm({
  initialName = '',
  initialStats,
  onSave,
  onCancel,
  saveLabel,
}: {
  initialName?: string;
  initialStats?: AdversaryStats;
  onSave: (name: string, stats: AdversaryStats) => void;
  onCancel?: () => void;
  saveLabel: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [stats, setStats] = useState<AdversaryStats>(initialStats ?? blankAdversaryStats());
  const set = <K extends keyof AdversaryStats>(key: K, value: AdversaryStats[K]) =>
    setStats((s) => ({ ...s, [key]: value }));

  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim(), stats);
    // Always clear: an edit form unmounts right after (its caller closes it),
    // and clearing lets the add-template form stay open for the next entry.
    setName('');
    setStats(blankAdversaryStats());
  };

  return (
    <div className="stack">
      <div className="form-row">
        <input
          className="grow"
          placeholder={t('sheet.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.primaryPool" en="Primary" />}
          ariaLabel={t('gm.primaryPool')}
          value={stats.primaryPool}
          onChange={(n) => set('primaryPool', n)}
        />
        <Stepper
          label={<FieldLabel i18nKey="gm.secondaryPool" en="Secondary" />}
          ariaLabel={t('gm.secondaryPool')}
          value={stats.secondaryPool}
          onChange={(n) => set('secondaryPool', n)}
        />
        <div className="field">
          <span className="field-label">
            <FieldLabel i18nKey="gm.desperationPool" en="Desperation" />
          </span>
          <span className="stat-value">{desperationPool(stats.primaryPool)}</span>
        </div>
      </div>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.defense" en="Defense" />}
          ariaLabel={t('gm.defense')}
          value={stats.defense}
          onChange={(n) => set('defense', n)}
        />
      </div>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">
            <FieldLabel i18nKey="gm.enhancement" en="Enhancement" />
          </span>
          <input
            className="grow"
            placeholder={t('gm.enhancementPlaceholder')}
            value={stats.enhancement}
            onChange={(e) => set('enhancement', e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="gm.integrity" en="Integrity" />}
          ariaLabel={t('gm.integrity')}
          value={stats.integrity}
          onChange={(n) => set('integrity', n)}
        />
        <Stepper
          label={<FieldLabel i18nKey="gm.injuryBoxes" en="Injury boxes" />}
          ariaLabel={t('gm.injuryBoxes')}
          value={stats.injuryBoxes}
          onChange={(n) => set('injuryBoxes', n)}
        />
      </div>
      <div className="form-row">
        <label className="field-check">
          <input
            type="checkbox"
            checked={stats.hasArmor}
            onChange={(e) => set('hasArmor', e.target.checked)}
          />
          <span>
            <FieldLabel i18nKey="gm.armor" en="Armor" />
          </span>
        </label>
        {stats.hasArmor && (
          <Stepper
            label={<FieldLabel i18nKey="gm.armorRating" en="Armor rating" />}
            ariaLabel={t('gm.armorRating')}
            value={stats.armorRating}
            onChange={(n) => set('armorRating', n)}
          />
        )}
      </div>
      {stats.hasArmor && (
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('gm.armorTagsPlaceholder')}
            value={stats.armorTags}
            onChange={(e) => set('armorTags', e.target.value)}
          />
        </div>
      )}
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.qualities')}
          value={stats.qualities}
          onChange={(e) => set('qualities', e.target.value)}
        />
      </div>
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.dreadPower')}
          value={stats.dreadPower}
          onChange={(e) => set('dreadPower', e.target.value)}
        />
      </div>
      <div className="form-row">
        <textarea
          className="grow"
          rows={2}
          placeholder={t('gm.special')}
          value={stats.special}
          onChange={(e) => set('special', e.target.value)}
        />
      </div>
      <div className="form-row">
        <button className="primary" onClick={save}>
          {saveLabel}
        </button>
        {onCancel && <button onClick={onCancel}>{t('common.cancel')}</button>}
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  editing,
  onSave,
  onRemove,
  onDuplicate,
}: {
  template: AdversaryTemplate;
  editing: boolean;
  onSave: (template: AdversaryTemplate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (editing && open) {
    return (
      <li className="named-item named-item-editing">
        <AdversaryTemplateForm
          initialName={template.name}
          initialStats={template.stats}
          saveLabel={t('sheet.save')}
          onCancel={() => setOpen(false)}
          onSave={(name, stats) => {
            onSave({ ...template, name, stats });
            setOpen(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="named-item">
      <div className="named-item-row">
        <button
          type="button"
          className="chip ghost"
          aria-expanded={expanded}
          aria-label={expanded ? `collapse ${template.name}` : `expand ${template.name}`}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="chevron">{expanded ? '▾' : '▸'}</span>
        </button>
        <span className="named-name">{template.name}</span>
        {editing && (
          <div className="item-card-actions">
            <button className="chip ghost" aria-label={`duplicate ${template.name}`} onClick={onDuplicate}>
              📋
            </button>
            <button className="chip ghost" aria-label={`edit ${template.name}`} onClick={() => setOpen(true)}>
              ✏️
            </button>
            <button className="chip ghost" aria-label={`remove ${template.name}`} onClick={onRemove}>
              ✕
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <p className="muted item-card-desc named-item-note">{statSummary(template.stats, t)}</p>
      )}
    </li>
  );
}

function AdversaryTemplatesCard({ campaign, editing }: { campaign: Campaign; editing: boolean }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { templates } = campaign;
  const [adding, setAdding] = useState(false);

  return (
    <section className="card">
      <h2>{t('gm.templates')}</h2>
      {editing && (
        <div className="form-row">
          <button className="primary" onClick={() => setAdding((v) => !v)}>
            {adding ? `✕ ${t('common.cancel')}` : `+ ${t('gm.addTemplate')}`}
          </button>
        </div>
      )}
      {editing && adding && (
        <AdversaryTemplateForm
          saveLabel={t('gm.addTemplate')}
          onCancel={() => setAdding(false)}
          onSave={(name, stats) =>
            patch({ templates: [...templates, { id: uid(), name, stats }] })
          }
        />
      )}
      {templates.length === 0 && <p className="muted">{t('gm.noTemplates')}</p>}
      <ul className="named-list">
        {templates.map((tpl) => (
          <TemplateRow
            key={tpl.id}
            template={tpl}
            editing={editing}
            onSave={(updated) =>
              patch({ templates: templates.map((x) => (x.id === tpl.id ? updated : x)) })
            }
            onRemove={() => {
              if (!confirm(t('gm.confirmDeleteTemplate'))) return;
              patch({ templates: templates.filter((x) => x.id !== tpl.id) });
            }}
            onDuplicate={() =>
              patch({
                templates: [
                  ...templates,
                  { id: uid(), name: `${tpl.name}${t('gm.copySuffix')}`, stats: { ...tpl.stats } },
                ],
              })
            }
          />
        ))}
      </ul>
    </section>
  );
}

function AddInstanceRow({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { templates, instances } = campaign;
  const [templateId, setTemplateId] = useState('');

  const add = () => {
    const template = templates.find((tpl) => tpl.id === templateId);
    if (!template) return;
    const count = instances.filter((i) => i.templateId === template.id).length;
    const label = count === 0 ? template.name : `${template.name} #${count + 1}`;
    patch({
      instances: [
        ...instances,
        { id: uid(), templateId: template.id, label, memo: '', marked: 0, takenOut: false },
      ],
    });
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
    </section>
  );
}

function CampaignSettingsCard({ campaign, editing }: { campaign: Campaign; editing: boolean }) {
  const { t } = useTranslation();
  const rename = useCampaignStore((s) => s.rename);
  const patch = useCampaignStore((s) => s.patch);

  if (!editing) {
    return (
      <section className="card identity">
        <h1>{campaign.name}</h1>
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
      <div className="form-row">
        <label className="field-check">
          <input
            type="checkbox"
            checked={campaign.autoPostToDiscord}
            onChange={(e) => patch({ autoPostToDiscord: e.target.checked })}
          />
          <span>{t('gm.autoPostToDiscord')}</span>
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
      <AdversaryTemplatesCard campaign={campaign} editing={editing} />

      {/* Deploying/viewing stat-block cards clutters template authoring, so both are hidden while editing. */}
      {!editing && <AddInstanceRow campaign={campaign} />}
      {!editing &&
        (instances.length === 0 ? (
          <p className="muted">{t('gm.noAdversaries')}</p>
        ) : (
          <div className="card-grid">
            {instances.map((instance) => (
              <AdversaryCard
                key={instance.id}
                campaign={campaign}
                instance={instance}
                onChange={(updated) =>
                  patch({ instances: instances.map((x) => (x.id === updated.id ? updated : x)) })
                }
                onRemove={() => patch({ instances: instances.filter((x) => x.id !== instance.id) })}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
