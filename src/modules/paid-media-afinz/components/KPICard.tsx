import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string;

    // Trend Section
    trendValue?: number; // e.g. 4
    trendLabel?: string; // e.g. "vs ontem"
    trendInverse?: boolean; // if true, up is bad

    // Context Section
    contextValue?: string; // e.g. "65% do orçado"

    // Status Section
    status?: 'success' | 'warning' | 'error';

    icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trendValue,
    trendLabel = "vs período anterior",
    trendInverse = false,
    contextValue,
    status,
    icon
}) => {
    // Trend Logic
    const isPositive = trendValue !== undefined && trendValue > 0;
    const isNeutral = trendValue === 0 || trendValue === undefined;

    let trendColor = 'text-slate-500';
    let TrendIcon = Minus;

    if (!isNeutral && trendValue !== undefined) {
        if (isPositive) {
            TrendIcon = ArrowUpRight;
            trendColor = trendInverse ? 'text-red-500' : 'text-green-500';
        } else {
            TrendIcon = ArrowDownRight;
            trendColor = trendInverse ? 'text-green-500' : 'text-red-500';
        }
    }

    // Status Logic
    const StatusIcon = status === 'success' ? CheckCircle : status === 'warning' ? AlertTriangle : XCircle;
    const statusColor = status === 'success' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:border-[#00c6cc]/40 transition-colors relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-light text-slate-400 uppercase tracking-wider">{title}</p>
                {icon && <div className="text-slate-500 opacity-80 scale-90">{icon}</div>}
            </div>

            {/* Main Value */}
            <h3 className="text-2xl font-black text-white tracking-tight mb-3">{value}</h3>

            {/* Footer / Details */}
            <div className="flex flex-col gap-1 text-xs">

                {/* Row 1: Trend */}
                {trendValue !== undefined && (
                    <div className="flex items-center gap-1.5 font-medium">
                        <span className={`flex items-center ${trendColor}`}>
                            <TrendIcon className="w-3.5 h-3.5" />
                            {Math.abs(trendValue).toFixed(1)}%
                        </span>
                        <span className="text-slate-400 font-light">{trendLabel}</span>
                    </div>
                )}

                {/* Row 2: Context + Status */}
                {(contextValue || status) && (
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-800">
                        {contextValue && (
                            <span className="text-slate-400 font-light">
                                {contextValue}
                            </span>
                        )}

                        {contextValue && status && <span className="text-slate-700">|</span>}

                        {status && (
                            <div className={`flex items-center gap-1 ${statusColor}`}>
                                <span>Status:</span>
                                <StatusIcon className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Decorator Line — teal accent (Afinz brand) */}
            <div className={`absolute bottom-0 left-0 h-0.5 w-full ${status === 'error' ? 'bg-[#e74742]' : status === 'warning' ? 'bg-[#f8a538]' : 'bg-[#00c6cc]'}`} />
        </div>
    );
};
