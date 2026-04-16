/**
 * CampaignBudgetTable Component
 *
 * Displays detailed breakdown of budget allocations per campaign
 * Shows: Nome, Orçado, Realizado, %, Projeção, Ritmo, Status, Ações
 */

import React, { useState } from 'react';
import { Edit2, Trash2, MoreVertical, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { CampaignBudget, formatPaceStatus } from '../types/budget';

interface CampaignBudgetTableProps {
  campaigns: CampaignBudget[];
  onEdit: (campaign: CampaignBudget) => void;
  onDelete: (id: string) => void;
  onRelocate: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number | undefined) => (value !== undefined ? `${Math.round(value)}%` : '—');

export const CampaignBudgetTable: React.FC<CampaignBudgetTableProps> = ({
  campaigns,
  onEdit,
  onDelete,
  onRelocate,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'allocated' | 'realized' | 'pace'>('name');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    switch (sortBy) {
      case 'allocated':
        return (b.allocatedBudget || 0) - (a.allocatedBudget || 0);
      case 'realized':
        return (b.realizedSpend || 0) - (a.realizedSpend || 0);
      case 'pace':
        return (b.paceIndex || 0) - (a.paceIndex || 0);
      case 'name':
      default:
        return a.campaignName.localeCompare(b.campaignName);
    }
  });

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 text-sm">Nenhuma campanha alocada neste objetivo</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header with action button */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-bold text-slate-800">Detalhamento por Campanha</h4>
        <button
          onClick={onRelocate}
          className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
        >
          ⟳ Realocar Budget
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left font-semibold text-slate-700">
                <button
                  onClick={() => setSortBy('name')}
                  className="hover:text-slate-900 transition-colors"
                >
                  Campanha {sortBy === 'name' && '↓'}
                </button>
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">
                <button
                  onClick={() => setSortBy('allocated')}
                  className="hover:text-slate-900 transition-colors block w-full text-right"
                >
                  Orçado {sortBy === 'allocated' && '↓'}
                </button>
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">% Obj</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">
                <button
                  onClick={() => setSortBy('realized')}
                  className="hover:text-slate-900 transition-colors block w-full text-right"
                >
                  Realizado {sortBy === 'realized' && '↓'}
                </button>
              </th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">% Alocado</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">Projeção</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">
                <button
                  onClick={() => setSortBy('pace')}
                  className="hover:text-slate-900 transition-colors block w-full text-right"
                >
                  Ritmo {sortBy === 'pace' && '↓'}
                </button>
              </th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedCampaigns.map((campaign) => {
              const statusDisplay = campaign.paceStatus ? formatPaceStatus(campaign.paceStatus) : null;

              return (
                <tr key={campaign.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  {/* Campaign Name */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{campaign.campaignName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {campaign.channel === 'meta' ? 'Meta Ads' : 'Google Ads'}
                      </p>
                    </div>
                  </td>

                  {/* Orçado */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-slate-800">{formatCurrency(campaign.allocatedBudget)}</p>
                  </td>

                  {/* % do Objetivo */}
                  <td className="px-6 py-4 text-right text-slate-600">
                    {formatPercentage(campaign.percentOfObjective)}
                  </td>

                  {/* Realizado */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-medium text-blue-600">{formatCurrency(campaign.realizedSpend || 0)}</p>
                  </td>

                  {/* % do Orçado */}
                  <td className="px-6 py-4 text-right text-slate-600">
                    {formatPercentage(campaign.percentOfAllocated)}
                  </td>

                  {/* Projeção */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-medium text-slate-800">{formatCurrency(campaign.projectedSpend || 0)}</p>
                  </td>

                  {/* Ritmo */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-slate-800">{campaign.paceIndex?.toFixed(2)}x</p>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    {statusDisplay && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusDisplay.color}`}>
                        {campaign.paceStatus === 'overspending' && <TrendingUp size={14} />}
                        {campaign.paceStatus === 'underspending' && <TrendingDown size={14} />}
                        {campaign.paceStatus === 'ontrack' && <CheckCircle size={14} />}
                        <span>{statusDisplay.label}</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === campaign.id ? null : campaign.id)}
                        className="p-2 hover:bg-slate-200 rounded transition-colors"
                      >
                        <MoreVertical size={16} className="text-slate-500" />
                      </button>

                      {menuOpenId === campaign.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              onEdit(campaign);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 text-sm font-medium"
                          >
                            <Edit2 size={14} />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              onDelete(campaign.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm font-medium border-t border-slate-100"
                          >
                            <Trash2 size={14} />
                            Deletar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-slate-500 mb-1">Total Orçado</p>
          <p className="font-bold text-slate-800">{formatCurrency(campaigns.reduce((s, c) => s + c.allocatedBudget, 0))}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-1">Total Realizado</p>
          <p className="font-bold text-slate-800">{formatCurrency(campaigns.reduce((s, c) => s + (c.realizedSpend || 0), 0))}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-1">Total Projetado</p>
          <p className="font-bold text-slate-800">{formatCurrency(campaigns.reduce((s, c) => s + (c.projectedSpend || 0), 0))}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-1">Ritmo Médio</p>
          <p className="font-bold text-slate-800">
            {(campaigns.reduce((s, c) => s + (c.paceIndex || 0), 0) / campaigns.length).toFixed(2)}x
          </p>
        </div>
      </div>
    </div>
  );
};
