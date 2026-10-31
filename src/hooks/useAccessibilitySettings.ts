'use client';

import { useEffect, useState } from 'react';
import { getSetting, setSetting } from '@/lib/storage/settings';

export type TextScale = 'normal' | 'large' | 'xl';

interface AccessibilitySettings {
  textScale: TextScale;
  highContrast: boolean;
  autoplayTts: boolean;
  isLoaded: boolean;
  setTextScale: (scale: TextScale) => void;
  setHighContrast: (enabled: boolean) => void;
  setAutoplayTts: (enabled: boolean) => void;
}

export function useAccessibilitySettings(): AccessibilitySettings {
  const [textScale, setTextScaleState] = useState<TextScale>('normal');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [autoplayTts, setAutoplayTtsState] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const savedScale = await getSetting('text-scale', 'normal');
      const savedContrast = await getSetting('high-contrast', false);
      const savedAutoplay = await getSetting('autoplay-tts', false);

      setTextScaleState(savedScale as TextScale);
      setHighContrastState(Boolean(savedContrast));
      setAutoplayTtsState(Boolean(savedAutoplay));
      
      applyAttributes(savedScale as TextScale, Boolean(savedContrast));
      setIsLoaded(true);
    }
    loadSettings();
  }, []);

  const applyAttributes = (scale: TextScale, contrast: boolean) => {
    if (typeof document === 'undefined') return;
    
    if (contrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }

    if (scale === 'normal') {
      document.documentElement.removeAttribute('data-text-scale');
    } else {
      document.documentElement.setAttribute('data-text-scale', scale);
    }
  };

  const setTextScale = async (scale: TextScale) => {
    setTextScaleState(scale);
    applyAttributes(scale, highContrast);
    await setSetting('text-scale', scale);
  };

  const setHighContrast = async (enabled: boolean) => {
    setHighContrastState(enabled);
    applyAttributes(textScale, enabled);
    await setSetting('high-contrast', enabled);
  };

  const setAutoplayTts = async (enabled: boolean) => {
    setAutoplayTtsState(enabled);
    await setSetting('autoplay-tts', enabled);
  };

  return {
    textScale,
    highContrast,
    autoplayTts,
    isLoaded,
    setTextScale,
    setHighContrast,
    setAutoplayTts
  };
}
