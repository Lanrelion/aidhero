"use client";

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Phone, Mic, Check } from 'lucide-react';

import { useRescueStore } from '@/store/useRescueStore';
import { getScenario } from '@/lib/data/scenarios';
import { StepCard } from '@/components/rescue/StepCard';
import { Locale } from '@/i18n/config';

interface StepsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export default function StepsPage({ params }: StepsPageProps) {
  const { locale, slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  
  const variant = searchParams.get('variant');
  const scenario = getScenario(slug);
  
  const { currentStepIndex, advanceStep, setVoiceMode } = useRescueStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!scenario) {
    return (
      <div className="flex h-screen items-center justify-center text-text-secondary">
        Scenario not found.
      </div>
    );
  }

  // Fallback variant logic: if step has variant property (not currently in schema) we filter, else all
  let stepsToRender = scenario.steps;
  if (variant && stepsToRender.some(s => (s as any).variant === variant)) {
    stepsToRender = stepsToRender.filter(s => (s as any).variant === variant);
  }

  if (!stepsToRender || stepsToRender.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-text-secondary">
        No steps available.
      </div>
    );
  }

  // Ensure index is within bounds (in case of weird state)
  const safeStepIndex = Math.min(Math.max(0, currentStepIndex), stepsToRender.length - 1);
  const currentStep = stepsToRender[safeStepIndex];
  const isLastStep = safeStepIndex === stepsToRender.length - 1;
  const progressPercentage = ((safeStepIndex + 1) / stepsToRender.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      // Done - open phone dialer
      window.location.href = "tel:112";
    } else {
      advanceStep();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleVoiceMode = () => {
    setVoiceMode(true);
    // Voice mode triggers STEP 19 implementation
    console.log("Activating voice mode");
  };

  // Don't render until mounted to avoid hydration mismatch with useSearchParams
  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        {/* Progress Bar (Thin red line at very top) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-border">
          <div 
            className="h-full bg-emergency transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }} 
          />
        </div>

        <div className="flex items-center justify-between h-14 px-4 mt-1">
          <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-card active:bg-card-active transition-colors text-text-primary"
            aria-label={t('rescue.back') || "Back"}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-sm font-bold tracking-wide text-text-secondary uppercase">
            {t('rescue.stepXOfY', { step: safeStepIndex + 1, total: stepsToRender.length }) || `Step ${safeStepIndex + 1} of ${stepsToRender.length}`}
          </div>
          
          <div className="w-10" /> {/* Spacer to center the title */}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-6 max-w-md mx-auto w-full relative">
        <div 
          key={currentStep.id} 
          className="motion-safe:animate-in motion-safe:slide-in-from-right duration-300 ease-out fill-mode-both w-full"
        >
          <StepCard 
            step={currentStep} 
            stepNumber={safeStepIndex + 1} 
            locale={locale} 
          />
        </div>
      </main>

      {/* Bottom Sticky Action Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 max-w-md mx-auto">
        <button
          onClick={handleNext}
          className="w-full min-h-[72px] rounded-2xl bg-authority text-white font-bold text-[22px] flex items-center justify-center gap-2 shadow-card hover:bg-authority/90 active:scale-[0.98] transition-transform"
        >
          {isLastStep ? (
            <>
              <Check className="w-6 h-6" />
              {t('rescue.doneCall') || "Done — Call Emergency"}
            </>
          ) : (
            <>
              {t('rescue.nextStep') || "Next Step"}
              <span className="text-white/60 ml-1">→</span>
            </>
          )}
        </button>
      </div>

      {/* Persistent Emergency Call (Bottom Left) */}
      <div className="fixed bottom-28 left-4 z-40">
        <a 
          href="tel:112"
          className="flex items-center justify-center gap-2 h-12 px-5 bg-card border border-border text-emergency rounded-full shadow-sm active:scale-95 transition-transform font-bold"
          aria-label={t('emergency.callButton') || "Call"}
        >
          <Phone className="w-5 h-5 fill-emergency/20" />
          {t('emergency.callButton') || "Call"}
        </a>
      </div>

      {/* Voice Mode FAB (Bottom Right) */}
      <div className="fixed bottom-28 right-4 z-40">
        <button 
          onClick={handleVoiceMode}
          className="flex items-center justify-center w-16 h-16 bg-emergency text-white rounded-full shadow-emergency active:scale-95 transition-transform"
          aria-label={t('rescue.voiceMode') || "Voice Mode"}
        >
          <Mic className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
