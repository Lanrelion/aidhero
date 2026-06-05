import { describe, it, expect } from 'vitest';
import { ScenarioSearch } from './src/lib/search/index';
import { scenarios } from './src/lib/data/scenarios';
import { synonyms } from './src/lib/search/synonyms';

describe('Search Engine', () => {
  const searchEngine = new ScenarioSearch(scenarios, synonyms);

  it('passes all 7 required test queries', () => {
    const tests = [
      { query: "heart attack", expected: "heart-attack" },
      { query: "chest pain", expected: "heart-attack" },
      { query: "my heart dey pain", expected: "heart-attack" },
      { query: "can't breathe", expected: "choking-adult" },
      { query: "e dey choke", expected: "choking-adult" },
      { query: "face drooping", expected: "stroke" },
      { query: "bleeding won't stop", expected: "severe-bleeding" }
    ];

    for (const { query, expected } of tests) {
      const results = searchEngine.search(query, 'en');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].scenarioId).toBe(expected);
    }
  });
});
