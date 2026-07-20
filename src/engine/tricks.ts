import type { PurchaseValidation } from '../types/roll';

/** Anything with a hit cost — character tricks, or future purchasables. */
export interface Costed {
  cost: number;
}

/**
 * Validate a set of selected tricks against an available budget of extra
 * hits. Powers the post-roll purchase phase UI: the total cost must not
 * exceed the budget.
 */
export function validatePurchase(
  selected: Costed[],
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
  selected: Costed[],
  trick: Costed,
  budget: number,
): boolean {
  return validatePurchase(selected, budget).remaining >= Math.max(0, trick.cost);
}
