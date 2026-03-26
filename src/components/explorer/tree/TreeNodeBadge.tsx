import React from 'react';
import { TreeNode } from '../../../types/explorer';
import { useExplorerStore } from '../../../store/explorerStore';

interface TreeNodeBadgeProps {
  node: TreeNode;
}

function fmtCompactNum(n: number): string {
  if (n === 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtCompactCurrency(n: number): string {
  if (n === 0) return 'R$ 0';
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return `R$ ${n.toFixed(2)}`;
}

export const TreeNodeBadge: React.FC<TreeNodeBadgeProps> = ({ node }) => {
  const metric = useExplorerStore((state) => state.metric);

  const getValue = () => {
    switch (metric) {
      case 'cartoes':
        return fmtCompactNum(node.metrics.cartoes);
      case 'custo':
        return fmtCompactCurrency(node.metrics.custoTotal);
      case 'cac':
        return fmtCompactCurrency(node.metrics.cac);
      case 'volume':
        return fmtCompactNum(node.metrics.baseTotal);
      case 'disparos':
      default:
        return fmtCompactNum(node.count);
    }
  };

  return (
    <span className="ml-auto text-xs font-mono text-slate-500 tabular-nums shrink-0">
      {getValue()}
    </span>
  );
};
