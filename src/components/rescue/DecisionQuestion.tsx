import { cn } from '@/lib/utils';
import type { QuestionNode } from '@/types/decision-tree';
import type { Locale } from '@/types';

interface DecisionQuestionProps {
  node: QuestionNode;
  locale: Locale;
  onAnswer: (nextId: string) => void;
  className?: string;
}

export function DecisionQuestion({ node, locale, onAnswer, className }: DecisionQuestionProps) {
  const questionText = node.translations[locale] || node.text;

  return (
    <div className={cn("w-full flex flex-col gap-8 items-center text-center", className)}>
      <h2 className="font-display font-bold text-[28px] leading-tight text-text-primary px-4">
        {questionText}
      </h2>

      <div className="w-full flex flex-col gap-4 mt-4">
        {node.options.map((option, index) => {
          const isYes = option.label.toLowerCase() === 'yes';
          const isNo = option.label.toLowerCase() === 'no';
          const optionText = option.translations[locale] || option.label;

          return (
            <button
              key={`${option.next_node_id}-${index}`}
              onClick={() => onAnswer(option.next_node_id)}
              className={cn(
                "w-full rounded-2xl font-bold text-body-lg flex items-center justify-center transition-transform active:scale-[0.98]",
                isYes
                  ? "bg-authority text-white min-h-[72px] shadow-card hover:bg-authority/90"
                  : isNo
                  ? "bg-card text-text-primary min-h-[72px] border-2 border-border hover:bg-card-active"
                  : "bg-surface text-text-secondary min-h-[64px] border border-border hover:bg-card"
              )}
            >
              {optionText}
            </button>
          );
        })}
      </div>
    </div>
  );
}
