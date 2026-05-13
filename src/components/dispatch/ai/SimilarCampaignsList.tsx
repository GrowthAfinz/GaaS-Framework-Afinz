import React from 'react';
import { Calendar, Percent } from 'lucide-react';
import type { CampaignReference } from '../../../services/ml/types';

interface SimilarCampaignsListProps {
    campaigns: CampaignReference[];
    maxItems?: number;
    formatValue?: (value: number) => string;
}

/**
 * Lista de campanhas similares usadas na projecao
 */
export const SimilarCampaignsList: React.FC<SimilarCampaignsListProps> = ({
    campaigns,
    maxItems = 3,
    formatValue = (v) => v.toLocaleString('pt-BR')
}) => {
    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="text-[9px] text-slate-500 italic">
                Sem campanhas similares encontradas.
            </div>
        );
    }

    const displayCampaigns = campaigns.slice(0, maxItems);

    return (
        <div className="space-y-1">
            {displayCampaigns.map((campaign, index) => (
                <CampaignItem
                    key={campaign.id || index}
                    campaign={campaign}
                    formatValue={formatValue}
                    rank={index + 1}
                />
            ))}

            {campaigns.length > maxItems && (
                <div className="text-[8px] text-slate-500 text-center pt-0.5">
                    +{campaigns.length - maxItems} outras campanhas
                </div>
            )}
        </div>
    );
};

interface CampaignItemProps {
    campaign: CampaignReference;
    formatValue: (value: number) => string;
    rank: number;
}

const CampaignItem: React.FC<CampaignItemProps> = ({
    campaign,
    formatValue,
    rank
}) => {
    // Formatar data
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short'
            });
        } catch {
            return dateStr;
        }
    };

    // Cor baseada na similaridade
    const getSimilarityColor = () => {
        if (campaign.similarityScore >= 80) return 'text-emerald-600';
        if (campaign.similarityScore >= 60) return 'text-blue-600';
        if (campaign.similarityScore >= 40) return 'text-amber-600';
        return 'text-slate-500';
    };

    return (
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-200 hover:border-slate-300 transition-colors">
            {/* Rank */}
            <span className="text-[9px] text-slate-500 font-mono w-3">
                {rank}.
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium text-slate-700 truncate" title={campaign.activityName}>
                    {campaign.activityName.substring(0, 25)}
                    {campaign.activityName.length > 25 && '...'}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[8px] text-slate-500">
                        <Calendar size={8} />
                        {formatDate(campaign.dataDisparo)}
                    </span>
                </div>
            </div>

            {/* Valor */}
            <div className="text-right shrink-0">
                <div className="text-[10px] font-bold text-indigo-600">
                    {formatValue(campaign.metricValue)}
                </div>
                <div className={`flex items-center gap-0.5 text-[8px] ${getSimilarityColor()}`}>
                    <Percent size={8} />
                    {Math.round(campaign.similarityScore)}
                </div>
            </div>
        </div>
    );
};

export default SimilarCampaignsList;
