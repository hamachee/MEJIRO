import type { SystemTemplate } from '../types/template';
import type { CharacterTrick } from '../types/character';
import type { RollRequest, RollResult } from '../types/roll';
import { hasCurseHit } from './roll';
import { label } from '../lib/localize';

/** Localised strings for Discord embeds, independent of the UI language. */
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    roll: 'Roll',
    pool: 'Pool',
    dice: 'Dice',
    successes: 'Hits',
    difficulty: 'Difficulty',
    result: 'Result',
    success: '✅ Success',
    failure: '❌ Failure',
    wicked: '😈 Wicked Success',
    cruel: '🩸 Cruel Failure',
    botch: '💀 Botch',
    threshold: 'Extra hits',
    enhancement: 'Enhancement',
    curseDice: 'Curse dice',
    complication: 'Complication',
    complicationResolved: 'Complication resolved',
    minor: 'Minor',
    moderate: 'Moderate',
    major: 'Major',
    tricks: 'Tricks purchased',
    spent: 'Spent',
    remaining: 'Remaining',
  },
  ko: {
    roll: '굴림',
    pool: '풀',
    dice: '주사위',
    successes: '히트',
    difficulty: '난이도',
    result: '결과',
    success: '✅ 성공',
    failure: '❌ 실패',
    wicked: '😈 사악한 성공',
    cruel: '🩸 잔혹한 실패',
    botch: '💀 대실패',
    threshold: '초과 히트',
    enhancement: '강화',
    curseDice: '저주 주사위',
    complication: '컴플리케이션',
    complicationResolved: '컴플리케이션 해소',
    minor: '경미',
    moderate: '보통',
    major: '심각',
    tricks: '구매한 트릭',
    spent: '사용',
    remaining: '잔여',
  },
};

function s(lang: string, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

const THEME_COLOR = 0x5b4b8a;

export interface DiscordContext {
  webhookUrl: string;
  lang: string;
  characterName: string;
}

/**
 * Format the dice as a compact string, marking hits in bold and curse dice
 * with a skull so the table can adjudicate their effects.
 */
function formatDice(result: RollResult): string {
  return result.dice
    .map((d) => {
      const n = d.successes > 0 ? `**${d.value}**` : `${d.value}`;
      return d.isCurse ? `💀${n}` : n;
    })
    .join(', ');
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

  const fields = [
    { name: s(lang, 'pool'), value: poolParts.join(' + ') || '—', inline: false },
    { name: s(lang, 'dice'), value: formatDice(result) || '—', inline: false },
    {
      name: s(lang, 'successes'),
      value: `${result.totalSuccesses}`,
      inline: true,
    },
    {
      name: s(lang, 'difficulty'),
      value: `${result.difficulty}`,
      inline: true,
    },
    {
      name: s(lang, 'threshold'),
      value: `${result.thresholdSuccesses}`,
      inline: true,
    },
  ];
  if (result.curseDice > 0) {
    fields.push({
      name: s(lang, 'curseDice'),
      value: `${result.curseDice}`,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: `${ctx.characterName} — ${s(lang, 'roll')}`,
        description: `**${outcome}**`,
        color: result.botched ? 0x8a1a1a : result.passed ? THEME_COLOR : 0x555555,
        fields,
        footer: { text: label(template.name, lang) },
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
export function buildTricksEmbed(
  template: SystemTemplate,
  purchase: PurchaseSummary,
  ctx: DiscordContext,
) {
  const { lang } = ctx;
  const { tricks, budget, enhancement, complication } = purchase;
  const spent =
    tricks.reduce((sum, t) => sum + t.cost, 0) + (complication ?? 0);
  const lines = tricks.map((t) => `• ${t.name} (${t.cost})`);
  if (complication) {
    const sev = s(lang, SEVERITY_KEYS[complication] ?? 'minor');
    lines.unshift(`• ${s(lang, 'complicationResolved')}: ${sev} (${complication})`);
  }

  const fields = [
    { name: s(lang, 'spent'), value: `${spent}`, inline: true },
    { name: s(lang, 'remaining'), value: `${budget - spent}`, inline: true },
  ];
  if (enhancement > 0) {
    fields.unshift({
      name: s(lang, 'enhancement'),
      value: `+${enhancement}`,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: `${ctx.characterName} — ${s(lang, 'tricks')}`,
        description: lines.join('\n') || '—',
        color: THEME_COLOR,
        fields,
        footer: { text: label(template.name, lang) },
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
  template: SystemTemplate,
  purchase: PurchaseSummary,
  ctx: DiscordContext,
): Promise<void> {
  return post(ctx.webhookUrl, buildTricksEmbed(template, purchase, ctx));
}
