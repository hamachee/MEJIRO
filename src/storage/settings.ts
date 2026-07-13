import { getDB, DEFAULT_SETTINGS, type AppSettings } from './db';

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDB();
  const stored = await db.get('settings', 'app');
  return { ...DEFAULT_SETTINGS, ...stored, id: 'app' };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'app' });
  return settings;
}
