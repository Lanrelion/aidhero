"use client";

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useRescueStore } from '@/store/useRescueStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Check } from 'lucide-react';
import type { Locale } from '@/i18n/config';

interface LanguageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ha', label: 'Hausa', native: 'Hausa' },
  { code: 'ig', label: 'Igbo', native: 'Igbo' },
  { code: 'yo', label: 'Yoruba', native: 'Yorùbá' },
  { code: 'pcm', label: 'Nigerian Pidgin', native: 'Naijá' },
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
      // Use settings.confirmDuringRescue to match our existing i18n structure
      const confirmed = window.confirm(t('settings.confirmDuringRescue'));
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
      <SheetContent side="bottom" className="rounded-t-xl bg-surface px-0 pb-8">
        <SheetHeader className="px-6 pb-2 text-left">
          <SheetTitle className="text-h3 text-text-primary">
            {t('settings.language')}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col mt-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="flex items-center justify-between w-full h-16 px-6 text-left active:bg-card-active transition-colors"
              aria-current={currentLocale === lang.code ? 'true' : 'false'}
            >
              <div className="flex flex-col">
                <span className="text-body-lg font-medium text-text-primary">
                  {lang.native}
                </span>
                <span className="text-sm text-text-secondary">
                  {lang.label}
                </span>
              </div>
              {currentLocale === lang.code && (
                <Check className="w-6 h-6 text-emergency" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
