"use client";

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Phone, Mic, Check } from 'lucide-react';

import { useRescueStore } from '@/store/useRescueStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getScenario } from '@/lib/data/scenarios';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { StepCard } from '@/components/rescue/StepCard';
import { TTSProvider } from '@/components/tts/TTSProvider';
import { ReadAllButton } from '@/components/tts/ReadAllButton';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Locale } from '@/types';
import { TrustSignal } from '@/components/emergency/TrustSignal';
import { EmergencyCallButton } from '@/components/emergency/EmergencyCallButton';

// These branches have no reviewed instructions matching the person's condition.
const pendingInstructionVariants = new Set([
  'cardiac-arrest:recovery',
  'drowning:recovery',
  'choking-child:cough',
]);

const VoiceMode = dynamic(() => import('@/components/rescue/VoiceMode').then(mod => mod.VoiceMode), {
  ssr: false,
});

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
  
  const { currentStepIndex, activeScenario, advanceStep, setVoiceMode, startRescue } = useRescueStore();
  const { detectedState } = useOfflineStore();
  const [mounted, setMounted] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (activeScenario !== slug) {
      startRescue(slug, '');
    }
  }, [slug, activeScenario, startRescue]);

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

  // Ensure index is within bounds and reset if coming from a different scenario
  const effectiveStepIndex = activeScenario === slug ? currentStepIndex : 0;
  const safeStepIndex = Math.min(Math.max(0, effectiveStepIndex), stepsToRender.length - 1);
  const currentStep = stepsToRender[safeStepIndex];
  const isLastStep = safeStepIndex === stepsToRender.length - 1;
  const progressPercentage = ((safeStepIndex + 1) / stepsToRender.length) * 100;
  
  const primaryNumber = getPrimaryEmergencyNumber(detectedState);

  const handleNext = () => {
    if (isLastStep) {
      // Done - open phone dialer
      window.location.href = `tel:${primaryNumber}`;
    } else {
      advanceStep();
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleVoiceMode = () => {
    setVoiceMode(true);
    setVoiceModeOpen(true);
  };

  // Don't render until mounted to avoid hydration mismatch with useSearchParams
  if (!mounted) return null;

  if (pendingInstructionVariants.has(`${slug}:${variant}`)) {
    return (
      <div className="flex flex-col gap-6 p-4 pb-28 max-w-md mx-auto">
        <div role="status">
          <TrustSignal />
        </div>
        <Link
          href={`/${locale}/incidents/${slug}`}
          aria-label={t('rescue.back')}
          className="flex items-center justify-center h-16 rounded-xl border border-border font-bold text-text-primary"
        >
          {t('rescue.back')}
        </Link>
        <EmergencyCallButton />
      </div>
    );
  }

  return (
    <TTSProvider>
      {/* VoiceMode full-screen overlay */}
      {voiceModeOpen && (
        <VoiceMode
          scenarioId={scenario.id}
          steps={stepsToRender}
          onClose={() => {
            setVoiceModeOpen(false);
            setVoiceMode(false);
          }}
        />
      )}
      <div className="flex flex-col min-h-screen bg-background overflow-hidden pb-48">
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

      <div className="flex-1 flex flex-col px-4 pt-6 max-w-md mx-auto w-full relative">
        <ReadAllButton scenarioId={scenario.id} steps={stepsToRender} />
        <div 
          key={currentStep.id} 
          className="motion-safe:animate-in motion-safe:slide-in-from-right duration-300 ease-out fill-mode-both w-full"
        >
          <StepCard 
            scenarioId={scenario.id}
            step={currentStep} 
            stepNumber={safeStepIndex + 1} 
            locale={locale} 
          />
        </div>
      </div>

      {/* Bottom Sticky Action Area */}
      <div className="fixed bottom-bottom-nav left-0 right-0 p-4 bg-background border-t border-border z-40 max-w-md mx-auto">
        <button
          onClick={handleNext}
          className="w-full h-[72px] min-h-[72px] rounded-2xl bg-authority text-white font-bold text-[22px] flex items-center justify-center gap-2 shadow-card hover:bg-authority/90 active:scale-[0.98] transition-transform"
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

      <div className="fixed bottom-[calc(var(--spacing-bottom-nav)+7rem)] left-4 z-40">
        <a 
          href={`tel:${primaryNumber}`}
          className="flex items-center justify-center gap-2 h-16 px-5 bg-card border border-border text-emergency rounded-full shadow-sm active:scale-95 transition-transform font-bold"
          aria-label={t('emergency.callButton') || "Call"}
        >
          <Phone className="w-5 h-5 fill-emergency/20" />
          {t('emergency.callButton') || "Call"}
        </a>
      </div>

      {/* Voice Mode FAB (Bottom Right) */}
      <div className="fixed bottom-[calc(var(--spacing-bottom-nav)+7rem)] right-4 z-40">
        <button 
          onClick={handleVoiceMode}
          className="flex items-center justify-center w-16 h-16 bg-emergency text-white rounded-full shadow-emergency active:scale-95 transition-transform"
          aria-label={t('rescue.voiceMode') || "Voice Mode"}
        >
          <Mic className="w-7 h-7" />
        </button>
        </div>
      </div>
    </TTSProvider>
  );
}
