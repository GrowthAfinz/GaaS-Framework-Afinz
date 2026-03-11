import React, { useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode as TreeNodeType } from '../../../types/explorer';
import { TreeNodeIcon } from './TreeNodeIcon';
import { TreeNodeBadge } from './TreeNodeBadge';

const LEVEL_INDENT = 16; // px per level

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string, multiSelect: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent, nodeId: string) => void;
}

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onKeyDown,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;
  const paddingLeft = level * LEVEL_INDENT;
  const isDisparo = node.type === 'disparo';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id, e.ctrlKey || e.metaKey);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) onToggle(node.id);
  };

  // ── Nó folha: disparo individual ───────────────────────────────────────
  if (isDisparo) {
    return (
      <div role="treeitem" aria-selected={isSelected}>
        <div
          ref={ref}
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => onKeyDown(e, node.id)}
          title={node.label}
          className={[
            'flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer select-none transition-colors',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
            isSelected
              ? 'bg-blue-50 border-l-2 border-blue-400 text-blue-700'
              : 'text-slate-500 hover:bg-slate-50 border-l-2 border-transparent hover:text-slate-700',
          ].join(' ')}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          {/* Espaço alinhado ao chevron dos pais */}
          <span className="shrink-0" style={{ width: 14 }} />

          {/* Ícone Send */}
          <TreeNodeIcon type="disparo" label={node.label} color={node.color || '#94A3B8'} size={12} />

          {/* Taxonomia em mono, truncada */}
          <span className="truncate flex-1 font-mono text-[10.5px] leading-relaxed opacity-80">
            {node.label}
          </span>
        </div>
      </div>
    );
  }

  // ── Nó regular: bu / segmento / canal ──────────────────────────────────
  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-selected={isSelected}>
      <div
        ref={ref}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => onKeyDown(e, node.id)}
        className={[
          'flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer select-none text-sm transition-colors',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
          isSelected
            ? 'bg-blue-50 border-l-2 border-blue-500 text-blue-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent hover:text-slate-800',
        ].join(' ')}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        {/* Chevron */}
        <span
          className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={handleChevronClick}
          style={{ width: 14 }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="inline-block" style={{ width: 12 }} />
          )}
        </span>

        {/* Icon */}
        <TreeNodeIcon type={node.type} label={node.label} color={node.color} size={13} />

        {/* Label */}
        <span className="truncate flex-1 font-medium text-xs leading-relaxed">
          {node.label}
        </span>

        {/* Badge */}
        <TreeNodeBadge count={node.count} />
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNodeChildWrapper
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Wrapper that reads store state for each child node
import { useExplorerStore } from '../../../store/explorerStore';

const TreeNodeChildWrapper: React.FC<{
  node: TreeNodeType;
  level: number;
  onToggle: (id: string) => void;
  onSelect: (id: string, multi: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
}> = ({ node, level, onToggle, onSelect, onKeyDown }) => {
  const { expandedNodeIds, selectedNodeIds } = useExplorerStore();
  return (
    <TreeNodeComponent
      node={node}
      level={level}
      isExpanded={expandedNodeIds.includes(node.id)}
      isSelected={selectedNodeIds.includes(node.id)}
      onToggle={onToggle}
      onSelect={onSelect}
      onKeyDown={onKeyDown}
    />
  );
};
