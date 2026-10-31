'use client';

import { Play, Square } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Locale } from '@/types/index';

interface TTSButtonProps {
  scenarioId: string;
  stepId: number;
  text: string;
  size?: 'sm' | 'lg';
  className?: string;
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ha: 'Hausa',
  ig: 'Igbo',
  yo: 'Yoruba',
  pcm: 'Pidgin'
};

export function TTSButton({ scenarioId, stepId, text, size = 'lg', className }: TTSButtonProps) {
  const t = useTranslations();
  const routeLocale = useLocale() as Locale;
  const { language } = useLanguageStore();
  const currentLang = (language && language !== 'en') ? language : (routeLocale || language);
  const { toggle, isSpeaking } = useTTS();
  
  const langName = LANGUAGE_NAMES[currentLang] || 'Language';

  const handleClick = () => {
    toggle(scenarioId, stepId, text, currentLang);
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center gap-3 rounded-2xl border-2 font-bold transition-all active:scale-[0.98]",
        size === 'lg' ? "min-h-[64px] text-body-lg w-full" : "min-h-[48px] text-body px-4",
        isSpeaking 
          ? "bg-emergency/10 border-emergency text-emergency" 
          : "bg-card border-border text-text-primary hover:bg-card-active",
        className
      )}
      aria-label={isSpeaking ? t('rescue.stopAudio') || "Stop audio" : `${t('rescue.playAudio') || "Play in"} ${langName}`}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <>
          <div className="flex gap-1 items-end h-4 mr-1">
            <span className="w-1 h-2 bg-emergency motion-safe:animate-[wave_1s_ease-in-out_infinite]" />
            <span className="w-1 h-4 bg-emergency motion-safe:animate-[wave_1s_ease-in-out_infinite_0.2s]" />
            <span className="w-1 h-3 bg-emergency motion-safe:animate-[wave_1s_ease-in-out_infinite_0.4s]" />
          </div>
          <Square className="w-5 h-5 fill-current" />
          {t('rescue.stopAudio') || "Stop"}
        </>
      ) : (
        <>
          <Play className="w-5 h-5 text-action fill-action" />
          {t('rescue.playAudio') || "Play in"} {langName}
        </>
      )}
    </button>
  );
}
