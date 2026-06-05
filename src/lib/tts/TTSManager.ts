import { Locale } from '@/types';
import { getAudioPath } from './audioPath';

type Language = Locale;

class TTSManagerClass {
  private currentAudio: HTMLAudioElement | null = null;
  private _isSpeaking = false;
  
  // Event callbacks
  public onEnd?: () => void;
  public onStateChange?: (isSpeaking: boolean) => void;

  private setSpeakingState(state: boolean) {
    this._isSpeaking = state;
    if (this.onStateChange) {
      this.onStateChange(state);
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
    await this.stop();
    
    // English skips static files directly since we have highly reliable en-NG synthesis
    if (lang === 'en') {
      return this.webSpeechSpeak(text, 'en-NG');
    }
    
    // Try static audio file first (production)
    const audioPath = getAudioPath(scenarioId, lang, stepId);
    const fileExists = await this.checkAudioExists(audioPath);
    
    if (fileExists) {
      return this.playStaticAudio(audioPath);
    }
    
    // Fallback: Web Speech API (development + missing audio files)
    const voiceMap: Record<Language, string> = {
      ha: 'ha', 
      ig: 'ig', 
      yo: 'yo', 
      pcm: 'en-NG', 
      en: 'en-NG'
    };
    
    return this.webSpeechSpeak(text, voiceMap[lang]);
  }
  
  private async checkAudioExists(audioPath: string): Promise<boolean> {
    try {
      const response = await fetch(audioPath, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  private playStaticAudio(audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioPath);
      
      this.currentAudio.onplay = () => {
        this.setSpeakingState(true);
      };
      
      this.currentAudio.onended = () => {
        this.setSpeakingState(false);
        if (this.onEnd) this.onEnd();
        resolve();
      };
      
      this.currentAudio.onerror = (e) => {
        this.setSpeakingState(false);
        reject(e);
      };

      this.currentAudio.play().catch(e => {
        this.setSpeakingState(false);
        reject(e);
      });
    });
  }

  private webSpeechSpeak(text: string, voiceLang: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn("Web Speech API not supported");
        return resolve();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;

      // Optional: Find best matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a voice that matches the lang exactly
        const match = voices.find(v => v.lang === voiceLang || v.lang.startsWith(voiceLang));
        if (match) {
          utterance.voice = match;
        }
      }

      utterance.onstart = () => {
        this.setSpeakingState(true);
      };

      utterance.onend = () => {
        this.setSpeakingState(false);
        if (this.onEnd) this.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        // Ignore "interrupted" errors which happen on explicit cancel
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error("Speech synthesis error", e);
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
      window.speechSynthesis.cancel();
    }

    this.setSpeakingState(false);
  }
}

export const TTSManager = new TTSManagerClass();
