import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Character } from '../types/character';
import type { Campaign } from '../types/campaign';
import type { MessageTemplate } from '../types/messageTemplate';
import type { ThemeMode } from '../lib/theme';

/** Persisted app settings (single record, keyed by a fixed id). */
export interface AppSettings {
  id: 'app';
  /** UI language code, e.g. "en" | "ko". Also used for Discord output. */
  uiLang: string;
  /** Color scheme mode: dark, light, system, or by game rule. */
  themeMode: ThemeMode;
  /** Hex color for the curse dice, overriding the active scheme's own — applies in every mode. Empty uses the scheme default. */
  curseColor: string;
  /** Saved messages for the webhook message panel — per device, not synced with a character/campaign. */
  messageTemplates: MessageTemplate[];
}

interface MejiroDB extends DBSchema {
  characters: {
    key: string;
    value: Character;
    indexes: { 'by-updated': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  campaigns: {
    key: string;
    value: Campaign;
    indexes: { 'by-updated': number };
  };
}

const DB_NAME = 'mejiro';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<MejiroDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MejiroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MejiroDB>(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (!db.objectStoreNames.contains('characters')) {
          const store = db.createObjectStore('characters', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('campaigns')) {
          const store = db.createObjectStore('campaigns', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        // v2: the bundled Storypath Ultra template was replaced by Curseborne;
        // characters for templates that no longer exist are unusable — drop them.
        if (oldVersion >= 1 && oldVersion < 2) {
          let cursor = await tx.objectStore('characters').openCursor();
          while (cursor) {
            if (cursor.value.templateId !== 'curseborne') await cursor.delete();
            cursor = await cursor.continue();
          }
        }
      },
    });
  }
  return dbPromise;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  uiLang: 'ko',
  themeMode: 'system',
  curseColor: '',
  messageTemplates: [],
};
