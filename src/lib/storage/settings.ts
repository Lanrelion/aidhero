import { openDB } from 'idb';

const DB_NAME = 'aidhero-settings';
const STORE_NAME = 'settings';

export async function initSettingsDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await initSettingsDB();
    const val = await db.get(STORE_NAME, key);
    return val !== undefined ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: any): Promise<void> {
  try {
    const db = await initSettingsDB();
    await db.put(STORE_NAME, value, key);
  } catch (e) {
    console.error('Failed to save setting to IndexedDB:', e);
  }
}
