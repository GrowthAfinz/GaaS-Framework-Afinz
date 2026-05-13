
import React from 'react';
import { MetricsSummary } from '../../types/b2c';
import {
    CreditCard,
    TrendingUp,
    DollarSign,
    BarChart2,
    FileText
} from 'lucide-react';

interface OriginacaoKPIsProps {
    summary: MetricsSummary;
}

export const OriginacaoKPIs: React.FC<OriginacaoKPIsProps> = ({ summary }) => {

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">

            {/* 1. Propostas B2C (Total) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Propostas B2C</p>
                    <FileText className="text-blue-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    {summary.propostas_b2c_total.toLocaleString('pt-BR')}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Recebidas no período</p>
            </div>

            {/* 2. Cartões B2C (Total) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Cartões B2C</p>
                    <CreditCard className="text-blue-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    {summary.emissoes_b2c_total.toLocaleString('pt-BR')}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Gerados no período</p>
            </div>

            {/* 3. Taxa Conversão B2C (%) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Conv. B2C</p>
                    <TrendingUp className="text-blue-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    {summary.taxa_conversao_b2c_media.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Conversão média</p>
            </div>

            {/* 4. Share CRM (%) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Share CRM</p>
                    <BarChart2 className="text-indigo-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    {summary.share_crm_media.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">% de participação</p>
            </div>

            {/* 5. Emissões CRM */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Cartões CRM</p>
                    <CreditCard className="text-emerald-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    {summary.emissoes_crm_total.toLocaleString('pt-BR')}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Gerados via CRM</p>
            </div>

            {/* 6. CAC Médio */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">CAC Médio</p>
                    <DollarSign className="text-yellow-600" size={16} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                    R$ {summary.cac_medio.toFixed(2)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Custo por emissão</p>
            </div>

        </div>
    );
};
