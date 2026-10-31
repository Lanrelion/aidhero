'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { HeartPulse, Smartphone, DownloadCloud, Check } from 'lucide-react';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { setSetting } from '@/lib/storage/settings';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import type { Locale } from '@/types';

const LANGUAGES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ha', label: 'Hausa', native: 'Hausa' },
  { code: 'ig', label: 'Igbo', native: 'Igbo' },
  { code: 'yo', label: 'Yoruba', native: 'Yorùbá' },
  { code: 'pcm', label: 'Nigerian Pidgin', native: 'Naijá' },
];

export default function OnboardingPage() {
  const t = useTranslations();
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const initOfflineState = useOfflineStore((state) => state.initOfflineState);
  const isCached = useOfflineStore((state) => state.isCached);
  const { startDownload, progress } = useOfflineDownload(currentLocale);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const totalSlides = 3;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If the mock cache turns true while downloading, finish onboarding
    if (isDownloading && isCached) {
      completeOnboarding();
    }
  }, [isDownloading, isCached]);

  const completeOnboarding = async () => {
    await setSetting('onboarding-complete', true);
    router.replace(`/${currentLocale}`);
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleDownload = () => {
    setIsDownloading(true);
    // Triggers progressive audio cache
    startDownload();
    // Triggers the dev mock setTimeout to cache in useOfflineStore
    initOfflineState();
  };

  const handleLanguageSelect = async (lang: Locale) => {
    await setLanguage(lang);
    const newPath = pathname.replace(`/${currentLocale}`, `/${lang}`);
    router.replace(newPath);
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
      scrollRef.current?.scrollTo({
        left: (currentSlide + 1) * window.innerWidth,
        behavior: 'smooth'
      });
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      scrollRef.current?.scrollTo({
        left: (currentSlide - 1) * window.innerWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const slideIndex = Math.round(scrollLeft / window.innerWidth);
      if (slideIndex !== currentSlide) {
        setCurrentSlide(slideIndex);
      }
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-surface overflow-hidden relative">
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleSkip}
          className="text-body font-bold text-slate-500 px-4 py-2 active:bg-slate-100 rounded-full transition-colors"
        >
          {t('onboarding.skip')}
        </button>
      </div>

      {/* Slides Container */}
      <div 
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Slide 1 */}
        <OnboardingSlide
          title={t('onboarding.slide1.title')}
          body={t('onboarding.slide1.body')}
          icon={<HeartPulse className="w-32 h-32 text-emergency" />}
        />

        {/* Slide 2 */}
        <OnboardingSlide
          title={t('onboarding.slide2.title')}
          body={t('onboarding.slide2.body')}
          icon={
            <div className="relative">
              <Smartphone className="w-32 h-32 text-slate-800" />
              <DownloadCloud className="w-16 h-16 text-action absolute -bottom-4 -right-4 bg-surface rounded-full border-[6px] border-surface" />
            </div>
          }
        />

        {/* Slide 3 */}
        <OnboardingSlide
          title={t('onboarding.slide3.title')}
          body={t('onboarding.slide3.body')}
          icon={null}
        >
          <div className="w-full max-w-sm flex flex-col gap-2 mb-6 text-left">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                aria-current={currentLocale === lang.code ? 'true' : undefined}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-colors ${
                  currentLocale === lang.code 
                    ? 'border-emergency bg-emergency/5' 
                    : 'border-border hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-900">{lang.native}</span>
                  <span className="text-sm text-slate-500">{lang.label}</span>
                </div>
                {currentLocale === lang.code && <Check className="w-5 h-5 text-emergency" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full max-w-sm h-14 bg-action text-white font-bold rounded-xl shadow-lg shadow-action/20 active:scale-95 transition-transform flex items-center justify-center disabled:opacity-80 overflow-hidden relative"
          >
            {isDownloading && progress > 0 && (
              <div 
                className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            )}
            <span className="relative z-10 flex items-center">
              {isDownloading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  {progress > 0 ? `${progress}%` : t('onboarding.download')}
                </>
              ) : (
                t('onboarding.download')
              )}
            </span>
          </button>

          <button
            onClick={handleSkip}
            className="w-full max-w-sm h-14 bg-transparent text-slate-500 font-bold rounded-xl active:bg-slate-100 transition-colors mt-2"
          >
            {t('onboarding.skipLater')}
          </button>
        </OnboardingSlide>
      </div>

      {/* Navigation Controls */}
      <div className="h-24 flex items-center justify-between px-8 shrink-0">
        <button
          onClick={prevSlide}
          className={`font-bold px-4 py-2 ${currentSlide === 0 ? 'invisible' : 'text-slate-600 active:bg-slate-100 rounded-full transition-colors'}`}
          aria-label={t('onboarding.back') || 'Back'}
        >
          {t('onboarding.back') || 'Back'}
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label={t('onboarding.progressDots') || 'Onboarding progress'}>
          {[0, 1, 2].map((idx) => (
            <div 
              key={idx} 
              role="tab"
              aria-selected={currentSlide === idx}
              aria-label={`Slide ${idx + 1} of 3`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentSlide === idx ? 'bg-emergency' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className={`font-bold px-4 py-2 ${currentSlide === totalSlides - 1 ? 'invisible' : 'text-emergency active:bg-emergency/10 rounded-full transition-colors'}`}
          aria-label={t('onboarding.next') || 'Next'}
        >
          {t('onboarding.next') || 'Next'}
        </button>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
