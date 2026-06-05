'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isActive: boolean;
  className?: string;
}

export function WaveformVisualizer({ isActive, className }: WaveformVisualizerProps) {
  return (
    <div
      className={cn('flex items-end justify-center gap-[5px] h-12', className)}
      aria-hidden="true"
      role="presentation"
    >
      {[1, 2, 3, 4, 5].map((bar) => {
        const delays = ['0ms', '160ms', '80ms', '240ms', '120ms'];
        const delay = delays[bar - 1];
        return (
          <span
            key={bar}
            className={cn(
              'w-[5px] rounded-full bg-emergency transition-all duration-300',
              isActive
                ? 'motion-safe:animate-[voiceBar_0.9s_ease-in-out_infinite]'
                : 'h-1 opacity-50'
            )}
            style={
              isActive
                ? { animationDelay: delay, height: '100%' }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
