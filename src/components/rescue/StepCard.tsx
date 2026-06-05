import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { TTSButton } from '@/components/tts/TTSButton';
import { WordHighlight } from '@/components/tts/WordHighlight';
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
  
  const instruction = step.instruction_translations[locale] || step.instruction;
  const detail = step.detail_translations?.[locale] || step.detail;
  const doNot = step.do_not_translations?.[locale] || step.do_not;

  return (
    <div className={cn("w-full flex flex-col gap-6 bg-surface", className)}>
      <div className="flex flex-col gap-2">
        <span className="font-display font-bold text-[48px] leading-none tracking-tight text-emergency">
          {t('rescue.stepNumber', { number: stepNumber }) || `STEP ${stepNumber}`}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-sans font-bold text-h3 text-authority">
          <WordHighlight text={instruction} />
        </h3>
        
        {detail && (
          <p className="font-sans text-body-lg text-text-secondary">
            {detail}
          </p>
        )}

        {doNot && (
          <div className="mt-2 flex gap-3 items-start bg-emergency/10 p-4 rounded-xl border border-emergency/20">
            <AlertTriangle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-emergency uppercase tracking-wider">
                {t('rescue.doNot') || "Don't"}
              </span>
              <p className="font-bold text-body text-emergency">
                {doNot}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
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
