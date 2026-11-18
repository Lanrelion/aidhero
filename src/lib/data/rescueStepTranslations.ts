import translations from '../../../i18n/rescue-step-translation-drafts.json';
import type { Scenario } from '@/types/scenario';

const translationsByIncident = new Map(translations.scenarios.map(incident => [incident.slug, incident]));
const locales = ['ha', 'ig', 'yo', 'pcm'] as const;

// These drafts have specific wording differences from the source instruction.
const knownWordingIssues = new Set([
  'choking-adult:2:yo',
  'choking-adult:4:yo',
  'generator-fumes:4:yo',
  'severe-bleeding:5:ig',
]);

export function getLocalizedRescueSteps(scenario: Scenario) {
  const translatedSteps = translationsByIncident.get(scenario.slug)?.steps;
  if (!translatedSteps) return scenario.steps;

  return scenario.steps.map(step => {
    const source = step.instruction_translations?.en || step.instruction;
    const translated = translatedSteps.find(entry => entry.id === step.id && entry.en === source);
    if (!translated) return step;

    const instructionTranslations = { ...step.instruction_translations };
    for (const locale of locales) {
      const existing = instructionTranslations[locale]?.trim();
      const text = translated.translations[locale]?.text;
      if (existing && !/\[NEEDS_REVIEW\]/i.test(existing)) continue;
      if (text && !knownWordingIssues.has(`${scenario.slug}:${step.id}:${locale}`)) {
        instructionTranslations[locale] = text;
      }
    }
    return { ...step, instruction_translations: instructionTranslations };
  });
}
