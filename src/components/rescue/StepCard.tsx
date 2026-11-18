import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { TTSButton } from '@/components/tts/TTSButton';
import { WordHighlight } from '@/components/tts/WordHighlight';
import { getLocalizedStepText, getStepNarration } from '@/lib/tts/stepNarration';
import type { Step } from '@/types/scenario';

interface StepCardProps {
  scenarioId: string;
  step: Step;
  stepNumber: number;
  narration: ReturnType<typeof getStepNarration>;
  className?: string;
}

export function StepCard({ scenarioId, step, stepNumber, narration, className }: StepCardProps) {
  const t = useTranslations();
  const detail = getLocalizedStepText(step.detail, step.detail_translations, narration.locale);
  const doNot = getLocalizedStepText(step.do_not, step.do_not_translations, narration.locale);

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
        <h3 lang={narration.locale} className="font-body font-bold text-[20px] text-text-primary leading-snug">
          <WordHighlight text={narration.text} />
        </h3>
        
        {/* Detail Text (18px Atkinson secondary color) */}
        {detail.text && (
          <p lang={detail.locale} className="font-body text-[18px] text-text-secondary leading-relaxed">
            {detail.text}
          </p>
        )}

        {/* Warning / Do Not Box */}
        {doNot.text && (
          <div className="mt-3 flex gap-3 items-start bg-emergency/10 p-4 rounded-xl border border-emergency/20">
            <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-xs text-emergency uppercase tracking-wider">
                {t('rescue.doNot') || "Don't"}
              </span>
              <p lang={doNot.locale} className="font-bold text-body text-emergency">
                {doNot.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TTS Audio Button */}
      <div className="mt-5 pt-3 border-t border-border/60">
        <TTSButton 
          scenarioId={scenarioId} 
          stepId={step.id} 
          text={narration.text}
          englishText={getStepNarration(step, 'en').text}
          narrationLocale={narration.locale}
          size="lg" 
        />
      </div>
    </div>
  );
}
