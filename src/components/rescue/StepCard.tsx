import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { TTSButton } from '@/components/tts/TTSButton';
import { WordHighlight } from '@/components/tts/WordHighlight';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { Step } from '@/types/scenario';
import type { Locale } from '@/types';

interface StepCardProps {
  scenarioId: string;
  step: Step;
  stepNumber: number;
  locale: Locale;
  className?: string;
}

export function StepCard({ scenarioId, step, stepNumber, locale, className }: StepCardProps) {
  const t = useTranslations();
  const { language } = useLanguageStore();
  
  const currentLang = (language && language !== 'en') ? language : (locale || language);
  const instruction = step.instruction_translations?.[currentLang] || step.instruction;
  const detail = step.detail_translations?.[currentLang] || step.detail;
  const doNot = step.do_not_translations?.[currentLang] || step.do_not;

  return (
    <div className={cn("w-full flex flex-col px-6 py-5 bg-surface rounded-2xl border border-border shadow-sm", className)}>
      {/* Step Number on its own line above */}
      <div className="mb-3">
        <span className="font-sans font-bold text-[48px] leading-none tracking-tight text-emergency block">
          {stepNumber}
        </span>
      </div>

      {/* Instruction Text (20px Atkinson bold) */}
      <div className="flex flex-col gap-3">
        <h3 className="font-body font-bold text-[20px] text-text-primary leading-snug">
          <WordHighlight text={instruction} />
        </h3>
        
        {/* Detail Text (18px Atkinson secondary color) */}
        {detail && (
          <p className="font-body text-[18px] text-text-secondary leading-relaxed">
            {detail}
          </p>
        )}

        {/* Warning / Do Not Box */}
        {doNot && (
          <div className="mt-3 flex gap-3 items-start bg-emergency/10 p-4 rounded-xl border border-emergency/20">
            <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xs text-emergency uppercase tracking-wider">
                {t('rescue.doNot') || "Don't"}
              </span>
              <p className="font-bold text-body text-emergency">
                {doNot}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TTS Audio Button */}
      <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
        <TTSButton 
          scenarioId={scenarioId} 
          stepId={step.id} 
          text={instruction} 
          size="lg" 
        />
      </div>
    </div>
  );
}
