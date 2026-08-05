import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useGmRollStore } from '../store/gmRollStore';
import { uid } from '../lib/uid';
import { parseTags } from '../lib/tags';
import { useDragReorder } from '../lib/useDragReorder';
import {
  desperationPool,
  isPcInstance,
  type AdversaryStats,
  type TableCard,
} from '../types/campaign';
import type { Campaign } from '../types/campaign';
import { FieldLabel } from './FieldLabel';
import { IconCheck, IconEdit } from './icons';
import { AdversaryCard } from './AdversaryCard';
import { PcTableCard, pcInjuryLevels } from './CampaignPcsPage';
import { Counter } from './Counter';
import { getTemplate } from '../templates';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import { cssHex, leftBorderStyle, pickerValue } from '../lib/color';

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

/**
 * A unique instance label derived from `baseName`: the bare name if it's
 * free, otherwise "`baseName` #N" for the next free N. Used both when
 * dropping a template onto the table and when duplicating a deployed card
 * (stats are copied, not linked, so uniqueness is by label prefix).
 */
function nextInstanceLabel(baseName: string, instances: TableCard[]): string {
  const count = instances.filter(
    (i) => !isPcInstance(i) && (i.label === baseName || i.label.startsWith(`${baseName} #`)),
  ).length;
  return count === 0 ? baseName : `${baseName} #${count + 1}`;
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
    const label = nextInstanceLabel(template.name, instances);
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
          armorMarked: 0,
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

/** Campaign name + Discord webhook. Manages its own edit toggle, since the name may only be changed while it's open. */
function CampaignSettingsCard({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const lang = useLang();
  const rename = useCampaignStore((s) => s.rename);
  const patch = useCampaignStore((s) => s.patch);
  const [editing, setEditing] = useState(false);
  const template = getTemplate(campaign.templateId);
  const systemLabel = template ? label(template.name, lang) : campaign.templateId;

  if (!editing) {
    return (
      <section className="card identity" style={leftBorderStyle(cssHex(campaign.embedColor))}>
        <div className="item-card-head">
          <h1 className="grow">
            {campaign.name} <span className="identity-rule muted">· {systemLabel}</span>
          </h1>
          <button className="chip ghost" aria-label={t('sheet.edit')} onClick={() => setEditing(true)}>
            <IconEdit />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card identity" style={leftBorderStyle(cssHex(campaign.embedColor))}>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.rename')}</span>
          <input defaultValue={campaign.name} onBlur={(e) => rename(e.target.value)} />
        </label>
        <button className="chip ghost" aria-label={t('sheet.done')} onClick={() => setEditing(false)}>
          <IconCheck />
        </button>
      </div>
      <div className="identity-row muted">{systemLabel}</div>
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
        <span className="color-field-row">
          <input
            type="color"
            aria-label={t('gm.embedColor')}
            value={pickerValue(campaign.embedColor)}
            onChange={(e) => patch({ embedColor: e.target.value })}
          />
          <input
            key={campaign.embedColor}
            className="color-input"
            aria-label={t('gm.embedColor')}
            placeholder="#5B4B8A"
            defaultValue={campaign.embedColor}
            onBlur={(e) => patch({ embedColor: e.target.value.trim() })}
          />
        </span>
      </div>
    </section>
  );
}

/** Free-roll pool + Momentum counter, alongside the identity card. */
function CampaignMomentumCard({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const select = useGmRollStore((s) => s.select);

  return (
    <section className="card">
      <CustomPoolControl
        value={campaign.customPool}
        selected={selectedInstanceId === null && selectedPool === 'custom'}
        onSelect={() => select(null, 'custom')}
        onChange={(n) => patch({ customPool: n })}
      />
      <div className="curse-row momentum-row">
        <span className="field-label">
          <FieldLabel i18nKey="gm.momentum" en="Momentum" />
        </span>
        <Counter
          value={campaign.momentum}
          onChange={(n) => patch({ momentum: n })}
          ariaLabel={t('gm.momentum')}
        />
      </div>
    </section>
  );
}

/**
 * The table's combat controls, sticky above the deployed cards: turn
 * navigation (◀/▶ walks the current-turn highlight through the cards in
 * display order, incrementing the round when it wraps from the last card
 * back to the first), the round counter, a reset (round 1, no highlight),
 * and an initiative sort — PCs by their Initiative rating, adversaries by
 * their Desperation pool, highest first.
 */
function TurnTracker({ campaign }: { campaign: Campaign }) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { instances, pcs, round, turnId } = campaign;

  const initiativeOf = (card: TableCard) =>
    isPcInstance(card)
      ? (pcs.find((p) => p.id === card.pcId)?.initiative ?? 0)
      : desperationPool(card.stats.primaryPool);

  const step = (dir: 1 | -1) => {
    if (instances.length === 0) return;
    const cur = instances.findIndex((i) => i.id === turnId);
    const next =
      cur === -1
        ? dir === 1
          ? 0
          : instances.length - 1
        : (cur + dir + instances.length) % instances.length;
    const wrappedToStart = cur !== -1 && dir === 1 && next === 0;
    patch({ turnId: instances[next].id, ...(wrappedToStart ? { round: round + 1 } : {}) });
  };

  return (
    <div className="turn-bar">
      <button aria-label={t('gm.prevTurn')} onClick={() => step(-1)}>
        ◀
      </button>
      <button aria-label={t('gm.nextTurn')} onClick={() => step(1)}>
        ▶
      </button>
      <span className="turn-bar-divider" aria-hidden="true">
        |
      </span>
      <span className="field-label">{t('gm.round')}</span>
      <div className="curse-controls">
        <button
          aria-label={`− ${t('gm.round')}`}
          disabled={round <= 1}
          onClick={() => patch({ round: round - 1 })}
        >
          −
        </button>
        <span className="exp-value">{round}</span>
        <button aria-label={`+ ${t('gm.round')}`} onClick={() => patch({ round: round + 1 })}>
          +
        </button>
      </div>
      <button onClick={() => patch({ round: 1, turnId: null })}>{t('gm.resetRound')}</button>
      <span className="grow" />
      <button
        onClick={() =>
          patch({ instances: [...instances].sort((a, b) => initiativeOf(b) - initiativeOf(a)) })
        }
      >
        {t('gm.sortInitiative')}
      </button>
    </div>
  );
}

interface Props {
  campaign: Campaign;
}

export function CampaignSheet({ campaign }: Props) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);
  const { instances, pcs, turnId } = campaign;
  const levels = pcInjuryLevels(campaign);
  const { handleProps, itemProps } = useDragReorder(
    instances,
    (next) => patch({ instances: next }),
    'grid',
  );

  const turnFor = (id: string) => ({
    current: turnId === id,
    onToggle: () => patch({ turnId: turnId === id ? null : id }),
  });

  return (
    <div className="stack">
      <div className="two-col identity-split">
        <CampaignSettingsCard campaign={campaign} />
        <CampaignMomentumCard campaign={campaign} />
      </div>
      <AddInstanceRow campaign={campaign} />
      {instances.length === 0 ? (
        <p className="muted">{t('gm.noAdversaries')}</p>
      ) : (
        <>
          <TurnTracker campaign={campaign} />
          <div className="card-grid">
            {instances.map((instance, i) => {
              if (isPcInstance(instance)) {
                const pc = pcs.find((p) => p.id === instance.pcId);
                if (!pc) return null;
                return (
                  <PcTableCard
                    key={instance.id}
                    pc={pc}
                    levels={levels}
                    index={i}
                    turn={turnFor(instance.id)}
                    dragHandleProps={handleProps}
                    dragItemProps={itemProps}
                    onPatch={(p) =>
                      patch({ pcs: pcs.map((x) => (x.id === pc.id ? { ...x, ...p } : x)) })
                    }
                    onRemove={() =>
                      patch({ instances: instances.filter((x) => x.id !== instance.id) })
                    }
                  />
                );
              }
              return (
                <AdversaryCard
                  key={instance.id}
                  instance={instance}
                  index={i}
                  turn={turnFor(instance.id)}
                  dragHandleProps={handleProps}
                  dragItemProps={itemProps}
                  onChange={(updated) =>
                    patch({ instances: instances.map((x) => (x.id === updated.id ? updated : x)) })
                  }
                  onRemove={() => patch({ instances: instances.filter((x) => x.id !== instance.id) })}
                  onDuplicate={() => {
                    const baseName = instance.label.replace(/ #\d+$/, '');
                    patch({
                      instances: [
                        ...instances,
                        {
                          id: uid(),
                          label: nextInstanceLabel(baseName, instances),
                          stats: { ...instance.stats },
                          memo: '',
                          conditions: [],
                          marked: 0,
                          armorMarked: 0,
                          takenOut: false,
                        },
                      ],
                    });
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
