"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { idb } from '@/lib/offline/idb';
import { getScenario } from '@/lib/data/scenarios';
import type { Scenario } from '@/types/scenario';

export function RecentSearches() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [recent, setRecent] = useState<Scenario[]>([]);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    const ids = await idb.get('recently-viewed');
    if (ids && ids.length > 0) {
      const scenarios = ids
        .map(id => getScenario(id))
        .filter((sc): sc is Scenario => sc !== undefined)
        .slice(0, 5);
      setRecent(scenarios);
    }
  };

  const handleClear = async () => {
    await idb.remove('recently-viewed');
    setRecent([]);
  };

  if (recent.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          {t('search.recentSearches')}
        </h2>
        <button
          onClick={handleClear}
          className="text-sm font-medium text-text-secondary active:text-emergency transition-colors p-2 -mr-2 min-h-[44px]"
        >
          {t('search.clearRecent')}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {recent.map((sc) => (
          <button
            key={sc.id}
            onClick={() => router.push(`/${locale}/incidents/${sc.id}`)}
            className="flex items-center min-h-[48px] px-4 rounded-full bg-card border border-border text-sm font-medium text-text-primary active:bg-card-active transition-colors"
          >
            {sc.title_translations[locale as keyof typeof sc.title_translations] || sc.title}
          </button>
        ))}
      </div>
    </div>
  );
}
