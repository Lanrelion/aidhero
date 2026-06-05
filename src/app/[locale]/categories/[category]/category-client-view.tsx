"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import type { Scenario } from '@/types/scenario';
import { IncidentCard } from '@/components/ui/incident-card';
import { CATEGORY_ICONS } from '@/lib/utils/icons';

interface CategoryClientViewProps {
  locale: string;
  categoryId: string;
  scenarios: Scenario[];
}

export function CategoryClientView({ locale, categoryId, scenarios }: CategoryClientViewProps) {
  const t = useTranslations();
  const router = useRouter();

  const categoryLabel = t(`incidents.${categoryId}`) || categoryId;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link 
            href={`/${locale}/incidents`}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-card active:bg-card-active transition-colors text-text-primary"
            aria-label={t('rescue.back') || "Back"}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-h3 font-display font-bold text-text-primary capitalize">
            {categoryLabel}
          </h1>
        </div>
      </header>

      {/* Scenarios List */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col gap-3">
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-surface border border-border rounded-xl">
            <AlertTriangle className="w-8 h-8 text-text-tertiary mb-3" aria-hidden="true" />
            <p className="text-body text-text-secondary">
              No incidents found in this category.
            </p>
          </div>
        ) : (
          scenarios.map((sc) => {
            const Icon = CATEGORY_ICONS[sc.category] || AlertTriangle;
            const title = sc.title_translations[locale as keyof typeof sc.title_translations] || sc.title;
            const catLabel = t(`incidents.${sc.category}`) || sc.category;

            return (
              <IncidentCard
                key={sc.id}
                title={title}
                category={catLabel}
                severity={sc.severity as any}
                icon={Icon}
                onClick={() => router.push(`/${locale}/incidents/${sc.id}`)}
                className="w-full"
              />
            );
          })
        )}
      </main>
    </div>
  );
}
