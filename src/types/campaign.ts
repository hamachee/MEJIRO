/**
 * GM-side campaign sheet: a set of adversary templates (freeform Curseborne
 * NPC stat blocks) and the live instances a GM drops onto the table during
 * play. Unlike {@link Character}, adversaries don't use the fixed
 * attribute/skill grid — Curseborne's NPC rules use a much smaller set of
 * pools and traits instead.
 */
import type { CharacterTrick, ConditionItem, GearItem, SpellItem } from './character';

/** A single adversary's stat block, per the Curseborne NPC rules. */
export interface AdversaryStats {
  primaryPool: number;
  secondaryPool: number;
  /** Free-text note on what the Primary pool represents — shown as a tooltip on its badge outside editing. */
  primaryPoolDesc: string;
  /** Free-text note on what the Secondary pool represents — shown as a tooltip on its badge outside editing. */
  secondaryPoolDesc: string;
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
    primaryPoolDesc: '',
    secondaryPoolDesc: '',
    enhancement: '',
    defense: 1,
    integrity: 1,
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
  /** Short motivation phrase (Curseborne's "Drive") — shown as hint text under the name, template list only. */
  drive: string;
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
  /** Small free-text note, local to this card. */
  memo: string;
  /** Status-effect tags currently affecting this adversary. */
  conditions: ConditionItem[];
  /** Boxes filled on the injury track; capped at this card's stats.injuryBoxes. */
  marked: number;
  /** Boxes filled on the armor track; capped at this card's stats.armorRating. */
  armorMarked: number;
  takenOut: boolean;
}

/**
 * A player character as the GM tracks it: a deliberately thin slice of the
 * real character sheet (name, lineage/family, the armor/injury track, status
 * tags, notes) plus GM-only fields like Initiative. Lives on the campaign,
 * not the player's own sheet — there is no data link between the two.
 */
export interface AccursedPC {
  id: string;
  name: string;
  lineage: string;
  family: string;
  armorRating: number;
  armorMarked: number;
  /**
   * Bloodied extension boxes (0-2) added at the front of the injury track.
   * The track's base shape isn't stored: it always follows the campaign
   * system template's injury levels, same as a real character sheet.
   */
  extraBoxes: number;
  /** Boxes filled on the injury track (extension included). */
  marked: number;
  takenOut: boolean;
  conditions: ConditionItem[];
  /** One-line note, shown on the deployed table card too. */
  note: string;
  /** Long free-form notes, PC tab only. */
  memo: string;
  /** Turn-order rating for the table's initiative sort. */
  initiative: number;
}

/**
 * A PC placed on the table. Unlike an adversary instance this holds no
 * copied stats — just a reference into {@link Campaign.pcs}, so the table
 * card and the PC tab always show the same live data.
 */
export interface PcInstance {
  id: string;
  pcId: string;
}

/** Anything occupying a card slot on the GM table, in display/turn order. */
export type TableCard = AdversaryInstance | PcInstance;

export function isPcInstance(card: TableCard): card is PcInstance {
  return 'pcId' in card;
}

/** A blank PC entry for the roster. */
export function blankAccursedPC(id: string, name: string): AccursedPC {
  return {
    id,
    name,
    lineage: '',
    family: '',
    armorRating: 0,
    armorMarked: 0,
    extraBoxes: 0,
    marked: 0,
    takenOut: false,
    conditions: [],
    note: '',
    memo: '',
    initiative: 0,
  };
}

/** A GM's campaign sheet: its adversary roster, playable at the table. */
export interface Campaign {
  id: string;
  name: string;
  /** Which {@link SystemTemplate} (by id) this campaign's adversary rules follow. */
  templateId: string;
  /** Discord webhook this campaign posts adversary rolls to. */
  webhookUrl: string;
  /** Hex color (e.g. "#5B4B8A") for this campaign's embed left border. Empty uses the app default. */
  embedColor: string;
  /**
   * If false, rolls wait for the GM to press "post" instead of posting
   * immediately. Surfaced in the GM roll bar inverted, as a "secret roll"
   * checkbox — checking it sets this to false.
   */
  autoPostToDiscord: boolean;
  /** Ad-hoc dice pool for a one-off roll that doesn't fit any adversary's pools — shared by the whole campaign. */
  customPool: number;
  /** Shared Momentum counter for the table. */
  momentum: number;
  templates: AdversaryTemplate[];
  instances: TableCard[];
  /** The GM's simplified PC roster (the Accursed tab). */
  pcs: AccursedPC[];
  /** The GM's own trick list, purchased with extra hits after an adversary roll. */
  tricks: CharacterTrick[];
  /** The GM's shared gear reference list (loot, table props, etc.). */
  gear: GearItem[];
  /** The GM's shared spell reference list. */
  spells: SpellItem[];
  /** Combat round shown by the table's turn tracker. */
  round: number;
  /** Table card (by id) whose turn it currently is; null between fights. */
  turnId: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Envelope used for JSON export/import so files are self-describing. */
export interface CampaignExport {
  format: 'mejiro-campaign';
  version: 1;
  campaign: Campaign;
}
