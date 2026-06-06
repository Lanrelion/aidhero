'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pause, Play, SkipBack, SkipForward, SkipBack as PrevIcon, Repeat, MicOff } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { useRescueStore } from '@/store/useRescueStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { WordHighlight } from '@/components/tts/WordHighlight';
import type { Step } from '@/types/scenario';
import type { Locale } from '@/types';

interface VoiceModeProps {
  scenarioId: string;
  steps: Step[];
  onClose: () => void;
}

const COMMANDS = {
  next:      ['next', 'next step', 'forward'],
  back:      ['back', 'previous', 'go back'],
  restart:   ['restart', 'start over', 'beginning', 'from the start', 'first step'],
  repeat:    ['repeat', 'again', 'say again'],
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

// ─── INVESTIGATION ROOT CAUSE ───
// SpeechRecognition failed to initialize properly because the mic start was
// called from inside a setTimeout (600ms after TTS ended). Browsers (like Chrome)
// require a user gesture to prompt for microphone permission. Because the
// initialization lost the user gesture context, the browser automatically rejected it
// with a 'not-allowed' error, causing the API to silently fail in the background
// without ever showing a pulsing red dot. Voice commands are now an online-only
// secondary enhancement, with explicit buttons as the primary interface.
// ────────────────────────────────

export function VoiceMode({ scenarioId, steps, onClose }: VoiceModeProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { currentStepIndex, advanceStep, jumpToStep } = useRescueStore();
  const { detectedState, isSpeechRecognitionAvailable } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceCommandsActive, setVoiceCommandsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // ─── Imperative refs ───
  const activeRef = useRef(true);
  const pausedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const loopIndexRef = useRef(currentStepIndex);
  const recognitionBlockedRef = useRef(!isSpeechRecognitionAvailable);
  const recognitionRef = useRef<any>(null);

  const sessionRef = useRef(0);

  // Controls recognition start/stop from outside the effect
  const startListeningRef = useRef<(() => void) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const postTTSTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeIndex = (idx: number) => Math.min(Math.max(0, idx), steps.length - 1);

  // ─── Core loop ───
  const runLoop = useCallback(async (fromIndex: number) => {
    const mySession = ++sessionRef.current; // claim this session
    let idx = safeIndex(fromIndex);
    loopIndexRef.current = idx;

    while (activeRef.current && sessionRef.current === mySession) {
      if (pausedRef.current) break;

      const step = steps[idx];
      if (!step) break;

      const text = step.instruction_translations?.[locale] || step.instruction;

      // Stop mic before TTS plays
      stopListeningRef.current?.();
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      await TTSManager.speak(scenarioId, step.id, text, locale);
      
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // Check session is still ours after the async await
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) break;

      if (idx >= steps.length - 1) break; // last step — done

      // 1.5 s gap — start mic after 600ms buffer
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      postTTSTimerRef.current = setTimeout(() => {
        if (activeRef.current && sessionRef.current === mySession && !pausedRef.current) {
          startListeningRef.current?.();
        }
      }, 600);

      await new Promise<void>(r => setTimeout(r, 1500));

      // Clean up post-TTS timer if still pending
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);

      // Re-check session after the gap
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) break;

      // Stop mic again before advancing
      stopListeningRef.current?.();
      advanceStep();
      idx += 1;
      loopIndexRef.current = idx;
    }
  }, [scenarioId, steps, locale, advanceStep]);

  // ─── Restart loop from a new index ───
  const restartFrom = useCallback((newIdx: number) => {
    sessionRef.current++;
    TTSManager.stop();
    setTimeout(() => {
      if (activeRef.current && !pausedRef.current) {
        runLoop(safeIndex(newIdx));
      }
    }, 80);
  }, [runLoop]);

  // ─── Mount: start loop once ───
  useEffect(() => {
    activeRef.current = true;
    runLoop(currentStepIndex);

    return () => {
      activeRef.current = false;
      sessionRef.current++;
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      TTSManager.stop();
      stopListeningRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Speech recognition — controlled start/stop ───
  useEffect(() => {
    if (!isSpeechRecognitionAvailable) {
      setVoiceCommandsActive(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceCommandsActive(false);
      return;
    }

    let activeRecognition: any = null;
    let isRecognitionRunning = false;
    recognitionBlockedRef.current = false;

    const stopListening = () => {
      if (!isRecognitionRunning || !activeRecognition) return;
      isRecognitionRunning = false;
      try { activeRecognition.abort(); } catch {}
      setIsListening(false);
    };

    const startListening = () => {
      if (recognitionBlockedRef.current || !activeRef.current) return;
      if (isRecognitionRunning) return;

      try {
        const recognition = new SpeechRecognition();
        activeRecognition = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          isRecognitionRunning = true;
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          if (isSpeakingRef.current) return;

          for (let i = 0; i < event.results.length; i++) {
            for (let j = 0; j < event.results[i].length; j++) {
              const cmd = matchCommand(event.results[i][j].transcript);
              if (!cmd) continue;

              if (cmd === 'next' && loopIndexRef.current < steps.length - 1) {
                const nextIdx = loopIndexRef.current + 1;
                jumpToStep(nextIdx);
                restartFrom(nextIdx);
              } else if (cmd === 'back' && loopIndexRef.current > 0) {
                const prevIdx = loopIndexRef.current - 1;
                jumpToStep(prevIdx);
                restartFrom(prevIdx);
              } else if (cmd === 'restart') {
                jumpToStep(0);
                restartFrom(0);
              } else if (cmd === 'repeat') {
                restartFrom(loopIndexRef.current);
              } else if (cmd === 'emergency') {
                window.location.href = `tel:${primaryNumber}`;
              }
              return;
            }
          }
        };

        recognition.onerror = (e: any) => {
          isRecognitionRunning = false;
          setIsListening(false);
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            recognitionBlockedRef.current = true;
            setVoiceCommandsActive(false);
          }
        };

        recognition.onend = () => {
          isRecognitionRunning = false;
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setVoiceCommandsActive(true);
      } catch {
        setVoiceCommandsActive(false);
      }
    };

    startListeningRef.current = startListening;
    stopListeningRef.current = stopListening;

    return () => {
      recognitionBlockedRef.current = true;
      startListeningRef.current = null;
      stopListeningRef.current = null;
      stopListening();
    };
  }, [isSpeechRecognitionAvailable, steps.length, primaryNumber, jumpToStep, restartFrom]);

  // ─── Controls ───
  const handlePauseResume = () => {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      runLoop(loopIndexRef.current);
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      sessionRef.current++;
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      TTSManager.stop();
      stopListeningRef.current?.();
    }
  };

  const handleRestart = () => {
    jumpToStep(0);
    restartFrom(0);
  };

  const handleNext = () => {
    if (displayIndex < steps.length - 1) {
      const nextIdx = displayIndex + 1;
      jumpToStep(nextIdx);
      restartFrom(nextIdx);
    }
  };

  const handlePrev = () => {
    if (displayIndex > 0) {
      const prevIdx = displayIndex - 1;
      jumpToStep(prevIdx);
      restartFrom(prevIdx);
    }
  };

  const handleRepeat = () => {
    restartFrom(displayIndex);
  };

  const handleClose = () => {
    activeRef.current = false;
    sessionRef.current++;
    if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
    TTSManager.stop();
    stopListeningRef.current?.();
    onClose();
  };

  const displayIndex = safeIndex(currentStepIndex);
  const currentStep = steps[displayIndex];
  if (!currentStep) return null;
  const instruction = currentStep.instruction_translations?.[locale] || currentStep.instruction;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center p-6 pb-8 justify-between"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.98)' }}
      role="dialog"
      aria-modal="true"
    >
      {/* Top Bar */}
      <div className="w-full flex justify-between items-start mt-4">
        {displayIndex > 0 ? (
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all font-medium"
          >
            <SkipBack className="w-4 h-4" />
            {t('rescue.step1') || 'Step 1'}
          </button>
        ) : <div className="w-24" />}

        <button
          onClick={handleClose}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
          aria-label={t('rescue.exit') || 'Exit'}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center w-full max-w-sm flex-1 justify-center -mt-8 gap-8">
        
        {/* Instruction Text & Word Highlight */}
        <div aria-live="assertive" aria-atomic="true" className="text-center w-full">
          <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-4">
            {t('rescue.stepXOfY', { step: displayIndex + 1, total: steps.length }) ||
              `Step ${displayIndex + 1} of ${steps.length}`}
          </p>
          <div className="text-white font-bold text-[28px] leading-tight min-h-[120px] flex items-center justify-center">
            <WordHighlight text={instruction} />
          </div>
        </div>

        {/* Play / Pause Toggle */}
        <button
          onClick={handlePauseResume}
          className="w-20 h-20 rounded-full bg-emergency flex items-center justify-center shadow-lg shadow-emergency/20 hover:scale-105 active:scale-95 transition-all"
          aria-label={isPaused ? t('rescue.resume') || 'Resume' : t('rescue.pause') || 'Pause'}
        >
          {isPaused
            ? <Play className="w-9 h-9 text-white fill-white ml-1" />
            : <Pause className="w-9 h-9 text-white fill-white" />}
        </button>
        
        {/* Secondary Voice Hint */}
        <div className="h-10 flex items-center justify-center">
          {voiceCommandsActive ? (
            <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening && !isSpeaking
                      ? 'bg-emergency motion-safe:animate-pulse'
                      : 'bg-white/30'
                  }`}
                />
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  {isListening && !isSpeaking ? 'Listening…' : 'Mic ready'}
                </span>
              </div>
              <p className="text-white/40 text-xs">
                {t('rescue.voiceHint') || 'Say "next", "back", or "repeat"'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/30 text-xs font-medium">
              <MicOff className="w-4 h-4" />
              <span>{t('rescue.voiceUnavailable') || 'Voice commands unavailable — use buttons'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Bottom Controls */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-safe">
        {/* Next Step */}
        <button
          onClick={handleNext}
          disabled={displayIndex >= steps.length - 1}
          className="w-full h-[72px] bg-white text-[#1A1A2E] rounded-2xl font-bold text-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-white/50 transition-all active:scale-[0.98]"
        >
          {t('rescue.nextStep') || 'Next Step'}
          <SkipForward className="w-6 h-6" />
        </button>
        
        <div className="flex gap-3">
          {/* Previous Step */}
          <button
            onClick={handlePrev}
            disabled={displayIndex === 0}
            className="flex-1 h-[64px] bg-white/10 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all active:scale-95"
          >
            <PrevIcon className="w-5 h-5" />
            {t('rescue.back') || 'Previous'}
          </button>
          
          {/* Repeat */}
          <button
            onClick={handleRepeat}
            className="flex-1 h-[64px] bg-white/10 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-white/20"
          >
            <Repeat className="w-5 h-5" />
            {t('rescue.repeat') || 'Repeat'}
          </button>
        </div>
      </div>
    </div>
  );
}
