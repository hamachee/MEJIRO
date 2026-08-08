/**
 * Import/export for the individual lists on a sheet (tricks, gear, spells,
 * adversary templates), so a single list can travel between characters or
 * campaigns — e.g. a GM shares a trick catalogue without sharing a whole
 * sheet. Same self-describing envelope idea as {@link CharacterExport}.
 */
import { uid } from './uid';
import type { CharacterTrick, GearItem, SpellItem } from '../types/character';
import { blankAdversaryStats, type AdversaryTemplate } from '../types/campaign';
import type { MessageTemplate } from '../types/messageTemplate';

export type ListKind = 'tricks' | 'gear' | 'spells' | 'adversaries' | 'messageTemplates';

/** Envelope used for JSON list export/import so files are self-describing. */
export interface ListExport {
  format: 'mejiro-list';
  version: 1;
  kind: ListKind;
  items: unknown[];
}

/** Serialise a list to a portable JSON envelope. */
export function exportList(kind: ListKind, items: unknown[]): string {
  const envelope: ListExport = { format: 'mejiro-list', version: 1, kind, items };
  return JSON.stringify(envelope, null, 2);
}

/** Make a string safe to use as one dot-separated part of a filename. */
function filenamePart(s: string): string {
  return s.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'unknown';
}

/** Download a list as a MEJIRO.<kind>.<owner>.json file. */
export function exportListFile(kind: ListKind, items: unknown[], ownerName: string): void {
  const blob = new Blob([exportList(kind, items)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MEJIRO.${kind}.${filenamePart(ownerName)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The one field every list entry must carry to be usable at all. */
function entryName(raw: unknown): string {
  const name = (raw as { name?: unknown } | null)?.name;
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Every entry needs a name');
  }
  return name.trim();
}

function optionalText(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function tagList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * Per-kind entry normalisers. Each accepts a raw parsed entry (possibly from
 * a hand-edited file), fills in defaults like older-save normalisation does,
 * and assigns a fresh id so importing never collides with existing entries.
 */
export const normalizeEntry = {
  tricks(raw: unknown): CharacterTrick {
    const r = raw as Partial<CharacterTrick>;
    return {
      id: uid(),
      name: entryName(raw),
      cost: r.cost === 'variable' ? 'variable' : Math.max(1, Number(r.cost) || 1),
      description: optionalText(r.description),
    };
  },
  gear(raw: unknown): GearItem {
    const r = raw as Partial<GearItem>;
    return {
      id: uid(),
      name: entryName(raw),
      type: optionalText(r.type),
      tags: tagList(r.tags),
      description: optionalText(r.description),
      favorite: r.favorite === true,
    };
  },
  spells(raw: unknown): SpellItem {
    const r = raw as Partial<SpellItem>;
    return {
      id: uid(),
      name: entryName(raw),
      cost: optionalText(r.cost),
      attunements: tagList(r.attunements),
      effect: optionalText(r.effect),
      advancements: optionalText(r.advancements),
      favorite: r.favorite === true,
    };
  },
  adversaries(raw: unknown): AdversaryTemplate {
    const r = raw as Partial<AdversaryTemplate>;
    return {
      id: uid(),
      name: entryName(raw),
      drive: typeof r.drive === 'string' ? r.drive : '',
      stats: { ...blankAdversaryStats(), ...(typeof r.stats === 'object' ? r.stats : {}) },
    };
  },
  messageTemplates(raw: unknown): MessageTemplate {
    const r = raw as Partial<MessageTemplate>;
    if (typeof r.content !== 'string' || !r.content.trim()) {
      throw new Error('Every entry needs content');
    }
    return {
      id: uid(),
      title: typeof r.title === 'string' ? r.title : '',
      content: r.content,
      color: typeof r.color === 'string' ? r.color : '',
    };
  },
} as const;

/**
 * Parse an exported list JSON of the expected kind. Throws on an
 * unrecognised format or a file holding a different list kind.
 */
export function parseListImport<K extends ListKind>(
  json: string,
  kind: K,
): ReturnType<(typeof normalizeEntry)[K]>[] {
  const data = JSON.parse(json) as Partial<ListExport>;
  if (data.format !== 'mejiro-list' || !Array.isArray(data.items)) {
    throw new Error('Not a MEJIRO list file');
  }
  if (data.kind !== kind) {
    throw new Error(`This file holds a "${data.kind}" list, not "${kind}"`);
  }
  return data.items.map((item) => normalizeEntry[kind](item)) as ReturnType<
    (typeof normalizeEntry)[K]
  >[];
}
