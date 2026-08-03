import { create } from 'zustand';
import type { Campaign } from '../types/campaign';
import type { CharacterTrick } from '../types/character';
import {
  deleteCampaign,
  getCampaign,
  listCampaigns,
  newCampaign,
  parseCampaignImport,
  saveCampaign,
} from '../storage/campaigns';

interface CampaignStoreState {
  roster: Campaign[];
  active: Campaign | null;
  loadRoster: () => Promise<void>;
  create: (name: string, tricks?: CharacterTrick[]) => Promise<Campaign>;
  open: (id: string) => Promise<Campaign | undefined>;
  clearActive: () => void;
  rename: (name: string) => void;
  /** Merge arbitrary fields (webhook, templates, instances…) into the active campaign. */
  patch: (fields: Partial<Campaign>) => void;
  remove: (id: string) => Promise<void>;
  importFromJson: (json: string) => Promise<Campaign>;
}

/**
 * Apply a mutation to the active campaign. State is updated synchronously
 * (optimistic) so rapid successive edits never read stale values; the write
 * to IndexedDB happens in the background — same convention as characterStore.
 */
function commit(
  set: (partial: Partial<CampaignStoreState>) => void,
  get: () => CampaignStoreState,
  next: Campaign,
) {
  const updated = { ...next, updatedAt: Date.now() };
  set({
    active: updated,
    roster: [updated, ...get().roster.filter((c) => c.id !== updated.id)],
  });
  void saveCampaign(updated).catch((err) =>
    console.error('Failed to save campaign', err),
  );
}

export const useCampaignStore = create<CampaignStoreState>((set, get) => ({
  roster: [],
  active: null,

  loadRoster: async () => {
    set({ roster: await listCampaigns() });
  },

  create: async (name, tricks) => {
    const campaign = await saveCampaign(newCampaign(name, tricks));
    set({ roster: [campaign, ...get().roster], active: campaign });
    return campaign;
  },

  open: async (id) => {
    const campaign = await getCampaign(id);
    set({ active: campaign ?? null });
    return campaign;
  },

  clearActive: () => set({ active: null }),

  rename: (name) => {
    const active = get().active;
    if (!active) return;
    commit(set, get, { ...active, name: name.trim() || active.name });
  },

  patch: (fields) => {
    const active = get().active;
    if (!active) return;
    commit(set, get, { ...active, ...fields });
  },

  remove: async (id) => {
    await deleteCampaign(id);
    const active = get().active;
    set({
      roster: get().roster.filter((c) => c.id !== id),
      active: active?.id === id ? null : active,
    });
  },

  importFromJson: async (json) => {
    const campaign = await saveCampaign(parseCampaignImport(json));
    set({ roster: [campaign, ...get().roster] });
    return campaign;
  },
}));
