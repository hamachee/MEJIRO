import type { SystemTemplate, Trick } from '../types/template';
import type { RollRequest, RollResult } from '../types/roll';
import { label } from '../lib/localize';

/** Localised strings for Discord embeds, independent of the UI language. */
const STRINGS: Record<string, Record<string, string>> = {
  en: {
    roll: 'Roll',
    pool: 'Pool',
    dice: 'Dice',
    successes: 'Successes',
    difficulty: 'Difficulty',
    result: 'Result',
    success: '✅ Success',
    failure: '❌ Failure',
    botch: '💀 Botch',
    threshold: 'Threshold successes',
    enhancement: 'Enhancement',
    tricks: 'Tricks purchased',
    spent: 'Spent',
    remaining: 'Remaining',
  },
  ko: {
    roll: '굴림',
    pool: '풀',
    dice: '주사위',
    successes: '성공',
    difficulty: '난이도',
    result: '결과',
    success: '✅ 성공',
    failure: '❌ 실패',
    botch: '💀 대실패',
    threshold: '초과 성공',
    enhancement: '강화',
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

/** Format the dice as a compact string, marking successes in bold. */
function formatDice(result: RollResult): string {
  return result.dice
    .map((d) => (d.successes > 0 ? `**${d.value}**` : `${d.value}`))
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
  const poolParts = [
    attr ? `${label(attr.label, lang)} ${request.attributeRating}` : null,
    skill ? `${label(skill.label, lang)} ${request.skillRating}` : null,
    request.enhancement > 0
      ? `${s(lang, 'enhancement')} +${request.enhancement}`
      : null,
  ].filter(Boolean);

  const outcome = result.botched
    ? s(lang, 'botch')
    : result.passed
      ? s(lang, 'success')
      : s(lang, 'failure');

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

/** Build the tricks-purchased embed payload (stage two). */
export function buildTricksEmbed(
  template: SystemTemplate,
  tricks: Trick[],
  budget: number,
  ctx: DiscordContext,
) {
  const { lang } = ctx;
  const spent = tricks.reduce((sum, t) => sum + t.cost, 0);
  const lines = tricks.map((t) => `• ${label(t.label, lang)} (${t.cost})`);
  return {
    embeds: [
      {
        title: `${ctx.characterName} — ${s(lang, 'tricks')}`,
        description: lines.join('\n') || '—',
        color: THEME_COLOR,
        fields: [
          { name: s(lang, 'spent'), value: `${spent}`, inline: true },
          {
            name: s(lang, 'remaining'),
            value: `${budget - spent}`,
            inline: true,
          },
        ],
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

/** Post the purchased tricks (stage two). */
export function postTricks(
  template: SystemTemplate,
  tricks: Trick[],
  budget: number,
  ctx: DiscordContext,
): Promise<void> {
  return post(ctx.webhookUrl, buildTricksEmbed(template, tricks, budget, ctx));
}
