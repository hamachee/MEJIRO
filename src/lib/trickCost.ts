import type { CharacterTrick } from '../types/character';

/** The 1-3 choices offered for a variable-cost trick's purchase-time picker. */
export const VARIABLE_COST_OPTIONS = [1, 2, 3] as const;

/** Display text for a trick's cost, e.g. "2" or "1~3" for a variable-cost trick. */
export function formatTrickCost(cost: CharacterTrick['cost']): string {
  return cost === 'variable' ? '1~3' : String(cost);
}

/**
 * The actual hit cost to charge for a trick purchase: the trick's own cost,
 * or the chosen value from `variableCosts` (keyed by trick id) when the
 * trick's cost is 'variable'. Falls back to 1 if nothing has been chosen yet.
 */
export function resolveTrickCost(
  trick: CharacterTrick,
  variableCosts: Record<string, number>,
): number {
  return trick.cost === 'variable' ? (variableCosts[trick.id] ?? 1) : trick.cost;
}
