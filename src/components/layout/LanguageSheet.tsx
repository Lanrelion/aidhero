"use client";

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useRescueStore } from '@/store/useRescueStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
import type { Locale } from '@/types';

interface LanguageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES: { code: Locale; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'ha', label: 'Hausa', native: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', native: 'Igbo', flag: '🇳🇬' },
  { code: 'yo', label: 'Yoruba', native: 'Yorùbá', flag: '🇳🇬' },
  { code: 'pcm', label: 'Nigerian Pidgin', native: 'Naijá', flag: '🇳🇬' },
];

export function LanguageSheet({ open, onOpenChange }: LanguageSheetProps) {
  const t = useTranslations();
  const currentLocale = useLocale() as Locale;
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  
  const router = useRouter();
  const pathname = usePathname();
  const activeScenario = useRescueStore((state) => state.activeScenario);

  const handleSelect = async (lang: Locale) => {
    if (activeScenario) {
      const confirmed = window.confirm(t('settings.confirmDuringRescue') || "Change language during active rescue?");
      if (!confirmed) return;
    }

    await setLanguage(lang);
    onOpenChange(false);
    
    // Swap locale prefix in current path
    const newPath = pathname.replace(`/${currentLocale}`, `/${lang}`);
    router.push(newPath);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl bg-surface px-0 pb-8 border-t border-border">
        <SheetHeader className="px-6 pb-2 text-left">
          <SheetTitle className="text-h3 font-bold text-text-primary">
            {t('settings.language') || "Language"}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col mt-2 divide-y divide-border/40" role="list">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLocale === lang.code;
            return (
              <button
                key={lang.code}
                role="listitem"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between w-full h-16 min-h-[64px] px-6 text-left active:bg-card-active transition-colors ${
                  isSelected ? 'bg-emergency/5' : 'hover:bg-card'
                }`}
                aria-current={isSelected ? 'true' : 'false'}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-base font-bold ${isSelected ? 'text-emergency' : 'text-text-primary'}`}>
                      {lang.native}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {lang.label}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-5 h-5 text-emergency shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
