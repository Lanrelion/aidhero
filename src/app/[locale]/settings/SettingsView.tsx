'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Download, Globe, Moon, Type, Info, PlayCircle } from 'lucide-react';
import { getSetting, setSetting } from '@/lib/storage/settings';
import { Locale } from '@/types';
import Link from 'next/link';
import { LanguageSheet } from '@/components/layout/LanguageSheet';
import { VoiceAvailabilityBadge } from '@/components/settings/VoiceAvailabilityBadge';
import { useAccessibilitySettings, TextScale } from '@/hooks/useAccessibilitySettings';
import { idb } from '@/lib/offline/idb';

interface SettingsViewProps {
  locale: Locale;
}

export function SettingsView({ locale }: SettingsViewProps) {
  const t = useTranslations();
  const [stepDuration, setStepDuration] = useState<number | 'manual'>(30);
  const [isMounted, setIsMounted] = useState(false);
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [contentDownloaded, setContentDownloaded] = useState(false);
  const [downloadedAudioLangs, setDownloadedAudioLangs] = useState<string[]>([]);

  const {
    textScale,
    highContrast,
    autoplayTts,
    isLoaded: accLoaded,
    setTextScale,
    setHighContrast,
    setAutoplayTts
  } = useAccessibilitySettings();

  useEffect(() => {
    async function loadSettings() {
      const duration = await getSetting('voice-mode-step-duration', 30);
      if (duration !== undefined && duration !== null) {
        setStepDuration(duration as number | 'manual');
      }

      try {
        const versions = await idb.get('content-versions');
        setContentDownloaded(!!versions);

        const audios = [];
        for (const l of ['en', 'ha', 'ig', 'yo', 'pcm']) {
          const hasAudio = await idb.get(`audio-downloaded-${l}`);
          if (hasAudio) {
            audios.push(getLanguageName(l));
          }
        }
        setDownloadedAudioLangs(audios);
      } catch (err) {
        console.error('Failed to load offline status', err);
      }

      setIsMounted(true);
    }
    loadSettings();
  }, []);

  const handleDurationChange = async (val: number | 'manual') => {
    setStepDuration(val);
    await setSetting('voice-mode-step-duration', val);
  };

  const getLanguageName = (code: string) => {
    switch(code) {
      case 'en': return 'English';
      case 'ha': return 'Hausa';
      case 'ig': return 'Igbo';
      case 'yo': return 'Yorùbá';
      case 'pcm': return 'Naijá';
      default: return code;
    }
  };

  if (!isMounted || !accLoaded) return null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* General Settings */}
      <section className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary ml-1 mb-2">
          {t('settings.general') || 'General'}
        </h2>
        
        <button 
          onClick={() => setLangSheetOpen(true)}
          className="flex items-center justify-between py-3 border-b border-border/50 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-action" />
            <span className="text-body font-bold text-text-primary">{t('settings.language') || 'Language'}</span>
          </div>
          <span className="text-text-secondary text-sm font-bold">{getLanguageName(locale)}</span>
        </button>

        <Link href={`/${locale}/settings/offline`} className="flex flex-col gap-2 py-3 active:scale-[0.98] transition-transform group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-action" aria-hidden="true" />
              <span className="text-body font-bold text-text-primary">{t('settings.offline') || 'Offline Mode'}</span>
            </div>
            <span className="text-text-secondary text-sm font-bold group-hover:text-action transition-colors">{t('settings.manage') || 'Manage'}</span>
          </div>
          <div className="flex flex-col gap-0.5 ml-8 text-sm text-text-secondary">
            <span>{t('settings.contentDownloaded') || 'Content downloaded'}: {contentDownloaded ? t('common.yes') || 'Yes' : t('common.no') || 'No'}</span>
            {downloadedAudioLangs.length > 0 ? (
              <span>{t('settings.audioDownloadedFor') || 'Audio downloaded for'}: {downloadedAudioLangs.join(', ')}</span>
            ) : (
              <span>{t('settings.audioDownloadedFor') || 'Audio downloaded for'}: {t('common.none') || 'None'}</span>
            )}
          </div>
        </Link>
      </section>

      {/* Accessibility & Audio */}
      <section className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary ml-1">
          {t('settings.accessibility') || 'Accessibility'}
        </h2>

        {/* Text Size */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-action" aria-hidden="true" />
            <span className="text-body font-bold text-text-primary">{t('settings.textSize') || 'Text Size'}</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['normal', 'large', 'xl'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setTextScale(scale)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  textScale === scale 
                    ? 'bg-white shadow-sm text-action' 
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {scale === 'normal' ? (t('settings.scaleNormal') || 'Normal') : scale === 'large' ? (t('settings.scaleLarge') || 'Large') : (t('settings.scaleXL') || 'Extra Large')}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-action" aria-hidden="true" />
              <span className="text-body font-bold text-text-primary">{t('settings.highContrast') || 'High Contrast'}</span>
            </div>
            <span className="text-sm text-text-secondary ml-8">{t('settings.highContrastDesc') || 'Maximum legibility mode'}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              aria-label={t('settings.highContrast') || 'High Contrast'}
            />
            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-action"></div>
          </label>
        </div>

        {/* Auto-play TTS */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-action" aria-hidden="true" />
              <span className="text-body font-bold text-text-primary">{t('settings.autoplayVoice') || 'Auto-play Voice'}</span>
            </div>
            <span className="text-sm text-text-secondary ml-8">{t('settings.autoplayVoiceDesc') || 'Read steps aloud automatically'}</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={autoplayTts}
              onChange={(e) => setAutoplayTts(e.target.checked)}
              aria-label={t('settings.autoplayVoice') || 'Auto-play Voice'}
            />
            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-action"></div>
          </label>
        </div>

        {/* Voice Availability per Language */}
        <VoiceAvailabilityBadge />
      </section>

      {/* Voice Mode Advanced */}
      <section className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <h2 className="text-body-lg font-bold text-text-primary flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-action" aria-hidden="true" />
          {t('settings.offlineVoiceModeFallback') || 'Offline Voice Mode Fallback'}
        </h2>
        <p className="text-body text-text-secondary mb-4">
          {t('settings.offlineVoiceModeDesc') || 'Choose how long to wait before automatically advancing to the next step when voice commands are unavailable offline.'}
        </p>
        
        <div className="flex flex-col gap-2">
          {(['manual', 15, 30, 60] as const).map((option) => (
            <label key={option} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-card active:scale-[0.98] transition-all cursor-pointer">
              <span className="text-body font-bold text-text-primary capitalize">
                {option === 'manual' ? (t('settings.manualAdvance') || 'Manual (Tap to advance)') : t('settings.seconds', { count: option }) || `${option} seconds`}
              </span>
              <input
                type="radio"
                name="stepDuration"
                value={option}
                checked={stepDuration === option}
                onChange={() => handleDurationChange(option)}
                className="w-5 h-5 accent-action"
                aria-label={option === 'manual' ? (t('settings.manualAdvance') || 'Manual (Tap to advance)') : t('settings.seconds', { count: option }) || `${option} seconds`}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          <span className="text-body font-bold text-text-primary">{t('settings.aboutAidHero') || 'About AidHero'}</span>
        </div>
        <p className="text-sm text-text-secondary">
          {t('settings.version') || 'Version'} 1.0.0 ({t('settings.offlineFirst') || 'Offline-First'})
        </p>
        <p className="text-xs text-slate-400 mt-2">
          {t('settings.medicalDisclaimer') || 'Medical Disclaimer: This application provides general first-aid guidance based on standard protocols, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always call emergency services immediately in critical situations.'}
        </p>
      </section>

      <LanguageSheet open={langSheetOpen} onOpenChange={setLangSheetOpen} />
    </div>
  );
}
