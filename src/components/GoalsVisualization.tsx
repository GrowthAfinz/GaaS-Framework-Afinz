import React from 'react';
import { DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { Goal } from '../types/framework';

interface GoalsVisualizationProps {
    goal: Goal;
    currentCartoes: number;
    currentAprovacoes: number;
    currentCAC: number;
    scope?: string;
}

export const GoalsVisualization: React.FC<GoalsVisualizationProps> = ({
    goal,
    currentCartoes,
    currentAprovacoes,
    currentCAC
}) => {
    const cartoesPercent = goal.cartoes_meta ? Math.min((currentCartoes / goal.cartoes_meta) * 100, 100) : 0;
    const aprovacoesPercent = goal.aprovacoes_meta ? Math.min((currentAprovacoes / goal.aprovacoes_meta) * 100, 100) : 0;
    const isCacOk = !goal.cac_max || currentCAC <= goal.cac_max;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card Cartões */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                        <CreditCard size={48} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-400 text-sm font-medium">Cartões Gerados</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cartoesPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {cartoesPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {currentCartoes.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                        Meta: {goal.cartoes_meta?.toLocaleString('pt-BR') || '-'}
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${cartoesPercent}%` }}
                        />
                    </div>
                </div>

                {/* Card Aprovações */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                        <CheckCircle size={48} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-400 text-sm font-medium">Aprovações</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${aprovacoesPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {aprovacoesPercent.toFixed(1)}%
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {currentAprovacoes.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                        Meta: {goal.aprovacoes_meta?.toLocaleString('pt-BR') || '-'}
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${aprovacoesPercent}%` }}
                        />
                    </div>
                </div>

                {/* Card CAC */}
                <div className={`bg-slate-800/50 border rounded-lg p-4 relative overflow-hidden group transition-all ${isCacOk ? 'border-slate-700 hover:border-emerald-500/50' : 'border-red-900/50 hover:border-red-500/50'}`}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                        <DollarSign size={48} />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-400 text-sm font-medium">CAC Médio</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isCacOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isCacOk ? 'Dentro da Meta' : 'Acima da Meta'}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${isCacOk ? 'text-emerald-400' : 'text-red-400'}`}>
                        R$ {currentCAC.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                        Meta Máx: {goal.cac_max ? `R$ ${goal.cac_max.toFixed(2)}` : '-'}
                    </div>
                    {/* Visual indicator for CAC position relative to max */}
                    <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        {goal.cac_max && (
                            <div
                                className={`absolute h-full w-0.5 bg-white z-10`}
                                style={{ left: `${Math.min((goal.cac_max / (goal.cac_max * 1.5)) * 100, 100)}%` }}
                            />
                        )}
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${isCacOk ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${goal.cac_max ? Math.min((currentCAC / (goal.cac_max * 1.5)) * 100, 100) : 0}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
