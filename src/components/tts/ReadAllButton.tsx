'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { getStepNarration } from '@/lib/tts/stepNarration';
import { useTTS } from '@/hooks/useTTS';
import { useRescueStore } from '@/store/useRescueStore';
import { Locale } from '@/types/index';
import type { Step } from '@/types/scenario';

interface ReadAllButtonProps {
  scenarioId: string;
  steps: Step[];
  requestedLocale: Locale;
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ha: 'Hausa',
  ig: 'Igbo',
  yo: 'Yoruba',
  pcm: 'Pidgin'
};

export function ReadAllButton({ scenarioId, steps, requestedLocale }: ReadAllButtonProps) {
  const t = useTranslations();
  const { currentStepIndex, advanceStep } = useRescueStore();
  const { speak } = useTTS();
  
  const [isReadingAll, setIsReadingAll] = useState(false);
  
  const sessionRef = useRef(0);

  const remainingLocales = new Set(steps.slice(currentStepIndex).map(step => getStepNarration(step, requestedLocale).locale));
  const firstLocale = remainingLocales.values().next().value ?? requestedLocale;
  const playLabel = remainingLocales.size > 1
    ? t('rescue.readAllMixed')
    : `${t('rescue.readAll')} ${LANGUAGE_NAMES[firstLocale]}`;

  const startReadingFrom = useCallback(async (startIndex: number, session: number) => {
    let idx = startIndex;

    while (sessionRef.current === session && idx < steps.length) {
      const step = steps[idx];
      if (!step) break;

      const { text, locale } = getStepNarration(step, requestedLocale);

      const playback = speak(scenarioId, step.id, text, locale);
      const version = TTSManager.version;
      const result = await playback;
      if (result !== 'finished' || sessionRef.current !== session) break;

      if (idx < steps.length - 1) {
        // 500ms breathing room between steps
        await new Promise<void>(r => setTimeout(r, 500));

        // Still running after the pause?
        if (sessionRef.current !== session || TTSManager.version !== version ||
            useRescueStore.getState().currentStepIndex !== idx) break;

        advanceStep();
        idx++;
      } else {
        // Reached the last step
        break;
      }
    }

    if (sessionRef.current === session) setIsReadingAll(false);
  }, [scenarioId, steps, requestedLocale, advanceStep, speak]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sessionRef.current++;
    };
  }, []);

  const handleToggle = () => {
    const session = ++sessionRef.current;
    if (isReadingAll) {
      // Stop
      setIsReadingAll(false);
      TTSManager.stop();
    } else {
      // Start from current step
      setIsReadingAll(true);
      void startReadingFrom(currentStepIndex, session);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className="flex items-center justify-center gap-3 w-full min-h-[56px] rounded-2xl bg-action text-white font-bold text-body-lg shadow-action active:scale-[0.98] transition-transform mb-6"
      aria-label={isReadingAll ? "Stop reading all" : playLabel}
    >
      {isReadingAll ? (
        <>
          <Square className="w-5 h-5 fill-current" />
          {t('rescue.stopAudio') || "Stop"}
        </>
      ) : (
        <>
          <Play className="w-5 h-5 fill-current" />
          {playLabel}
        </>
      )}
    </button>
  );
}
