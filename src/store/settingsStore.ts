import { create } from 'zustand';
import i18n from '../i18n';
import { loadSettings, saveSettings } from '../storage/settings';
import { DEFAULT_SETTINGS, type AppSettings } from '../storage/db';

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  load: async () => {
    const settings = await loadSettings();
    await i18n.changeLanguage(settings.uiLang);
    set({ settings, loaded: true });
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    if (patch.uiLang) await i18n.changeLanguage(patch.uiLang);
    await saveSettings(next);
    set({ settings: next });
  },
}));
