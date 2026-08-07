import { getDB, DEFAULT_SETTINGS, type AppSettings } from './db';

/** Shape of a settings record saved before the custom theme editor was replaced by a single special-color override, or before that override field was generalized beyond Curseborne's own "curse dice" name. */
interface LegacySettings {
  customTheme?: { curse?: string; base?: 'dark' | 'light' };
  /** Pre-rename name for specialColor. */
  curseColor?: string;
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = (await db.get('settings', 'app')) as
    | (Partial<AppSettings> & LegacySettings)
    | undefined;
  // Drop the old customTheme/curseColor fields explicitly so they don't
  // keep getting spread back into every normalized record (and
  // re-persisted on save).
  const { customTheme, curseColor, ...clean } = stored ?? {};
  const merged: AppSettings = { ...DEFAULT_SETTINGS, ...clean, id: 'app' };
  // Carry a pre-existing custom curse pick into the new single-color field
  // rather than silently dropping it now that the rest of the custom
  // palette editor is gone.
  if (!merged.specialColor && customTheme?.curse) {
    merged.specialColor = customTheme.curse;
  }
  // "curseColor" was renamed to "specialColor" so the override reads as a
  // general dice-highlight setting, not a Curseborne-only one.
  if (!merged.specialColor && curseColor) {
    merged.specialColor = curseColor;
  }
  // The old "custom" mode no longer exists — fall back to the custom
  // theme's own base (dark/light), the closest equivalent.
  if ((merged.themeMode as string) === 'custom') {
    merged.themeMode = customTheme?.base === 'light' ? 'light' : 'dark';
  }
  // "rule" was renamed to "curseborne" — same fixed theme, honest name.
  if ((merged.themeMode as string) === 'rule') {
    merged.themeMode = 'curseborne';
  }
  return merged;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'app' });
  return settings;
}
