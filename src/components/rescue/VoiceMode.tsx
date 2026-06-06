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

const COMMANDS = {
  next: ['next', 'next step', 'forward'],
  back: ['back', 'previous', 'go back'],
  repeat: ['repeat', 'again', 'say again'],
  emergency: ['call emergency', 'call ambulance'],
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
  const [isListening, setIsListening] = useState(false);

  // --- Imperative refs so the async loop never captures stale state ---
  const activeRef = useRef(true);         // false when overlay is closed
  const pausedRef = useRef(false);        // mirrors isPaused
  const loopAbortRef = useRef(false);     // signals current loop to stop (for restarts)
  const loopIndexRef = useRef(currentStepIndex); // tracks where the loop currently is

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false); // mirrors isSpeaking for recognition mute
  const recognitionBlockedRef = useRef(false); // true = don't restart (mic denied)

  const safeIndex = (idx: number) =>
    Math.min(Math.max(0, idx), steps.length - 1);

  // ─────────────────────────────────────────────
  // Core loop — awaits each speak() promise so there
  // is exactly ONE speaking task at any moment. No
  // effects watch currentStepIndex; this loop IS the
  // sequencer.
  // ─────────────────────────────────────────────
  const runLoop = useCallback(async (fromIndex: number) => {
    loopAbortRef.current = false;
    let idx = safeIndex(fromIndex);
    loopIndexRef.current = idx;

    while (activeRef.current && !loopAbortRef.current) {
      if (pausedRef.current) break;

      const step = steps[idx];
      if (!step) break;

      const text = step.instruction_translations?.[locale] || step.instruction;

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      // await resolves when speech ends (naturally) OR is cancelled by stop()
      await TTSManager.speak(scenarioId, step.id, text, locale);
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // Bail if closed / aborted / paused while speaking
      if (!activeRef.current || loopAbortRef.current || pausedRef.current) break;

      if (idx >= steps.length - 1) {
        // Finished last step — stay on it, don't loop
        break;
      }

      // 1.5 s gap before auto-advancing
      await new Promise<void>(r => setTimeout(r, 1500));
      if (!activeRef.current || loopAbortRef.current || pausedRef.current) break;

      // Advance Zustand store for visual sync, then move loop index
      advanceStep();
      idx += 1;
      loopIndexRef.current = idx;
    }
  }, [scenarioId, steps, locale, advanceStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Helper: abort current loop + stop TTS, then optionally restart ───
  const restartFrom = useCallback((newIdx: number) => {
    loopAbortRef.current = true;   // kills loop on next iteration
    TTSManager.stop();             // resolves outstanding speak() immediately
    // Tiny tick to let the current loop iteration notice the abort before we
    // kick off the new loop
    setTimeout(() => {
      if (activeRef.current && !pausedRef.current) {
        runLoop(safeIndex(newIdx));
      }
    }, 50);
  }, [runLoop]);

  // ─── Mount: start the loop once ───
  useEffect(() => {
    activeRef.current = true;
    runLoop(currentStepIndex);

    return () => {
      activeRef.current = false;
      loopAbortRef.current = true;
      TTSManager.stop();
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Speech recognition ───
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceCommandsActive(false);
      return;
    }

    let recognition: any = null;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;

    const startRecognition = () => {
      if (!activeRef.current || recognitionBlockedRef.current) return;
      try {
        recognition = new SpeechRecognition();
        // en-NG is unsupported in Chrome — always use en-US for commands
        recognition.lang = 'en-US';
        recognition.continuous = false;   // one utterance at a time is more reliable
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          // Ignore results while TTS is playing to avoid feedback loop
          if (isSpeakingRef.current) return;

          // Try all alternatives for better command matching
          for (let i = 0; i < event.results.length; i++) {
            for (let j = 0; j < event.results[i].length; j++) {
              const transcript = event.results[i][j].transcript;
              const cmd = matchCommand(transcript);
              if (!cmd) continue;

              if (cmd === 'next' && loopIndexRef.current < steps.length - 1) {
                advanceStep();
                restartFrom(loopIndexRef.current + 1);
              } else if (cmd === 'back' && loopIndexRef.current > 0) {
                goBack();
                restartFrom(loopIndexRef.current - 1);
              } else if (cmd === 'repeat') {
                restartFrom(loopIndexRef.current);
              } else if (cmd === 'emergency') {
                window.location.href = `tel:${primaryNumber}`;
              }
              return; // stop after first match
            }
          }
        };

        recognition.onerror = (e: any) => {
          setIsListening(false);
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            // Mic permission denied — don't try again
            recognitionBlockedRef.current = true;
            setVoiceCommandsActive(false);
          }
          // For aborted / no-speech / audio-capture / network — onend will restart
        };

        recognition.onend = () => {
          setIsListening(false);
          // Auto-restart unless closed or blocked
          if (activeRef.current && !recognitionBlockedRef.current) {
            // Small delay so we're not hammering the API
            restartTimer = setTimeout(startRecognition, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setVoiceCommandsActive(true);
      } catch {
        setVoiceCommandsActive(false);
      }
    };

    startRecognition();

    return () => {
      recognitionBlockedRef.current = true; // stop restarts during cleanup
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition?.stop(); } catch {}
      setIsListening(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Pause / Resume ───
  const handlePauseResume = () => {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      runLoop(loopIndexRef.current); // restart loop from where we are
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      loopAbortRef.current = true;
      TTSManager.stop();
    }
  };

  const handleClose = () => {
    activeRef.current = false;
    loopAbortRef.current = true;
    TTSManager.stop();
    try { recognitionRef.current?.stop(); } catch {}
    onClose();
  };

  const displayIndex = safeIndex(currentStepIndex);
  const currentStep = steps[displayIndex];
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
      {/* Exit button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 flex items-center gap-2 min-h-[48px] px-4 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 active:scale-95 transition-all"
        aria-label={t('rescue.exitVoiceMode') || 'Exit Voice Mode'}
      >
        <X className="w-5 h-5" />
        {t('rescue.exit') || 'Exit'}
      </button>

      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Instruction */}
        <div aria-live="assertive" aria-atomic="true" className="text-center">
          <p className="text-white/60 text-base font-semibold uppercase tracking-widest mb-3">
            {t('rescue.stepXOfY', { step: displayIndex + 1, total: steps.length }) ||
              `Step ${displayIndex + 1} of ${steps.length}`}
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
          aria-label={isPaused ? t('rescue.resume') || 'Resume' : t('rescue.pause') || 'Pause'}
        >
          {isPaused
            ? <Play className="w-9 h-9 text-white fill-white" />
            : <Pause className="w-9 h-9 text-white" />}
        </button>

        {/* Voice hint + live listening indicator */}
        <div className="flex flex-col items-center gap-2">
          {voiceCommandsActive && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isListening && !isSpeaking
                    ? 'bg-emergency motion-safe:animate-pulse'
                    : 'bg-white/30'
                }`}
              />
              <span className="text-white/40 text-xs">
                {isListening && !isSpeaking ? 'Listening…' : 'Mic ready'}
              </span>
            </div>
          )}
          <p className={`text-sm text-center leading-relaxed ${voiceCommandsActive ? 'text-white/50' : 'text-white/25'}`}>
            {voiceCommandsActive
              ? t('rescue.voiceHint') || 'Say "next", "back", or "repeat"'
              : t('rescue.voiceUnavailable') || 'Voice commands unavailable'}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-10 flex gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor:
                i === displayIndex ? '#C0392B'
                  : i < displayIndex ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.2)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
