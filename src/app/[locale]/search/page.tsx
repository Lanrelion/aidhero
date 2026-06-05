"use client";

import { useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { RecentSearches } from '@/components/search/RecentSearches';
import { useSearch } from '@/hooks/useSearch';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function SearchScreenContent() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Grab initial query from URL (e.g. if arriving from Home screen submit)
  const initialQ = searchParams.get('q') || '';
  
  const { query, setQuery, results, isSearching, selectResult } = useSearch(initialQ);

  // If query is empty, we show recent + categories
  const showIdleState = !query.trim();

  // If we have a query, finished searching, and 0 results
  const showNoResults = !showIdleState && !isSearching && results.length === 0;

  return (
    <div className="flex flex-col min-h-full pb-20 pt-4 px-4 max-w-md mx-auto w-full space-y-6">
      
      <SearchBar 
        autoFocus={true} 
        value={query} 
        onChange={setQuery} 
      />

      {showIdleState && (
        <div className="space-y-6 mt-4">
          <RecentSearches />
          
          <div className="pt-2 border-t border-border">
            <Link 
              href={`/${locale}/incidents`}
              className="flex items-center justify-between w-full min-h-[56px] px-4 rounded-xl bg-surface border border-border shadow-sm active:bg-card-active transition-colors"
            >
              <span className="font-bold text-text-primary">
                {t('search.allCategories')}
              </span>
              <ArrowRight className="w-5 h-5 text-action" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {!showIdleState && !showNoResults && (
        <SearchResults 
          results={results} 
          onSelect={selectResult} 
        />
      )}

      {showNoResults && (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-surface border border-border rounded-xl mt-4">
          <h2 className="text-body-lg font-bold text-text-primary mb-2">
            {t('search.noResults', { query })}
          </h2>
          <p className="text-sm text-text-secondary">
            {t('search.trySuggestions')}
          </p>
        </div>
      )}

    </div>
  );
}

export default function SearchScreen() {
  return (
    <Suspense fallback={<div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-action border-t-transparent rounded-full animate-spin"></div></div>}>
      <SearchScreenContent />
    </Suspense>
  );
}
