/** A single change applied to a resource, kept so it can be undone. */
export interface ResourceChange {
  /** Signed delta applied (e.g. -3 for damage). */
  delta: number;
  /** Value after the change was applied. */
  after: number;
  /** Epoch ms when the change happened. */
  at: number;
}

/** A tracked resource's live value plus its change log for undo. */
export interface ResourceState {
  value: number;
  log: ResourceChange[];
}

/** Who the character is, beyond numbers. All free text — the user fills it in. */
export interface Identity {
  lineage: string;
  family: string;
  concept: string;
  /** Entanglement rating (dots). */
  entanglement: number;
  rolePath: string;
  shortTerm1: string;
  shortTerm2: string;
  longTerm: string;
  /** Free-form motifs, multi-line. */
  motifs: string;
}

/** The Entanglement rating cap in the core rules. */
export const MAX_ENTANGLEMENT = 4;

/**
 * How many curse dice a character can hold at a given Entanglement:
 * • = 5, •• / ••• = 7, •••• = 9.
 */
export function curseDiceCap(entanglement: number): number {
  if (entanglement >= 4) return 9;
  if (entanglement >= 2) return 7;
  return 5;
}

/** A user-entered named entry with a dot rating (edges, paths). */
export interface RatedItem {
  id: string;
  name: string;
  dots: number;
}

/** A user-entered condition currently affecting the character. */
export interface ConditionItem {
  id: string;
  name: string;
}

/** A piece of equipment. Tags stack like conditions do. */
export interface GearItem {
  id: string;
  name: string;
  type?: string;
  tags: string[];
  description?: string;
}

/** A spell. Cost is plain text (rules costs aren't always numbers). */
export interface SpellItem {
  id: string;
  name: string;
  cost?: string;
  attunements: string[];
  /** Free-form advancements, multi-line. */
  advancements?: string;
}

/**
 * A trick the player may buy with extra hits after a roll. User-entered
 * (name + cost) so no rulebook content ships with the app; new characters
 * are seeded with generic "one/two/three hit trick" placeholders.
 */
export interface CharacterTrick {
  id: string;
  name: string;
  cost: number;
  /** Optional user-written note, shown folded under the trick name. */
  description?: string;
}

/** The injury track: a row of boxes, marked left to right, plus Taken Out. */
export interface InjuryTrack {
  /** Total number of boxes (user-adjustable). */
  boxes: number;
  /** How many boxes are currently marked. */
  marked: number;
  takenOut: boolean;
}

/**
 * Armor: an independent box track, separate from the injury track. Rating
 * (box count) is a dynamic stat the player adjusts with +/-; 0 means no
 * boxes are shown. Marking follows the same fill convention as everything
 * else, but is tracked on its own — it doesn't interact with injuries.
 */
export interface ArmorTrack {
  rating: number;
  marked: number;
}

/**
 * A character sheet. `attributes` and `skills` map stat id -> dots/rating.
 * `resources` maps resource id -> its live state. All storage is local
 * (IndexedDB); nothing leaves the browser unless exported.
 */
export interface Character {
  id: string;
  templateId: string;
  name: string;
  identity: Identity;
  /**
   * Discord webhook this sheet posts to. Per-character so each game/channel
   * pairs with its own sheet. Stripped from JSON exports — a webhook URL
   * grants posting access to the channel and must not travel with shared
   * sheets.
   */
  webhookUrl: string;
  /**
   * Whether roll/tricks messages include the character name in the embed
   * title. Off by default makes sense when the webhook itself is already
   * named/avatared for this character (a GM can hand out a separate
   * webhook per character), so the name would just be redundant.
   */
  showNameInWebhook: boolean;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  edges: RatedItem[];
  paths: RatedItem[];
  contacts: RatedItem[];
  bonds: RatedItem[];
  conditions: ConditionItem[];
  /** Page 2: equipment and spells, card-style. */
  gear: GearItem[];
  spells: SpellItem[];
  /** Free-form Torment notes. */
  torment: string;
  /** Free-form Damnation notes. */
  damnation: string;
  tricks: CharacterTrick[];
  injuries: InjuryTrack;
  armor: ArmorTrack;
  /**
   * Curse dice held right now. A persistent stat (like VtM hunger), edited
   * on the sheet as play changes it; each roll replaces this many pool dice.
   */
  curseDice: number;
  resources: Record<string, ResourceState>;
  createdAt: number;
  updatedAt: number;
}

/** Envelope used for JSON export/import so files are self-describing. */
export interface CharacterExport {
  format: 'mejiro-character';
  version: 1;
  character: Character;
}
