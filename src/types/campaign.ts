/**
 * GM-side campaign sheet: a set of adversary templates (freeform Curseborne
 * NPC stat blocks) and the live instances a GM drops onto the table during
 * play. Unlike {@link Character}, adversaries don't use the fixed
 * attribute/skill grid — Curseborne's NPC rules use a much smaller set of
 * pools and traits instead.
 */
import type { CharacterTrick, ConditionItem } from './character';

/** A single adversary's stat block, per the Curseborne NPC rules. */
export interface AdversaryStats {
  primaryPool: number;
  secondaryPool: number;
  /**
   * Free-text reference note — nothing applies this automatically. Like a
   * character's Enhancement, it's added by hand after the dice are seen,
   * so it isn't a plain number plugged into the roll.
   */
  enhancement: string;
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
    enhancement: '',
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
 * One adversary dropped onto the table. Its stats are copied from a template
 * at add-time — a GM's own snapshot to fill in the fiddly numbers quickly —
 * and independent from then on: editing the template later doesn't touch
 * cards already on the table.
 */
export interface AdversaryInstance {
  id: string;
  label: string;
  stats: AdversaryStats;
  /** Ad-hoc dice pool for a one-off roll that doesn't fit the template's pools. */
  customPool: number;
  /** Small free-text note, local to this card. */
  memo: string;
  /** Status-effect tags currently affecting this adversary. */
  conditions: ConditionItem[];
  /** Boxes filled on the injury track; capped at this card's stats.injuryBoxes. */
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

/** Envelope used for JSON export/import so files are self-describing. */
export interface CampaignExport {
  format: 'mejiro-campaign';
  version: 1;
  campaign: Campaign;
}
