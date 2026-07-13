import type { SystemTemplate } from '../types/template';
import type { DieResult, RollRequest, RollResult } from '../types/roll';

/** A random source returning a float in [0, 1). Injected for deterministic tests. */
export type Rng = () => number;

/** Roll a single die with `sides`, returning 1..sides. */
function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1;
}

/** Successes a single die value yields under the template's dice config. */
function dieSuccesses(value: number, template: SystemTemplate): number {
  const { successThreshold, countDoubleOn } = template.dice;
  if (countDoubleOn !== undefined && value >= countDoubleOn) return 2;
  if (value >= successThreshold) return 1;
  return 0;
}

/** Safety cap so a misconfigured `explodeOn` can never loop forever. */
const MAX_EXPLOSIONS = 100;

/**
 * Roll a dice pool for the given template and request.
 *
 * Pool size is attribute + skill ratings (plus enhancement dice in `poolDice`
 * mode). Each die is scored per {@link SystemTemplate.dice}; enhancement in
 * `flatSuccess` mode is added to the success total. Threshold successes —
 * successes beyond the difficulty — form the trick/stunt budget.
 *
 * `rng` defaults to `Math.random` but is injectable for deterministic tests.
 */
export function roll(
  template: SystemTemplate,
  request: RollRequest,
  rng: Rng = Math.random,
): RollResult {
  const { sides, explodeOn, botchOn } = template.dice;
  const { enhancementMode } = template.roll;

  const baseRatings = Math.max(0, request.attributeRating) + Math.max(0, request.skillRating);
  const enhancement = Math.max(0, request.enhancement);
  const poolSize =
    baseRatings + (enhancementMode === 'poolDice' ? enhancement : 0);

  const dice: DieResult[] = [];
  let explosions = 0;

  const addDie = (exploded: boolean) => {
    const value = rollDie(sides, rng);
    dice.push({ value, successes: dieSuccesses(value, template), exploded });
    if (
      explodeOn !== undefined &&
      value >= explodeOn &&
      explosions < MAX_EXPLOSIONS
    ) {
      explosions++;
      addDie(true);
    }
  };

  for (let i = 0; i < poolSize; i++) addDie(false);

  const rawDiceSuccesses = dice.reduce((sum, d) => sum + d.successes, 0);

  // Botch (optional, WoD-style): dice at or below botchOn subtract successes.
  let diceSuccesses = rawDiceSuccesses;
  let botched = false;
  if (botchOn !== undefined) {
    const botchDice = dice.filter((d) => d.value <= botchOn).length;
    diceSuccesses = rawDiceSuccesses - botchDice;
    if (diceSuccesses < 0 && rawDiceSuccesses === 0) botched = true;
    diceSuccesses = Math.max(0, diceSuccesses);
  }

  const enhancementSuccesses =
    enhancementMode === 'flatSuccess' ? enhancement : 0;
  const totalSuccesses = diceSuccesses + enhancementSuccesses;

  const passed = !botched && totalSuccesses >= request.difficulty;
  const thresholdSuccesses = passed
    ? totalSuccesses - request.difficulty
    : 0;

  return {
    dice,
    poolSize,
    diceSuccesses,
    enhancementSuccesses,
    totalSuccesses,
    difficulty: request.difficulty,
    passed,
    botched,
    thresholdSuccesses,
  };
}
