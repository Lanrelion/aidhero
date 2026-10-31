'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Pause, Play, SkipBack, SkipForward, SkipBack as PrevIcon, Repeat, MicOff } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { TTSManager } from '@/lib/tts/TTSManager';
import { useRescueStore } from '@/store/useRescueStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { WordHighlight } from '@/components/tts/WordHighlight';
import { WaveformVisualizer } from '@/components/rescue/WaveformVisualizer';
import { getSetting } from '@/lib/storage/settings';
import type { Step } from '@/types/scenario';
import type { Locale } from '@/types';

interface VoiceModeProps {
  scenarioId: string;
  steps: Step[];
  onClose: () => void;
}

const COMMANDS = {
  next: [
    // English
    'next', 'next step', 'continue', 'go on', 'forward',
    // Pidgin
    'carry go', 'go front', 'next one', 'oya next', 'move',
    // Yoruba
    'tẹsiwaju', 'lo siwaju',
    // Hausa
    'ci gaba', 'gaba',
    // Igbo
    'gaa n\'ihu', 'ọ dị mma',
  ],
  back: [
    'back', 'previous', 'go back', 'before',
    'go back', 'return', 'oya back',
    'pada sẹhin',
    'koma baya',
    'laghachi azụ',
  ],
  repeat: [
    'repeat', 'again', 'say again', 'one more time',
    'repeat am', 'abeg repeat', 'say am again', 'do am again',
    'sọ lẹẹkan si',
    'sake da shi',
    'melite ya',
  ],
  restart: [
    'restart', 'start over', 'beginning', 'from the start',
    'start from beginning', 'start afresh',
    'bẹrẹ lati ibẹrẹ',
    'fara daga farko',
    'bido site na mbido',
  ],
  emergency: [
    'call emergency', 'call 199', 'call help', 'call ambulance',
    'call doctor', 'call 911', 'call for help',
    'pe ẹ̀gbọn', 'pe ìrànwọ́',
    'kira agajin gaggawa',
    'kpọọ ọ nyeafọ',
  ],
};

type CommandType = keyof typeof COMMANDS;

function matchCommand(transcript: string): CommandType | null {
  const lower = transcript.toLowerCase().trim();
  for (const [command, phrases] of Object.entries(COMMANDS)) {
    if (phrases.some(phrase => lower.includes(phrase))) {
      return command as CommandType;
    }
  }
  return null;
}

export function VoiceMode({ scenarioId, steps, onClose }: VoiceModeProps) {
  const t = useTranslations();
  const routeLocale = useLocale() as Locale;
  const { language } = useLanguageStore();
  const currentLang = (language && language !== 'en') ? language : (routeLocale || language);
  const { currentStepIndex, advanceStep, jumpToStep } = useRescueStore();
  const { detectedState } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceCommandsAvailable, setVoiceCommandsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Auto-advance Timer State
  const [stepDurationPref, setStepDurationPref] = useState<number | 'manual'>(30);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // ─── Imperative session and lifecycle refs ───
  const activeRef = useRef(true);
  const pausedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const loopIndexRef = useRef(currentStepIndex);
  const sessionRef = useRef(0);

  // Resolver for pending advance promise
  const advanceResolverRef = useRef<((advanced: boolean) => void) | null>(null);

  // Control handlers for speech recognition and timer
  const startListeningRef = useRef<(() => void) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const shouldListenRef = useRef(false);
  const timerTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const safeIndex = (idx: number) => Math.min(Math.max(0, idx), steps.length - 1);

  // Load preferences from settings storage
  useEffect(() => {
    getSetting<number | 'manual'>('voice-mode-step-duration', 30).then(val => {
      if (val !== undefined && val !== null) {
        setStepDurationPref(val);
      }
    });
  }, []);

  const clearAutoAdvanceTimer = useCallback(() => {
    if (timerTickRef.current) clearInterval(timerTickRef.current);
    timerTickRef.current = null;
    setTimeRemaining(null);
    setIsTimerActive(false);
  }, []);

  // ─── waitForAdvance Promise (Awaits Voice Command, UI Next, or Step Duration Countdown) ───
  const waitForAdvance = useCallback((mySession: number): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      let timerId: ReturnType<typeof setInterval> | null = null;
      let micTimerId: ReturnType<typeof setTimeout> | null = null;
      let resolved = false;

      const cleanup = () => {
        if (timerId) clearInterval(timerId);
        if (micTimerId) clearTimeout(micTimerId);
        timerTickRef.current = null;
        advanceResolverRef.current = null;
        stopListeningRef.current?.();
        setTimeRemaining(null);
        setIsTimerActive(false);
      };

      const finish = (result: boolean) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (sessionRef.current === mySession && activeRef.current && !pausedRef.current) {
          resolve(result);
        } else {
          resolve(false);
        }
      };

      advanceResolverRef.current = finish;

      // Check if session became stale before waiting
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) {
        finish(false);
        return;
      }

      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

      // 1. Pipeline flush: Wait exactly 600ms after TTS ends before opening mic (CLAUDE.md Rule 13)
      if (isOnline) {
        micTimerId = setTimeout(() => {
          if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) {
            finish(false);
            return;
          }
          startListeningRef.current?.();
        }, 600);
      }

      // 2. Countdown Timer based on user's preference (e.g. 15s / 30s / 60s)
      if (stepDurationPref !== 'manual') {
        let remaining = typeof stepDurationPref === 'number' ? stepDurationPref : 30;
        setTimeRemaining(remaining);
        setIsTimerActive(true);

        timerId = setInterval(() => {
          if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) {
            finish(false);
            return;
          }
          remaining -= 1;
          setTimeRemaining(remaining);
          if (remaining <= 0) {
            // Timer reached 0 -> auto-advance!
            finish(true);
          }
        }, 1000);
        timerTickRef.current = timerId;
      }
    });
  }, [stepDurationPref]);

  // ─── Core Loop (TTS -> Mutual Exclusion (600ms) -> waitForAdvance -> Advance) ───
  const runLoop = useCallback(async (fromIndex: number) => {
    const mySession = ++sessionRef.current; // Claim this session counter
    let idx = safeIndex(fromIndex);
    loopIndexRef.current = idx;

    while (idx < steps.length) {
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) return;

      const step = steps[idx];
      if (!step) break;

      const text = step.instruction_translations?.[currentLang] || step.instruction;

      // 1. Mutual exclusion: Close mic BEFORE TTS starts
      stopListeningRef.current?.();
      clearAutoAdvanceTimer();

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      // Play step audio / synthesis
      await TTSManager.speak(scenarioId, step.id, text, currentLang);

      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // Check session validity after async speak
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) return;

      if (idx >= steps.length - 1) {
        // Last step reached: keep mic listening for restart/repeat/emergency, but do not auto-advance
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          setTimeout(() => {
            if (activeRef.current && sessionRef.current === mySession && !pausedRef.current) {
              startListeningRef.current?.();
            }
          }, 600);
        }
        break;
      }

      // 2. Wait for user action (voice command, Next button) OR user's configured duration timer
      const advanced = await waitForAdvance(mySession);
      if (!advanced || sessionRef.current !== mySession || !activeRef.current || pausedRef.current) {
        return; // Session invalidated or cancelled
      }

      // Step successfully advanced
      advanceStep();
      idx += 1;
      loopIndexRef.current = idx;
    }
  }, [scenarioId, steps, currentLang, advanceStep, clearAutoAdvanceTimer, waitForAdvance]);

  // ─── Restart loop from a new index ───
  const restartFrom = useCallback((newIdx: number) => {
    sessionRef.current++;
    if (advanceResolverRef.current) {
      advanceResolverRef.current(false);
    }
    clearAutoAdvanceTimer();
    TTSManager.stop();
    stopListeningRef.current?.();
    setTimeout(() => {
      if (activeRef.current && !pausedRef.current) {
        runLoop(safeIndex(newIdx));
      }
    }, 80);
  }, [runLoop, clearAutoAdvanceTimer]);

  // ─── Mount: Start Loop ───
  useEffect(() => {
    activeRef.current = true;
    setTimeout(() => {
      runLoop(currentStepIndex);
    }, 0);

    return () => {
      activeRef.current = false;
      sessionRef.current++;
      if (advanceResolverRef.current) {
        advanceResolverRef.current(false);
      }
      clearAutoAdvanceTimer();
      TTSManager.stop();
      stopListeningRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Single isolated SpeechRecognition effect (100% Client-Side Guarded) ───
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('SR: checking support');

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    if (!SpeechRecognitionAPI || !isOnline) {
      console.log('SR: unavailable (supported:', !!SpeechRecognitionAPI, 'online:', isOnline, ')');
      setVoiceCommandsAvailable(false);
      return;
    }

    console.log('SR: initialising');
    let recognition: any = null;
    let isRunning = false;

    try {
      recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US'; // Rule 13: en-US required for Chrome SR
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        isRunning = true;
        setIsListening(true);
        console.log('SR: started');
      };

      recognition.onresult = (event: any) => {
        // Do not process commands if TTS is currently speaking
        if (isSpeakingRef.current) return;

        const results = event.results;
        if (!results || results.length === 0) return;

        const transcript = results[results.length - 1][0]?.transcript || '';
        console.log(`SR: result received: ${transcript}`);

        const cmd = matchCommand(transcript);
        if (!cmd) return;

        console.log(`SR: matched command: ${cmd}`);

        if (cmd === 'next') {
          if (advanceResolverRef.current) {
            advanceResolverRef.current(true);
          } else if (loopIndexRef.current < steps.length - 1) {
            const nextIdx = loopIndexRef.current + 1;
            jumpToStep(nextIdx);
            restartFrom(nextIdx);
          }
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
      };

      recognition.onerror = (e: any) => {
        isRunning = false;
        setIsListening(false);
        console.warn('SR: error', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setVoiceCommandsAvailable(false);
          startListeningRef.current = null;
        }
      };

      recognition.onend = () => {
        isRunning = false;
        if (shouldListenRef.current && activeRef.current && !isSpeakingRef.current && !pausedRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current && activeRef.current && !isSpeakingRef.current && !pausedRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          }, 200);
        } else {
          setIsListening(false);
        }
      };

      setVoiceCommandsAvailable(true);

      const startListening = () => {
        if (!activeRef.current || isSpeakingRef.current || isRunning || !recognition) return;
        shouldListenRef.current = true;
        try {
          recognition.start();
        } catch (e: any) {
          console.warn('SR: start error', e);
        }
      };

      const stopListening = () => {
        shouldListenRef.current = false;
        isRunning = false;
        setIsListening(false);
        if (recognition) {
          try {
            recognition.abort();
          } catch {}
        }
      };

      startListeningRef.current = startListening;
      stopListeningRef.current = stopListening;

    } catch (err) {
      console.error('SR: failed to initialise', err);
      setVoiceCommandsAvailable(false);
    }

    return () => {
      startListeningRef.current = null;
      stopListeningRef.current = null;
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
    };
  }, [steps.length, primaryNumber, jumpToStep, restartFrom]);

  // ─── User Controls ───
  const handlePauseResume = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      runLoop(loopIndexRef.current);
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      sessionRef.current++;
      if (advanceResolverRef.current) {
        advanceResolverRef.current(false);
      }
      clearAutoAdvanceTimer();
      TTSManager.stop();
      stopListeningRef.current?.();
    }
  };

  const handleRestart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    jumpToStep(0);
    restartFrom(0);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (advanceResolverRef.current) {
      advanceResolverRef.current(true);
    } else if (displayIndex < steps.length - 1) {
      const nextIdx = displayIndex + 1;
      jumpToStep(nextIdx);
      restartFrom(nextIdx);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (displayIndex > 0) {
      const prevIdx = displayIndex - 1;
      jumpToStep(prevIdx);
      restartFrom(prevIdx);
    }
  };

  const handleRepeat = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    restartFrom(displayIndex);
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    activeRef.current = false;
    sessionRef.current++;
    if (advanceResolverRef.current) {
      advanceResolverRef.current(false);
    }
    clearAutoAdvanceTimer();
    TTSManager.stop();
    stopListeningRef.current?.();
    onClose();
  };

  const handleOverlayClick = () => {
    handlePauseResume();
  };

  const displayIndex = safeIndex(currentStepIndex);
  const currentStep = steps[displayIndex];
  if (!currentStep) return null;
  const instruction = currentStep.instruction_translations?.[currentLang] || currentStep.instruction;

  // SVG ring progress calculations
  const timerMax = typeof stepDurationPref === 'number' ? stepDurationPref : 30;
  const timerPct = timeRemaining !== null ? (timeRemaining / timerMax) * 100 : 0;
  const dashArray = 2 * Math.PI * 46; // r=46
  const dashOffset = dashArray * ((100 - timerPct) / 100);
  const showCountdown = timeRemaining !== null && stepDurationPref !== 'manual';

  return (
    <div
      onClick={handleOverlayClick}
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

        {/* Play / Pause Toggle + Countdown Ring */}
        <div className="relative flex flex-col items-center justify-center">
          {showCountdown && (
            <p className="absolute -top-8 text-white/50 text-xs whitespace-nowrap animate-in fade-in zoom-in duration-300">
              {isPaused 
                ? 'Paused — tap to resume' 
                : `Auto-advancing in ${timeRemaining}s — tap to pause`}
            </p>
          )}
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Countdown SVG Ring */}
            {showCountdown && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle 
                  cx="48" cy="48" r="46" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="4" 
                />
                <circle 
                  cx="48" cy="48" r="46" 
                  fill="none" 
                  stroke="#C0392B" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            )}
            
            <button
              onClick={handlePauseResume}
              className="w-20 h-20 rounded-full bg-emergency flex items-center justify-center shadow-lg shadow-emergency/20 hover:scale-105 active:scale-95 transition-all z-10"
              aria-label={isPaused ? t('rescue.resume') || 'Resume' : t('rescue.pause') || 'Pause'}
            >
              {isPaused
                ? <Play className="w-9 h-9 text-white fill-white ml-1" />
                : <Pause className="w-9 h-9 text-white fill-white" />}
            </button>
          </div>
        </div>
        
        {/* Voice Status & Visual Indicators */}
        <div className="flex flex-col items-center justify-center gap-3">
          <WaveformVisualizer isActive={isSpeaking || isListening} />
          {voiceCommandsAvailable ? (
            <p className="text-white/60 text-[16px] font-ui text-center">
              {t('voiceMode.sayCommand')}
            </p>
          ) : (
            <p className="text-white/60 text-[16px] font-ui text-center">
              {t('voiceMode.offlineHint')}
            </p>
          )}
        </div>
      </div>

      {/* Primary Bottom Controls */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-safe z-10">
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
