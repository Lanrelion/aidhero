import { Locale } from '@/types';
import { getRecordedNarrationPath } from './audioPath';

export type PlaybackResult = 'finished' | 'stopped' | 'unavailable';

export const VOICE_LANG_MAP: Record<Locale, string[]> = {
  ha: ['ha-NG', 'ha'],
  yo: ['yo-NG', 'yo'],
  ig: ['ig-NG', 'ig'],
  pcm: ['pcm-NG', 'pcm'],
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

  const availableVoices = window.speechSynthesis.getVoices().filter(voice => lang === 'en' || voice.localService);
  const localEnglishVoices = lang === 'en'
    ? availableVoices.filter(voice => voice.localService && /^en(?:[-_]|$)/i.test(voice.lang))
    : [];
  const voices = localEnglishVoices.length ? localEnglishVoices : availableVoices;
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
    const prefix = voices.find((v) => v.lang.toLowerCase().split(/[-_]/)[0] === baseCode);
    if (prefix) {
      return { voice: prefix, voiceLang: prefix.lang };
    }
  }

  // 3. Fallback to primary lang code string
  return { voice: null, voiceLang: lang === 'en' ? 'en-US' : preferredLangs[0] };
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

  for (const l of locales) {
    const { voice, voiceLang } = findBestVoice(l);
    result[l] = {
      locale: l,
      supported: Boolean(voice),
      voiceName: voice?.name,
      langCode: voiceLang,
    };
  }

  return result as Record<Locale, VoiceAvailability>;
}

class TTSManagerClass {
  private audio: HTMLAudioElement | null = null;
  private cancelPlayback: (() => void) | null = null;
  private playbackVersion = 0;
  private _isSpeaking = false;

  public onStateChange?: (isSpeaking: boolean) => void;
  public onWordBoundary?: (charIndex: number) => void;

  private setSpeakingState(state: boolean) {
    this._isSpeaking = state;
    this.onStateChange?.(state);
    if (!state) this.onWordBoundary?.(-1);
  }

  get speaking(): boolean {
    return this._isSpeaking;
  }

  get version(): number {
    return this.playbackVersion;
  }

  speak(scenarioId: string, stepId: number, text: string, lang: Locale, highlightWords = true): Promise<PlaybackResult> {
    this.stop();
    this.onWordBoundary?.(0);

    // Start playback in the caller's tap handler so mobile browsers accept it.
    const recording = getRecordedNarrationPath(scenarioId, lang, stepId, text);
    return recording ? this.playStaticAudio(recording, text, lang) : this.webSpeechSpeak(text, lang, highlightWords);
  }

  private playStaticAudio(path: string, text: string, lang: Locale): Promise<PlaybackResult> {
    return new Promise(resolve => {
      // WebKit grants playback permission per media element. Reuse it between steps.
      const audio = this.audio ??= new Audio();
      const finish = (result: PlaybackResult) => {
        if (this.cancelPlayback !== cancel) return;
        this.cancelPlayback = null;
        audio.onended = null;
        audio.onerror = null;
        if (result !== 'finished') audio.pause();
        if (result === 'unavailable') {
          resolve(this.webSpeechSpeak(text, lang));
          return;
        }
        this.setSpeakingState(false);
        resolve(result);
      };
      const cancel = () => finish('stopped');
      this.cancelPlayback = cancel;
      audio.onended = () => finish('finished');
      audio.onerror = () => finish('unavailable');
      audio.src = path;
      this.setSpeakingState(true);
      void audio.play().catch(() => finish('unavailable'));
    });
  }

  private webSpeechSpeak(text: string, lang: Locale, highlightWords = true): Promise<PlaybackResult> {
    const synthesis = window.speechSynthesis;
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      this.setSpeakingState(false);
      return Promise.resolve('unavailable');
    }

    const { voice, voiceLang } = findBestVoice(lang);
    if (lang !== 'en' && !voice) {
      this.setSpeakingState(false);
      return Promise.resolve('unavailable');
    }
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;
      if (voice) utterance.voice = voice;

      const finish = (result: PlaybackResult) => {
        if (this.cancelPlayback !== cancel) return;
        this.cancelPlayback = null;
        clearTimeout(startTimeout);
        utterance.onstart = null;
        utterance.onboundary = null;
        utterance.onend = null;
        utterance.onerror = null;
        if (result !== 'finished') synthesis.cancel();
        this.setSpeakingState(false);
        resolve(result);
      };
      const cancel = () => finish('stopped');
      const startTimeout = setTimeout(() => finish('unavailable'), 5000);
      this.cancelPlayback = cancel;

      utterance.onstart = () => clearTimeout(startTimeout);
      utterance.onboundary = event => {
        if (highlightWords && this.cancelPlayback === cancel && event.name === 'word') {
          this.onWordBoundary?.(event.charIndex);
        }
      };
      utterance.onend = () => finish('finished');
      utterance.onerror = () => finish('unavailable');

      this.setSpeakingState(true);
      try {
        synthesis.speak(utterance);
      } catch {
        finish('unavailable');
      }
    });
  }

  stop(): void {
    this.playbackVersion++;
    this.cancelPlayback?.();
  }
}

export const TTSManager = new TTSManagerClass();
