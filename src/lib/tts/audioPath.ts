import type { Locale } from '@/types';
import heartAttackRecordings from './heartAttackRecordings.json';
import recordedNarration from './recordedNarration.json';

export type RecordingIndex = Partial<Record<string, { text: string; path: string }>>;

export function getRecordingKey(scenarioId: string, lang: Locale, stepId: number): string {
  return `${scenarioId}/${lang}/${stepId}`;
}

export function getAudioPath(scenarioId: string, lang: Locale, stepId: number): string {
  return `/audio/${scenarioId}/${lang}/step-${stepId}.mp3`;
}

export function getRecordedNarrationPath(scenarioId: string, lang: Locale, stepId: number, text: string): string | undefined {
  const recording = (recordedNarration as RecordingIndex)[getRecordingKey(scenarioId, lang, stepId)];
  if (recording?.text === text) return recording.path;
  if (scenarioId !== 'heart-attack' || lang === 'en') return;
  const recordedText: Partial<Record<number, string>> = heartAttackRecordings[lang];
  if (recordedText[stepId] === text) {
    return getAudioPath('heart-attack-v2', lang, stepId);
  }
}

export function getScenarioAudioPaths(scenarioId: string, lang: Locale, maxSteps: number): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= maxSteps; i++) {
    paths.push(getAudioPath(scenarioId, lang, i));
  }
  return paths;
}
