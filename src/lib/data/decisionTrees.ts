import type { DecisionTree } from '@/types/decision-tree';

import heartAttackFlow from '../../../data/decision-trees/heart-attack-flow.json';
import chokingAdultFlow from '../../../data/decision-trees/choking-adult-flow.json';
import strokeFlow from '../../../data/decision-trees/stroke-flow.json';
import severeBleedingFlow from '../../../data/decision-trees/severe-bleeding-flow.json';
import seizureFlow from '../../../data/decision-trees/seizure-flow.json';

export const decisionTrees: DecisionTree[] = [
  heartAttackFlow as DecisionTree,
  chokingAdultFlow as DecisionTree,
  strokeFlow as DecisionTree,
  severeBleedingFlow as DecisionTree,
  seizureFlow as DecisionTree
];

export function getDecisionTree(id: string): DecisionTree | undefined {
  return decisionTrees.find(dt => dt.id === id);
}

export const decisionTreesMap = new Map(decisionTrees.map(dt => [dt.id, dt]));
