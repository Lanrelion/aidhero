import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { categories, scenarios } from '@/lib/data/scenarios';
import { CATEGORY_ICONS } from '@/lib/utils/icons';

export default function CategoriesPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link 
            href={`/${locale}`}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-card active:bg-card-active transition-colors text-text-primary"
            aria-label={t('rescue.back') || "Back"}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-h3 font-display font-bold text-text-primary">
            {t('search.allCategories') || "All Categories"}
          </h1>
        </div>
      </header>

      {/* Grid Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] || AlertTriangle;
            const label = t(`incidents.${category.id}`) || category.name;
            const count = scenarios.filter(s => s.category === category.id).length;

            return (
              <Link
                key={category.id}
                href={`/${locale}/categories/${category.id}`}
                className="flex flex-col items-center text-center gap-3 p-4 bg-surface border border-border rounded-xl active:bg-card-active transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-card rounded-full text-emergency">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-body font-bold text-text-primary line-clamp-2 leading-tight">
                    {label}
                  </h3>
                  <span className="text-xs text-text-secondary mt-1 block">
                    {count} {count === 1 ? 'Incident' : 'Incidents'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
