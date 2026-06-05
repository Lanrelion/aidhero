import { Play, Square, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTTS } from '@/hooks/useTTS';
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
  const { toggle, isSpeaking } = useTTS();
  
  const instruction = step.instruction_translations[locale] || step.instruction;
  const detail = step.detail_translations?.[locale] || step.detail;
  const doNot = step.do_not_translations?.[locale] || step.do_not;

  const handlePlayTTS = () => {
    // Pass the scenario ID, step ID, instruction string, and locale to the TTS manager
    toggle(scenarioId, step.id, instruction, locale);
  };

  return (
    <div className={cn("w-full flex flex-col gap-6 bg-surface", className)}>
      <div className="flex flex-col gap-2">
        <span className="font-display font-bold text-[48px] leading-none tracking-tight text-emergency">
          {t('rescue.stepNumber', { number: stepNumber }) || `STEP ${stepNumber}`}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-sans font-bold text-h3 text-authority">
          {instruction}
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

      <button 
        onClick={handlePlayTTS}
        className={cn(
          "mt-4 flex items-center justify-center gap-3 w-full min-h-[64px] rounded-2xl border-2 font-bold text-body-lg transition-transform active:scale-[0.98]",
          isSpeaking 
            ? "bg-emergency/10 border-emergency text-emergency" 
            : "bg-card border-border text-text-primary hover:bg-card-active"
        )}
        aria-label={isSpeaking ? "Stop audio" : "Play audio instruction"}
        aria-pressed={isSpeaking}
      >
        {isSpeaking ? (
          <>
            <Square className="w-6 h-6 fill-current" />
            {t('rescue.stopAudio') || "Stop Audio"}
          </>
        ) : (
          <>
            <Play className="w-6 h-6 text-action fill-action" />
            {t('rescue.playAudio') || "Play Instruction"}
          </>
        )}
      </button>
    </div>
  );
}
