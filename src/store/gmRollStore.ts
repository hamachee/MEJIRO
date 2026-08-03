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

  /** Select a pool on an instance's card; selecting the same one again clears it. */
  select: (instanceId: string, pool: AdversaryPool) => void;
  setDifficulty: (n: number) => void;
  setBonusDice: (n: number) => void;
  performRoll: (params: {
    campaign: Campaign;
    instanceLabel: string;
    poolLabel: string;
    poolRating: number;
    enhancement: number;
  }) => void;
  /** Manual post, used when the campaign has auto-post turned off. */
  postToDiscord: (campaign: Campaign) => void;
  clearResult: () => void;
  resetFor: () => void;
}

const MAX_BONUS_DICE = 9;

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

  select: (instanceId, pool) => {
    const same = get().selectedInstanceId === instanceId && get().selectedPool === pool;
    set(same ? { selectedInstanceId: null, selectedPool: null } : { selectedInstanceId: instanceId, selectedPool: pool });
  },

  setDifficulty: (n) => set({ difficulty: Math.max(0, n) }),
  setBonusDice: (n) => set({ bonusDice: Math.max(0, Math.min(MAX_BONUS_DICE, n)) }),

  performRoll: ({ campaign, instanceLabel, poolLabel, poolRating, enhancement }) => {
    const { difficulty, bonusDice } = get();
    const request: RollRequest = {
      attributeId: null,
      skillId: null,
      attributeRating: 0,
      skillRating: poolRating,
      enhancement,
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
      postStatus: 'idle',
      postError: '',
    }),
}));
