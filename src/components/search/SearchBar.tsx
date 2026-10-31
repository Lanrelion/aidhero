"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

interface SearchBarProps {
  autoFocus?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

export function SearchBar({ autoFocus = false, value, onChange }: SearchBarProps = {}) {
  const t = useTranslations();
  
  const [internalQuery, setInternalQuery] = useState(value || '');

  // Sync prop changes (e.g. from URL)
  useEffect(() => {
    if (value !== undefined) {
      setInternalQuery(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalQuery(val);
    if (onChange) {
      onChange(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full h-[56px] flex items-center">
      <div className="absolute left-4 z-10 text-text-secondary pointer-events-none">
        <Search className="w-5 h-5" aria-hidden="true" />
      </div>
      
      <input
        type="search"
        value={internalQuery}
        onChange={handleChange}
        autoFocus={autoFocus}
        placeholder={t('home.searchPlaceholder')}
        className="w-full h-full pl-12 pr-4 rounded-lg bg-surface border-2 border-border focus:border-action focus:outline-none transition-colors text-body-lg text-text-primary shadow-sm"
        aria-label={t('home.searchPlaceholder')}
      />
    </form>
  );
}
