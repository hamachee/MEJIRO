/**
 * System template types. A template is a JSON description of a TTRPG system:
 * its attributes, skills, dice mechanics and success rules. The template
 * engine is data-driven, so new systems are added as JSON — no new code — as
 * long as their dice logic fits the configurable options in
 * {@link DiceConfig} / {@link RollConfig}.
 *
 * Templates carry only functional game data (stat names, dice rules). Content
 * with creative expression — trick lists, powers, rulebook text — is entered
 * by each user on their own characters instead of being bundled.
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
  /** id of the {@link Category} this stat belongs to. Omitted = uncategorised. */
  category?: string;
}

/** Dice mechanics. Extra flags let other pool systems (WoD, etc.) reuse the engine. */
export interface DiceConfig {
  /** Number of sides per die (10 for d10 pools). */
  sides: number;
  /** A die at or above this value counts as a hit (8 for Storypath/Curseborne). */
  successThreshold: number;
  /** If set, a die at or above this value counts as two hits (Curseborne 10s). */
  countDoubleOn?: number;
  /** If set, a die at or above this value is rerolled and added (exploding dice). */
  explodeOn?: number;
  /**
   * If set, dice at or below this value are "botch" dice that subtract from the
   * hit count when zero hits are rolled (classic WoD botch).
   */
  botchOn?: number;
  /**
   * Whether the system replaces pool dice with visually distinct "curse dice"
   * (Curseborne). Curse dice score hits normally; their effects are
   * adjudicated at the table, so the app only tracks and displays them.
   */
  curseDice?: boolean;
}

/** How a pool is assembled and scored. */
export interface RollConfig {
  /** Default difficulty (hits required) when the user has not chosen one. */
  defaultDifficulty: number;
  /**
   * How an "enhancement" value contributes. `flatSuccess` adds directly to the
   * hit total (Storypath/Curseborne). `poolDice` would add dice to the pool.
   */
  enhancementMode: 'flatSuccess' | 'poolDice';
  /**
   * Curseborne rule: enhancements only apply when the dice themselves
   * produced at least one hit.
   */
  enhancementRequiresHit?: boolean;
}

/** A trackable resource (momentum, etc.) with quick +/- controls. */
export interface ResourceDef {
  id: string;
  label: L10n;
  /** Default starting value for a fresh character. */
  default: number;
  /** Optional maximum (used for clamping and display). */
  max?: number;
}

/**
 * One named severity band of the injury track (e.g. Bloodied, Near Death).
 * Its label lights up once all of its boxes are marked.
 */
export interface InjuryLevel {
  /** How many boxes belong to this level. */
  boxes: number;
  label: L10n;
  /** Highlight this level more strongly when reached (e.g. Taken Out). */
  terminal?: boolean;
}

/** Injury track definition: an ordered set of severity levels. */
export interface InjuryTrackDef {
  levels: InjuryLevel[];
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
  resources: ResourceDef[];
  /** Optional structured injury track; falls back to a flat box count. */
  injuryTrack?: InjuryTrackDef;
}
