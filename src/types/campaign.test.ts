import { describe, it, expect } from 'vitest';
import { desperationPool } from './campaign';

describe('desperationPool', () => {
  it('is half the primary pool, rounded down', () => {
    expect(desperationPool(5)).toBe(2);
    expect(desperationPool(4)).toBe(2);
  });

  it('is 0 for a 0 or negative primary pool', () => {
    expect(desperationPool(0)).toBe(0);
    expect(desperationPool(-3)).toBe(0);
  });
});
