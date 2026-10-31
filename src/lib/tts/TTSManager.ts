import { Locale } from '@/types';
import { getAudioPath } from './audioPath';

type Language = Locale;

export const VOICE_LANG_MAP: Record<Locale, string[]> = {
  ha: ['ha-NG', 'ha'],
  yo: ['yo-NG', 'yo'],
  ig: ['ig-NG', 'ig'],
  pcm: ['en-NG', 'en-GB', 'en-US', 'en'],
  en: ['en-NG', 'en-GB', 'en-US', 'en'],
};

export interface VoiceAvailability {
  locale: Locale;
  supported: boolean;
  voiceName?: string;
  langCode: string;
}

/**
 * Finds the closest available browser SpeechSynthesisVoice for a target locale
 * following fallback rules (e.g. ha-NG -> ha -> prefix match).
 */
export function findBestVoice(lang: Locale): { voice: SpeechSynthesisVoice | null; voiceLang: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, voiceLang: VOICE_LANG_MAP[lang]?.[0] || 'en-NG' };
  }

  const voices = window.speechSynthesis.getVoices();
  const preferredLangs = VOICE_LANG_MAP[lang] || ['en-NG'];

  // 1. Try exact match in preference order
  for (const code of preferredLangs) {
    const exact = voices.find(
      (v) =>
        v.lang.toLowerCase() === code.toLowerCase() ||
        v.lang.replace('_', '-').toLowerCase() === code.toLowerCase()
    );
    if (exact) {
      return { voice: exact, voiceLang: exact.lang };
    }
  }

  // 2. Try prefix match (e.g., 'ha-' or 'yo-')
  for (const code of preferredLangs) {
    const baseCode = code.split('-')[0].toLowerCase();
    const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(baseCode));
    if (prefix) {
      return { voice: prefix, voiceLang: prefix.lang };
    }
  }

  // 3. Fallback to primary lang code string
  return { voice: null, voiceLang: preferredLangs[0] };
}

/**
 * Checks TTS voice availability across all supported AidHero languages in the current browser
 */
export function checkVoiceAvailability(): Record<Locale, VoiceAvailability> {
  const result: Partial<Record<Locale, VoiceAvailability>> = {};
  const locales: Locale[] = ['en', 'ha', 'ig', 'yo', 'pcm'];

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    for (const l of locales) {
      result[l] = { locale: l, supported: false, langCode: VOICE_LANG_MAP[l][0] };
    }
    return result as Record<Locale, VoiceAvailability>;
  }

  const voices = window.speechSynthesis.getVoices();

  for (const l of locales) {
    const preferredLangs = VOICE_LANG_MAP[l];
    let matchedVoice: SpeechSynthesisVoice | undefined;

    for (const code of preferredLangs) {
      const normalizedCode = code.toLowerCase().replace('_', '-');
      matchedVoice = voices.find((v) => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return vLang === normalizedCode || (l !== 'pcm' && vLang.startsWith(code.split('-')[0].toLowerCase()));
      });
      if (matchedVoice) break;
    }

    result[l] = {
      locale: l,
      supported: !!matchedVoice,
      voiceName: matchedVoice?.name,
      langCode: matchedVoice?.lang || preferredLangs[0],
    };
  }

  return result as Record<Locale, VoiceAvailability>;
}

class TTSManagerClass {
  private currentAudio: HTMLAudioElement | null = null;
  private _isSpeaking = false;

  // Event callbacks
  public onEnd?: () => void;
  public onStateChange?: (isSpeaking: boolean) => void;
  public onWordBoundary?: (charIndex: number) => void;

  private setSpeakingState(state: boolean) {
    this._isSpeaking = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
    if (!state && this.onWordBoundary) {
      // Reset word boundary on stop
      this.onWordBoundary(-1);
    }
  }

  get speaking(): boolean {
    return this._isSpeaking;
  }

  async speak(
    scenarioId: string,
    stepId: number,
    text: string,
    lang: Language
  ): Promise<void> {
    console.log(`[TTSManager] lang=${lang}, scenario=${scenarioId}, step=${stepId}`);
    await this.stop();
    if (this.onWordBoundary) this.onWordBoundary(0);

    if (lang === 'en') {
      console.log('[TTSManager] English — using Web Speech');
      return this.webSpeechSpeak(text, 'en-NG');
    }

    const audioPath = getAudioPath(scenarioId, lang, stepId);
    console.log(`[TTSManager] Attempting: ${audioPath}`);

    // Test if file is reachable before attempting play
    try {
      const testFetch = await fetch(audioPath, { method: 'HEAD' });
      console.log(`[TTSManager] HEAD ${audioPath} → ${testFetch.status}`);
    } catch (fetchErr) {
      console.error(`[TTSManager] HEAD fetch failed:`, fetchErr);
    }

    return this.playStaticAudio(audioPath, text, lang);
  }

  private playStaticAudio(audioPath: string, fallbackText: string, lang: Language): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(audioPath);
      this.currentAudio = audio;

      audio.oncanplaythrough = () => console.log(`[TTSManager] canplaythrough fired`);

      audio.onended = () => {
        console.log('[TTSManager] ended');
        this.setSpeakingState(false);
        if (this.onEnd) this.onEnd();
        resolve();
      };

      audio.onerror = async (e) => {
        console.error('[TTSManager] onerror fired:', e, audio.error?.message, audio.error?.code);
        // File missing or corrupt — fall back to Web Speech API
        this.currentAudio = null;
        await this.webSpeechSpeak(fallbackText, lang);
        resolve();
      };

      // Attempt to play immediately
      this.setSpeakingState(true);
      audio.load();
      audio.play().catch(async (e) => {
        console.error('[TTSManager] play() rejected:', e.message);
        // play() rejected (autoplay policy, missing file, etc.)
        this.currentAudio = null;
        await this.webSpeechSpeak(fallbackText, lang);
        resolve();
      });
    });
  }

  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public webSpeechSpeak(text: string, lang: Language | string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[TTSManager] Web Speech API not supported in this browser');
        return resolve();
      }

      const localeKey = (
        typeof lang === 'string' && ['en', 'ha', 'ig', 'yo', 'pcm'].includes(lang)
          ? lang
          : 'en'
      ) as Locale;

      const { voice, voiceLang } = findBestVoice(localeKey);

      console.log(`[TTSManager] Speaking in "${localeKey}". Selected voice:`, {
        targetLocale: localeKey,
        selectedVoice: voice ? `${voice.name} (${voice.lang})` : 'Browser Default',
        utteranceLang: voice ? voice.lang : voiceLang,
      });

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance; // Prevent garbage collection bug
      utterance.lang = voiceLang;
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.setSpeakingState(true);
      };

      utterance.onboundary = (e) => {
        if (e.name === 'word' && this.onWordBoundary) {
          this.onWordBoundary(e.charIndex);
        }
      };

      utterance.onend = () => {
        this.setSpeakingState(false);
        if (this.onEnd) this.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        // Ignore "interrupted" errors which happen on explicit cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('[TTSManager] Speech synthesis error', e);
        }
        this.setSpeakingState(false);
        resolve(); // resolve anyway to avoid hanging promises
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async stop(): Promise<void> {
    // Stop static audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop web speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }

    this.setSpeakingState(false);
  }
}

export const TTSManager = new TTSManagerClass();
