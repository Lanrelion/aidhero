"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useRescueStore } from '@/store/useRescueStore';

export function ContentUpdateBanner() {
  const t = useTranslations();
  const hasUpdate = useOfflineStore((state) => state.hasUpdate);
  const activeScenario = useRescueStore((state) => state.activeScenario);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasUpdate && !activeScenario) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasUpdate, activeScenario]);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-action text-text-inverse px-4 py-3 shadow-float animate-in slide-in-from-top-full duration-300"
      role="alert"
    >
      <div className="flex items-center justify-center max-w-md mx-auto text-center">
        <p className="text-sm font-medium">
          {t('offline.updated')}
        </p>
      </div>
    </div>
  );
}
