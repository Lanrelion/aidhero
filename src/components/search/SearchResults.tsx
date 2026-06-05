import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { SearchResult } from '@/lib/search/index';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { Heart, Wind, Brain, Droplets, Zap, Flame, AlertTriangle, Baby, User, Eye, AlertCircle, Sun } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cardiac: Heart,
  respiratory: Wind,
  neurological: Brain,
  trauma: Zap,
  burns: Flame,
  environmental: Sun,
  poisoning: AlertTriangle,
  obstetric: Baby,
  paediatric: User,
  "eye/ent": Eye,
  diabetic: Droplets,
  allergic: AlertCircle
};

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (scenarioId: string) => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {results.slice(0, 5).map((res) => {
        const Icon = CATEGORY_ICONS[res.category] || AlertTriangle;
        const categoryLabel = t(`incidents.${res.category}`) || res.category;

        return (
          <button
            key={res.scenarioId}
            onClick={() => {
              onSelect(res.scenarioId);
              router.push(`/${locale}/incidents/${res.scenarioId}`);
            }}
            className="flex items-start gap-4 p-4 min-h-[56px] bg-surface border border-border rounded-xl active:bg-card-active transition-colors text-left"
          >
            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-card rounded-full text-emergency mt-0.5">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-body-lg font-bold text-text-primary leading-tight">
                  {res.title}
                </h3>
                <SeverityBadge severity={res.severity as any} />
              </div>
              
              <span className="text-sm text-text-secondary capitalize mb-1">
                {categoryLabel}
              </span>
              
              {res.matchedAlias && (
                <span className="text-xs text-action font-medium">
                  {/* We hardcode "Matched via:" or could add to i18n, assuming inline is ok per prompt if not specified */}
                  Matched via: "{res.matchedAlias}"
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
