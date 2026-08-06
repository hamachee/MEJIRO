import { create } from 'zustand';

/**
 * Cosmetic, cross-component UI state that doesn't belong to any one
 * character/campaign: whether the character sheet's edit mode is on (so the
 * app-wide background outside the sheet's own width can react to it too),
 * and whether "send mode" is on — a table-wide toggle that turns hover over
 * a sendable card (identity/injury/momentum, currently) into a click-to-post
 * gesture for its content, instead of the card's usual behavior.
 */
interface UiStoreState {
  editingActive: boolean;
  setEditingActive: (active: boolean) => void;
  sendModeActive: boolean;
  toggleSendMode: () => void;
}

export const useUiStore = create<UiStoreState>((set, get) => ({
  editingActive: false,
  setEditingActive: (active) => set({ editingActive: active }),
  sendModeActive: false,
  toggleSendMode: () => set({ sendModeActive: !get().sendModeActive }),
}));
