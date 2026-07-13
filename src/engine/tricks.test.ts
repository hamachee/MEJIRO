import { describe, it, expect } from 'vitest';
import { validatePurchase, canAfford } from './tricks';
import type { Trick } from '../types/template';

const t = (id: string, cost: number): Trick => ({
  id,
  label: { en: id },
  cost,
});

describe('validatePurchase — trick budget', () => {
  it('is valid when total cost is under budget', () => {
    const v = validatePurchase([t('a', 1), t('b', 2)], 5);
    expect(v.totalCost).toBe(3);
    expect(v.remaining).toBe(2);
    expect(v.valid).toBe(true);
  });

  it('is valid when total cost exactly equals budget', () => {
    const v = validatePurchase([t('a', 3), t('b', 2)], 5);
    expect(v.remaining).toBe(0);
    expect(v.valid).toBe(true);
  });

  it('is invalid when total cost exceeds budget', () => {
    const v = validatePurchase([t('a', 3), t('b', 3)], 5);
    expect(v.totalCost).toBe(6);
    expect(v.remaining).toBe(-1);
    expect(v.valid).toBe(false);
  });

  it('handles an empty selection', () => {
    const v = validatePurchase([], 4);
    expect(v.totalCost).toBe(0);
    expect(v.remaining).toBe(4);
    expect(v.valid).toBe(true);
  });
});

describe('canAfford', () => {
  it('allows a trick that fits the remaining budget', () => {
    expect(canAfford([t('a', 2)], t('b', 2), 5)).toBe(true);
  });

  it('rejects a trick that would exceed the budget', () => {
    expect(canAfford([t('a', 2)], t('b', 4), 5)).toBe(false);
  });
});
