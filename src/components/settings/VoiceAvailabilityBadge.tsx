'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { checkVoiceAvailability, VoiceAvailability } from '@/lib/tts/TTSManager';
import { Locale } from '@/types';

const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ha', label: 'Hausa', native: 'Hausa' },
  { code: 'ig', label: 'Igbo', native: 'Igbo' },
  { code: 'yo', label: 'Yoruba', native: 'Yorùbá' },
  { code: 'pcm', label: 'Pidgin', native: 'Naijá' },
];

export function VoiceAvailabilityBadge() {
  const t = useTranslations('settings');
  const [availability, setAvailability] = useState<Record<Locale, VoiceAvailability> | null>(null);

  useEffect(() => {
    function update() {
      setAvailability(checkVoiceAvailability());
    }

    update();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', update);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', update);
      };
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-action" aria-hidden="true" />
          <span className="text-body font-bold text-text-primary">Browser TTS Voice Support</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary">
          Live Status
        </span>
      </div>

      <p className="text-xs text-text-secondary ml-8">
        {t('recordedNarrationAvailability')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 ml-0 sm:ml-8" role="list" aria-label="TTS Voice Availability by Language">
        {LANGUAGES.map((lang) => {
          const status = availability ? availability[lang.code] : null;
          const isSupported = status?.supported ?? false;

          return (
            <div
              key={lang.code}
              role="listitem"
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                isSupported
                  ? 'bg-action/5 border-action/20 text-action'
                  : 'bg-card border-border text-text-secondary'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary">
                  {lang.native} <span className="text-xs font-normal text-text-secondary">({lang.label})</span>
                </span>
                {status?.voiceName && (
                  <span className="text-[11px] text-text-secondary truncate max-w-[140px]">{status.voiceName}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isSupported ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-action bg-action/10 px-2 py-1 rounded-md">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary bg-slate-100 px-2 py-1 rounded-md">
                    {t('noDeviceVoice')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
