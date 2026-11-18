import type { Locale } from '@/types';
import type { LanguageMap, Step } from '@/types/scenario';

function cleanText(text: string | undefined) {
  return text?.replace(/\[NEEDS_REVIEW\]/gi, '').trim() || undefined;
}

function normalize(text: string | undefined) {
  return text?.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
}

export function getLocalizedStepText(original: string | undefined, translations: LanguageMap | undefined, requested: Locale) {
  const english = cleanText(translations?.en) ?? cleanText(original);
  const entry = translations?.[requested];
  const localized = cleanText(entry);
  const isEnglishPlaceholder = entry && /\[NEEDS_REVIEW\]/i.test(entry) &&
    (normalize(localized) === normalize(english) || normalize(localized) === normalize(original));
  if (requested !== 'en' && localized && !isEnglishPlaceholder) {
    return { locale: requested, text: localized };
  }
  return { locale: 'en' as const, text: english };
}

export function getStepNarration(step: Step, requested: Locale) {
  const { locale, text } = getLocalizedStepText(step.instruction, step.instruction_translations, requested);
  return { locale, text: text ?? step.instruction };
}
