import { decisionTrees } from './decisionTrees';
import type { DecisionTree, QuestionNode } from '@/types/decision-tree';

export function validateTreeDepth(tree: DecisionTree) {
  const maxAllowedDepth = 3;

  function traverse(nodeId: string, currentDepth: number, visited: Set<string>): void {
    if (visited.has(nodeId)) {
      throw new Error(`Cycle detected in tree ${tree.id} at node ${nodeId}`);
    }

    const node = tree.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found in tree ${tree.id}`);
    }

    if (node.type === 'instruction') {
      return;
    }

    if (node.type === 'question') {
      const qNode = node as QuestionNode;
      const newDepth = currentDepth + 1;

      if (newDepth > maxAllowedDepth) {
        throw new Error(
          `Validation failed: Tree '${tree.id}' exceeds maximum allowed question depth of ${maxAllowedDepth}. Path through node '${nodeId}' is too deep.`
        );
      }

      visited.add(nodeId);
      for (const option of qNode.options) {
        traverse(option.next_node_id, newDepth, new Set(visited));
      }
    }
  }

  traverse(tree.root_node_id, 0, new Set());
}

export function validateAll() {
  for (const tree of decisionTrees) {
    validateTreeDepth(tree);
  }
}
