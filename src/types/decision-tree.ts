import type { LanguageMap } from './scenario';

export interface DecisionTree {
  id: string;
  incident_id: string;
  root_node_id: string;
  nodes: Record<string, TreeNode>;
}

export type TreeNode = QuestionNode | InstructionNode;

export interface QuestionNode {
  type: "question";
  text: string;
  translations: LanguageMap;
  options: {
    label: string;
    translations: LanguageMap;
    next_node_id: string;
  }[];
}

export interface InstructionNode {
  type: "instruction";
  steps_reference: string;
  variant?: string;
}
