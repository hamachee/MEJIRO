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
  difficulty: number;
  result: RollResult | null;
  request: RollRequest | null;
  selectedTrickIds: string[];
  /**
   * Enhancement added during the purchase phase, after the dice are seen.
   * By the book it needs at least one dice hit; the app deliberately does
   * not enforce that — the table adjudicates.
   */
  enhancement: number;
  /** Complication severity chosen to buy off post-roll: 0 none, 1-3. */
  complicationSeverity: number;
  /**
   * Dice manually added to the pool before rolling (GM boons etc.), 0-5.
   * Resets to 0 once a roll is made.
   */
  bonusDice: number;

  /** Select an attribute for the pool; tapping the selected one deselects it. */
  toggleAttribute: (id: string) => void;
  /** Select a skill for the pool; tapping the selected one deselects it. */
  toggleSkill: (id: string) => void;
  /** Set (or clear, with null) the attribute directly — used by the roll-bar dropdown. */
  setAttribute: (id: string | null) => void;
  /** Set (or clear, with null) the skill directly — used by the roll-bar dropdown. */
  setSkill: (id: string | null) => void;
  setDifficulty: (n: number) => void;
  setEnhancement: (n: number) => void;
  setBonusDice: (n: number) => void;
  /** Set severity; picking the current one again clears back to none. */
  setComplicationSeverity: (n: number) => void;
  poolSize: (character: Character) => number;
  /** Roll and immediately post the result to the sheet's webhook. */
  performRoll: (template: SystemTemplate, character: Character) => void;
  toggleTrick: (trickId: string) => void;
  clearResult: () => void;
  resetFor: (template: SystemTemplate) => void;
  postStatus: PostStatus;
  postError: string;
}

const MAX_COMPLICATION = 3;
const MAX_BONUS_DICE = 5;

export const useRollStore = create<RollStoreState>((set, get) => ({
  attributeId: null,
  skillId: null,
  difficulty: 1,
  result: null,
  request: null,
  selectedTrickIds: [],
  enhancement: 0,
  complicationSeverity: 0,
  bonusDice: 0,
  postStatus: 'idle',
  postError: '',

  toggleAttribute: (id) =>
    set({ attributeId: get().attributeId === id ? null : id }),
  toggleSkill: (id) => set({ skillId: get().skillId === id ? null : id }),
  setAttribute: (id) => set({ attributeId: id }),
  setSkill: (id) => set({ skillId: id }),
  setDifficulty: (n) => set({ difficulty: Math.max(0, n) }),
  setEnhancement: (n) => set({ enhancement: Math.max(0, n) }),
  setBonusDice: (n) => set({ bonusDice: Math.max(0, Math.min(MAX_BONUS_DICE, n)) }),
  setComplicationSeverity: (n) =>
    set({
      complicationSeverity:
        get().complicationSeverity === n
          ? 0
          : Math.min(MAX_COMPLICATION, Math.max(0, n)),
    }),

  poolSize: (character) => {
    const { attributeId, skillId } = get();
    const a = attributeId ? (character.attributes[attributeId] ?? 0) : 0;
    const s = skillId ? (character.skills[skillId] ?? 0) : 0;
    return a + s;
  },

  performRoll: (template, character) => {
    const { attributeId, skillId, difficulty, bonusDice } = get();
    const request: RollRequest = {
      attributeId,
      skillId,
      attributeRating: attributeId ? (character.attributes[attributeId] ?? 0) : 0,
      skillRating: skillId ? (character.skills[skillId] ?? 0) : 0,
      // Enhancement is applied in the purchase phase, after the dice are seen.
      enhancement: 0,
      bonusDice,
      difficulty,
      // Curse dice live on the sheet — a persistent stat, not a roll option.
      curseDice: character.curseDice,
    };
    const result = rollEngine(template, request);
    const fresh = {
      result,
      request,
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
      bonusDice: 0,
    };

    const webhookUrl = character.webhookUrl.trim();
    if (!webhookUrl) {
      set({ ...fresh, postStatus: 'noWebhook' as const, postError: '' });
      return;
    }

    set({ ...fresh, postStatus: 'posting' as const, postError: '' });
    postRollResult(template, request, result, {
      webhookUrl,
      lang: useSettingsStore.getState().settings.uiLang,
      characterName: character.showNameInWebhook ? character.name : '',
    })
      .then(() => set({ postStatus: 'posted' }))
      .catch((err) =>
        set({
          postStatus: 'error',
          postError: err instanceof Error ? err.message : String(err),
        }),
      );
  },

  toggleTrick: (trickId) => {
    const { selectedTrickIds } = get();
    set({
      selectedTrickIds: selectedTrickIds.includes(trickId)
        ? selectedTrickIds.filter((id) => id !== trickId)
        : [...selectedTrickIds, trickId],
    });
  },

  clearResult: () =>
    set({
      result: null,
      request: null,
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
      postStatus: 'idle',
      postError: '',
    }),

  resetFor: (template) =>
    set({
      attributeId: null,
      skillId: null,
      difficulty: template.roll.defaultDifficulty,
      result: null,
      request: null,
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
      bonusDice: 0,
      postStatus: 'idle',
      postError: '',
    }),
}));

/**
 * Post-roll totals once purchase-phase enhancement is applied. Derived here
 * so the result card and the purchase card always agree.
 */
export function effectiveTotals(
  result: RollResult,
  enhancement: number,
): { total: number; passed: boolean; budget: number } {
  const total = result.totalSuccesses + Math.max(0, enhancement);
  const passed = !result.botched && total >= result.difficulty;
  return { total, passed, budget: Math.max(0, total - result.difficulty) };
}
