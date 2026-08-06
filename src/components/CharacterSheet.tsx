import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useRollStore } from '../store/rollStore';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import { useResolvedTheme } from '../lib/useTheme';
import { useSendableCard } from '../lib/useSendableCard';
import { cssHex, leftBorderStyle, pickerValue } from '../lib/color';
import { SendConfirmPopover } from './SendConfirmPopover';
import {
  MAX_ENTANGLEMENT,
  curseDiceCap,
  type Character,
  type RatedItem,
} from '../types/character';
import type { InjuryLevel, L10n as L10nLabel, Stat, SystemTemplate } from '../types/template';
import { ResourceTracker } from './ResourceTracker';
import { Counter } from './Counter';
import { FieldLabel } from './FieldLabel';
import { IconClose, IconDiamond, IconEdit, IconLink } from './icons';
import { Stepper } from './Stepper';
import { uid } from '../lib/uid';
import { attributesByCategory } from '../templates';
import { useDragReorder } from '../lib/useDragReorder';

const MAX_DOTS = 5;

/**
 * A localised label with the English original as a small sublabel when the
 * UI language differs — non-English template labels are unofficial fan
 * translations, so the source term stays visible. `suffix` (e.g. the Path
 * Skill diamond) renders right after the localized text and before the
 * sublabel, since the sublabel is block-level and would otherwise push an
 * appended suffix onto its own line below.
 */
function L({ l10n, suffix }: { l10n: L10nLabel; suffix?: ReactNode }) {
  const lang = useLang();
  const localized = label(l10n, lang);
  const showEn = lang !== 'en' && l10n.en && l10n.en !== localized;
  return (
    <>
      {localized}
      {suffix}
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
 * are clickable to set the rating. Skills additionally carry a Path Skill
 * checkbox (`onTogglePathSkill`); attributes don't pass it, so they never
 * render one.
 */
function SheetStat({
  stat,
  value,
  editing,
  selected,
  onToggle,
  onSet,
  pathSkill,
  onTogglePathSkill,
}: {
  stat: Stat;
  value: number;
  editing: boolean;
  selected: boolean;
  onToggle: () => void;
  onSet: (n: number) => void;
  pathSkill?: boolean;
  onTogglePathSkill?: () => void;
}) {
  const { t } = useTranslation();
  const lang = useLang();

  if (editing) {
    return (
      <div className="sheet-stat editing">
        {onTogglePathSkill && (
          <input
            type="checkbox"
            className="diamond-check"
            checked={!!pathSkill}
            onChange={onTogglePathSkill}
            aria-label={`${t('sheet.pathSkill')}: ${label(stat.label, lang)}`}
          />
        )}
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
        <L l10n={stat.label} suffix={pathSkill && <IconDiamond className="diamond-icon" />} />
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

/** The character's guiding motifs, as an always-visible card (where the Paths card used to sit). */
function MotifsCard({ character, editing }: { character: Character; editing: boolean }) {
  const { t } = useTranslation();
  const patch = useCharacterStore((s) => s.patch);
  const { identity } = character;
  return (
    <section className="card motifs-card">
      <h2>
        <FieldLabel i18nKey="sheet.motifs" en="Motifs" />
      </h2>
      {editing ? (
        <textarea
          rows={3}
          placeholder={t('sheet.tormentPlaceholder')}
          defaultValue={identity.motifs}
          onBlur={(e) => patch({ identity: { ...identity, motifs: e.target.value } })}
        />
      ) : (
        <p className="fold-readonly">{identity.motifs || '—'}</p>
      )}
    </section>
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
  const theme = useResolvedTheme();
  const { identity } = character;

  const setIdentity = (field: keyof typeof identity) =>
    (e: React.FocusEvent<HTMLInputElement>) =>
      patch({ identity: { ...identity, [field]: e.target.value.trim() } });

  // Major Path: which of Lineage/Family the character's supernatural nature
  // mainly draws from. The two checkboxes are mutually exclusive — checking
  // one clears the other — and checking the already-checked one clears it,
  // so "neither" stays reachable.
  const setMajorPath = (path: 'lineage' | 'family') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      patch({ identity: { ...identity, majorPath: e.target.checked ? path : '' } });

  // Short/long-term aspirations, folded away until needed. Role path lives
  // up in the main identity row, next to Family, since it's identity rather
  // than a goal. Like the rest of the card, these only accept changes in
  // edit mode; play mode shows the current values read-only.
  const goalsFold = (
    <details className="fold">
      <summary>{t('sheet.pathGoals')}</summary>
      {editing ? (
        <>
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

  if (!editing) {
    return (
      <section className="card identity" style={leftBorderStyle(cssHex(character.embedColor))}>
        <div className="identity-name">
          <h1>
            {character.name}
            {character.externalSheetUrl && (
              <a
                className="external-sheet-link"
                href={character.externalSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={t('sheet.externalSheet')}
                aria-label={t('sheet.externalSheet')}
              >
                <IconLink />
              </a>
            )}
          </h1>
        </div>
        <div className="identity-row muted">
          {identity.lineage || identity.family || identity.rolePath ? (
            <>
              {identity.lineage && (
                <span>
                  {identity.lineage}
                  {identity.majorPath === 'lineage' && <IconDiamond className="diamond-icon" />}
                </span>
              )}
              {identity.lineage && (identity.family || identity.rolePath) ? ' · ' : null}
              {identity.family && (
                <span>
                  {identity.family}
                  {identity.majorPath === 'family' && <IconDiamond className="diamond-icon" />}
                </span>
              )}
              {identity.family && identity.rolePath ? ' · ' : null}
              {identity.rolePath}
            </>
          ) : (
            '—'
          )}
        </div>
        {identity.concept && <div className="identity-row muted">{identity.concept}</div>}
        {goalsFold}
      </section>
    );
  }

  return (
    <section className="card identity" style={leftBorderStyle(cssHex(character.embedColor))}>
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
          <span className="field-label field-label-check">
            <input
              type="checkbox"
              className="diamond-check"
              checked={identity.majorPath === 'lineage'}
              onChange={setMajorPath('lineage')}
              aria-label={`${t('sheet.majorPath')}: ${t('sheet.lineage')}`}
            />
            <FieldLabel i18nKey="sheet.lineage" en="Lineage" />
          </span>
          <input defaultValue={identity.lineage} onBlur={setIdentity('lineage')} />
        </label>
        <label className="field grow">
          <span className="field-label field-label-check">
            <input
              type="checkbox"
              className="diamond-check"
              checked={identity.majorPath === 'family'}
              onChange={setMajorPath('family')}
              aria-label={`${t('sheet.majorPath')}: ${t('sheet.family')}`}
            />
            <FieldLabel i18nKey="sheet.family" en="Family" />
          </span>
          <input defaultValue={identity.family} onBlur={setIdentity('family')} />
        </label>
        <label className="field grow">
          <span className="field-label">{t('sheet.rolePath')}</span>
          <input defaultValue={identity.rolePath} onBlur={setIdentity('rolePath')} />
        </label>
      </div>
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.concept')}</span>
          <input defaultValue={identity.concept} onBlur={setIdentity('concept')} />
        </label>
      </div>
      {goalsFold}
      <div className="form-row">
        <label className="field grow">
          <span className="field-label">{t('sheet.externalSheet')}</span>
          <input
            type="url"
            placeholder="https://…"
            defaultValue={character.externalSheetUrl}
            onBlur={(e) => patch({ externalSheetUrl: e.target.value.trim() })}
          />
        </label>
      </div>
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
        <span className="color-field-row">
          <input
            type="color"
            aria-label={t('sheet.embedColor')}
            value={pickerValue(character.embedColor, theme.bg2)}
            onChange={(e) => patch({ embedColor: e.target.value })}
          />
          <input
            key={character.embedColor}
            className="color-input"
            aria-label={t('sheet.embedColor')}
            placeholder="#5B4B8A"
            defaultValue={character.embedColor}
            onBlur={(e) => patch({ embedColor: e.target.value.trim() })}
          />
        </span>
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

  // Only the momentum counter itself is sendable — not entanglement or
  // curse dice — so only that row gets the overlay/highlight below.
  const sendable = useSendableCard({
    webhookUrl: character.webhookUrl,
    embedColor: character.embedColor,
    title: character.showNameInWebhook ? character.name : '',
    buildContent: () => `${t('sheet.momentum')} ${character.momentum}`,
  });

  const entanglementDots = (
    <Dots
      value={identity.entanglement}
      max={MAX_ENTANGLEMENT}
      editable={editing}
      onSet={(n) => {
        // Entanglement can never drop below 1.
        const clamped = Math.max(1, n);
        patch({
          identity: { ...identity, entanglement: clamped },
          // Lowering entanglement shrinks curse capacity too.
          curseDice: Math.min(character.curseDice, curseDiceCap(clamped)),
        });
      }}
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

  // The send overlay only applies outside edit mode — while editing this
  // card, its dots/checkbox need real clicks, not a click-to-send capture.
  const sendableHere = sendable.active && !editing;

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
      {!character.hideMomentum && (
        <div className={`curse-row ${sendableHere ? 'sendable-active' : ''}`}>
          <span className="field-label">
            <FieldLabel i18nKey="sheet.momentum" en="Momentum" />
          </span>
          <Counter
            value={character.momentum}
            onChange={(n) => patch({ momentum: n })}
            ariaLabel={t('sheet.momentum')}
          />
          {sendableHere && (
            <div className="sendable-overlay" onClick={sendable.openConfirm}>
              <SendConfirmPopover
                confirm={sendable.confirm}
                popoverRef={sendable.popoverRef}
                cancel={sendable.cancel}
                send={sendable.send}
                status={sendable.status}
                error={sendable.error}
              />
            </div>
          )}
        </div>
      )}
      {editing && (
        <label className="field-check momentum-hide-toggle">
          <input
            type="checkbox"
            checked={character.hideMomentum}
            onChange={(e) => patch({ hideMomentum: e.target.checked })}
          />
          <span>{t('sheet.hideMomentum')}</span>
        </label>
      )}
    </section>
  );
}

export function InjuryCard({
  character,
  template,
  variant = 'full',
  editing = false,
}: {
  character: Character;
  template: SystemTemplate;
  variant?: 'full' | 'compact';
  editing?: boolean;
}) {
  const { t } = useTranslation();
  const lang = useLang();
  const patch = useCharacterStore((s) => s.patch);
  const { injuries, armor } = character;

  const levels = template.injuryTrack?.levels;
  // Taken Out is tracked independently (injuries.takenOut) rather than as
  // the last box of the cumulative fill, so it can be marked without first
  // filling every level before it.
  const trackLevels = levels?.filter((l) => !l.terminal) ?? [];
  const terminalLevel = levels?.find((l) => l.terminal);
  // Extra boxes apply to the first (least severe) structured level —
  // Bloodied, for Curseborne — on top of the template's own count.
  const levelBoxes = (level: InjuryLevel, index: number) =>
    index === 0 ? level.boxes + injuries.extraBoxes : level.boxes;

  const total = levels?.length
    ? trackLevels.reduce((sum, l, i) => sum + levelBoxes(l, i), 0)
    : injuries.boxes;
  const marked = Math.min(injuries.marked, total);

  // Which structured level the deepest marked box currently falls in, for
  // the sendable summary — mirrors the "lit" level highlighted below.
  const currentLevelLabel = (() => {
    let offset = 0;
    for (const [i, level] of trackLevels.entries()) {
      const start = offset;
      offset += levelBoxes(level, i);
      if (marked > start && marked <= offset) return label(level.label, lang);
    }
    return undefined;
  })();

  const sendable = useSendableCard({
    webhookUrl: character.webhookUrl,
    embedColor: character.embedColor,
    title: character.showNameInWebhook ? character.name : '',
    buildContent: () =>
      [
        `${t('sheet.injuries')} ${marked}/${total}`,
        currentLevelLabel,
        injuries.takenOut && terminalLevel && label(terminalLevel.label, lang),
      ]
        .filter(Boolean)
        .join(' · '),
  });
  const sendableHere = sendable.active && !editing;

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
    patch({ armor: { ...armor, rating, marked: Math.min(armorMarked, rating) } });
  };
  const armorBox = (absIndex: number) => {
    const isMarked = absIndex < armorMarked;
    const position = absIndex + 1;
    return (
      <button
        key={absIndex}
        className={`armor-box ${isMarked ? 'marked' : ''}`}
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
      <div className="stat-track-row-head">
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
      {!compact &&
        (editing ? (
          <input
            className="grow"
            placeholder={t('sheet.notePlaceholder')}
            defaultValue={armor.note}
            onBlur={(e) => patch({ armor: { ...armor, note: e.target.value } })}
          />
        ) : (
          armor.note.trim() && <p className="muted item-card-desc">{armor.note}</p>
        ))}
    </div>
  );

  // Compact (Gear tab): inline in the tracker line, same as the fill groups.
  const takenOutRow = terminalLevel && (
    <div className={`injury-level terminal thin ${injuries.takenOut ? 'lit' : ''}`}>
      <div className="injury-boxes">
        {Array.from({ length: terminalLevel.boxes }, (_, i) => takenOutBox(i))}
      </div>
      <span className="injury-level-label">
        <L l10n={terminalLevel.label} />
      </span>
    </div>
  );

  // Full: in the card's header corner instead of its own line below the
  // track, so it reads as this card's own status flag, not another group.
  const takenOutCorner = terminalLevel && (
    <div className={`injury-level terminal taken-out-corner ${injuries.takenOut ? 'lit' : ''}`}>
      <span className="injury-level-label">
        <L l10n={terminalLevel.label} />
      </span>
      <div className="injury-boxes">
        {Array.from({ length: terminalLevel.boxes }, (_, i) => takenOutBox(i))}
      </div>
    </div>
  );

  if (levels?.length) {
    let offset = 0;
    const groups = trackLevels.map((level, i) => {
      const boxes = levelBoxes(level, i);
      const start = offset;
      offset += boxes;
      // Only the current severity is lit: the level holding the deepest
      // marked box. Shallower levels dim again as damage progresses.
      const lit = marked > start && marked <= offset;
      return (
        <div
          key={start}
          className={`injury-level ${lit ? 'lit' : ''} ${variant === 'compact' ? 'thin' : ''}`}
        >
          <div className="injury-boxes">
            {Array.from({ length: boxes }, (_, j) => box(start + j))}
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
      <section
        className={`card ${injuries.takenOut ? 'taken-out' : ''} ${sendableHere ? 'sendable-active' : ''}`}
      >
        <div className="item-card-head">
          <h2>
            <FieldLabel i18nKey="sheet.injuries" en="Injuries" />
          </h2>
          {takenOutCorner}
        </div>
        {armorRow}
        {editing && trackLevels[0] && (
          <div className="form-row">
            <Stepper
              label={
                <>
                  <L l10n={trackLevels[0].label} /> {t('sheet.extraBoxes')}
                </>
              }
              ariaLabel={t('sheet.extraBoxes')}
              value={injuries.extraBoxes}
              onChange={(n) => patch({ injuries: { ...injuries, extraBoxes: Math.max(0, n) } })}
            />
          </div>
        )}
        <div className="injury-track grouped">{groups}</div>
        {sendableHere && (
          <div className="sendable-overlay" onClick={sendable.openConfirm}>
            <SendConfirmPopover
              confirm={sendable.confirm}
              popoverRef={sendable.popoverRef}
              cancel={sendable.cancel}
              send={sendable.send}
              status={sendable.status}
              error={sendable.error}
            />
          </div>
        )}
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

/** A single row within a RatedListCard: read-only, or an inline edit form when opened. */
function RatedItemRow({
  item,
  index,
  editing,
  onSave,
  onRemove,
  dragHandleProps,
  dragItemProps,
}: {
  item: RatedItem;
  index: number;
  editing: boolean;
  onSave: (item: RatedItem) => void;
  onRemove: () => void;
  dragHandleProps: ReturnType<typeof useDragReorder<RatedItem>>['handleProps'];
  dragItemProps: ReturnType<typeof useDragReorder<RatedItem>>['itemProps'];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [note, setNote] = useState(item.note ?? '');

  const save = () => {
    if (!name.trim()) return;
    onSave({ ...item, name: name.trim(), note: note.trim() || undefined });
    setOpen(false);
  };

  const drag = dragItemProps(index);

  if (editing && open) {
    return (
      <li className={`named-item named-item-editing ${drag.className}`} data-drag-index={index}>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </div>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('sheet.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </div>
        <div className="form-row">
          <button className="primary" onClick={save}>
            {t('sheet.save')}
          </button>
          <button onClick={() => setOpen(false)}>{t('common.cancel')}</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`named-item ${drag.className}`} data-drag-index={index}>
      <div className="named-item-row">
        {editing && <span className="drag-handle" {...dragHandleProps(index)} />}
        <span className="named-name">{item.name}</span>
        <Dots value={item.dots} editable={editing} onSet={(n) => onSave({ ...item, dots: n })} />
        {editing && (
          <div className="item-card-actions">
            <button
              className="chip ghost"
              aria-label={`edit ${item.name}`}
              onClick={() => setOpen(true)}
            >
              <IconEdit />
            </button>
            <button className="chip ghost" aria-label={`remove ${item.name}`} onClick={onRemove}>
              <IconClose />
            </button>
          </div>
        )}
      </div>
      {item.note && <p className="muted item-card-desc named-item-note">{item.note}</p>}
    </li>
  );
}

/** A user-managed list of named entries with dot ratings (edges, paths, contacts, bonds). */
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
  const { handleProps, itemProps } = useDragReorder(items, onChange);

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
        {items.map((item, i) => (
          <RatedItemRow
            key={item.id}
            item={item}
            index={i}
            editing={editing}
            onSave={(updated) =>
              onChange(items.map((x) => (x.id === item.id ? updated : x)))
            }
            onRemove={() => onChange(items.filter((x) => x.id !== item.id))}
            dragHandleProps={handleProps}
            dragItemProps={itemProps}
          />
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
              <IconClose />
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
              pathSkill={!!character.pathSkills[stat.id]}
              onTogglePathSkill={() =>
                patch({
                  pathSkills: {
                    ...character.pathSkills,
                    [stat.id]: !character.pathSkills[stat.id],
                  },
                })
              }
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
              {(attributesByCategory(template).get(cat.id) ?? [])
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
        <InjuryCard character={character} template={template} editing={editing} />
        <ConditionsCard character={character} />
      </div>

      <div className="two-col">
        <RatedListCard
          title={<FieldLabel i18nKey="sheet.edges" en="Edges" />}
          items={character.edges}
          editing={editing}
          onChange={(edges) => patch({ edges })}
        />
        <MotifsCard character={character} editing={editing} />
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
            className="torment-field inheritance-field"
            rows={4}
            placeholder={t('sheet.tormentPlaceholder')}
            defaultValue={character.inheritance1}
            onBlur={(e) => patch({ inheritance1: e.target.value })}
          />
          <textarea
            className="torment-field inheritance-field"
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
