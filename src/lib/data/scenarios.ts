import type { Scenario, Category } from '@/types/scenario';

import heartAttack from '../../../data/scenarios/heart-attack.json';
import chokingAdult from '../../../data/scenarios/choking-adult.json';
import stroke from '../../../data/scenarios/stroke.json';
import severeBleeding from '../../../data/scenarios/severe-bleeding.json';
import seizure from '../../../data/scenarios/seizure.json';

import categoriesJson from '../../../data/categories.json';

export const scenarios: Scenario[] = [
  heartAttack as Scenario,
  chokingAdult as Scenario,
  stroke as Scenario,
  severeBleeding as Scenario,
  seizure as Scenario
];

export const categories: Category[] = categoriesJson as Category[];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}

export const scenariosMap = new Map(scenarios.map(s => [s.id, s]));
