'use client';

import React, { useEffect, useRef, useState, useCallback, useEffectEvent } from 'react';
import { X, Pause, Play, SkipBack, SkipForward, SkipBack as PrevIcon, Repeat, MicOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TTSManager, type PlaybackResult } from '@/lib/tts/TTSManager';
import { getStepNarration } from '@/lib/tts/stepNarration';
import { useRescueStore } from '@/store/useRescueStore';
import { useOfflineStore } from '@/store/useOfflineStore';
import { getPrimaryEmergencyNumber } from '@/lib/data/emergencyNumbers';
import { WordHighlight } from '@/components/tts/WordHighlight';
import { WaveformVisualizer } from '@/components/rescue/WaveformVisualizer';
import { getSetting } from '@/lib/storage/settings';
import type { Step } from '@/types/scenario';
import type { Locale } from '@/types';

interface VoiceModeProps {
  scenarioId: string;
  steps: Step[];
  requestedLocale: Locale;
  initialPlayback: Promise<PlaybackResult>;
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

export function VoiceMode({
  scenarioId, steps, requestedLocale, initialPlayback, onClose,
}: VoiceModeProps) {
  const t = useTranslations();
  const { currentStepIndex, advanceStep, jumpToStep } = useRescueStore();
  const { detectedState, isOnline } = useOfflineStore();
  const primaryNumber = getPrimaryEmergencyNumber(detectedState);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceCommandStatus, setVoiceCommandStatus] = useState<'available' | 'unavailable' | 'network'>('unavailable');
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
  const waitForAdvance = useCallback((mySession: number, allowAutoAdvance: boolean): Promise<boolean> => {
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
      if (allowAutoAdvance && stepDurationPref !== 'manual') {
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
  const runLoop = useCallback(async (fromIndex: number, firstPlayback?: Promise<PlaybackResult>) => {
    const mySession = ++sessionRef.current; // Claim this session counter
    let idx = safeIndex(fromIndex);
    loopIndexRef.current = idx;

    while (idx < steps.length) {
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) return;

      const step = steps[idx];
      if (!step) break;

      const { text, locale } = getStepNarration(step, requestedLocale);

      // 1. Mutual exclusion: Close mic BEFORE TTS starts
      stopListeningRef.current?.();
      clearAutoAdvanceTimer();

      setIsSpeaking(true);
      setAudioUnavailable(false);
      isSpeakingRef.current = true;

      // Play step audio / synthesis
      const result = await (firstPlayback ?? TTSManager.speak(scenarioId, step.id, text, locale));
      firstPlayback = undefined;

      // Check session validity after async speak
      if (!activeRef.current || sessionRef.current !== mySession || pausedRef.current) return;
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setAudioUnavailable(result === 'unavailable');

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
      const advanced = await waitForAdvance(mySession, result === 'finished');
      if (!advanced || sessionRef.current !== mySession || !activeRef.current || pausedRef.current) {
        return; // Session invalidated or cancelled
      }

      // Step successfully advanced
      advanceStep();
      idx += 1;
      loopIndexRef.current = idx;
    }
  }, [scenarioId, steps, requestedLocale, advanceStep, clearAutoAdvanceTimer, waitForAdvance]);

  // ─── Restart loop from a new index ───
  const restartFrom = useCallback((newIdx: number) => {
    ++sessionRef.current;
    loopIndexRef.current = newIdx;
    if (advanceResolverRef.current) {
      advanceResolverRef.current(false);
    }
    clearAutoAdvanceTimer();
    TTSManager.stop();
    stopListeningRef.current?.();
    if (activeRef.current && !pausedRef.current) runLoop(safeIndex(newIdx));
  }, [runLoop, clearAutoAdvanceTimer]);

  // ─── Mount: Start Loop ───
  useEffect(() => {
    activeRef.current = true;
    const mountSession = sessionRef.current;
    let started = false;
    const startTimer = setTimeout(() => {
      if (sessionRef.current !== mountSession) return;
      started = true;
      runLoop(currentStepIndex, initialPlayback);
    }, 0);

    return () => {
      clearTimeout(startTimer);
      activeRef.current = false;
      sessionRef.current++;
      if (advanceResolverRef.current) {
        advanceResolverRef.current(false);
      }
      clearAutoAdvanceTimer();
      if (started) TTSManager.stop();
      stopListeningRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVoiceCommand = useEffectEvent((cmd: CommandType) => {
    const index = loopIndexRef.current;
    if (cmd === 'next' && index < steps.length - 1) {
      if (advanceResolverRef.current) {
        advanceResolverRef.current(true);
      } else {
        jumpToStep(index + 1);
        restartFrom(index + 1);
      }
    } else if (cmd === 'back' && index > 0) {
      jumpToStep(index - 1);
      restartFrom(index - 1);
    } else if (cmd === 'restart') {
      jumpToStep(0);
      restartFrom(0);
    } else if (cmd === 'repeat') {
      restartFrom(index);
    } else if (cmd === 'emergency') {
      window.location.href = `tel:${primaryNumber}`;
    }
  });

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('[Voice Mode] Speech recognition API unavailable');
      return;
    }

    let recognition: any = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let unavailable = false;
    let retriedNetworkError = false;
    let useLocalRecognition = false;
    let listeningGeneration = 0;

    // Check during narration so the first command can use an installed speech pack.
    const localRecognitionCheck = typeof SpeechRecognitionAPI.available === 'function'
      ? Promise.resolve()
        .then(() => SpeechRecognitionAPI.available({ langs: ['en-US'], processLocally: true }))
        .then(status => { useLocalRecognition = status === 'available'; }, () => {})
      : undefined;

    const canListen = () =>
      !unavailable && shouldListenRef.current && activeRef.current &&
      !isSpeakingRef.current && !pausedRef.current && navigator.onLine;

    const stopListening = () => {
      listeningGeneration++;
      shouldListenRef.current = false;
      clearTimeout(retryTimer);
      const current = recognition;
      recognition = null;
      setIsListening(false);
      if (current) {
        try { current.abort(); } catch {}
      }
    };

    const markUnavailable = (reason: 'unavailable' | 'network' = 'unavailable') => {
      unavailable = true;
      stopListening();
      setVoiceCommandStatus(reason);
    };

    const startListening = () => {
      if (!canListen() || recognition) return;

      const listeningLocally = useLocalRecognition;
      try {
        // WebKit can stop returning results when a recognizer is reused after playback.
        const current = new SpeechRecognitionAPI();
        recognition = current;
        const session = sessionRef.current;
        const generation = listeningGeneration;
        let retryDelay = 200;
        let waitForLocalCheck = false;
        const isCurrent = () => recognition === current && sessionRef.current === session;
        current.lang = 'en-US';
        current.continuous = false;
        current.interimResults = false;
        current.maxAlternatives = 3;
        if (listeningLocally) current.processLocally = true;

        current.onstart = () => {
          if (isCurrent() && canListen()) setIsListening(true);
        };
        current.onspeechend = () => {
          if (!isCurrent() || !canListen()) return;
          setIsListening(false);
          // Request the final transcript from the captured audio immediately.
          try { current.stop(); } catch {}
        };
        current.onresult = (event: any) => {
          if (!isCurrent() || !canListen()) return;
          const result = event.results[event.resultIndex ?? 0];
          if (!result?.isFinal) return;
          for (let index = 0; index < result.length; index++) {
            const command = matchCommand(result[index].transcript);
            if (command && (index === 0 || command !== 'emergency')) {
              handleVoiceCommand(command);
              break;
            }
          }
        };
        current.onerror = (event: { error: string }) => {
          if (!isCurrent()) return;
          setIsListening(false);
          if (listeningLocally && (event.error === 'network' || event.error === 'language-not-supported')) {
            useLocalRecognition = false;
            return;
          }
          if (event.error === 'network' && !retriedNetworkError) {
            retriedNetworkError = true;
            retryDelay = 1000;
            waitForLocalCheck = !useLocalRecognition;
            return;
          }
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('[Voice Mode] Speech recognition failed:', event.error);
            markUnavailable(event.error === 'network' ? 'network' : 'unavailable');
          }
        };
        current.onend = () => {
          if (!isCurrent()) return;
          recognition = null;
          setIsListening(false);
          if (canListen()) {
            retryTimer = setTimeout(async () => {
              if (waitForLocalCheck) await localRecognitionCheck;
              if (sessionRef.current !== session || listeningGeneration !== generation || !canListen()) return;
              startListening();
            }, retryDelay);
          }
        };
        current.start();
      } catch (error) {
        if (listeningLocally && error instanceof DOMException && error.name === 'NotSupportedError') {
          useLocalRecognition = false;
          recognition = null;
          startListening();
          return;
        }
        console.warn('[Voice Mode] Could not start speech recognition:', error);
        markUnavailable();
      }
    };

    setVoiceCommandStatus('available');
    startListeningRef.current = () => {
      retriedNetworkError = false;
      shouldListenRef.current = true;
      startListening();
    };
    stopListeningRef.current = stopListening;

    return () => {
      stopListening();
      startListeningRef.current = null;
      stopListeningRef.current = null;
    };
  }, []);

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
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      stopListeningRef.current?.();
    }
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
  const narration = getStepNarration(currentStep, requestedLocale);

  // SVG ring progress calculations
  const timerMax = typeof stepDurationPref === 'number' ? stepDurationPref : 30;
  const timerPct = timeRemaining !== null ? (timeRemaining / timerMax) * 100 : 0;
  const dashArray = 2 * Math.PI * 46; // r=46
  const dashOffset = dashArray * ((100 - timerPct) / 100);
  const showCountdown = timeRemaining !== null && stepDurationPref !== 'manual';

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex h-dvh flex-col items-center gap-4 px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ backgroundColor: 'rgba(26, 26, 46, 0.98)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('rescue.voiceMode')}
    >
      {/* Top Bar */}
      <div className="w-full shrink-0 flex justify-between items-start">
        {displayIndex > 0 ? (
          <button
            onClick={handlePrev}
            className="flex items-center justify-center gap-2 h-16 px-5 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all font-medium"
          >
            <SkipBack className="w-4 h-4" />
            {t('rescue.back')}
          </button>
        ) : <div className="w-24" />}

        <button
          onClick={handleClose}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
          aria-label={t('rescue.exit') || 'Exit'}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-sm min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col items-center justify-center gap-8">
        
        {/* Instruction Text & Word Highlight */}
        <div aria-live="assertive" aria-atomic="true" className="text-center w-full">
          {narration.locale !== requestedLocale && (
            <p className="mb-2 text-white/80">{t('rescue.stepEnglishFallback')}</p>
          )}
          <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-4">
            {t('rescue.stepXOfY', { step: displayIndex + 1, total: steps.length }) ||
              `Step ${displayIndex + 1} of ${steps.length}`}
          </p>
          <div lang={narration.locale} className="text-white font-bold text-[28px] leading-tight min-h-[120px] flex items-center justify-center">
            <WordHighlight text={narration.text} />
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
          {audioUnavailable && (
            <p role="status" className="text-white/70 text-center">{t('rescue.playbackUnavailable')}</p>
          )}
          <p role="status" className="text-white/70 text-[16px] font-ui text-center">
            {t(!isOnline ? 'voiceMode.offlineHint'
              : voiceCommandStatus === 'network' ? 'voiceMode.serviceUnavailable'
              : voiceCommandStatus === 'unavailable' ? 'voiceMode.unavailable'
              : isListening ? 'voiceMode.sayCommand'
              : 'voiceMode.waiting')}
          </p>
        </div>
        </div>
      </div>

      {/* Primary Bottom Controls */}
      <div className="w-full max-w-sm shrink-0 flex flex-col gap-3">
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
