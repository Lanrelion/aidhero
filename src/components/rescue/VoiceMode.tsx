'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pause, Play, SkipBack } from 'lucide-react';
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

export function VoiceMode({ scenarioId, steps, onClose }: VoiceModeProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { currentStepIndex, advanceStep, jumpToStep } = useRescueStore();
  const { detectedState } = useOfflineStore();
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
  const recognitionBlockedRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // ─── Session ID pattern — prevents stale loops from advancing ───
  // Every call to runLoop gets a unique session number. The loop checks
  // it hasn't been superseded before each advance. This eliminates the
  // race where TTSManager.stop() resolves asynchronously AFTER a new
  // loop has already started and reset the abort flag.
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

      // 1.5 s gap — start mic after 600ms buffer (mic was capturing TTS tail)
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      postTTSTimerRef.current = setTimeout(() => {
        if (activeRef.current && sessionRef.current === mySession && !pausedRef.current) {
          startListeningRef.current?.();
        }
      }, 600);

      await new Promise<void>(r => setTimeout(r, 1500));

      // Clean up post-TTS timer if still pending
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);

      // Re-check session after the gap (restart commands fire during gap)
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) break;

      // Stop mic again before advancing to next step's TTS
      stopListeningRef.current?.();
      advanceStep();
      idx += 1;
      loopIndexRef.current = idx;
    }
  }, [scenarioId, steps, locale, advanceStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Restart loop from a new index ───
  // Increments sessionRef first so the running loop sees it's superseded
  // on its next session check — even if stop() resolves asynchronously.
  const restartFrom = useCallback((newIdx: number) => {
    sessionRef.current++;  // invalidate current loop (no flag to reset)
    TTSManager.stop();
    setTimeout(() => {
      if (activeRef.current && !pausedRef.current) {
        runLoop(safeIndex(newIdx));
      }
    }, 80);
  }, [runLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Mount: start loop once ───
  useEffect(() => {
    activeRef.current = true;
    runLoop(currentStepIndex);

    return () => {
      activeRef.current = false;
      sessionRef.current++; // kill any running loop
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      TTSManager.stop();
      stopListeningRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Speech recognition — controlled start/stop ───
  // Recognition is NOT continuously running. It is:
  //   - started 600ms AFTER TTS ends (mic buffer cleared)
  //   - stopped BEFORE TTS starts
  // This prevents the mic from capturing TTS output as voice commands.
  useEffect(() => {
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
      if (isRecognitionRunning) return; // already running

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
          // Double-check TTS isn't playing (belt + suspenders)
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
          // Other errors (no-speech, aborted) are fine — loop will restart on next gap
        };

        recognition.onend = () => {
          isRecognitionRunning = false;
          setIsListening(false);
          // Do NOT auto-restart here. startListening() is called explicitly
          // by runLoop at the right moment (600ms after TTS ends).
        };

        recognition.start();
        recognitionRef.current = recognition;
        setVoiceCommandsActive(true);
      } catch {
        setVoiceCommandsActive(false);
      }
    };

    // Expose controls to runLoop via refs
    startListeningRef.current = startListening;
    stopListeningRef.current = stopListening;

    return () => {
      recognitionBlockedRef.current = true;
      startListeningRef.current = null;
      stopListeningRef.current = null;
      stopListening();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Pause / Resume ───
  const handlePauseResume = () => {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      runLoop(loopIndexRef.current);
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      sessionRef.current++; // kill loop
      if (postTTSTimerRef.current) clearTimeout(postTTSTimerRef.current);
      TTSManager.stop();
      stopListeningRef.current?.();
    }
  };

  // ─── Back to Step 1 ───
  const handleRestart = () => {
    jumpToStep(0);
    restartFrom(0);
  };

  const handleClose = () => {
    activeRef.current = false;
    sessionRef.current++;
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

      {/* Back to Step 1 button — top left */}
      {displayIndex > 0 && (
        <button
          onClick={handleRestart}
          className="absolute top-6 left-6 flex items-center gap-2 min-h-[48px] px-4 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all text-sm"
          aria-label="Back to Step 1"
        >
          <SkipBack className="w-4 h-4" />
          Step 1
        </button>
      )}

      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Step counter + instruction */}
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

        {/* Pause / Resume */}
        <button
          onClick={handlePauseResume}
          className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all border border-white/20"
          aria-label={isPaused ? t('rescue.resume') || 'Resume' : t('rescue.pause') || 'Pause'}
        >
          {isPaused
            ? <Play className="w-9 h-9 text-white fill-white" />
            : <Pause className="w-9 h-9 text-white" />}
        </button>

        {/* Listening indicator + voice hint */}
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
              ? t('rescue.voiceHint') || 'Say "next", "back", "repeat", or "restart"'
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
