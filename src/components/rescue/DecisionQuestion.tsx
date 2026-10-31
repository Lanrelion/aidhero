import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { QuestionNode } from '@/types/decision-tree';
import type { Locale } from '@/types';

interface DecisionQuestionProps {
  node: QuestionNode;
  locale: Locale;
  onAnswer: (nextNodeId: string) => void;
  selectedOptionId?: string;
  className?: string;
}

export function DecisionQuestion({ 
  node, 
  locale, 
  onAnswer, 
  selectedOptionId,
  className 
}: DecisionQuestionProps) {
  const questionText = node.translations?.[locale] || node.text;

  return (
    <div className={cn("w-full flex flex-col gap-6 items-center text-center", className)}>
      {/* 24px Atkinson Hyperlegible Question Text */}
      <h2 className="font-body font-bold text-[24px] leading-snug text-text-primary px-2 max-w-sm">
        {questionText}
      </h2>

      {/* Option Buttons: Full-width, 72px height, 18px Inter 600 */}
      <div className="w-full flex flex-col gap-3.5 mt-2">
        {node.options.map((option, index) => {
          const optionText = option.translations?.[locale] || option.label;
          const isSelected = selectedOptionId === option.next_node_id;

          return (
            <button
              key={`${option.next_node_id}-${index}`}
              onClick={() => onAnswer(option.next_node_id)}
              className={cn(
                "w-full h-[72px] min-h-[72px] px-6 rounded-2xl font-sans font-semibold text-[18px] flex items-center justify-between transition-all active:scale-[0.98] border-2 shadow-sm text-left group",
                isSelected
                  ? "border-l-4 border-l-emergency bg-emergency/10 border-emergency/40 text-emergency"
                  : "bg-card text-text-primary border-border hover:border-emergency/50 hover:bg-emergency/5"
              )}
            >
              <span>{optionText}</span>
              <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-emergency transition-colors shrink-0" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
