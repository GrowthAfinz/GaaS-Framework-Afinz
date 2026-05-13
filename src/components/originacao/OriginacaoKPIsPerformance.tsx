import React from 'react';
import { MetricsSummary } from '../../types/b2c';
import { Target, DollarSign } from 'lucide-react';

interface OriginacaoKPIsPerformanceProps {
    summary: MetricsSummary;
}

const KPICardLarge = ({ label, value, subtitle, icon, colorClass }: { label: string, value: string, subtitle: string, icon: React.ReactNode, colorClass: string }) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 flex items-center justify-between group hover:border-slate-600 transition-all h-[120px]">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg bg-slate-900/50 ${colorClass}`}>
                    {icon}
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
            </div>

            <h3 className="text-3xl font-bold text-white tracking-tight mt-1">
                {value}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        </div>

    </div>
);

export const OriginacaoKPIsPerformance: React.FC<OriginacaoKPIsPerformanceProps> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KPICardLarge
                label="Share CRM"
                value={`${summary.share_crm_media.toFixed(1)}%`}
                subtitle="% de cartões gerados via CRM"
                icon={<Target size={18} />}
                colorClass="text-indigo-400"
            />
            <KPICardLarge
                label="CAC Médio"
                value={`R$ ${summary.cac_medio.toFixed(2)}`}
                subtitle="Custo por emissão"
                icon={<DollarSign size={18} />}
                colorClass="text-emerald-400"
            />
        </div>
    );
};
