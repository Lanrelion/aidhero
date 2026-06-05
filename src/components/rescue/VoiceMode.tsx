'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { useRescueStore } from '@/store/useRescueStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { WaveformVisualizer } from './WaveformVisualizer';
import type { Step } from '@/types/scenario';
import type { Locale } from '@/types';

interface VoiceModeProps {
  scenarioId: string;
  steps: Step[];
  onClose: () => void;
}

// Supported voice command keywords
const COMMANDS = {
  next: ['next', 'next step', 'forward'],
  back: ['back', 'previous', 'go back'],
  repeat: ['repeat', 'again', 'say again'],
  emergency: ['call emergency', 'call 999', 'call ambulance'],
};

function matchCommand(transcript: string): keyof typeof COMMANDS | null {
  const lower = transcript.toLowerCase().trim();
  for (const [cmd, variants] of Object.entries(COMMANDS)) {
    if (variants.some(v => lower.includes(v))) {
      return cmd as keyof typeof COMMANDS;
    }
  }
  return null;
}

export function VoiceMode({ scenarioId, steps, onClose }: VoiceModeProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { currentStepIndex, advanceStep, goBack } = useRescueStore();
  const { detectedState } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceCommandsActive, setVoiceCommandsActive] = useState(false);

  // Ref mirrors to allow the async loop to see current values
  const activeRef = useRef(true);
  const pausedRef = useRef(false);
  const currentStepRef = useRef(currentStepIndex);
  currentStepRef.current = currentStepIndex;

  const recognitionRef = useRef<any>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeStepIndex = Math.min(Math.max(0, currentStepIndex), steps.length - 1);
  const currentStep = steps[safeStepIndex];
  const isLastStep = safeStepIndex >= steps.length - 1;

  // Speak the current step
  const speakStep = useCallback(async (stepIndex: number) => {
    if (!activeRef.current) return;
    const step = steps[stepIndex];
    if (!step) return;

    const text = step.instruction_translations?.[locale] || step.instruction;
    setIsSpeaking(true);

    await TTSManager.speak(scenarioId, step.id, text, locale);

    setIsSpeaking(false);

    // Auto-advance 1.5s after TTS ends (unless paused or last step or closed)
    if (activeRef.current && !pausedRef.current && stepIndex < steps.length - 1) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        if (activeRef.current && !pausedRef.current) {
          advanceStep();
          // Reading the next step is handled by the useEffect below on currentStepIndex change
        }
      }, 1500);
    }
  }, [scenarioId, steps, locale, advanceStep]);

  // Auto-read when Voice Mode opens (reads current step)
  useEffect(() => {
    activeRef.current = true;
    speakStep(safeStepIndex);

    return () => {
      activeRef.current = false;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      TTSManager.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When currentStepIndex changes (auto-advance or voice "next"), read the new step
  useEffect(() => {
    if (!activeRef.current) return;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (!isPaused) {
      speakStep(safeStepIndex);
    }
  }, [currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceCommandsActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = locale === 'en' ? 'en-NG' : 'en-NG'; // Always listen in English for commands

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const cmd = matchCommand(transcript);
      if (!cmd) return;

      if (cmd === 'next' && !isLastStep) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        TTSManager.stop();
        advanceStep();
      } else if (cmd === 'back') {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        TTSManager.stop();
        goBack();
      } else if (cmd === 'repeat') {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        TTSManager.stop();
        speakStep(currentStepRef.current);
      } else if (cmd === 'emergency') {
        window.location.href = `tel:${primaryNumber}`;
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setVoiceCommandsActive(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setVoiceCommandsActive(true);
    } catch {
      setVoiceCommandsActive(false);
    }

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePauseResume = () => {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      speakStep(safeStepIndex);
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      TTSManager.stop();
    }
  };

  const handleClose = () => {
    activeRef.current = false;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    TTSManager.stop();
    try { recognitionRef.current?.stop(); } catch {}
    onClose();
  };

  if (!currentStep) return null;

  const instruction = currentStep.instruction_translations?.[locale] || currentStep.instruction;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.97)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('rescue.voiceMode') || 'Voice Mode'}
    >
      {/* Exit button — top right */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 flex items-center gap-2 min-h-[48px] px-4 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 active:scale-95 transition-all"
        aria-label={t('rescue.exitVoiceMode') || 'Exit Voice Mode'}
      >
        <X className="w-5 h-5" />
        {t('rescue.exit') || 'Exit'}
      </button>

      {/* Main content area */}
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">

        {/* Step instruction — aria-live for screen readers */}
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="text-center"
        >
          <p className="text-white/60 text-base font-semibold uppercase tracking-widest mb-3">
            {t('rescue.stepXOfY', { step: safeStepIndex + 1, total: steps.length }) || `Step ${safeStepIndex + 1} of ${steps.length}`}
          </p>
          <h2 className="text-white font-bold text-[24px] leading-snug max-w-[300px] mx-auto">
            {instruction}
          </h2>
        </div>

        {/* Waveform */}
        <WaveformVisualizer isActive={isSpeaking && !isPaused} />

        {/* Pause / Resume — 80px circle */}
        <button
          onClick={handlePauseResume}
          className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all border border-white/20"
          aria-label={isPaused ? (t('rescue.resume') || 'Resume') : (t('rescue.pause') || 'Pause')}
        >
          {isPaused
            ? <Play className="w-9 h-9 text-white fill-white" />
            : <Pause className="w-9 h-9 text-white" />
          }
        </button>

        {/* Voice command hint */}
        {voiceCommandsActive ? (
          <p className="text-white/50 text-sm text-center leading-relaxed">
            {t('rescue.voiceHint') || "Say \"next\", \"back\", or \"repeat\""}
          </p>
        ) : (
          <p className="text-white/30 text-sm text-center">
            {t('rescue.voiceUnavailable') || "Voice commands unavailable"}
          </p>
        )}
      </div>

      {/* Progress dots at bottom */}
      <div className="absolute bottom-10 flex gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor: i === safeStepIndex
                ? '#C0392B'
                : i < safeStepIndex
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.2)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
