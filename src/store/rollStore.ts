import { create } from 'zustand';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';
import type { RollRequest, RollResult } from '../types/roll';
import { roll as rollEngine } from '../engine/roll';

interface RollStoreState {
  attributeId: string | null;
  skillId: string | null;
  enhancement: number;
  difficulty: number;
  result: RollResult | null;
  request: RollRequest | null;
  selectedTrickIds: string[];

  setAttribute: (id: string) => void;
  setSkill: (id: string) => void;
  setEnhancement: (n: number) => void;
  setDifficulty: (n: number) => void;
  poolSize: (character: Character) => number;
  performRoll: (template: SystemTemplate, character: Character) => void;
  /** Toggle a trick. Adds only when `canAdd` (component enforces budget). */
  toggleTrick: (trickId: string, canAdd: boolean) => void;
  clearResult: () => void;
  resetFor: (template: SystemTemplate) => void;
}

export const useRollStore = create<RollStoreState>((set, get) => ({
  attributeId: null,
  skillId: null,
  enhancement: 0,
  difficulty: 1,
  result: null,
  request: null,
  selectedTrickIds: [],

  setAttribute: (id) => set({ attributeId: id }),
  setSkill: (id) => set({ skillId: id }),
  setEnhancement: (n) => set({ enhancement: Math.max(0, n) }),
  setDifficulty: (n) => set({ difficulty: Math.max(0, n) }),

  poolSize: (character) => {
    const { attributeId, skillId } = get();
    const a = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
    const s = skillId ? (character.skills[skillId] ?? 0) : 0;
    return a + s;
  },

  performRoll: (template, character) => {
    const { attributeId, skillId, enhancement, difficulty } = get();
    const request: RollRequest = {
      attributeId,
      skillId,
      attributeRating: attributeId ? (character.attributes[attributeId] ?? 0) : 0,
      skillRating: skillId ? (character.skills[skillId] ?? 0) : 0,
      enhancement,
      difficulty,
    };
    const result = rollEngine(template, request);
    set({ result, request, selectedTrickIds: [] });
  },

  toggleTrick: (trickId, canAdd) => {
    const { selectedTrickIds } = get();
    if (selectedTrickIds.includes(trickId)) {
      set({ selectedTrickIds: selectedTrickIds.filter((id) => id !== trickId) });
    } else if (canAdd) {
      set({ selectedTrickIds: [...selectedTrickIds, trickId] });
    }
  },

  clearResult: () => set({ result: null, request: null, selectedTrickIds: [] }),

  resetFor: (template) =>
    set({
      attributeId: null,
      skillId: null,
      enhancement: 0,
      difficulty: template.roll.defaultDifficulty,
      result: null,
      request: null,
      selectedTrickIds: [],
    }),
}));
