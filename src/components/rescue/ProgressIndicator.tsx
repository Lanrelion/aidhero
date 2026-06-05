import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  current: number;
  max: number;
  className?: string;
}

export function ProgressIndicator({ current, max, className }: ProgressIndicatorProps) {
  const t = useTranslations();
  // Ensure we don't exceed 100% width visually, even if current > max
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={cn("w-full flex flex-col items-center", className)} aria-live="polite">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-border relative">
        <div 
          className="absolute top-0 left-0 h-full bg-emergency transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Step Counter */}
      <div className="mt-4 px-4 py-1.5 rounded-full bg-card border border-border text-sm font-semibold tracking-wide text-text-secondary uppercase">
        {t('rescue.stepXOfY', { step: current, total: max }) || `Question ${current} of ${max}`}
      </div>
    </div>
  );
}
