import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { Locale } from '@/types';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const locale = useLocale() as Locale;

  useEffect(() => {
    // Subscribe to global TTS state
    const handleStateChange = (state: boolean) => {
      setIsSpeaking(state);
    };

    TTSManager.onStateChange = handleStateChange;

    return () => {
      // Clean up subscription and stop audio if component unmounts
      TTSManager.onStateChange = undefined;
      TTSManager.stop();
    };
  }, []);

  const speak = useCallback(async (scenarioId: string, stepId: number, text: string, langOverride?: Locale) => {
    try {
      await TTSManager.speak(scenarioId, stepId, text, langOverride || locale);
    } catch (e) {
      console.error("TTS failed to speak:", e);
    }
  }, [locale]);

  const stop = useCallback(() => {
    TTSManager.stop();
  }, []);

  const toggle = useCallback(async (scenarioId: string, stepId: number, text: string, langOverride?: Locale) => {
    if (isSpeaking) {
      stop();
    } else {
      await speak(scenarioId, stepId, text, langOverride);
    }
  }, [isSpeaking, speak, stop]);

  return {
    speak,
    stop,
    toggle,
    isSpeaking
  };
}
