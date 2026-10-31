'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { checkForUpdates } from '@/lib/offline/contentVersion';
import { registerServiceWorker } from '@/lib/offline/serviceWorker';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { Locale } from '@/types';

export function ClientInitializer() {
  const locale = useLocale() as Locale;
  const { setLanguage, initLanguage } = useLanguageStore();

  // Calling this hook globally ensures it reads from IndexedDB on app mount
  // and applies the data-text-scale and data-contrast attributes.
  useAccessibilitySettings();
  
  useEffect(() => {
    if (locale) {
      setLanguage(locale);
    } else {
      initLanguage();
    }

    // Run content version check silently in the background
    checkForUpdates();
    // Register Service Worker
    registerServiceWorker();
  }, [locale, setLanguage, initLanguage]);

  return null;
}
