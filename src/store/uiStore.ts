import { create } from 'zustand';

/**
 * Cosmetic, cross-component UI state that doesn't belong to any one
 * character/campaign — currently just whether the character sheet's edit
 * mode is on, so the app-wide background (outside the sheet's own width)
 * can react to it too.
 */
interface UiStoreState {
  editingActive: boolean;
  setEditingActive: (active: boolean) => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  editingActive: false,
  setEditingActive: (active) => set({ editingActive: active }),
}));
