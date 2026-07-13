import { describe, it, expect } from 'vitest';
import { roll, type Rng } from './roll';
import storypath from '../templates/storypath-ultra.json';
import type { SystemTemplate } from '../types/template';
import type { RollRequest } from '../types/roll';

const template = storypath as SystemTemplate;

/** RNG that yields die faces from a fixed script (values are 1..sides). */
function scriptedRng(faces: number[], sides = 10): Rng {
  let i = 0;
  return () => {
    const face = faces[i % faces.length];
    i++;
    // roll.ts computes floor(rng()*sides)+1; invert to hit `face` exactly.
    return (face - 1) / sides + 0.001;
  };
}

function baseRequest(overrides: Partial<RollRequest> = {}): RollRequest {
  return {
    attributeId: 'might',
    skillId: 'closeCombat',
    attributeRating: 3,
    skillRating: 2,
    enhancement: 0,
    difficulty: 1,
    ...overrides,
  };
}

describe('roll — Storypath Ultra (8+ successes, d10)', () => {
  it('rolls a pool sized attribute + skill', () => {
    const rng = scriptedRng([5]);
    const result = roll(template, baseRequest(), rng);
    expect(result.poolSize).toBe(5);
    expect(result.dice).toHaveLength(5);
  });

  it('counts only dice >= 8 as successes', () => {
    // faces: 8,9,10 are successes; 7 and 2 are not
    const rng = scriptedRng([8, 9, 10, 7, 2]);
    const result = roll(template, baseRequest(), rng);
    expect(result.diceSuccesses).toBe(3);
    expect(result.totalSuccesses).toBe(3);
  });

  it('does not double 10s (Storypath has no doubles configured)', () => {
    const rng = scriptedRng([10, 10, 10, 10, 10]);
    const result = roll(template, baseRequest(), rng);
    expect(result.diceSuccesses).toBe(5);
  });

  it('passes when successes >= difficulty and computes threshold successes', () => {
    const rng = scriptedRng([8, 9, 10, 7, 2]); // 3 successes
    const result = roll(template, baseRequest({ difficulty: 2 }), rng);
    expect(result.passed).toBe(true);
    expect(result.thresholdSuccesses).toBe(1); // 3 - 2
  });

  it('fails when successes < difficulty and threshold is 0', () => {
    const rng = scriptedRng([2, 3, 4, 5, 6]); // 0 successes
    const result = roll(template, baseRequest({ difficulty: 1 }), rng);
    expect(result.passed).toBe(false);
    expect(result.thresholdSuccesses).toBe(0);
  });

  it('adds enhancement as flat successes', () => {
    const rng = scriptedRng([8, 2, 2, 2, 2]); // 1 dice success
    const result = roll(template, baseRequest({ enhancement: 2, difficulty: 1 }), rng);
    expect(result.diceSuccesses).toBe(1);
    expect(result.enhancementSuccesses).toBe(2);
    expect(result.totalSuccesses).toBe(3);
    expect(result.thresholdSuccesses).toBe(2);
  });

  it('is deterministic under a fixed RNG', () => {
    const a = roll(template, baseRequest(), scriptedRng([8, 9, 2, 3, 10]));
    const b = roll(template, baseRequest(), scriptedRng([8, 9, 2, 3, 10]));
    expect(a).toEqual(b);
  });
});

describe('roll — configurable mechanics (future systems)', () => {
  const wodLike: SystemTemplate = {
    ...template,
    dice: { sides: 10, successThreshold: 6, countDoubleOn: 10 },
  };

  it('counts a die >= countDoubleOn as two successes', () => {
    const rng = scriptedRng([10, 6, 2, 2, 2]); // 10 -> 2, 6 -> 1
    const result = roll(wodLike, baseRequest(), rng);
    expect(result.diceSuccesses).toBe(3);
  });

  it('explodes dice at explodeOn and marks the extra die', () => {
    const exploding: SystemTemplate = {
      ...template,
      dice: { sides: 10, successThreshold: 8, explodeOn: 10 },
    };
    // first die 10 -> explode -> next 8; remaining pool dice are low
    const rng = scriptedRng([10, 8, 2, 2, 2, 2]);
    const result = roll(exploding, baseRequest(), rng);
    expect(result.dice.some((d) => d.exploded)).toBe(true);
    expect(result.dice.length).toBeGreaterThan(result.poolSize);
    expect(result.diceSuccesses).toBe(2); // the 10 and the exploded 8
  });
});
