import type { SystemTemplate } from '../types/template';
import type { RollRequest, RollResult } from '../types/roll';
import { hasCurseHit } from './roll';
import { label } from '../lib/localize';

/** Localised strings for Discord embeds, independent of the UI language. */
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    difficulty: 'Difficulty',
    success: 'Success',
    failure: 'Failure',
    wicked: 'Wicked Success',
    cruel: 'Cruel Failure',
    botch: 'Botch',
    enhancement: 'Enhancement',
    bonusDice: 'Bonus dice',
    complication: 'Complication',
    complicationResolved: 'Complication resolved',
    minor: 'Minor',
    moderate: 'Moderate',
    major: 'Major',
    spent: 'Spent',
    remaining: 'Remaining',
  },
  ko: {
    difficulty: '난이도',
    success: '성공',
    failure: '실패',
    wicked: '사악한 성공',
    cruel: '잔혹한 실패',
    botch: '대실패',
    enhancement: '강화',
    bonusDice: '추가 주사위',
    complication: '컴플리케이션',
    complicationResolved: '컴플리케이션 해소',
    minor: '경미',
    moderate: '보통',
    major: '중대',
    spent: '사용',
    remaining: '잔여',
  },
};

function s(lang: string, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Localised "N hit(s)" — Korean uses a fixed unit word, no plural form. */
function hitsLabel(lang: string, n: number): string {
  return lang === 'ko' ? `${n} 히트` : `${n} hit${n === 1 ? '' : 's'}`;
}

const THEME_COLOR = 0x5b4b8a;

/**
 * Parse a hex color like "#5B4B8A" or "5b4b8a" (3- or 6-digit) into a
 * Discord embed color integer. Returns undefined for empty/invalid input,
 * so callers can fall back to their own default with `??`.
 */
export function parseHexColor(hex: string | undefined): number | undefined {
  const stripped = hex?.trim().replace(/^#/, '');
  if (!stripped) return undefined;
  if (/^[0-9a-fA-F]{3}$/.test(stripped)) {
    return parseInt(
      stripped
        .split('')
        .map((c) => c + c)
        .join(''),
      16,
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(stripped)) return parseInt(stripped, 16);
  return undefined;
}

export interface DiscordContext {
  webhookUrl: string;
  lang: string;
  characterName: string;
  /** Identity color override, e.g. "#5B4B8A" — falls back to the outcome-based color when unset/invalid. */
  color?: string;
}

/**
 * Format the dice as a compact string, curse dice first and regular dice
 * after. Curse dice are bracketed behind a "→" so the table can spot them
 * without an emoji marker. Hits are bolded within each group.
 */
function formatDice(result: RollResult): string {
  const format = (dice: RollResult['dice']) =>
    dice.map((d) => (d.successes > 0 ? `**${d.value}**` : `${d.value}`)).join(', ');
  const curse = result.dice.filter((d) => d.isCurse);
  const regular = result.dice.filter((d) => !d.isCurse);
  return curse.length > 0
    ? `→ [ ${format(curse)} ] ${format(regular)}`
    : format(regular);
}

/** Build the roll-result embed payload. */
export function buildRollEmbed(
  template: SystemTemplate,
  request: RollRequest,
  result: RollResult,
  ctx: DiscordContext,
) {
  const { lang } = ctx;
  const attr =
    template.attributes.find((a) => a.id === request.attributeId);
  const skill = template.skills.find((sk) => sk.id === request.skillId);
  // Non-English stat names are unofficial translations; keep the English
  // original alongside so everyone at the table recognises the roll.
  const statName = (l10n: Parameters<typeof label>[0]) => {
    const localized = label(l10n, lang);
    return l10n.en && l10n.en !== localized
      ? `${localized} (${l10n.en})`
      : localized;
  };
  const poolParts = [
    skill ? `${statName(skill.label)} ${request.skillRating}` : null,
    attr ? `${statName(attr.label)} ${request.attributeRating}` : null,
    request.bonusDice > 0 ? `${s(lang, 'bonusDice')} +${request.bonusDice}` : null,
    request.enhancement > 0
      ? `${s(lang, 'enhancement')} +${request.enhancement}`
      : null,
  ].filter(Boolean);

  // A curse hit tints the outcome: wicked success / cruel failure.
  const curseHit = hasCurseHit(result);
  const outcome = result.botched
    ? s(lang, 'botch')
    : result.passed
      ? s(lang, curseHit ? 'wicked' : 'success')
      : s(lang, curseHit ? 'cruel' : 'failure');

  const poolLine = `${poolParts.join(' + ') || '—'}\n${formatDice(result) || '—'}`;
  const hitsLine = `${hitsLabel(lang, result.totalSuccesses)} vs ${s(lang, 'difficulty')} ${result.difficulty} = *${outcome}*`;

  return {
    embeds: [
      {
        title: ctx.characterName || undefined,
        description: `${poolLine}\n${hitsLine}`,
        color:
          parseHexColor(ctx.color) ??
          (result.botched ? 0x8a1a1a : result.passed ? THEME_COLOR : 0x555555),
      },
    ],
  };
}

/** Context for an adversary roll embed — no attribute/skill lookup, just a pool label. */
export interface AdversaryRollContext {
  webhookUrl: string;
  lang: string;
  instanceLabel: string;
  poolLabel: string;
  /** Identity color override, e.g. "#5B4B8A" — falls back to the outcome-based color when unset/invalid. */
  color?: string;
}

/** Build the roll-result embed for an adversary (GM page) roll. */
export function buildAdversaryRollEmbed(
  request: RollRequest,
  result: RollResult,
  ctx: AdversaryRollContext,
) {
  const { lang } = ctx;
  const poolParts = [
    `${ctx.poolLabel} ${request.skillRating}`,
    request.bonusDice > 0 ? `${s(lang, 'bonusDice')} +${request.bonusDice}` : null,
    request.enhancement > 0
      ? `${s(lang, 'enhancement')} +${request.enhancement}`
      : null,
  ].filter(Boolean);

  const curseHit = hasCurseHit(result);
  const outcome = result.botched
    ? s(lang, 'botch')
    : result.passed
      ? s(lang, curseHit ? 'wicked' : 'success')
      : s(lang, curseHit ? 'cruel' : 'failure');

  const poolLine = `${poolParts.join(' + ') || '—'}\n${formatDice(result) || '—'}`;
  const hitsLine = `${hitsLabel(lang, result.totalSuccesses)} vs ${s(lang, 'difficulty')} ${result.difficulty} = *${outcome}*`;

  return {
    embeds: [
      {
        title: ctx.instanceLabel || undefined,
        description: `${poolLine}\n${hitsLine}`,
        color:
          parseHexColor(ctx.color) ??
          (result.botched ? 0x8a1a1a : result.passed ? THEME_COLOR : 0x555555),
      },
    ],
  };
}

/** Post an adversary roll result to the campaign's Discord webhook. */
export function postAdversaryRoll(
  request: RollRequest,
  result: RollResult,
  ctx: AdversaryRollContext,
): Promise<void> {
  return post(ctx.webhookUrl, buildAdversaryRollEmbed(request, result, ctx));
}

/** A trick purchase line: its resolved (already-numeric) hit cost, not the trick's own definition. */
export interface PurchasedTrick {
  name: string;
  cost: number;
}

/** What the player did with their extra hits after the roll. */
export interface PurchaseSummary {
  tricks: PurchasedTrick[];
  /** Extra-hit budget after post-roll enhancement. */
  budget: number;
  /** Enhancement added during the purchase phase (already in `budget`). */
  enhancement: number;
  /** Complication severity bought off (1-3), if any. */
  complication?: number;
}

const SEVERITY_KEYS: Record<number, string> = {
  1: 'minor',
  2: 'moderate',
  3: 'major',
};

/** Build the tricks-purchased embed payload (stage two). */
export function buildTricksEmbed(purchase: PurchaseSummary, ctx: DiscordContext) {
  const { lang } = ctx;
  const { tricks, budget, enhancement, complication } = purchase;
  const spent =
    tricks.reduce((sum, t) => sum + t.cost, 0) + (complication ?? 0);
  const lines = tricks.map((t) => `• ${t.name} (${t.cost})`);
  if (complication) {
    const sev = s(lang, SEVERITY_KEYS[complication] ?? 'minor');
    lines.unshift(`• ${s(lang, 'complicationResolved')} (${sev}, -${complication})`);
  }

  const previousHits = budget - enhancement;
  const summaryParts = [
    hitsLabel(lang, previousHits),
    enhancement > 0 ? `${s(lang, 'enhancement')} +${enhancement}` : null,
    `${s(lang, 'spent')} ${spent}`,
    `${s(lang, 'remaining')} ${budget - spent}`,
  ].filter(Boolean);

  return {
    embeds: [
      {
        title: ctx.characterName || undefined,
        description: `${lines.join('\n') || '—'}\n${summaryParts.join(' · ')}`,
        color: parseHexColor(ctx.color) ?? THEME_COLOR,
      },
    ],
  };
}

/** POST a payload to a Discord webhook. Discord webhooks permit browser CORS. */
async function post(webhookUrl: string, payload: unknown): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord webhook failed: ${res.status} ${text}`.trim());
  }
}

/** Post a formatted roll result (stage one). */
export function postRollResult(
  template: SystemTemplate,
  request: RollRequest,
  result: RollResult,
  ctx: DiscordContext,
): Promise<void> {
  return post(ctx.webhookUrl, buildRollEmbed(template, request, result, ctx));
}

/** Post the purchase-phase summary (stage two). */
export function postTricks(
  purchase: PurchaseSummary,
  ctx: DiscordContext,
): Promise<void> {
  return post(ctx.webhookUrl, buildTricksEmbed(purchase, ctx));
}

/**
 * Post a free-form message as an embed — Discord renders its own markdown
 * in the description, this app adds none. A color that fails to parse (or
 * isn't given) leaves the embed's `color` unset, so Discord shows it with
 * no accent border rather than silently falling back to the app's own
 * brand color.
 */
export function postEmbedMessage(
  webhookUrl: string,
  title: string,
  content: string,
  color?: string,
): Promise<void> {
  const parsedColor = parseHexColor(color);
  return post(webhookUrl, {
    embeds: [
      {
        title: title.trim() || undefined,
        description: content,
        ...(parsedColor !== undefined ? { color: parsedColor } : {}),
      },
    ],
  });
}
