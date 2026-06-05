import Fuse from 'fuse.js';
import type { Scenario } from '@/types/scenario';
import type { Locale } from '@/types';
import { expandAliases, SynonymMap } from './synonyms';

export interface SearchResult {
  scenarioId: string;
  title: string;
  category: string;
  severity: string;
  matchedAlias?: string;
  score?: number;
}

interface IndexedScenario extends Scenario {
  expandedAliases: string[];
  allSigns: string[];
}

export class ScenarioSearch {
  private fuse: Fuse<IndexedScenario>;
  private indexedData: IndexedScenario[];
  
  constructor(scenarios: Scenario[], synonyms: SynonymMap) {
    this.indexedData = scenarios.map(sc => {
      const expandedAliases = expandAliases(sc, synonyms);
      const allSigns = [...sc.signs];
      Object.values(sc.signs_translations || {}).forEach(transMap => {
        Object.values(transMap || {}).forEach(v => {
          if (v && !v.startsWith('[NEEDS_REVIEW]')) {
            allSigns.push(v);
          }
        });
      });
      
      return {
        ...sc,
        expandedAliases,
        allSigns
      };
    });

    this.fuse = new Fuse(this.indexedData, {
      keys: [
        { name: 'title', weight: 2.0 },
        { name: 'expandedAliases', weight: 1.5 },
        { name: 'allSigns', weight: 1.0 }
      ],
      threshold: 0.3,
      includeMatches: true,
      includeScore: true,
      ignoreLocation: true
    });
  }
  
  search(query: string, locale: Locale): SearchResult[] {
    if (!query || query.trim() === '') return [];
    
    const results = this.fuse.search(query);
    
    return results.slice(0, 5).map(res => {
      const sc = res.item;
      let matchedAlias: string | undefined = undefined;
      
      if (res.matches) {
        const aliasMatch = res.matches.find(m => m.key === 'expandedAliases' || m.key === 'expandedAliases.refIndex');
        if (aliasMatch && aliasMatch.value) {
          matchedAlias = aliasMatch.value;
        }
      }

      return {
        scenarioId: sc.id,
        title: sc.title_translations[locale] || sc.title,
        category: sc.category,
        severity: sc.severity,
        matchedAlias,
        score: res.score
      };
    });
  }
}
