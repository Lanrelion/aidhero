'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { TTSManager, type PlaybackResult } from '@/lib/tts/TTSManager';
import { Locale } from '@/types/index';

interface TTSContextValue {
  isSpeaking: boolean;
  currentWordIndex: number;
  speak: (scenarioId: string, stepId: number, text: string, lang: Locale, announceFailure?: boolean, highlightWords?: boolean) => Promise<PlaybackResult>;
  stop: () => void;
  toggle: (scenarioId: string, stepId: number, text: string, lang: Locale) => Promise<PlaybackResult>;
}

const TTSContext = createContext<TTSContextValue | null>(null);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('rescue');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  useEffect(() => {
    TTSManager.onStateChange = (state) => setIsSpeaking(state);
    TTSManager.onWordBoundary = (charIndex) => setCurrentWordIndex(charIndex);

    return () => {
      TTSManager.onStateChange = undefined;
      TTSManager.onWordBoundary = undefined;
      TTSManager.stop();
    };
  }, []);

  const speak = useCallback(async (scenarioId: string, stepId: number, text: string, lang: Locale, announceFailure = true, highlightWords = true) => {
    setAudioUnavailable(false);
    const result = await TTSManager.speak(scenarioId, stepId, text, lang, highlightWords);
    if (result === 'unavailable' && announceFailure) setAudioUnavailable(true);
    return result;
  }, []);

  const stop = useCallback(() => {
    TTSManager.stop();
  }, []);

  const toggle = useCallback(async (scenarioId: string, stepId: number, text: string, lang: Locale) => {
    if (isSpeaking) {
      stop();
      return 'stopped';
    }
    return speak(scenarioId, stepId, text, lang, false);
  }, [isSpeaking, speak, stop]);

  return (
    <TTSContext.Provider value={{ isSpeaking, currentWordIndex, speak, stop, toggle }}>
      {audioUnavailable && (
        <p role="status" className="mx-auto max-w-md px-4 py-2 text-text-secondary">
          {t('playbackUnavailable')}
        </p>
      )}
      {children}
    </TTSContext.Provider>
  );
}

export function useTTSContext() {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTSContext must be used within a TTSProvider');
  }
  return context;
}
