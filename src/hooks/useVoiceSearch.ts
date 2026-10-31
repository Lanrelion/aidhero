'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceSearch(
  onTranscript: (text: string) => void,
  onFinalResult?: (text: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const onTranscriptRef = useRef(onTranscript);
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onFinalResultRef.current = onFinalResult;
  }, [onTranscript, onFinalResult]);

  useEffect(() => {
    // MUST be inside useEffect — never access window outside
    if (typeof window === 'undefined') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

    if (!SR || !isOnline) {
      setIsAvailable(false);
      return;
    }

    setIsAvailable(true);

    try {
      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (e: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < e.results.length; i++) {
          const item = e.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentText = (final || interim).trim();
        if (currentText) {
          setInterimText(currentText);
          onTranscriptRef.current?.(currentText);
        }

        if (final && onFinalResultRef.current) {
          onFinalResultRef.current(final.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('VoiceSearch SR error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('VoiceSearch failed to initialize SpeechRecognition:', err);
      setIsAvailable(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return false;
    }
    setInterimText('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
      return true;
    } catch (err) {
      console.warn('VoiceSearch start error:', err);
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, []);

  return { isListening, isAvailable, interimText, startListening, stopListening };
}
