import synonymsJson from '../../../data/synonyms.json';
import type { Scenario } from '@/types/scenario';

export type SynonymMap = Record<string, string[]>;

export const synonyms = synonymsJson as SynonymMap;

export function expandAliases(scenario: Scenario, synonymMap: SynonymMap): string[] {
  const baseAliases = scenario.aliases || [];
  const extraSynonyms = synonymMap[scenario.id] || [];
  
  return Array.from(new Set([...baseAliases, ...extraSynonyms]));
}
