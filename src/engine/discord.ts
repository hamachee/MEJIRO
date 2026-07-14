import type { SystemTemplate } from '../types/template';
import type { CharacterTrick } from '../types/character';
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
    complication: '컴플리케이션',
    complicationResolved: '컴플리케이션 해소',
    minor: '경미',
    moderate: '보통',
    major: '심각',
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

export interface DiscordContext {
  webhookUrl: string;
  lang: string;
  characterName: string;
}

/**
 * Format the dice as a compact string, curse dice first and regular dice
 * after, separated by "|" so the table can spot curse dice without an
 * emoji marker. Hits are bolded within each group.
 */
function formatDice(result: RollResult): string {
  const format = (dice: RollResult['dice']) =>
    dice.map((d) => (d.successes > 0 ? `**${d.value}**` : `${d.value}`)).join(', ');
  const curse = result.dice.filter((d) => d.isCurse);
  const regular = result.dice.filter((d) => !d.isCurse);
  return curse.length > 0
    ? `${format(curse)} | ${format(regular)}`
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
    attr ? `${statName(attr.label)} ${request.attributeRating}` : null,
    skill ? `${statName(skill.label)} ${request.skillRating}` : null,
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

  const poolLine = `${poolParts.join(' + ') || '—'} = ${formatDice(result) || '—'}`;
  const hitsLine = `${hitsLabel(lang, result.totalSuccesses)} vs ${s(lang, 'difficulty')} ${result.difficulty} = *${outcome}*`;

  return {
    embeds: [
      {
        title: ctx.characterName || undefined,
        description: `${poolLine}\n${hitsLine}`,
        color: result.botched ? 0x8a1a1a : result.passed ? THEME_COLOR : 0x555555,
      },
    ],
  };
}

/** What the player did with their extra hits after the roll. */
export interface PurchaseSummary {
  tricks: CharacterTrick[];
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
        color: THEME_COLOR,
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
