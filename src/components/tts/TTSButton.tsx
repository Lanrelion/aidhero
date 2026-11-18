'use client';

import { Play, Square } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
import { Locale } from '@/types/index';

interface TTSButtonProps {
  scenarioId: string;
  stepId: number;
  text: string;
  englishText: string;
  narrationLocale: Locale;
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

export function TTSButton({ scenarioId, stepId, text, englishText, narrationLocale, size = 'lg', className }: TTSButtonProps) {
  const t = useTranslations();
  const { speak, stop, toggle, isSpeaking } = useTTS();
  const [failedLocale, setFailedLocale] = useState<Locale | null>(null);
  const [playingEnglish, setPlayingEnglish] = useState(false);
  
  const langName = LANGUAGE_NAMES[narrationLocale];

  const handleClick = async (locale: Locale, instruction: string) => {
    setFailedLocale(null);
    const result = await toggle(scenarioId, stepId, instruction, locale);
    if (result === 'unavailable') setFailedLocale(locale);
  };

  const handleEnglish = async () => {
    if (playingEnglish) {
      stop();
      return;
    }
    setPlayingEnglish(true);
    // English audio can play while the card continues to display the localized step.
    await speak(scenarioId, stepId, englishText, 'en', false, false);
    setPlayingEnglish(false);
  };

  return (
    <>
    <button 
      disabled={playingEnglish}
      onClick={() => void handleClick(narrationLocale, text)}
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
    {failedLocale && (
      <p role="status" className="mt-3 text-sm text-text-secondary">
        {t('rescue.playbackUnavailable')}
      </p>
    )}
    {failedLocale === narrationLocale && narrationLocale !== 'en' && (
      <button
        type="button"
        onClick={() => void handleEnglish()}
        className="mt-2 min-h-16 w-full rounded-2xl border-2 border-border bg-card px-4 font-bold text-text-primary"
      >
        {playingEnglish ? t('rescue.stopAudio') : `${t('rescue.playAudio')} English`}
      </button>
    )}
    </>
  );
}
