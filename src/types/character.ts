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
  /** Entanglement rating (dots). */
  entanglement: number;
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

/**
 * A trick the player may buy with extra hits after a roll. User-entered
 * (name + cost) so no rulebook content ships with the app; new characters
 * are seeded with generic "one/two/three hit trick" placeholders.
 */
export interface CharacterTrick {
  id: string;
  name: string;
  cost: number;
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
  attributes: Record<string, number>;
  skills: Record<string, number>;
  edges: RatedItem[];
  paths: RatedItem[];
  conditions: ConditionItem[];
  tricks: CharacterTrick[];
  injuries: InjuryTrack;
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
