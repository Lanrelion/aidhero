"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, Mic } from 'lucide-react';
import { useRescueStore } from '@/store/useRescueStore';

export function SearchBar() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const setVoiceMode = useRescueStore(state => state.setVoiceMode);
  
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleFocus = () => {
    // If empty query, push to search page to show recent searches
    if (!query) {
      router.push(`/${locale}/search`);
    }
  };

  const startVoiceMode = () => {
    setVoiceMode(true);
    // Voice Mode logic will be handled later, for now we just flag it
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full h-[56px] flex items-center">
      <div className="absolute left-4 z-10 text-text-secondary pointer-events-none">
        <Search className="w-5 h-5" aria-hidden="true" />
      </div>
      
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        placeholder={t('home.searchPlaceholder')}
        className="w-full h-full pl-12 pr-14 rounded-lg bg-surface border-2 border-border focus:border-action focus:outline-none transition-colors text-body-lg text-text-primary shadow-sm"
        aria-label={t('home.searchPlaceholder')}
      />
      
      <button
        type="button"
        onClick={startVoiceMode}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-[40px] h-[40px] flex items-center justify-center rounded-md hover:bg-card active:bg-card-active transition-colors text-text-secondary"
        aria-label="Start Voice Search"
      >
        <Mic className="w-5 h-5" aria-hidden="true" />
      </button>
    </form>
  );
}
