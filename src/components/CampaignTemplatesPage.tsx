import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { uid } from '../lib/uid';
import { useDragReorder } from '../lib/useDragReorder';
import { blankAdversaryStats, type AdversaryStats, type AdversaryTemplate, type Campaign } from '../types/campaign';
import { AdversaryStatBody, AdversaryStatsFields } from './AdversaryCard';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconCopy, IconEdit } from './icons';
import { ListImportExport } from './ListImportExport';

/** Shared form fields for creating or editing an adversary template. */
function AdversaryTemplateForm({
  initialName = '',
  initialDrive = '',
  initialStats,
  onSave,
  onCancel,
  saveLabel,
}: {
  initialName?: string;
  initialDrive?: string;
  initialStats?: AdversaryStats;
  onSave: (name: string, drive: string, stats: AdversaryStats) => void;
  onCancel?: () => void;
  saveLabel: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [drive, setDrive] = useState(initialDrive);
  const [stats, setStats] = useState<AdversaryStats>(initialStats ?? blankAdversaryStats());
  const set = <K extends keyof AdversaryStats>(key: K, value: AdversaryStats[K]) =>
    setStats((s) => ({ ...s, [key]: value }));

  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim(), drive.trim(), stats);
    // Always clear: an edit form unmounts right after (its caller closes it),
    // and clearing lets the add-template form stay open for the next entry.
    setName('');
    setDrive('');
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
        <label className="field grow">
          <span className="field-label"><FieldLabel i18nKey="gm.drive" en="Drive" /></span>
          <input
            className="grow"
            placeholder={t('gm.drivePlaceholder')}
            value={drive}
            onChange={(e) => setDrive(e.target.value)}
          />
        </label>
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
  index,
  onSave,
  onRemove,
  onDuplicate,
  dragHandleProps,
  dragItemProps,
}: {
  template: AdversaryTemplate;
  index: number;
  onSave: (template: AdversaryTemplate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<AdversaryTemplate>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<AdversaryTemplate>>['itemProps'];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const drag = dragItemProps(index);

  if (open) {
    return (
      <div className="item-card adversary-card editing" data-drag-index={index}>
        <AdversaryTemplateForm
          initialName={template.name}
          initialDrive={template.drive}
          initialStats={template.stats}
          saveLabel={t('sheet.save')}
          onCancel={() => setOpen(false)}
          onSave={(name, drive, stats) => {
            onSave({ ...template, name, drive, stats });
            setOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`item-card adversary-card ${drag.className}`} data-drag-index={index}>
      <div className="item-card-head">
        <div className="item-card-title grow">
          <span className="drag-handle" {...dragHandleProps(index)} />
          <span className="grow adversary-label">{template.name}</span>
        </div>
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
      {template.drive && <p className="muted adversary-drive">{template.drive}</p>}
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
  const { handleProps, itemProps } = useDragReorder(
    templates,
    (next) => patch({ templates: next }),
    'grid',
  );

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
            onSave={(name, drive, stats) =>
              patch({ templates: [...templates, { id: uid(), name, drive, stats }] })
            }
          />
        )}
        {templates.length === 0 && <p className="muted">{t('gm.noTemplates')}</p>}
      </section>
      {templates.length > 0 && (
        <div className="card-grid">
          {templates.map((tpl, i) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
              index={i}
              dragHandleProps={handleProps}
              dragItemProps={itemProps}
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
                    { id: uid(), name: `${tpl.name}${t('gm.copySuffix')}`, drive: tpl.drive, stats: { ...tpl.stats } },
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
