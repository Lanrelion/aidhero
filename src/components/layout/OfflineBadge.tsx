"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useOfflineStore } from '@/store/useOfflineStore';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export function OfflineBadge() {
  const t = useTranslations();
  const { isOnline, isCached, initOfflineState } = useOfflineStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initOfflineState();
    setMounted(true);
  }, [initOfflineState]);

  if (!mounted) return null;

  // Online + cached: green pill "Offline Ready"
  if (isOnline && isCached) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-action/10 border border-action/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-action" aria-hidden="true" />
        <span className="text-xs font-medium text-action">
          {t('offline.ready')}
        </span>
      </div>
    );
  }

  // Offline + cached: same style, changes label
  if (!isOnline && isCached) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-action/10 border border-action/20">
        <WifiOff className="w-3.5 h-3.5 text-action" aria-hidden="true" />
        <span className="text-xs font-medium text-action">
          {t('offline.active')}
        </span>
      </div>
    );
  }

  // Not cached + online: amber banner
  if (isOnline && !isCached) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20">
        <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
        <span className="text-xs font-medium text-warning">
          {t('offline.downloading')}
        </span>
      </div>
    );
  }

  // Offline + not cached: error state
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emergency/10 border border-emergency/20">
      <WifiOff className="w-3.5 h-3.5 text-emergency" aria-hidden="true" />
      <span className="text-xs font-medium text-emergency">
        {t('offline.limited')}
      </span>
    </div>
  );
}
