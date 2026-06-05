'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Play, Square } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { useRescueStore } from '@/store/useRescueStore';
import { Locale } from '@/types/index';
import type { Step } from '@/types/scenario';

interface ReadAllButtonProps {
  scenarioId: string;
  steps: Step[];
}

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  ha: 'Hausa',
  ig: 'Igbo',
  yo: 'Yoruba',
  pcm: 'Pidgin'
};

export function ReadAllButton({ scenarioId, steps }: ReadAllButtonProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { currentStepIndex, advanceStep } = useRescueStore();
  
  const [isReadingAll, setIsReadingAll] = useState(false);
  
  // Ref mirrors state so the async loop can check it without stale closures
  const isReadingAllRef = useRef(false);

  const langName = LANGUAGE_NAMES[locale] || 'Language';

  const startReadingFrom = useCallback(async (startIndex: number) => {
    let idx = startIndex;

    while (isReadingAllRef.current && idx < steps.length) {
      const step = steps[idx];
      if (!step) break;

      const text = step.instruction_translations[locale] || step.instruction;

      // Await the speak() promise — resolves only when speech fully ends
      await TTSManager.speak(scenarioId, step.id, text, locale);

      // If user stopped in the meantime, bail out
      if (!isReadingAllRef.current) break;

      if (idx < steps.length - 1) {
        // 500ms breathing room between steps
        await new Promise<void>(r => setTimeout(r, 500));

        // Still running after the pause?
        if (!isReadingAllRef.current) break;

        advanceStep();
        idx++;
      } else {
        // Reached the last step
        break;
      }
    }

    // Always clean up
    isReadingAllRef.current = false;
    setIsReadingAll(false);
  }, [scenarioId, steps, locale, advanceStep]);

  const handleToggle = () => {
    if (isReadingAllRef.current) {
      // Stop
      isReadingAllRef.current = false;
      setIsReadingAll(false);
      TTSManager.stop();
    } else {
      // Start from current step
      isReadingAllRef.current = true;
      setIsReadingAll(true);
      startReadingFrom(currentStepIndex);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className="flex items-center justify-center gap-3 w-full min-h-[56px] rounded-2xl bg-action text-white font-bold text-body-lg shadow-action active:scale-[0.98] transition-transform mb-6"
      aria-label={isReadingAll ? "Stop reading all" : `Read all steps in ${langName}`}
    >
      {isReadingAll ? (
        <>
          <Square className="w-5 h-5 fill-current" />
          {t('rescue.stopAudio') || "Stop"}
        </>
      ) : (
        <>
          <Play className="w-5 h-5 fill-current" />
          {t('rescue.readAll') || "Read all steps in"} {langName}
        </>
      )}
    </button>
  );
}
