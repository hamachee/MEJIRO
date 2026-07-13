import type { Trick } from '../types/template';
import type { PurchaseValidation } from '../types/roll';

/**
 * Validate a set of selected tricks against an available budget of threshold
 * successes. Powers the post-roll purchase phase UI: the total cost must not
 * exceed the budget.
 */
export function validatePurchase(
  selected: Trick[],
  budget: number,
): PurchaseValidation {
  const totalCost = selected.reduce((sum, t) => sum + Math.max(0, t.cost), 0);
  const remaining = budget - totalCost;
  return {
    totalCost,
    remaining,
    valid: remaining >= 0,
  };
}

/** Whether adding `trick` to the current selection would stay within budget. */
export function canAfford(
  selected: Trick[],
  trick: Trick,
  budget: number,
): boolean {
  return validatePurchase([...selected, trick], budget).valid;
}
