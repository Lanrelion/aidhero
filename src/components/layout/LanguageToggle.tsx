"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { LanguageSheet } from './LanguageSheet';
import type { Locale } from '@/i18n/config';

export function LanguageToggle() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        aria-label={t('accessibility.changeLanguage')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card active:bg-card-active transition-colors border border-border"
      >
        <Globe className="w-4 h-4 text-text-primary" aria-hidden="true" />
        <span className="text-sm font-bold text-text-primary uppercase">
          {locale}
        </span>
      </button>
      
      <LanguageSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
