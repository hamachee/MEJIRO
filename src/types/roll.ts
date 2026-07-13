import type { CharacterTrick } from './character';

/** A request to roll a pool. */
export interface RollRequest {
  /** Selected attribute id (contributes its rating to the pool). */
  attributeId: string | null;
  /** Selected skill id (contributes its rating to the pool). */
  skillId: string | null;
  /** Rating contributed by the attribute. */
  attributeRating: number;
  /** Rating contributed by the skill. */
  skillRating: number;
  /** Flat enhancement (added per the template's enhancementMode). */
  enhancement: number;
  /** Difficulty: number of hits required to pass. */
  difficulty: number;
  /** How many pool dice are curse dice (Curseborne). Clamped to pool size. */
  curseDice: number;
}

/** One die and whether/how much it counted. */
export interface DieResult {
  value: number;
  /** Hits this die yielded (0, 1, or 2 with doubles). */
  successes: number;
  /** True if this die was produced by an explosion. */
  exploded?: boolean;
  /** True if this die is a curse die (displayed distinctly). */
  isCurse?: boolean;
}

/** The outcome of a roll. */
export interface RollResult {
  dice: DieResult[];
  /** Number of dice in the base pool (before explosions). */
  poolSize: number;
  /** How many of the pool dice were curse dice. */
  curseDice: number;
  /** Hits from dice. */
  diceSuccesses: number;
  /** Flat hits added from enhancement (flatSuccess mode). */
  enhancementSuccesses: number;
  /** Total hits (dice + enhancement, botch applied). */
  totalSuccesses: number;
  difficulty: number;
  /** True when totalSuccesses >= difficulty. */
  passed: boolean;
  /** True when the roll botched (system-dependent). */
  botched: boolean;
  /** Hits beyond difficulty — the trick budget. */
  thresholdSuccesses: number;
}

/** A trick the player has chosen to purchase during the trick phase. */
export interface TrickPurchase {
  trick: CharacterTrick;
}

/** Result of validating a set of trick purchases against a budget. */
export interface PurchaseValidation {
  totalCost: number;
  remaining: number;
  valid: boolean;
}
