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

  // Split text into words while preserving spaces and tracking char offsets
  const words = useMemo(() => {
    const tokens: { text: string; start: number; end: number }[] = [];
    let currentIdx = 0;
    
    const parts = text.split(/(\s+)/);
    
    for (const part of parts) {
      const start = currentIdx;
      const end = currentIdx + part.length;
      tokens.push({ text: part, start, end });
      currentIdx = end;
    }
    
    return tokens;
  }, [text]);

  // Fallback: no highlight when:
  // - not speaking at all
  // - charIndex is -1 (reset/idle)
  // - charIndex is still 0 — the initial value set when speak() starts,
  //   before any boundary event fires. On Safari, onboundary never fires
  //   so charIndex stays at 0 indefinitely. We only start highlighting
  //   once a real boundary event pushes charIndex > 0.
  const shouldHighlight = isSpeaking && currentWordIndex > 0;

  if (!shouldHighlight) {
    // Render plain text — works correctly on Safari and when idle
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, i) => {
        const isActive = currentWordIndex >= word.start && currentWordIndex < word.end;
        
        // Don't style whitespace tokens
        if (word.text.trim() === '') {
          return <span key={i}>{word.text}</span>;
        }

        return (
          <span
            key={i}
            className={cn(
              // Only animate color transition when reduced motion is OK
              "motion-safe:transition-colors motion-safe:duration-150",
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
