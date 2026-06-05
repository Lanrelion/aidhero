import type { Locale } from '@/types';

export function getAudioPath(scenarioId: string, lang: Locale, stepId: number): string {
  return `/audio/${scenarioId}/${lang}/step-${stepId}.mp3`;
}

export function getScenarioAudioPaths(scenarioId: string, lang: Locale, maxSteps: number): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= maxSteps; i++) {
    paths.push(getAudioPath(scenarioId, lang, i));
  }
  return paths;
}
