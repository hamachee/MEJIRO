import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Character } from '../types/character';

/** Persisted app settings (single record, keyed by a fixed id). */
export interface AppSettings {
  id: 'app';
  /** UI language code, e.g. "en" | "ko". */
  uiLang: string;
  /** Language used for Discord output. */
  discordLang: string;
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
const DB_VERSION = 2;

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
  uiLang: 'en',
  discordLang: 'en',
};
