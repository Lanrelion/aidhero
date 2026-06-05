'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { TTSManager } from '@/lib/tts/TTSManager';
import { Locale } from '@/types/index';

interface TTSContextValue {
  isSpeaking: boolean;
  currentWordIndex: number;
  speak: (scenarioId: string, stepId: number, text: string, lang: Locale) => Promise<void>;
  stop: () => void;
  toggle: (scenarioId: string, stepId: number, text: string, lang: Locale) => Promise<void>;
}

const TTSContext = createContext<TTSContextValue | null>(null);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    TTSManager.onStateChange = (state) => setIsSpeaking(state);
    TTSManager.onWordBoundary = (charIndex) => setCurrentWordIndex(charIndex);

    return () => {
      TTSManager.onStateChange = undefined;
      TTSManager.onWordBoundary = undefined;
      TTSManager.stop();
    };
  }, []);

  const speak = useCallback(async (scenarioId: string, stepId: number, text: string, lang: Locale) => {
    try {
      await TTSManager.speak(scenarioId, stepId, text, lang);
    } catch (e) {
      console.error("TTS failed to speak:", e);
    }
  }, []);

  const stop = useCallback(() => {
    TTSManager.stop();
  }, []);

  const toggle = useCallback(async (scenarioId: string, stepId: number, text: string, lang: Locale) => {
    if (isSpeaking) {
      stop();
    } else {
      await speak(scenarioId, stepId, text, lang);
    }
  }, [isSpeaking, speak, stop]);

  return (
    <TTSContext.Provider value={{ isSpeaking, currentWordIndex, speak, stop, toggle }}>
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
