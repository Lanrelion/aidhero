import type { DecisionTree } from '@/types/decision-tree';

import heartAttackFlow from '../../../data/decision-trees/heart-attack-flow.json';
import chokingAdultFlow from '../../../data/decision-trees/choking-adult-flow.json';
import strokeFlow from '../../../data/decision-trees/stroke-flow.json';
import severeBleedingFlow from '../../../data/decision-trees/severe-bleeding-flow.json';
import seizureFlow from '../../../data/decision-trees/seizure-flow.json';
import cardiacArrestFlow from '../../../data/decision-trees/cardiac-arrest-flow.json';
import anginaFlow from '../../../data/decision-trees/angina-flow.json';
import chokingChildFlow from '../../../data/decision-trees/choking-child-flow.json';
import asthmaAttackFlow from '../../../data/decision-trees/asthma-attack-flow.json';
import drowningFlow from '../../../data/decision-trees/drowning-flow.json';
import minorBurnFlow from '../../../data/decision-trees/minor-burn-flow.json';
import severeBurnFlow from '../../../data/decision-trees/severe-burn-flow.json';
import generatorFumesFlow from '../../../data/decision-trees/generator-fumes-flow.json';
import heatstrokeFlow from '../../../data/decision-trees/heatstroke-flow.json';
import brokenBoneFlow from '../../../data/decision-trees/broken-bone-flow.json';
import headInjuryFlow from '../../../data/decision-trees/head-injury-flow.json';
import faintingFlow from '../../../data/decision-trees/fainting-flow.json';
import snakeBiteFlow from '../../../data/decision-trees/snake-bite-flow.json';
import foodPoisoningFlow from '../../../data/decision-trees/food-poisoning-flow.json';
import anaphylaxisFlow from '../../../data/decision-trees/anaphylaxis-flow.json';

export const decisionTrees: DecisionTree[] = [
  ((heartAttackFlow as any).default || heartAttackFlow) as DecisionTree,
  ((chokingAdultFlow as any).default || chokingAdultFlow) as DecisionTree,
  ((strokeFlow as any).default || strokeFlow) as DecisionTree,
  ((severeBleedingFlow as any).default || severeBleedingFlow) as DecisionTree,
  ((seizureFlow as any).default || seizureFlow) as DecisionTree,
  cardiacArrestFlow as DecisionTree,
  anginaFlow as DecisionTree,
  chokingChildFlow as DecisionTree,
  asthmaAttackFlow as DecisionTree,
  drowningFlow as DecisionTree,
  minorBurnFlow as DecisionTree,
  severeBurnFlow as DecisionTree,
  generatorFumesFlow as DecisionTree,
  heatstrokeFlow as DecisionTree,
  brokenBoneFlow as DecisionTree,
  headInjuryFlow as DecisionTree,
  faintingFlow as DecisionTree,
  snakeBiteFlow as DecisionTree,
  foodPoisoningFlow as DecisionTree,
  anaphylaxisFlow as DecisionTree,
];

export function getDecisionTree(id: string): DecisionTree | undefined {
  return decisionTrees.find(dt => dt.id === id);
}

export const decisionTreesMap = new Map(decisionTrees.map(dt => [dt.id, dt]));
