import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import { MAX_CURSE_DICE, type Character, type RatedItem } from '../types/character';
import type { L10n as L10nLabel, Stat, SystemTemplate } from '../types/template';
import { ResourceTracker } from './ResourceTracker';
import { TrickInfo } from './TrickInfo';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

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

  // Curse dice shift constantly in play (like hunger), so unlike the rest of
  // the identity block they stay editable outside edit mode too.
  const curseRow = (
    <div className="curse-row">
      <span className="field-label">{t('roller.curseDice')}</span>
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
            max={Math.max(MAX_DOTS, character.curseDice)}
            editable
            onSet={(n) => patch({ curseDice: n })}
          />
        </span>
        <button
          aria-label={`+ ${t('roller.curseDice')}`}
          disabled={character.curseDice >= MAX_CURSE_DICE}
          onClick={() => patch({ curseDice: character.curseDice + 1 })}
        >
          +
        </button>
      </div>
    </div>
  );

  if (!editing) {
    return (
      <section className="card identity">
        <div className="identity-name">
          <h1>{character.name}</h1>
          <Dots value={identity.entanglement} />
        </div>
        <div className="identity-row muted">
          {[identity.lineage, identity.family].filter(Boolean).join(' · ') || '—'}
        </div>
        {curseRow}
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
          <span className="field-label">{t('sheet.lineage')}</span>
          <input
            defaultValue={identity.lineage}
            onBlur={(e) =>
              patch({ identity: { ...identity, lineage: e.target.value.trim() } })
            }
          />
        </label>
        <label className="field grow">
          <span className="field-label">{t('sheet.family')}</span>
          <input
            defaultValue={identity.family}
            onBlur={(e) =>
              patch({ identity: { ...identity, family: e.target.value.trim() } })
            }
          />
        </label>
        <div className="field">
          <span className="field-label">{t('sheet.entanglement')}</span>
          <Dots
            value={identity.entanglement}
            editable
            onSet={(n) => patch({ identity: { ...identity, entanglement: n } })}
          />
        </div>
      </div>
      {curseRow}
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
    </section>
  );
}

function InjuryCard({
  character,
  editing,
}: {
  character: Character;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const { injuries } = character;

  const setMarked = (n: number) =>
    patch({ injuries: { ...injuries, marked: n } });

  return (
    <section className="card">
      <div className="result-head">
        <h2>{t('sheet.injuries')}</h2>
        <label className={`taken-out ${injuries.takenOut ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={injuries.takenOut}
            onChange={(e) =>
              patch({ injuries: { ...injuries, takenOut: e.target.checked } })
            }
          />
          {t('sheet.takenOut')}
        </label>
      </div>
      <div className="injury-track">
        {Array.from({ length: injuries.boxes }, (_, i) => {
          const marked = i < injuries.marked;
          return (
            <button
              key={i}
              className={`injury-box ${marked ? 'marked' : ''}`}
              aria-label={`${i + 1}`}
              onClick={() => setMarked(marked ? i : i + 1)}
            />
          );
        })}
      </div>
      {editing && (
        <div className="form-row">
          <button
            onClick={() =>
              patch({
                injuries: {
                  ...injuries,
                  boxes: Math.max(1, injuries.boxes - 1),
                  marked: Math.min(injuries.marked, Math.max(1, injuries.boxes - 1)),
                },
              })
            }
          >
            − {t('sheet.box')}
          </button>
          <button
            onClick={() =>
              patch({ injuries: { ...injuries, boxes: injuries.boxes + 1 } })
            }
          >
            + {t('sheet.box')}
          </button>
        </div>
      )}
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
  title: string;
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
      <h2>{t('sheet.conditions')}</h2>
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

function TricksCard({ character }: { character: Character }) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const [name, setName] = useState('');
  const [cost, setCost] = useState(1);
  const [desc, setDesc] = useState('');
  const { tricks } = character;

  const add = () => {
    if (!name.trim()) return;
    patch({
      tricks: [
        ...tricks,
        {
          id: uid(),
          name: name.trim(),
          cost: Math.max(1, cost),
          description: desc.trim() || undefined,
        },
      ],
    });
    setName('');
    setCost(1);
    setDesc('');
  };

  return (
    <section className="card">
      <h2>{t('tricks.title')}</h2>
      <p className="muted hint">{t('tricks.manageHint')}</p>
      <ul className="named-list">
        {tricks.map((tr) => (
          <li key={tr.id} className="named-item">
            <span className="named-name">
              <TrickInfo trick={tr} />
            </span>
            <span className="trick-cost">
              {t('tricks.cost')} {tr.cost}
            </span>
            <button
              className="chip ghost"
              aria-label={`remove ${tr.name}`}
              onClick={() => patch({ tricks: tricks.filter((x) => x.id !== tr.id) })}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="form-row">
        <input
          className="grow"
          placeholder={t('tricks.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <label className="field">
          <span className="field-label">{t('tricks.cost')}</span>
          <input
            type="number"
            min={1}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
          />
        </label>
        <button onClick={add}>{t('tricks.add')}</button>
      </div>
      <div className="form-row">
        <input
          className="grow"
          placeholder={t('tricks.descPlaceholder')}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
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
      <IdentityCard character={character} editing={editing} />

      <section className="card">
        <h2>{t('sheet.attributes')}</h2>
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
      </section>

      <section className="card">
        <h2>{t('sheet.skills')}</h2>
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
        {!editing && <p className="muted hint">{t('roller.selectPrompt')}</p>}
      </section>

      <InjuryCard character={character} editing={editing} />

      <div className="two-col">
        <RatedListCard
          title={t('sheet.edges')}
          items={character.edges}
          editing={editing}
          onChange={(edges) => patch({ edges })}
        />
        <RatedListCard
          title={t('sheet.paths')}
          items={character.paths}
          editing={editing}
          onChange={(paths) => patch({ paths })}
        />
      </div>

      <ConditionsCard character={character} />
      <TricksCard character={character} />
      {template.resources.length > 0 && (
        <ResourceTracker character={character} template={template} />
      )}
    </div>
  );
}
