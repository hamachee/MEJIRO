import { create } from 'zustand';
import type { RollRequest, RollResult } from '../types/roll';
import { roll as rollEngine } from '../engine/roll';
import { postAdversaryRoll } from '../engine/discord';
import { getTemplate } from '../templates';
import type { Campaign } from '../types/campaign';
import { useSettingsStore } from './settingsStore';

/** GM rolls always use the Curseborne dice engine — the only bundled system. */
const CURSEBORNE = getTemplate('curseborne')!;

export type AdversaryPool = 'primary' | 'secondary' | 'desperation';

export type PostStatus = 'idle' | 'posting' | 'posted' | 'error';

interface GmRollStoreState {
  selectedInstanceId: string | null;
  selectedPool: AdversaryPool | null;
  difficulty: number;
  bonusDice: number;
  result: RollResult | null;
  request: RollRequest | null;
  instanceLabel: string;
  poolLabel: string;
  postStatus: PostStatus;
  postError: string;
  /** Selected trick ids for the post-roll purchase phase. */
  selectedTrickIds: string[];
  /**
   * Extra hits bought during the purchase phase, after the dice are seen.
   * A template's Enhancement is a free-text reference note only — nothing
   * applies it automatically, so the GM adds it here by hand once the dice
   * are visible, same as a character's purchase-phase enhancement.
   */
  enhancement: number;
  /** Complication severity chosen to buy off post-roll: 0 none, 1-3. */
  complicationSeverity: number;

  /** Select a pool on an instance's card; selecting the same one again clears it. */
  select: (instanceId: string, pool: AdversaryPool) => void;
  setDifficulty: (n: number) => void;
  setBonusDice: (n: number) => void;
  setEnhancement: (n: number) => void;
  /** Set severity; picking the current one again clears back to none. */
  setComplicationSeverity: (n: number) => void;
  toggleTrick: (trickId: string) => void;
  performRoll: (params: {
    campaign: Campaign;
    instanceLabel: string;
    poolLabel: string;
    poolRating: number;
  }) => void;
  /** Manual post, used when the campaign has auto-post turned off. */
  postToDiscord: (campaign: Campaign) => void;
  clearResult: () => void;
  resetFor: () => void;
}

const MAX_BONUS_DICE = 9;
const MAX_COMPLICATION = 3;

export const useGmRollStore = create<GmRollStoreState>((set, get) => ({
  selectedInstanceId: null,
  selectedPool: null,
  difficulty: CURSEBORNE.roll.defaultDifficulty,
  bonusDice: 0,
  result: null,
  request: null,
  instanceLabel: '',
  poolLabel: '',
  postStatus: 'idle',
  postError: '',
  selectedTrickIds: [],
  enhancement: 0,
  complicationSeverity: 0,

  select: (instanceId, pool) => {
    const same = get().selectedInstanceId === instanceId && get().selectedPool === pool;
    set(same ? { selectedInstanceId: null, selectedPool: null } : { selectedInstanceId: instanceId, selectedPool: pool });
  },

  setDifficulty: (n) => set({ difficulty: Math.max(0, n) }),
  setBonusDice: (n) => set({ bonusDice: Math.max(0, Math.min(MAX_BONUS_DICE, n)) }),
  setEnhancement: (n) => set({ enhancement: Math.max(0, n) }),
  setComplicationSeverity: (n) =>
    set({
      complicationSeverity:
        get().complicationSeverity === n
          ? 0
          : Math.min(MAX_COMPLICATION, Math.max(0, n)),
    }),
  toggleTrick: (trickId) => {
    const { selectedTrickIds } = get();
    set({
      selectedTrickIds: selectedTrickIds.includes(trickId)
        ? selectedTrickIds.filter((id) => id !== trickId)
        : [...selectedTrickIds, trickId],
    });
  },

  performRoll: ({ campaign, instanceLabel, poolLabel, poolRating }) => {
    const { difficulty, bonusDice } = get();
    // Pure dice pool + bonus dice — Enhancement is never baked into the roll
    // itself, it's added by hand in the purchase phase after the dice land.
    const request: RollRequest = {
      attributeId: null,
      skillId: null,
      attributeRating: 0,
      skillRating: poolRating,
      enhancement: 0,
      bonusDice,
      difficulty,
      curseDice: 0,
    };
    const result = rollEngine(CURSEBORNE, request);

    const webhookUrl = campaign.webhookUrl.trim();
    const fresh = {
      result,
      request,
      instanceLabel,
      poolLabel,
      selectedInstanceId: null,
      selectedPool: null,
      bonusDice: 0,
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
    };

    if (!webhookUrl || !campaign.autoPostToDiscord) {
      set({ ...fresh, postStatus: 'idle' as const, postError: '' });
      return;
    }

    set({ ...fresh, postStatus: 'posting' as const, postError: '' });
    postAdversaryRoll(request, result, {
      webhookUrl,
      lang: useSettingsStore.getState().settings.uiLang,
      instanceLabel,
      poolLabel,
    })
      .then(() => set({ postStatus: 'posted' }))
      .catch((err) =>
        set({
          postStatus: 'error',
          postError: err instanceof Error ? err.message : String(err),
        }),
      );
  },

  postToDiscord: (campaign) => {
    const { request, result, instanceLabel, poolLabel } = get();
    const webhookUrl = campaign.webhookUrl.trim();
    if (!request || !result || !webhookUrl) return;
    set({ postStatus: 'posting', postError: '' });
    postAdversaryRoll(request, result, {
      webhookUrl,
      lang: useSettingsStore.getState().settings.uiLang,
      instanceLabel,
      poolLabel,
    })
      .then(() => set({ postStatus: 'posted' }))
      .catch((err) =>
        set({
          postStatus: 'error',
          postError: err instanceof Error ? err.message : String(err),
        }),
      );
  },

  clearResult: () =>
    set({
      result: null,
      request: null,
      instanceLabel: '',
      poolLabel: '',
      postStatus: 'idle',
      postError: '',
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
    }),

  resetFor: () =>
    set({
      selectedInstanceId: null,
      selectedPool: null,
      difficulty: CURSEBORNE.roll.defaultDifficulty,
      bonusDice: 0,
      result: null,
      request: null,
      instanceLabel: '',
      poolLabel: '',
      selectedTrickIds: [],
      enhancement: 0,
      complicationSeverity: 0,
      postStatus: 'idle',
      postError: '',
    }),
}));
