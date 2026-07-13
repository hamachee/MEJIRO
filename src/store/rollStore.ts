import { create } from 'zustand';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';
import type { RollRequest, RollResult } from '../types/roll';
import { roll as rollEngine } from '../engine/roll';
import { postRollResult } from '../engine/discord';
import { useSettingsStore } from './settingsStore';

/**
 * Discord delivery state for the current roll. Rolls post automatically so
 * every roll the table should see actually reaches the channel — a roll
 * without a webhook is flagged, not silently private.
 */
export type PostStatus = 'idle' | 'posting' | 'posted' | 'noWebhook' | 'error';

interface RollStoreState {
  attributeId: string | null;
  skillId: string | null;
  enhancement: number;
  difficulty: number;
  curseDice: number;
  complication: number;
  result: RollResult | null;
  request: RollRequest | null;
  selectedTrickIds: string[];
  /** Purchase-phase choice: buy off the complication with extra hits. */
  resolveComplication: boolean;
  postStatus: PostStatus;
  postError: string;

  /** Select an attribute for the pool; tapping the selected one deselects it. */
  toggleAttribute: (id: string) => void;
  /** Select a skill for the pool; tapping the selected one deselects it. */
  toggleSkill: (id: string) => void;
  setEnhancement: (n: number) => void;
  setDifficulty: (n: number) => void;
  setCurseDice: (n: number) => void;
  setComplication: (n: number) => void;
  toggleResolveComplication: () => void;
  poolSize: (character: Character) => number;
  /** Roll and immediately post the result to the sheet's webhook. */
  performRoll: (template: SystemTemplate, character: Character) => void;
  /** Toggle a trick. Adds only when `canAdd` (component enforces budget). */
  toggleTrick: (trickId: string, canAdd: boolean) => void;
  clearResult: () => void;
  resetFor: (template: SystemTemplate) => void;
}

// Curseborne: the curse always takes its due — one curse die by default.
const DEFAULT_CURSE_DICE = 1;
const MAX_COMPLICATION = 3;

export const useRollStore = create<RollStoreState>((set, get) => ({
  attributeId: null,
  skillId: null,
  enhancement: 0,
  difficulty: 1,
  curseDice: DEFAULT_CURSE_DICE,
  complication: 0,
  result: null,
  request: null,
  selectedTrickIds: [],
  resolveComplication: false,
  postStatus: 'idle',
  postError: '',

  toggleAttribute: (id) =>
    set({ attributeId: get().attributeId === id ? null : id }),
  toggleSkill: (id) => set({ skillId: get().skillId === id ? null : id }),
  setEnhancement: (n) => set({ enhancement: Math.max(0, n) }),
  setDifficulty: (n) => set({ difficulty: Math.max(0, n) }),
  setCurseDice: (n) => set({ curseDice: Math.max(0, n) }),
  setComplication: (n) =>
    set({ complication: Math.min(MAX_COMPLICATION, Math.max(0, n)) }),
  toggleResolveComplication: () =>
    set({ resolveComplication: !get().resolveComplication }),

  poolSize: (character) => {
    const { attributeId, skillId } = get();
    const a = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
    const s = skillId ? (character.skills[skillId] ?? 0) : 0;
    return a + s;
  },

  performRoll: (template, character) => {
    const { attributeId, skillId, enhancement, difficulty, curseDice, complication } = get();
    const request: RollRequest = {
      attributeId,
      skillId,
      attributeRating: attributeId ? (character.attributes[attributeId] ?? 0) : 0,
      skillRating: skillId ? (character.skills[skillId] ?? 0) : 0,
      enhancement,
      difficulty,
      curseDice,
      complication,
    };
    const result = rollEngine(template, request);
    const fresh = {
      result,
      request,
      selectedTrickIds: [],
      resolveComplication: false,
    };

    const webhookUrl = character.webhookUrl.trim();
    if (!webhookUrl) {
      set({ ...fresh, postStatus: 'noWebhook', postError: '' });
      return;
    }

    set({ ...fresh, postStatus: 'posting', postError: '' });
    postRollResult(template, request, result, {
      webhookUrl,
      lang: useSettingsStore.getState().settings.discordLang,
      characterName: character.name,
    })
      .then(() => set({ postStatus: 'posted' }))
      .catch((err) =>
        set({
          postStatus: 'error',
          postError: err instanceof Error ? err.message : String(err),
        }),
      );
  },

  toggleTrick: (trickId, canAdd) => {
    const { selectedTrickIds } = get();
    if (selectedTrickIds.includes(trickId)) {
      set({ selectedTrickIds: selectedTrickIds.filter((id) => id !== trickId) });
    } else if (canAdd) {
      set({ selectedTrickIds: [...selectedTrickIds, trickId] });
    }
  },

  clearResult: () =>
    set({
      result: null,
      request: null,
      selectedTrickIds: [],
      resolveComplication: false,
      postStatus: 'idle',
      postError: '',
    }),

  resetFor: (template) =>
    set({
      attributeId: null,
      skillId: null,
      enhancement: 0,
      difficulty: template.roll.defaultDifficulty,
      curseDice: DEFAULT_CURSE_DICE,
      complication: 0,
      result: null,
      request: null,
      selectedTrickIds: [],
      resolveComplication: false,
      postStatus: 'idle',
      postError: '',
    }),
}));
