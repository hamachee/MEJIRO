import { getDB, type AppSettings, DEFAULT_SETTINGS } from './db';
import { listCharacters, normalizeCharacter } from './characters';
import { listCampaigns, normalizeCampaign } from './campaigns';
import { loadSettings, saveSettings } from './settings';
import type { Character } from '../types/character';
import type { Campaign } from '../types/campaign';

export interface BackupExport {
  format: 'mejiro-backup';
  version: 1;
  characters: Character[];
  campaigns: Campaign[];
  settings: AppSettings;
}

/**
 * Serialise every character, campaign, and app setting into one portable
 * JSON envelope — the whole-app counterpart to the single-character/
 * single-campaign export. Webhook URLs are stripped from every character
 * and campaign, same reason as the single-item export: a backup is exactly
 * the kind of file someone might post for troubleshooting or hand to
 * someone else.
 */
export async function exportAllData(): Promise<string> {
  const [characters, campaigns, settings] = await Promise.all([
    listCharacters(),
    listCampaigns(),
    loadSettings(),
  ]);
  const envelope: BackupExport = {
    format: 'mejiro-backup',
    version: 1,
    characters: characters.map((c) => ({ ...c, webhookUrl: '' })),
    campaigns: campaigns.map((c) => ({ ...c, webhookUrl: '' })),
    settings,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Replace every character, campaign, and setting with the contents of a
 * backup file. Unlike the single-item import (which assigns a fresh id so
 * it never clobbers what's already there), ids and timestamps are kept
 * as-is — the whole store is being replaced, not merged into.
 */
export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json) as Partial<BackupExport>;
  if (
    data.format !== 'mejiro-backup' ||
    !Array.isArray(data.characters) ||
    !Array.isArray(data.campaigns)
  ) {
    throw new Error('Not a MEJIRO backup file');
  }
  const db = await getDB();
  await clearAllData();
  for (const raw of data.characters) {
    await db.put('characters', normalizeCharacter(raw));
  }
  for (const raw of data.campaigns) {
    await db.put('campaigns', normalizeCampaign(raw));
  }
  if (data.settings) {
    await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings, id: 'app' });
  }
}

/** Delete every character and campaign. Settings (theme, language, ...) are left alone. */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('characters');
  await db.clear('campaigns');
}
