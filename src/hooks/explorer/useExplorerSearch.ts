import { useMemo } from 'react';
import { TreeNode, SearchResult } from '../../types/explorer';

function scoreMatch(label: string, tokens: string[]): number {
  const lower = label.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower === token) score += 50;
    else if (lower.startsWith(token)) score += 30;
    else if (lower.includes(token)) score += 20;
  }
  return score;
}

function buildInvertedIndex(nodeMap: Map<string, TreeNode>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const [id, node] of nodeMap) {
    const words = node.label.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (!index.has(word)) index.set(word, []);
      index.get(word)!.push(id);
    }
  }
  return index;
}

function getNodePath(nodeId: string, nodeMap: Map<string, TreeNode>): string[] {
  const path: string[] = [];
  let current = nodeMap.get(nodeId);
  while (current) {
    path.unshift(current.label);
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }
  return path;
}

export function useExplorerSearch(
  nodeMap: Map<string, TreeNode>,
  query: string,
  minScore = 10
): SearchResult[] {
  const index = useMemo(() => buildInvertedIndex(nodeMap), [nodeMap]);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/);
    const candidateIds = new Set<string>();

    for (const token of tokens) {
      // Exact index matches
      for (const [word, ids] of index) {
        if (word.includes(token)) ids.forEach((id) => candidateIds.add(id));
      }
      // Also scan all nodes for partial matches not in index
      for (const id of nodeMap.keys()) candidateIds.add(id);
    }

    const results: SearchResult[] = [];

    for (const id of candidateIds) {
      const node = nodeMap.get(id);
      if (!node) continue;

      let score = 0;

      // Score the node's own label
      score += scoreMatch(node.label, tokens);

      // Score parent labels (lower weight)
      const path = getNodePath(id, nodeMap);
      for (let i = 0; i < path.length - 1; i++) {
        score += scoreMatch(path[i], tokens) * 0.4;
      }

      if (score >= minScore) {
        results.push({
          node,
          path: getNodePath(id, nodeMap),
          matchType: score >= 50 ? 'exact' : 'partial',
          score: Math.min(100, Math.round(score)),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [nodeMap, index, query, minScore]);
}
