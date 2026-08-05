import { getDB, DEFAULT_SETTINGS, type AppSettings } from './db';

/** Shape of a settings record saved before the custom theme editor was replaced by a single curse-color override. */
interface LegacySettings {
  customTheme?: { curse?: string; base?: 'dark' | 'light' };
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = (await db.get('settings', 'app')) as
    | (Partial<AppSettings> & LegacySettings)
    | undefined;
  // Drop the old customTheme field explicitly so it doesn't keep getting
  // spread back into every normalized record (and re-persisted on save).
  const { customTheme, ...clean } = stored ?? {};
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...clean, id: 'app' };
  // Carry a pre-existing custom curse pick into the new single-color field
  // rather than silently dropping it now that the rest of the custom
  // palette editor is gone.
  if (!merged.curseColor && customTheme?.curse) {
    merged.curseColor = customTheme.curse;
  }
  // The old "custom" mode no longer exists — fall back to the custom
  // theme's own base (dark/light), the closest equivalent.
  if ((merged.themeMode as string) === 'custom') {
    merged.themeMode = customTheme?.base === 'light' ? 'light' : 'dark';
  }
  return merged;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'app' });
  return settings;
}
