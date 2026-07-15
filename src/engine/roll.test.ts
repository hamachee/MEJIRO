import { describe, it, expect } from 'vitest';
import { roll, hasCurseHit, type Rng } from './roll';
import curseborne from '../templates/curseborne.json';
import type { SystemTemplate } from '../types/template';
import type { RollRequest } from '../types/roll';

const template = curseborne as SystemTemplate;

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
    bonusDice: 0,
    difficulty: 1,
    curseDice: 0,
    ...overrides,
  };
}

describe('roll — Curseborne (d10, 8-9 = 1 hit, 10 = 2 hits)', () => {
  it('rolls a pool sized attribute + skill', () => {
    const rng = scriptedRng([5]);
    const result = roll(template, baseRequest(), rng);
    expect(result.poolSize).toBe(5);
    expect(result.dice).toHaveLength(5);
  });

  it('counts 8 and 9 as one hit and 10 as two hits', () => {
    // faces: 8 -> 1, 9 -> 1, 10 -> 2, 7 -> 0, 2 -> 0
    const rng = scriptedRng([8, 9, 10, 7, 2]);
    const result = roll(template, baseRequest(), rng);
    expect(result.diceSuccesses).toBe(4);
    expect(result.totalSuccesses).toBe(4);
  });

  it('passes when hits >= difficulty and computes extra hits', () => {
    const rng = scriptedRng([8, 9, 10, 7, 2]); // 4 hits
    const result = roll(template, baseRequest({ difficulty: 2 }), rng);
    expect(result.passed).toBe(true);
    expect(result.thresholdSuccesses).toBe(2); // 4 - 2
  });

  it('fails when hits < difficulty and extra hits are 0', () => {
    const rng = scriptedRng([2, 3, 4, 5, 6]); // 0 hits
    const result = roll(template, baseRequest({ difficulty: 1 }), rng);
    expect(result.passed).toBe(false);
    expect(result.thresholdSuccesses).toBe(0);
  });

  it('adds enhancement as flat hits when the dice produced a hit', () => {
    const rng = scriptedRng([8, 2, 2, 2, 2]); // 1 dice hit
    const result = roll(template, baseRequest({ enhancement: 2, difficulty: 1 }), rng);
    expect(result.diceSuccesses).toBe(1);
    expect(result.enhancementSuccesses).toBe(2);
    expect(result.totalSuccesses).toBe(3);
    expect(result.thresholdSuccesses).toBe(2);
  });

  it('ignores enhancement when the dice produced zero hits', () => {
    const rng = scriptedRng([2, 3, 4, 5, 6]); // 0 dice hits
    const result = roll(template, baseRequest({ enhancement: 3, difficulty: 1 }), rng);
    expect(result.enhancementSuccesses).toBe(0);
    expect(result.totalSuccesses).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('flags the requested number of curse dice, clamped to the pool', () => {
    const rng = scriptedRng([8, 9, 2, 3, 10]);
    const result = roll(template, baseRequest({ curseDice: 2 }), rng);
    expect(result.curseDice).toBe(2);
    expect(result.dice.filter((d) => d.isCurse)).toHaveLength(2);

    const clamped = roll(template, baseRequest({ curseDice: 99 }), rng);
    expect(clamped.curseDice).toBe(clamped.poolSize);
  });

  it('scores curse dice like normal dice', () => {
    // first two dice are curse dice: 10 -> 2 hits, 8 -> 1 hit
    const rng = scriptedRng([10, 8, 2, 2, 2]);
    const result = roll(template, baseRequest({ curseDice: 2 }), rng);
    expect(result.diceSuccesses).toBe(3);
  });

  it('detects a curse hit (wicked success / cruel failure trigger)', () => {
    // curse die hits (8) -> wicked/cruel applies
    const hit = roll(template, baseRequest({ curseDice: 1 }), scriptedRng([8, 2, 2, 2, 2]));
    expect(hasCurseHit(hit)).toBe(true);
    // curse die misses (2), a normal die hits -> plain outcome
    const miss = roll(template, baseRequest({ curseDice: 1 }), scriptedRng([2, 8, 2, 2, 2]));
    expect(hasCurseHit(miss)).toBe(false);
    // no curse dice at all
    const none = roll(template, baseRequest(), scriptedRng([8, 8, 8, 8, 8]));
    expect(hasCurseHit(none)).toBe(false);
  });

  it('adds bonus dice to the pool regardless of enhancement mode', () => {
    const rng = scriptedRng([5]);
    const result = roll(template, baseRequest({ bonusDice: 3 }), rng);
    expect(result.poolSize).toBe(8); // 3 (attr) + 2 (skill) + 3 (bonus)
    expect(result.dice).toHaveLength(8);
  });

  it('is deterministic under a fixed RNG', () => {
    const a = roll(template, baseRequest(), scriptedRng([8, 9, 2, 3, 10]));
    const b = roll(template, baseRequest(), scriptedRng([8, 9, 2, 3, 10]));
    expect(a).toEqual(b);
  });
});

describe('roll — configurable mechanics (future systems)', () => {
  it('supports a plain 8+ threshold with no doubles (Storypath-style)', () => {
    const plain: SystemTemplate = {
      ...template,
      dice: { sides: 10, successThreshold: 8 },
      roll: { defaultDifficulty: 1, enhancementMode: 'flatSuccess' },
    };
    const rng = scriptedRng([10, 10, 8, 2, 2]);
    const result = roll(plain, baseRequest(), rng);
    expect(result.diceSuccesses).toBe(3); // 10s count once without countDoubleOn
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
  });
});
