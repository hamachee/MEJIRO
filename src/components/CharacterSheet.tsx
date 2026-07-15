import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import {
  MAX_ENTANGLEMENT,
  curseDiceCap,
  type Character,
  type RatedItem,
} from '../types/character';
import type { L10n as L10nLabel, Stat, SystemTemplate } from '../types/template';
import { ResourceTracker } from './ResourceTracker';
import { FieldLabel } from './FieldLabel';
import { uid } from '../lib/uid';

const MAX_DOTS = 5;

/**
 * A localised label with the English original as a small sublabel when the
 * UI language differs — non-English template labels are unofficial fan
 * translations, so the source term stays visible.
 */
function L({ l10n }: { l10n: L10nLabel }) {
  const lang = useLang();
  const localized = label(l10n, lang);
  const showEn = lang !== 'en' && l10n.en && l10n.en !== localized;
  return (
    <>
      {localized}
      {showEn && <small className="label-en">{l10n.en}</small>}
    </>
  );
}

/**
 * A dot rating. In edit mode dots are clickable: clicking dot n sets the
 * value to n, clicking the current value lowers it by one (so 0 is reachable).
 */
function Dots({
  value,
  editable,
  onSet,
  max = MAX_DOTS,
}: {
  value: number;
  editable?: boolean;
  onSet?: (n: number) => void;
  max?: number;
}) {
  return (
    <span className="dots" role={editable ? 'radiogroup' : undefined}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return editable ? (
          <button
            key={n}
            className={`dot ${filled ? 'filled' : ''}`}
            aria-label={`${n}`}
            onClick={() => onSet?.(value === n ? n - 1 : n)}
          />
        ) : (
          <span key={n} className={`dot ${filled ? 'filled' : ''}`} />
        );
      })}
    </span>
  );
}

/**
 * One attribute or skill on the sheet. In play mode the whole row is a
 * toggle that selects the stat for the dice pool; in edit mode the dots
 * are clickable to set the rating.
 */
function SheetStat({
  stat,
  value,
  editing,
  selected,
  onToggle,
  onSet,
}: {
  stat: Stat;
  value: number;
  editing: boolean;
  selected: boolean;
  onToggle: () => void;
  onSet: (n: number) => void;
}) {
  if (editing) {
    return (
      <div className="sheet-stat editing">
        <span className="stat-label">
          <L l10n={stat.label} />
        </span>
        <Dots value={value} editable onSet={onSet} />
      </div>
    );
  }
  return (
    <button
      className={`sheet-stat ${selected ? 'selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="stat-label">
        <L l10n={stat.label} />
      </span>
      <Dots value={value} />
    </button>
  );
}

/** The character's guiding motifs, folded away until needed. */
export function MotifsFold({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const { identity } = character;
  return (
    <details className="fold">
      <summary>{t('sheet.motifs')}</summary>
      {editing ? (
        <textarea
          rows={3}
          placeholder={t('sheet.tormentPlaceholder')}
          defaultValue={identity.motifs}
          onBlur={(e) => patch({ identity: { ...identity, motifs: e.target.value } })}
        />
      ) : (
        <p className="muted fold-readonly">{identity.motifs || '—'}</p>
      )}
    </details>
  );
}

function IdentityCard({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const rename = useCharacterStore((s) => s.rename);
  const patch = useCharacterStore((s) => s.patch);
  const { identity } = character;

  const setIdentity = (field: keyof typeof identity) =>
    (e: React.FocusEvent<HTMLInputElement>) =>
      patch({ identity: { ...identity, [field]: e.target.value.trim() } });

  // Role path and aspirations, folded away until needed. Like the rest of
  // the card, these only accept changes in edit mode; play mode shows the
  // current values read-only.
  const goalsFold = (
    <details className="fold">
      <summary>{t('sheet.pathGoals')}</summary>
      {editing ? (
        <>
          <div className="form-row">
            <label className="field grow">
              <span className="field-label">{t('sheet.rolePath')}</span>
              <input defaultValue={identity.rolePath} onBlur={setIdentity('rolePath')} />
            </label>
          </div>
          <div className="form-row">
            <label className="field grow">
              <span className="field-label">{t('sheet.shortTerm1')}</span>
              <input defaultValue={identity.shortTerm1} onBlur={setIdentity('shortTerm1')} />
            </label>
            <label className="field grow">
              <span className="field-label">{t('sheet.shortTerm2')}</span>
              <input defaultValue={identity.shortTerm2} onBlur={setIdentity('shortTerm2')} />
            </label>
          </div>
          <div className="form-row">
            <label className="field grow">
              <span className="field-label">{t('sheet.longTerm')}</span>
              <input defaultValue={identity.longTerm} onBlur={setIdentity('longTerm')} />
            </label>
          </div>
        </>
      ) : (
        <div className="fold-readonly">
          <div>
            <span className="field-label">{t('sheet.rolePath')}</span> {identity.rolePath || '—'}
          </div>
          <div>
            <span className="field-label">{t('sheet.shortTerm1')}</span>{' '}
            {identity.shortTerm1 || '—'}
          </div>
          <div>
            <span className="field-label">{t('sheet.shortTerm2')}</span>{' '}
            {identity.shortTerm2 || '—'}
          </div>
          <div>
            <span className="field-label">{t('sheet.longTerm')}</span> {identity.longTerm || '—'}
          </div>
        </div>
      )}
    </details>
  );

  const motifsFold = <MotifsFold character={character} editing={editing} />;

  if (!editing) {
    return (
      <section className="card identity">
        <div className="identity-name">
          <h1>{character.name}</h1>
        </div>
        <div className="identity-row muted">
          {[identity.lineage, identity.family, identity.concept]
            .filter(Boolean)
            .join(' · ') || '—'}
        </div>
        {goalsFold}
        {motifsFold}
      </section>
    );
  }

  return (
    <section className="card identity">
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.rename')}</span>
          <input
            defaultValue={character.name}
            onBlur={(e) => rename(e.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">
            <FieldLabel i18nKey="sheet.lineage" en="Lineage" />
          </span>
          <input defaultValue={identity.lineage} onBlur={setIdentity('lineage')} />
        </label>
        <label className="field grow">
          <span className="field-label">
            <FieldLabel i18nKey="sheet.family" en="Family" />
          </span>
          <input defaultValue={identity.family} onBlur={setIdentity('family')} />
        </label>
      </div>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.concept')}</span>
          <input defaultValue={identity.concept} onBlur={setIdentity('concept')} />
        </label>
      </div>
      {goalsFold}
      {motifsFold}
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.webhook')}</span>
          <input
            type="url"
            placeholder="https://discord.com/api/webhooks/…"
            defaultValue={character.webhookUrl}
            onBlur={(e) => patch({ webhookUrl: e.target.value.trim() })}
          />
        </label>
      </div>
      <div className="form-row">
        <label className="field-check">
          <input
            type="checkbox"
            checked={character.showNameInWebhook}
            onChange={(e) => patch({ showNameInWebhook: e.target.checked })}
          />
          <span>{t('sheet.showNameInWebhook')}</span>
        </label>
      </div>
    </section>
  );
}

/**
 * Entanglement and curse dice, together in their own card. Curse dice shift
 * constantly in play (like hunger), so they stay editable outside edit mode;
 * capacity follows Entanglement (• = 5, ••/••• = 7, •••• = 9) and every
 * capacity dot is drawn so the maximum stays visible.
 */
export function CurseCard({
  character,
  editing,
  variant = 'full',
}: {
  character: Character;
  editing: boolean;
  variant?: 'full' | 'compact';
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const { identity } = character;
  const curseCap = curseDiceCap(identity.entanglement);

  const entanglementDots = (
    <Dots
      value={identity.entanglement}
      max={MAX_ENTANGLEMENT}
      editable={editing}
      onSet={(n) =>
        patch({
          identity: { ...identity, entanglement: n },
          // Lowering entanglement shrinks curse capacity too.
          curseDice: Math.min(character.curseDice, curseDiceCap(n)),
        })
      }
    />
  );

  const curseDiceControls = (
    <div className="curse-controls">
      <button
        aria-label={`− ${t('roller.curseDice')}`}
        disabled={character.curseDice <= 0}
        onClick={() => patch({ curseDice: character.curseDice - 1 })}
      >
        −
      </button>
      <span className="dots curse-dots">
        <Dots
          value={character.curseDice}
          max={curseCap}
          editable
          onSet={(n) => patch({ curseDice: n })}
        />
      </span>
      <button
        aria-label={`+ ${t('roller.curseDice')}`}
        disabled={character.curseDice >= curseCap}
        onClick={() => patch({ curseDice: character.curseDice + 1 })}
      >
        +
      </button>
    </div>
  );

  if (variant === 'compact') {
    return (
      <section className="card compact-tracker">
        <div className="curse-line">
          <span className="field-label">
            <FieldLabel i18nKey="sheet.entanglement" en="Entanglement" />
          </span>
          {entanglementDots}
          <span className="curse-line-divider" aria-hidden="true">
            |
          </span>
          <span className="field-label">
            <FieldLabel i18nKey="roller.curseDice" en="Curse dice" />
          </span>
          {curseDiceControls}
        </div>
        <MotifsFold character={character} editing={editing} />
      </section>
    );
  }

  return (
    <section className="card">
      <div className="curse-row">
        <span className="field-label">
          <FieldLabel i18nKey="sheet.entanglement" en="Entanglement" />
        </span>
        {entanglementDots}
      </div>
      <div className="curse-row">
        <span className="field-label">
          <FieldLabel i18nKey="roller.curseDice" en="Curse dice" />
        </span>
        {curseDiceControls}
      </div>
    </section>
  );
}

export function InjuryCard({
  character,
  template,
  variant = 'full',
}: {
  character: Character;
  template: SystemTemplate;
  variant?: 'full' | 'compact';
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const { injuries, armor } = character;

  const levels = template.injuryTrack?.levels;
  // Taken Out is tracked independently (injuries.takenOut) rather than as
  // the last box of the cumulative fill, so it can be marked without first
  // filling every level before it.
  const trackLevels = levels?.filter((l) => !l.terminal) ?? [];
  const terminalLevel = levels?.find((l) => l.terminal);

  const total = levels?.length
    ? trackLevels.reduce((sum, l) => sum + l.boxes, 0)
    : injuries.boxes;
  const marked = Math.min(injuries.marked, total);

  const setMarked = (n: number) =>
    patch({ injuries: { ...injuries, marked: Math.max(0, Math.min(n, total)) } });

  const box = (absIndex: number) => {
    const isMarked = absIndex < marked;
    const position = absIndex + 1;
    return (
      <button
        key={absIndex}
        className={`injury-box ${isMarked ? 'marked' : ''}`}
        aria-label={`${position}`}
        // Same convention as dot ratings: clicking a box fills up to and
        // including it; only clicking the topmost filled box steps down one.
        onClick={() => setMarked(marked === position ? position - 1 : position)}
      />
    );
  };

  // A standalone toggle, unaffected by (and not requiring) the fill track.
  const takenOutBox = (key: number) => (
    <button
      key={key}
      className={`injury-box ${injuries.takenOut ? 'marked' : ''}`}
      aria-label={t('sheet.takenOut')}
      onClick={() => patch({ injuries: { ...injuries, takenOut: !injuries.takenOut } })}
    />
  );

  // Armor: its own independent box track. Rating (box count) is a dynamic
  // stat set with +/-, defaulting to 0 (no boxes shown); marking follows the
  // same fill convention as the injury track but never touches it.
  const armorMarked = Math.min(armor.marked, armor.rating);
  const setArmorRating = (n: number) => {
    const rating = Math.max(0, n);
    patch({ armor: { rating, marked: Math.min(armorMarked, rating) } });
  };
  const armorBox = (absIndex: number) => {
    const isMarked = absIndex < armorMarked;
    const position = absIndex + 1;
    return (
      <button
        key={absIndex}
        className={`injury-box ${isMarked ? 'marked' : ''}`}
        aria-label={`${position}`}
        onClick={() =>
          patch({
            armor: {
              ...armor,
              marked: armorMarked === position ? position - 1 : position,
            },
          })
        }
      />
    );
  };
  const compact = variant === 'compact';

  const armorRow = (
    <div className={compact ? 'stat-track-row thin' : 'stat-track-row'}>
      <span className="field-label">
        <FieldLabel i18nKey="sheet.armor" en="Armor" />
      </span>
      <div className="curse-controls">
        <button
          aria-label={`− ${t('sheet.armor')}`}
          disabled={armor.rating <= 0}
          onClick={() => setArmorRating(armor.rating - 1)}
        >
          −
        </button>
        <div className="injury-boxes">
          {Array.from({ length: armor.rating }, (_, i) => armorBox(i))}
        </div>
        <button aria-label={`+ ${t('sheet.armor')}`} onClick={() => setArmorRating(armor.rating + 1)}>
          +
        </button>
      </div>
    </div>
  );

  const takenOutRow = terminalLevel && (
    <div className={compact ? undefined : 'injury-standalone'}>
      <div className={`injury-level terminal ${injuries.takenOut ? 'lit' : ''} ${compact ? 'thin' : ''}`}>
        <div className="injury-boxes">
          {Array.from({ length: terminalLevel.boxes }, (_, i) => takenOutBox(i))}
        </div>
        <span className="injury-level-label">
          <L l10n={terminalLevel.label} />
        </span>
      </div>
    </div>
  );

  if (levels?.length) {
    let offset = 0;
    const groups = trackLevels.map((level) => {
      const start = offset;
      offset += level.boxes;
      // Only the current severity is lit: the level holding the deepest
      // marked box. Shallower levels dim again as damage progresses.
      const lit = marked > start && marked <= offset;
      return (
        <div
          key={start}
          className={`injury-level ${lit ? 'lit' : ''} ${variant === 'compact' ? 'thin' : ''}`}
        >
          <div className="injury-boxes">
            {Array.from({ length: level.boxes }, (_, i) => box(start + i))}
          </div>
          <span className="injury-level-label">
            <L l10n={level.label} />
          </span>
        </div>
      );
    });
    if (compact) {
      return (
        <section className="card compact-tracker">
          <div className="tracker-line">
            {armorRow}
            <div className="injury-track grouped compact">{groups}</div>
            {takenOutRow}
          </div>
        </section>
      );
    }
    return (
      <section className="card">
        <h2>
        <FieldLabel i18nKey="sheet.injuries" en="Injuries" />
      </h2>
        {armorRow}
        <div className="injury-track grouped">{groups}</div>
        {takenOutRow}
      </section>
    );
  }

  // Fallback: flat track for templates without a structured injury track.
  if (compact) {
    return (
      <section className="card compact-tracker">
        <div className="tracker-line">
          {armorRow}
          <div className="injury-track compact">
            {Array.from({ length: total }, (_, i) => box(i))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>
        <FieldLabel i18nKey="sheet.injuries" en="Injuries" />
      </h2>
      {armorRow}
      <div className="injury-track">
        {Array.from({ length: total }, (_, i) => box(i))}
      </div>
    </section>
  );
}

/** A user-managed list of named entries with dot ratings (edges, paths). */
function RatedListCard({
  title,
  items,
  editing,
  onChange,
}: {
  title: ReactNode;
  items: RatedItem[];
  editing: boolean;
  onChange: (items: RatedItem[]) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const add = () => {
    if (!name.trim()) return;
    onChange([...items, { id: uid(), name: name.trim(), dots: 1 }]);
    setName('');
  };

  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p className="muted">—</p>}
      <ul className="named-list">
        {items.map((item) => (
          <li key={item.id} className="named-item">
            <span className="named-name">{item.name}</span>
            <Dots
              value={item.dots}
              editable={editing}
              onSet={(n) =>
                onChange(items.map((x) => (x.id === item.id ? { ...x, dots: n } : x)))
              }
            />
            {editing && (
              <button
                className="chip ghost"
                aria-label={`remove ${item.name}`}
                onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button onClick={add}>{t('sheet.add')}</button>
        </div>
      )}
    </section>
  );
}

function ConditionsCard({ character }: { character: Character }) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const [name, setName] = useState('');
  const { conditions } = character;

  const add = () => {
    if (!name.trim()) return;
    patch({ conditions: [...conditions, { id: uid(), name: name.trim() }] });
    setName('');
  };

  return (
    <section className="card">
      <h2>
        <FieldLabel i18nKey="sheet.conditions" en="Conditions" />
      </h2>
      <div className="condition-chips">
        {conditions.length === 0 && <span className="muted">—</span>}
        {conditions.map((c) => (
          <span key={c.id} className="condition">
            {c.name}
            <button
              aria-label={`remove ${c.name}`}
              onClick={() =>
                patch({ conditions: conditions.filter((x) => x.id !== c.id) })
              }
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      {/* Conditions come and go mid-session, so adding is available in play mode too. */}
      <div className="form-row">
        <input
          className="grow"
          placeholder={t('sheet.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add}>{t('sheet.add')}</button>
      </div>
    </section>
  );
}

interface Props {
  character: Character;
  template: SystemTemplate;
  editing: boolean;
}

/**
 * The character sheet, doubling as the dice-pool builder: in play mode,
 * tapping an attribute and a skill selects them for the roll bar.
 */
export function CharacterSheet({ character, template, editing }: Props) {
  const { t } = useTranslation();
  const setStat = useCharacterStore((s) => s.setStat);
  const patch = useCharacterStore((s) => s.patch);

  const attributeId = useRollStore((s) => s.attributeId);
  const skillId = useRollStore((s) => s.skillId);
  const toggleAttribute = useRollStore((s) => s.toggleAttribute);
  const toggleSkill = useRollStore((s) => s.toggleSkill);

  return (
    <div className="stack">
      <div className="two-col identity-split">
        <IdentityCard character={character} editing={editing} />
        <CurseCard character={character} editing={editing} />
      </div>

      <details className="card fold-card" open>
        <summary className="card-summary">
          <FieldLabel i18nKey="sheet.skills" en="Skills" />
        </summary>
        <div className="skill-grid">
          {template.skills.map((stat) => (
            <SheetStat
              key={stat.id}
              stat={stat}
              value={character.skills[stat.id] ?? 0}
              editing={editing}
              selected={skillId === stat.id}
              onToggle={() => toggleSkill(stat.id)}
              onSet={(n) => setStat('skills', stat.id, n)}
            />
          ))}
        </div>
      </details>

      <details className="card fold-card" open>
        <summary className="card-summary">
          <FieldLabel i18nKey="sheet.attributes" en="Attributes" />
        </summary>
        <div className="attr-grid">
          {template.categories.map((cat) => (
            <div key={cat.id} className="attr-col">
              <h3 className="group-title">
                <L l10n={cat.label} />
              </h3>
              {template.attributes
                .filter((a) => a.category === cat.id)
                .map((stat) => (
                  <SheetStat
                    key={stat.id}
                    stat={stat}
                    value={character.attributes[stat.id] ?? 0}
                    editing={editing}
                    selected={attributeId === stat.id}
                    onToggle={() => toggleAttribute(stat.id)}
                    onSet={(n) => setStat('attributes', stat.id, n)}
                  />
                ))}
            </div>
          ))}
        </div>
      </details>

      <div className="two-col">
        <InjuryCard character={character} template={template} />
        <ConditionsCard character={character} />
      </div>

      <div className="two-col">
        <RatedListCard
          title={<FieldLabel i18nKey="sheet.edges" en="Edges" />}
          items={character.edges}
          editing={editing}
          onChange={(edges) => patch({ edges })}
        />
        <RatedListCard
          title={<FieldLabel i18nKey="sheet.paths" en="Paths" />}
          items={character.paths}
          editing={editing}
          onChange={(paths) => patch({ paths })}
        />
      </div>

      <div className="two-col">
        <RatedListCard
          title={<FieldLabel i18nKey="sheet.contacts" en="Contacts" />}
          items={character.contacts}
          editing={editing}
          onChange={(contacts) => patch({ contacts })}
        />
        <RatedListCard
          title={<FieldLabel i18nKey="sheet.bonds" en="Bonds" />}
          items={character.bonds}
          editing={editing}
          onChange={(bonds) => patch({ bonds })}
        />
      </div>

      <div className="two-col">
        <section className="card">
          <h2>
            <FieldLabel i18nKey="sheet.torment" en="Torment" />
          </h2>
          <textarea
            className="torment-field"
            rows={4}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={character.torment}
            onBlur={(e) => patch({ torment: e.target.value })}
          />
        </section>
        <section className="card">
          <h2>
            <FieldLabel i18nKey="sheet.damnation" en="Damnation" />
          </h2>
          <textarea
            className="torment-field"
            rows={4}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={character.damnation}
            onBlur={(e) => patch({ damnation: e.target.value })}
          />
        </section>
      </div>

      <section className="card">
        <h2>
          <FieldLabel i18nKey="sheet.inheritance" en="Inheritance" />
        </h2>
        <div className="form-row">
          <textarea
            className="torment-field grow"
            rows={4}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={character.inheritance1}
            onBlur={(e) => patch({ inheritance1: e.target.value })}
          />
          <textarea
            className="torment-field grow"
            rows={4}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={character.inheritance2}
            onBlur={(e) => patch({ inheritance2: e.target.value })}
          />
        </div>
      </section>

      {template.resources.length > 0 && (
        <ResourceTracker character={character} template={template} />
      )}
    </div>
  );
}
