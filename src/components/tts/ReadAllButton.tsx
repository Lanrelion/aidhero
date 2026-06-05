'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useTTS } from '@/hooks/useTTS';
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
  const { isSpeaking, speak, stop } = useTTS();
  const { currentStepIndex, advanceStep } = useRescueStore();
  
  const [isReadingAll, setIsReadingAll] = useState(false);
  
  // Track previous speaking state to detect when speech ends naturally
  const prevSpeakingRef = useRef(isSpeaking);

  const langName = LANGUAGE_NAMES[locale] || 'Language';

  const handleToggle = async () => {
    if (isReadingAll) {
      // Manually stopping
      setIsReadingAll(false);
      stop();
    } else {
      // Start reading all from current step
      setIsReadingAll(true);
      const currentStep = steps[currentStepIndex];
      if (currentStep) {
        const text = currentStep.instruction_translations[locale] || currentStep.instruction;
        await speak(scenarioId, currentStep.id, text, locale);
      }
    }
  };

  useEffect(() => {
    // If we are in "Read All" mode, and speech JUST finished
    if (isReadingAll && prevSpeakingRef.current === true && isSpeaking === false) {
      // Did we reach the end?
      if (currentStepIndex >= steps.length - 1) {
        setIsReadingAll(false);
      } else {
        // Wait 500ms then advance and read the next step
        const timer = setTimeout(async () => {
          advanceStep();
          // We can't speak here immediately because advanceStep updates state asynchronously.
          // We will handle the actual 'speak' in another effect when currentStepIndex changes.
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, isReadingAll, currentStepIndex, steps.length, advanceStep]);

  // When step index advances while in ReadAll mode, read the new step
  useEffect(() => {
    if (isReadingAll) {
      const currentStep = steps[currentStepIndex];
      if (currentStep) {
        const text = currentStep.instruction_translations[locale] || currentStep.instruction;
        speak(scenarioId, currentStep.id, text, locale).catch(() => {
          // If speak fails, cancel read all
          setIsReadingAll(false);
        });
      } else {
        setIsReadingAll(false);
      }
    }
  }, [currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // If user clicks a standard Play button elsewhere, we should cancel Read All mode
  // if it's playing something else. But since we use a global TTSManager, we can just 
  // assume if they hit stop elsewhere, we cancel.
  useEffect(() => {
    if (isReadingAll && !isSpeaking && prevSpeakingRef.current === false) {
      // If we are 'ReadingAll' but speaking hasn't even started after a short while,
      // or got interrupted abruptly. We handle this simply:
      // Actually, if someone stops it externally, isSpeaking becomes false. 
      // Handled above.
    }
  }, [isSpeaking, isReadingAll]);

  return (
    <button 
      onClick={handleToggle}
      className="flex items-center justify-center gap-3 w-full min-h-[56px] rounded-2xl bg-action text-white font-bold text-body-lg shadow-action active:scale-[0.98] transition-transform"
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
