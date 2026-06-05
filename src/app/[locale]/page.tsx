"use client";

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Heart, Wind, Brain, Droplets, Zap, Flame, Phone } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { IncidentCard } from '@/components/ui/incident-card';
import { idb } from '@/lib/offline/idb';
import { getScenario } from '@/lib/data/scenarios';
import type { Scenario } from '@/types/scenario';

const POPULAR_SLUGS = [
  { slug: 'heart-attack', icon: Heart },
  { slug: 'choking-adult', icon: Wind },
  { slug: 'stroke', icon: Brain },
  { slug: 'severe-bleeding', icon: Droplets },
  { slug: 'seizure', icon: Zap },
  { slug: 'burns', icon: Flame } // We didn't build a seed scenario for burns, but we render the card as requested
];

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [recentScenarios, setRecentScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const recentIds = await idb.get('recently-viewed');
      if (recentIds && recentIds.length > 0) {
        const scenarios = recentIds
          .map(id => getScenario(id))
          .filter((sc): sc is Scenario => sc !== undefined);
        setRecentScenarios(scenarios);
      }
    };
    fetchRecent();
  }, []);

  const navigateToIncident = (slug: string) => {
    router.push(`/${locale}/incidents/${slug}`);
  };

  const navigateToEmergency = () => {
    router.push(`/${locale}/emergency`);
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* 1. Emergency CTA Strip */}
      <button
        onClick={navigateToEmergency}
        aria-label={t('accessibility.emergencyCallStrip')}
        className="w-full h-[72px] bg-emergency text-text-inverse flex items-center justify-center gap-3 active:opacity-90 transition-opacity shrink-0"
      >
        <Phone className="w-6 h-6 animate-pulse" aria-hidden="true" />
        <span className="text-h2 font-bold tracking-wide">
          {t('home.emergencyCall')}
        </span>
      </button>

      <div className="flex-1 px-4 pt-6 space-y-8 max-w-md mx-auto w-full">
        
        {/* 2. Search Bar */}
        <section>
          <SearchBar />
        </section>

        {/* 4. Recently Viewed (renders before popular if it exists) */}
        {recentScenarios.length > 0 && (
          <section>
            <h2 className="text-h3 font-bold text-text-primary mb-4">
              {t('search.recentSearches')}
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x hide-scrollbar">
              {recentScenarios.map(sc => (
                <div key={sc.id} className="snap-start shrink-0 w-[240px]">
                  <IncidentCard
                    title={sc.title_translations[locale as keyof typeof sc.title_translations] || sc.title}
                    category={t(`incidents.${sc.category}`) || sc.category}
                    severity={sc.severity}
                    icon={Heart} // generic or matched
                    onClick={() => navigateToIncident(sc.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Popular Incidents Grid */}
        <section>
          <h2 className="text-h3 font-bold text-text-primary mb-4">
            {t('home.sectionHeaders')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {POPULAR_SLUGS.map((item) => {
              const sc = getScenario(item.slug);
              // Fallbacks if we haven't seeded this scenario yet (like burns)
              const title = sc ? (sc.title_translations[locale as keyof typeof sc.title_translations] || sc.title) : item.slug;
              const category = sc ? (t(`incidents.${sc.category}`) || sc.category) : "Trauma";
              const severity = sc ? sc.severity : "urgent";

              return (
                <IncidentCard
                  key={item.slug}
                  title={title}
                  category={category}
                  severity={severity as any}
                  icon={item.icon}
                  onClick={() => navigateToIncident(item.slug)}
                />
              );
            })}
          </div>
        </section>
        
      </div>
    </div>
  );
}
