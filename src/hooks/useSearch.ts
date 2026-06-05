import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { idb } from '@/lib/offline/idb';
import { scenarios } from '@/lib/data/scenarios';
import { synonyms } from '@/lib/search/synonyms';
import { ScenarioSearch, SearchResult } from '@/lib/search/index';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const locale = useLanguageStore((state) => state.language);

  // Initialize search engine once
  const searchEngine = useMemo(() => new ScenarioSearch(scenarios, synonyms), []);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      const res = searchEngine.search(query, locale);
      setResults(res);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, locale, searchEngine]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const selectResult = useCallback(async (scenarioId: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const recent = (await idb.get('recently-viewed')) || [];
      const updated = [scenarioId, ...recent.filter(id => id !== scenarioId)].slice(0, 5);
      await idb.set('recently-viewed', updated);
    } catch (e) {
      console.warn("Could not save to recently-viewed", e);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    selectResult
  };
}
