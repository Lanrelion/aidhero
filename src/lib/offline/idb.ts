import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Locale } from '../../../i18n/config';

interface AidHeroDB extends DBSchema {
  'aidhero-store': {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<AidHeroDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<AidHeroDB>('aidhero-db', 1, {
      upgrade(db) {
        db.createObjectStore('aidhero-store');
      },
    }).catch(err => {
      console.warn('IndexedDB unavailable (possibly private mode). Falling back to memory.', err);
      return null;
    });
  }
  return dbPromise;
}

interface IDBHelper {
  get(key: 'preferred-language'): Promise<Locale | undefined>;
  get(key: 'content-versions'): Promise<Record<string, number> | undefined>;
  get(key: 'recently-viewed'): Promise<string[] | undefined>;
  get<T>(key: string): Promise<T | undefined>;

  set(key: 'preferred-language', val: Locale): Promise<void>;
  set(key: 'content-versions', val: Record<string, number>): Promise<void>;
  set(key: 'recently-viewed', val: string[]): Promise<void>;
  set<T>(key: string, val: T): Promise<void>;

  remove(key: string): Promise<void>;
}

export const idb: IDBHelper = {
  async get<T>(key: string): Promise<any> {
    try {
      const db = await getDB();
      if (!db) return undefined;
      return await db.get('aidhero-store', key);
    } catch (err) {
      console.warn(`Failed to read ${key} from IndexedDB:`, err);
      return undefined;
    }
  },

  async set(key: string, val: any): Promise<void> {
    try {
      const db = await getDB();
      if (!db) return;
      await db.put('aidhero-store', val, key);
    } catch (err) {
      console.warn(`Failed to write ${key} to IndexedDB:`, err);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      const db = await getDB();
      if (!db) return;
      await db.delete('aidhero-store', key);
    } catch (err) {
      console.warn(`Failed to remove ${key} from IndexedDB:`, err);
    }
  },
};
