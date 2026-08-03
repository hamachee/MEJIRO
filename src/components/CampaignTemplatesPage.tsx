import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { blankAdversaryStats, type AdversaryStats, type AdversaryTemplate, type Campaign } from '../types/campaign';
import { AdversaryStatsFields } from './AdversaryCard';
import { statSummary } from './CampaignSheet';

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
        <details className="template-fold" open={expanded} onToggle={(e) => setExpanded(e.currentTarget.open)}>
          <summary>{template.name}</summary>
        </details>
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

/** Adversary templates tab: always browsable; add/edit/duplicate/remove gated by its own edit toggle. */
export function CampaignTemplatesPage({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { templates } = campaign;
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <div className="stack">
      <section className="card">
        <div className="item-card-head">
          <h2 className="grow">{t('gm.templates')}</h2>
          <button className={editing ? 'primary' : ''} onClick={() => setEditing((v) => !v)}>
            {editing ? `✓ ${t('sheet.done')}` : `✏️ ${t('sheet.edit')}`}
          </button>
        </div>
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
    </div>
  );
}
