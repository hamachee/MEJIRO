import { describe, it, expect } from 'vitest';
import { exportList, parseListImport } from './listExchange';

describe('exportList / parseListImport', () => {
  it('round-trips a trick list, reassigning ids', () => {
    const tricks = [{ id: 'a', name: 'Disarm', cost: 2, description: 'Drop it' }];
    const parsed = parseListImport(exportList('tricks', tricks), 'tricks');
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Disarm');
    expect(parsed[0].cost).toBe(2);
    expect(parsed[0].description).toBe('Drop it');
    expect(parsed[0].id).not.toBe('a');
  });

  it('rejects non-list files', () => {
    expect(() => parseListImport('{"format":"mejiro-character"}', 'tricks')).toThrow(
      'Not a MEJIRO list file',
    );
    expect(() => parseListImport('[]', 'tricks')).toThrow('Not a MEJIRO list file');
  });

  it('rejects a list of a different kind', () => {
    const json = exportList('gear', [{ id: 'g', name: 'Rope', tags: [], favorite: false }]);
    expect(() => parseListImport(json, 'spells')).toThrow('"gear"');
  });

  it('rejects entries without a name', () => {
    const json = exportList('tricks', [{ cost: 1 }]);
    expect(() => parseListImport(json, 'tricks')).toThrow('name');
  });

  it('fills defaults for sparse hand-written entries', () => {
    const gear = parseListImport(exportList('gear', [{ name: 'Rope' }]), 'gear');
    expect(gear[0]).toMatchObject({ name: 'Rope', tags: [], favorite: false });

    const spells = parseListImport(exportList('spells', [{ name: 'Hex' }]), 'spells');
    expect(spells[0]).toMatchObject({ name: 'Hex', attunements: [], favorite: false });

    const tricks = parseListImport(exportList('tricks', [{ name: 'Trip', cost: 0 }]), 'tricks');
    expect(tricks[0].cost).toBe(1);
  });

  it('merges adversary stats over a blank block', () => {
    const json = exportList('adversaries', [
      { name: 'Ghoul', stats: { primaryPool: 7, defense: 2 } },
    ]);
    const parsed = parseListImport(json, 'adversaries');
    expect(parsed[0].stats.primaryPool).toBe(7);
    expect(parsed[0].stats.defense).toBe(2);
    // Fields missing from the file come from the blank stat block.
    expect(parsed[0].stats.armorTags).toBe('');
    expect(parsed[0].stats.hasArmor).toBe(false);
  });
});
