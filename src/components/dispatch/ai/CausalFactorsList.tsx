import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { CausalFactor } from '../../../services/ml/types';

interface CausalFactorsListProps {
    factors: CausalFactor[];
    maxItems?: number;
    compact?: boolean;
}

/**
 * Lista de fatores causais que influenciam a projecao
 */
export const CausalFactorsList: React.FC<CausalFactorsListProps> = ({
    factors,
    maxItems = 5,
    compact = false
}) => {
    if (!factors || factors.length === 0) {
        return (
            <div className="text-[9px] text-slate-500 italic">
                Sem fatores causais identificados.
            </div>
        );
    }

    const displayFactors = factors.slice(0, maxItems);

    return (
        <div className="space-y-1.5">
            {displayFactors.map((factor, index) => (
                <CausalFactorItem
                    key={`${factor.feature}-${index}`}
                    factor={factor}
                    compact={compact}
                />
            ))}

            {factors.length > maxItems && (
                <div className="text-[8px] text-slate-500 text-center pt-1">
                    +{factors.length - maxItems} outros fatores
                </div>
            )}
        </div>
    );
};

interface CausalFactorItemProps {
    factor: CausalFactor;
    compact?: boolean;
}

const CausalFactorItem: React.FC<CausalFactorItemProps> = ({ factor, compact }) => {
    const isPositive = factor.direction === 'positive';
    const absImpact = Math.abs(factor.impact);

    // Determinar intensidade do impacto
    const getIntensity = () => {
        if (absImpact >= 20) return 'high';
        if (absImpact >= 10) return 'medium';
        return 'low';
    };

    const intensity = getIntensity();

    // Cores baseadas em direcao e intensidade
    const colorClasses = {
        positive: {
            high: 'text-emerald-700 bg-emerald-50 border-emerald-500/30',
            medium: 'text-emerald-600 bg-emerald-50 border-emerald-500/20',
            low: 'text-emerald-500 bg-emerald-50 border-emerald-500/10'
        },
        negative: {
            high: 'text-red-700 bg-red-50 border-red-500/30',
            medium: 'text-red-600 bg-red-50 border-red-500/20',
            low: 'text-red-500 bg-red-50 border-red-500/10'
        }
    };

    const direction = isPositive ? 'positive' : 'negative';
    const colors = colorClasses[direction][intensity];

    if (compact) {
        return (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${colors}`}>
                {isPositive ? (
                    <TrendingUp size={10} />
                ) : (
                    <TrendingDown size={10} />
                )}
                <span className="text-[8px] font-medium truncate">
                    {factor.feature}: {isPositive ? '+' : ''}{factor.impact.toFixed(1)}%
                </span>
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-2 px-2 py-1.5 rounded border ${colors}`}>
            <div className="mt-0.5">
                {isPositive ? (
                    <TrendingUp size={12} />
                ) : (
                    <TrendingDown size={12} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold truncate">
                        {factor.feature}
                    </span>
                    {factor.isConfounder && (
                        <span title="Confounder detectado" className="text-amber-600">
                            <AlertTriangle size={9} />
                        </span>
                    )}
                </div>

                <div className="text-[9px] text-slate-600 truncate">
                    "{factor.value}"
                </div>

                <div className="text-[9px] mt-0.5 opacity-80">
                    {factor.explanation}
                </div>
            </div>

            <div className="text-right shrink-0">
                <span className="text-[11px] font-bold">
                    {isPositive ? '+' : ''}{factor.impact.toFixed(1)}%
                </span>
            </div>
        </div>
    );
};

export default CausalFactorsList;
