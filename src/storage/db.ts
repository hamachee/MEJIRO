import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Character } from '../types/character';

/** Persisted app settings (single record, keyed by a fixed id). */
export interface AppSettings {
  id: 'app';
  /** UI language code, e.g. "en" | "ko". */
  uiLang: string;
  /** Language used for Discord output. */
  discordLang: string;
  /** Named Discord webhook URLs (label -> url). */
  webhooks: { id: string; label: string; url: string }[];
  /** Id of the webhook currently selected for posting. */
  activeWebhookId: string | null;
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
}

const DB_NAME = 'mejiro';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MejiroDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MejiroDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MejiroDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('characters')) {
          const store = db.createObjectStore('characters', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  uiLang: 'en',
  discordLang: 'en',
  webhooks: [],
  activeWebhookId: null,
};
