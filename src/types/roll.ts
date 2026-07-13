import type { Trick } from './template';

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
  /** Difficulty: number of successes required to pass. */
  difficulty: number;
}

/** One die and whether/how much it counted. */
export interface DieResult {
  value: number;
  /** Successes this die yielded (0, 1, or 2 with doubles). */
  successes: number;
  /** True if this die was produced by an explosion. */
  exploded?: boolean;
}

/** The outcome of a roll. */
export interface RollResult {
  dice: DieResult[];
  /** Number of dice in the base pool (before explosions). */
  poolSize: number;
  /** Successes from dice. */
  diceSuccesses: number;
  /** Flat successes added from enhancement (flatSuccess mode). */
  enhancementSuccesses: number;
  /** Total successes (dice + enhancement, botch applied). */
  totalSuccesses: number;
  difficulty: number;
  /** True when totalSuccesses >= difficulty. */
  passed: boolean;
  /** True when the roll botched (system-dependent). */
  botched: boolean;
  /** Successes beyond difficulty — the trick/stunt budget. */
  thresholdSuccesses: number;
}

/** A trick the player has chosen to purchase during the trick phase. */
export interface TrickPurchase {
  trick: Trick;
}

/** Result of validating a set of trick purchases against a budget. */
export interface PurchaseValidation {
  totalCost: number;
  remaining: number;
  valid: boolean;
}
