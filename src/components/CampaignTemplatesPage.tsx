import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { blankAdversaryStats, type AdversaryStats, type AdversaryTemplate, type Campaign } from '../types/campaign';
import { AdversaryStatBody, AdversaryStatsFields } from './AdversaryCard';
import { IconClose, IconCopy, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';

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
      <AdversaryStatsFields stats={stats} onChange={set} />
      <div className="form-row">
        <button className="primary" onClick={save}>
          {saveLabel}
        </button>
        {onCancel && <button onClick={onCancel}>{t('common.cancel')}</button>}
      </div>
    </div>
  );
}

/**
 * A template, card-style like a deployed adversary — same stat block, same
 * duplicate/edit/remove affordance, always visible (no page-level edit
 * gate). Editing swaps the whole card for the add/edit form.
 */
function TemplateRow({
  template,
  onSave,
  onRemove,
  onDuplicate,
}: {
  template: AdversaryTemplate;
  onSave: (template: AdversaryTemplate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="item-card adversary-card editing">
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
      </div>
    );
  }

  return (
    <div className="item-card adversary-card">
      <div className="item-card-head">
        <span className="grow adversary-label">{template.name}</span>
        <div className="item-card-actions">
          <button className="chip ghost" aria-label={`duplicate ${template.name}`} onClick={onDuplicate}>
            <IconCopy />
          </button>
          <button className="chip ghost" aria-label={`edit ${template.name}`} onClick={() => setOpen(true)}>
            <IconEdit />
          </button>
          <button className="chip ghost" aria-label={`remove ${template.name}`} onClick={onRemove}>
            <IconClose />
          </button>
        </div>
      </div>
      <AdversaryStatBody stats={template.stats} />
    </div>
  );
}

/** Adversary templates tab: browsable and fully editable, no page-level edit gate. */
export function CampaignTemplatesPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { templates } = campaign;
  const [adding, setAdding] = useState(false);

  return (
    <div className="stack">
      <section className="card">
        <h2>{t('gm.templates')}</h2>
        <div className="form-row">
          <button className="primary" onClick={() => setAdding((v) => !v)}>
            {adding ? <><IconClose /> {t('common.cancel')}</> : `+ ${t('gm.addTemplate')}`}
          </button>
        </div>
        <ListImportExport
          kind="adversaries"
          items={templates}
          ownerName={campaign.name}
          onChange={(next) => patch({ templates: next })}
        />
        {adding && (
          <AdversaryTemplateForm
            saveLabel={t('gm.addTemplate')}
            onCancel={() => setAdding(false)}
            onSave={(name, stats) =>
              patch({ templates: [...templates, { id: uid(), name, stats }] })
            }
          />
        )}
        {templates.length === 0 && <p className="muted">{t('gm.noTemplates')}</p>}
      </section>
      {templates.length > 0 && (
        <div className="card-grid">
          {templates.map((tpl) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
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
        </div>
      )}
    </div>
  );
}
