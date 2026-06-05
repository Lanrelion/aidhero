import { ScenarioSearch } from './src/lib/search/index';
import { scenarios } from './src/lib/data/scenarios';
import { synonyms } from './src/lib/search/synonyms';

const searchEngine = new ScenarioSearch(scenarios, synonyms);

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
  console.log(`Query: "${query}" -> Results: ${results.length}`);
  if (results.length > 0) {
    console.log(`   Top result: ${results[0].scenarioId} (Matched: ${results[0].matchedAlias})`);
  }
}
