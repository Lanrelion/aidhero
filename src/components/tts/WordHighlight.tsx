'use client';

import React, { useMemo } from 'react';
import { useTTS } from '@/hooks/useTTS';
import { cn } from '@/lib/utils';

interface WordHighlightProps {
  text: string;
  className?: string;
}

export function WordHighlight({ text, className }: WordHighlightProps) {
  const { currentWordIndex, isSpeaking } = useTTS();

  // Split text into words while preserving spaces
  const words = useMemo(() => {
    // Regex splits by word boundary but we need to track character indices
    const tokens: { text: string; start: number; end: number }[] = [];
    let currentIdx = 0;
    
    // Simple split by spaces for display, but calculating absolute char index
    const parts = text.split(/(\s+)/);
    
    for (const part of parts) {
      const start = currentIdx;
      const end = currentIdx + part.length;
      tokens.push({ text: part, start, end });
      currentIdx = end;
    }
    
    return tokens;
  }, [text]);

  if (!isSpeaking || currentWordIndex < 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, i) => {
        // A word is active if the current char index falls within its boundaries
        // Or if we're on a space and it's the preceding word
        const isActive = currentWordIndex >= word.start && currentWordIndex < word.end;
        
        // Don't highlight whitespace
        if (word.text.trim() === '') {
          return <span key={i}>{word.text}</span>;
        }

        return (
          <span
            key={i}
            className={cn(
              "transition-colors duration-150",
              isActive ? "text-emergency bg-emergency/10 rounded-sm" : ""
            )}
          >
            {word.text}
          </span>
        );
      })}
    </span>
  );
}
