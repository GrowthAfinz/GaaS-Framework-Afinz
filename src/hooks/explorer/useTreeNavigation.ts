import { useCallback } from 'react';
import { TreeNode } from '../../types/explorer';
import { useExplorerStore } from '../../store/explorerStore';

function getVisibleNodeIds(nodes: TreeNode[], expandedIds: string[]): string[] {
  const result: string[] = [];
  const traverse = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      result.push(node.id);
      if (expandedIds.includes(node.id) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return result;
}

export function useTreeNavigation(rootNodes: TreeNode[], nodeMap: Map<string, TreeNode>) {
  const {
    expandedNodeIds,
    selectedNodeIds,
    toggleNode,
    expandAll,
    collapseAll,
    expandToNode,
    selectNode,
    deselectAll,
    setDetailsPaneNode,
  } = useExplorerStore();

  const handleToggle = useCallback((nodeId: string) => {
    toggleNode(nodeId);
  }, [toggleNode]);

  const handleSelect = useCallback((nodeId: string, multiSelect: boolean) => {
    selectNode(nodeId, multiSelect);
  }, [selectNode]);

  const handleExpandAll = useCallback(() => {
    const allIds = Array.from(nodeMap.keys()).filter((id) => {
      const node = nodeMap.get(id);
      return node && node.children.length > 0;
    });
    expandAll(allIds);
  }, [nodeMap, expandAll]);

  const handleCollapseAll = useCallback(() => {
    collapseAll();
  }, [collapseAll]);

  const handleExpandToNode = useCallback((nodeId: string) => {
    expandToNode(nodeId, nodeMap);
    selectNode(nodeId, false);
    setDetailsPaneNode(nodeId);
  }, [nodeMap, expandToNode, selectNode, setDetailsPaneNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentNodeId: string) => {
      const visibleIds = getVisibleNodeIds(rootNodes, expandedNodeIds);
      const currentIndex = visibleIds.indexOf(currentNodeId);
      const currentNode = nodeMap.get(currentNodeId);

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (currentNode && currentNode.children.length > 0 && !expandedNodeIds.includes(currentNodeId)) {
            toggleNode(currentNodeId);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (expandedNodeIds.includes(currentNodeId)) {
            toggleNode(currentNodeId);
          } else if (currentNode?.parentId) {
            selectNode(currentNode.parentId, false);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleIds.length - 1) {
            selectNode(visibleIds[currentIndex + 1], false);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            selectNode(visibleIds[currentIndex - 1], false);
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          selectNode(currentNodeId, e.ctrlKey || e.metaKey);
          break;

        case 'Escape':
          e.preventDefault();
          deselectAll();
          break;

        default:
          break;
      }
    },
    [rootNodes, expandedNodeIds, nodeMap, toggleNode, selectNode, deselectAll]
  );

  return {
    expandedNodeIds,
    selectedNodeIds,
    handleToggle,
    handleSelect,
    handleExpandAll,
    handleCollapseAll,
    handleExpandToNode,
    handleKeyDown,
  };
}
