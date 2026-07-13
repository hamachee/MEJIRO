/**
 * System template types. A template is a JSON description of a TTRPG system:
 * its attributes, skills, dice mechanics, success rules and (optionally) a
 * catalogue of purchasable tricks/stunts. The template engine is data-driven,
 * so new systems are added as JSON — no new code — as long as their dice logic
 * fits the configurable options in {@link DiceConfig} / {@link RollConfig}.
 */

/** A label available in multiple languages. `en` is required as the fallback. */
export interface L10n {
  en: string;
  ko?: string;
  [lang: string]: string | undefined;
}

/** A broad grouping such as Physical / Mental / Social. */
export interface Category {
  id: string;
  label: L10n;
}

/** An attribute or skill definition. */
export interface Stat {
  id: string;
  label: L10n;
  /** id of the {@link Category} this stat belongs to. */
  category: string;
}

/** Dice mechanics. Extra flags let other pool systems (WoD, etc.) reuse the engine. */
export interface DiceConfig {
  /** Number of sides per die (10 for d10 pools). */
  sides: number;
  /** A die at or above this value counts as a success (8 for Storypath). */
  successThreshold: number;
  /** If set, a die at or above this value counts as two successes (e.g. WoD 10s). */
  countDoubleOn?: number;
  /** If set, a die at or above this value is rerolled and added (exploding dice). */
  explodeOn?: number;
  /**
   * If set, dice at or below this value are "botch" dice that subtract from the
   * success count when zero successes are rolled (classic WoD botch).
   */
  botchOn?: number;
}

/** How a pool is assembled and scored. */
export interface RollConfig {
  /** Default difficulty (successes required) when the user has not chosen one. */
  defaultDifficulty: number;
  /**
   * How an "enhancement" value contributes. `flatSuccess` adds directly to the
   * success total (Storypath). `poolDice` would add dice to the pool instead.
   */
  enhancementMode: 'flatSuccess' | 'poolDice';
}

/** A purchasable trick / stunt spent from threshold successes after a roll. */
export interface Trick {
  id: string;
  label: L10n;
  /** Threshold successes required to buy this trick. */
  cost: number;
  description?: L10n;
}

/** A trackable resource (HP, willpower, etc.) with quick +/- controls. */
export interface ResourceDef {
  id: string;
  label: L10n;
  /** Default starting value for a fresh character. */
  default: number;
  /** Optional maximum (used for clamping and display). */
  max?: number;
}

export interface SystemTemplate {
  id: string;
  name: L10n;
  version: string;
  /** Language codes the template provides labels for, e.g. ["en", "ko"]. */
  languages: string[];
  categories: Category[];
  attributes: Stat[];
  skills: Stat[];
  dice: DiceConfig;
  roll: RollConfig;
  tricks: Trick[];
  resources: ResourceDef[];
}
