import { create } from 'zustand';
import type { Locale } from '../../i18n/config';
import { defaultLocale } from '../../i18n/config';
import { idb } from '@/lib/offline/idb';

interface LanguageStore {
  language: Locale;
  setLanguage: (lang: Locale) => Promise<void>;
  initLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: defaultLocale,
  
  setLanguage: async (lang: Locale) => {
    set({ language: lang });
    
    // 1. Persist to IndexedDB for PWA offline startup
    await idb.set('preferred-language', lang);
    
    // 2. Set cookie for next-intl SSR and middleware
    // This is CRITICAL for language switching to persist on page refresh
    if (typeof document !== 'undefined') {
      document.cookie = `aidhero-lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }
    
    // 3. Dispatch custom event for progressive audio caching (implemented later)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
    }
  },

  initLanguage: async () => {
    if (typeof window !== 'undefined') {
      const stored = await idb.get('preferred-language');
      if (stored) {
        set({ language: stored });
      }
    }
  }
}));

