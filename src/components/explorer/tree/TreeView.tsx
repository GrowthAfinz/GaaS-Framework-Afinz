import React from 'react';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { TreeNode } from '../../../types/explorer';
import { TreeNodeComponent } from './TreeNode';
import { useExplorerStore } from '../../../store/explorerStore';

interface TreeViewProps {
  rootNodes: TreeNode[];
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string, multiSelect: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onResetComparison?: () => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  rootNodes,
  onToggle,
  onSelect,
  onKeyDown,
  onExpandAll,
  onCollapseAll,
  onResetComparison,
}) => {
  const { expandedNodeIds, selectedNodeIds } = useExplorerStore();
  const isAnyExpanded = expandedNodeIds.length > 0;

  if (rootNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
        <p>Sem dados para o período</p>
      </div>
    );
  }

  return (
    <div role="tree" className="flex flex-col gap-0">
      {/* Expand/Collapse all */}
      <div className="flex items-center justify-end px-2 pb-1 gap-1">
        {onResetComparison && (
          <button
            onClick={onResetComparison}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors px-1 py-0.5 rounded"
            title="Limpar foco da comparação"
          >
            <span>Limpar</span>
          </button>
        )}
        <button
          onClick={isAnyExpanded ? onCollapseAll : onExpandAll}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-1 py-0.5 rounded"
          title={isAnyExpanded ? 'Recolher todos' : 'Expandir todos'}
        >
          {isAnyExpanded ? <ChevronsDownUp size={11} /> : <ChevronsUpDown size={11} />}
          <span>{isAnyExpanded ? 'Recolher' : 'Expandir'}</span>
        </button>
      </div>

      {rootNodes.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          isExpanded={expandedNodeIds.includes(node.id)}
          isSelected={selectedNodeIds.includes(node.id)}
          onToggle={onToggle}
          onSelect={onSelect}
          onKeyDown={onKeyDown}
        />
      ))}
    </div>
  );
};
