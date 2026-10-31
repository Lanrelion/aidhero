import type { Scenario, Category } from '@/types/scenario';

// Original 5 scenarios
import heartAttack from '../../../data/scenarios/heart-attack.json';
import chokingAdult from '../../../data/scenarios/choking-adult.json';
import stroke from '../../../data/scenarios/stroke.json';
import severeBleeding from '../../../data/scenarios/severe-bleeding.json';
import seizure from '../../../data/scenarios/seizure.json';

// Cardiac
import cardiacArrest from '../../../data/scenarios/cardiac-arrest.json';
import angina from '../../../data/scenarios/angina.json';

// Respiratory
import chokingChild from '../../../data/scenarios/choking-child.json';
import asthmaAttack from '../../../data/scenarios/asthma-attack.json';
import drowning from '../../../data/scenarios/drowning.json';

// Burns
import minorBurn from '../../../data/scenarios/minor-burn.json';
import severeBurn from '../../../data/scenarios/severe-burn.json';

// Environmental
import generatorFumes from '../../../data/scenarios/generator-fumes.json';
import heatstroke from '../../../data/scenarios/heatstroke.json';

// Trauma
import brokenBone from '../../../data/scenarios/broken-bone.json';
import headInjury from '../../../data/scenarios/head-injury.json';

// Neurological
import fainting from '../../../data/scenarios/fainting.json';

// Poisoning
import snakeBite from '../../../data/scenarios/snake-bite.json';
import foodPoisoning from '../../../data/scenarios/food-poisoning.json';

// Allergic
import anaphylaxis from '../../../data/scenarios/anaphylaxis.json';

import categoriesJson from '../../../data/categories.json';

export const scenarios: Scenario[] = [
  // Original 5
  heartAttack as unknown as Scenario,
  chokingAdult as unknown as Scenario,
  stroke as unknown as Scenario,
  severeBleeding as unknown as Scenario,
  seizure as unknown as Scenario,
  // Cardiac
  cardiacArrest as unknown as Scenario,
  angina as unknown as Scenario,
  // Respiratory
  chokingChild as unknown as Scenario,
  asthmaAttack as unknown as Scenario,
  drowning as unknown as Scenario,
  // Burns
  minorBurn as unknown as Scenario,
  severeBurn as unknown as Scenario,
  // Environmental
  generatorFumes as unknown as Scenario,
  heatstroke as unknown as Scenario,
  // Trauma
  brokenBone as unknown as Scenario,
  headInjury as unknown as Scenario,
  // Neurological
  fainting as unknown as Scenario,
  // Poisoning
  snakeBite as unknown as Scenario,
  foodPoisoning as unknown as Scenario,
  // Allergic
  anaphylaxis as unknown as Scenario,
];

export const categories: Category[] = categoriesJson as Category[];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id || s.slug === id);
}

export const scenariosMap = new Map(scenarios.map(s => [s.id, s]));
