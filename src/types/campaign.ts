/**
 * GM-side campaign sheet: a set of adversary templates (freeform Curseborne
 * NPC stat blocks) and the live instances a GM drops onto the table during
 * play. Unlike {@link Character}, adversaries don't use the fixed
 * attribute/skill grid — Curseborne's NPC rules use a much smaller set of
 * pools and traits instead.
 */
import type { CharacterTrick } from './character';

/** A single adversary's stat block, per the Curseborne NPC rules. */
export interface AdversaryStats {
  primaryPool: number;
  secondaryPool: number;
  enhancement: number;
  defense: number;
  integrity: number;
  /** The injury track's box count — set independently of Defense/Integrity. */
  injuryBoxes: number;
  hasArmor: boolean;
  armorRating: number;
  /** Comma-separated tags, shown via TagChips. */
  armorTags: string;
  qualities: string;
  dreadPower: string;
  special: string;
}

/** Desperation pool: half of Primary, rounded down. Never stored — always derived. */
export function desperationPool(primaryPool: number): number {
  return Math.floor(Math.max(0, primaryPool) / 2);
}

/** A blank stat block for a newly created template. */
export function blankAdversaryStats(): AdversaryStats {
  return {
    primaryPool: 0,
    secondaryPool: 0,
    enhancement: 0,
    defense: 0,
    integrity: 0,
    injuryBoxes: 0,
    hasArmor: false,
    armorRating: 0,
    armorTags: '',
    qualities: '',
    dreadPower: '',
    special: '',
  };
}

/** A GM-authored adversary stat block, reusable across many instances. */
export interface AdversaryTemplate {
  id: string;
  name: string;
  stats: AdversaryStats;
}

/**
 * One adversary dropped onto the table. Stats aren't copied here — they're
 * looked up live via `templateId`, so editing a template updates every card
 * using it. Only per-instance play state (label, injuries) lives here.
 */
export interface AdversaryInstance {
  id: string;
  templateId: string;
  label: string;
  /** Small free-text note, local to this card (not shared via the template). */
  memo: string;
  /** Boxes filled on the injury track; capped at the linked template's injuryBoxes. */
  marked: number;
  takenOut: boolean;
}

/** A GM's campaign sheet: its adversary roster, playable at the table. */
export interface Campaign {
  id: string;
  name: string;
  /** Discord webhook this campaign posts adversary rolls to. */
  webhookUrl: string;
  /** If false, rolls wait for the GM to press "post" instead of posting immediately. */
  autoPostToDiscord: boolean;
  templates: AdversaryTemplate[];
  instances: AdversaryInstance[];
  /** The GM's own trick list, purchased with extra hits after an adversary roll. */
  tricks: CharacterTrick[];
  createdAt: number;
  updatedAt: number;
}
