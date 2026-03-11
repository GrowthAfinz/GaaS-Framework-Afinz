import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { DetailsPaneData } from '../../../types/explorer';
import { TreeNodeIcon } from '../tree/TreeNodeIcon';
import { PerformanceCard } from './PerformanceCard';
import { ChannelDistribution } from './ChannelDistribution';
import { TopOffersTable } from './TopOffersTable';

interface DetailsPaneProps {
  data: DetailsPaneData | null;
  onClose: () => void;
  onViewAll: () => void;
}

export const DetailsPane: React.FC<DetailsPaneProps> = ({ data, onClose, onViewAll }) => {
  if (!data) {
    return (
      <div className="bg-slate-50 rounded-xl p-5 flex items-center justify-center h-full border border-dashed border-slate-300">
        <div className="text-center text-slate-500">
          <p className="text-sm font-medium">Selecione um item no Explorador de disparos</p>
          <p className="text-xs mt-1">para ver a análise</p>
        </div>
      </div>
    );
  }

  const { node, period, channelDistribution, topOffers } = data;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <TreeNodeIcon type={node.type} label={node.label} color={node.color} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{node.label}</p>
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase mt-0.5">{period}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Fechar painel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        <PerformanceCard metrics={node.metrics} count={node.count} />
        <div className="border-t border-slate-100" />
        <ChannelDistribution items={channelDistribution} />
        <div className="border-t border-slate-100" />
        <TopOffersTable items={topOffers} />
      </div>

      {/* Footer removido pedido pelo usuário */}
    </div>
  );
};
