import React from 'react';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Goal } from '../types/framework';

interface GoalsProgressProps {
    goal: Goal;
    currentCartoes: number;
    currentAprovacoes: number;
    currentCAC: number;
    onEditGoals: () => void;
    scope?: string;
}

export const GoalsProgress: React.FC<GoalsProgressProps> = ({
    goal,
    currentCartoes,
    currentAprovacoes,
    currentCAC,
    onEditGoals,
    scope = 'Global'
}) => {
    const cartoesPercent = goal.cartoes_meta ? Math.min((currentCartoes / goal.cartoes_meta) * 100, 100) : 0;
    const aprovacoesPercent = goal.aprovacoes_meta ? Math.min((currentAprovacoes / goal.aprovacoes_meta) * 100, 100) : 0;

    const isCacOk = !goal.cac_max || currentCAC <= goal.cac_max;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Target size={20} className="text-red-400" />
                    Meta vs. Realizado <span className="text-slate-500 text-sm font-normal">({scope})</span>
                </h2>
                <button
                    onClick={onEditGoals}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                    Definir Metas
                </button>
            </div>

            <div className="space-y-6">
                {/* Cartões */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Cartões Gerados</span>
                        <span className="text-slate-400">
                            <span className="text-white font-bold">{currentCartoes.toLocaleString('pt-BR')}</span>
                            {' / '}
                            {goal.cartoes_meta?.toLocaleString('pt-BR') || '—'}
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                            style={{ width: `${cartoesPercent}%` }}
                        />
                    </div>
                    <div className="text-right text-xs text-slate-500 mt-1">
                        {cartoesPercent.toFixed(1)}% da meta
                    </div>
                </div>

                {/* Aprovações */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Aprovações</span>
                        <span className="text-slate-400">
                            <span className="text-white font-bold">{currentAprovacoes.toLocaleString('pt-BR')}</span>
                            {' / '}
                            {goal.aprovacoes_meta?.toLocaleString('pt-BR') || '—'}
                        </span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
                            style={{ width: `${aprovacoesPercent}%` }}
                        />
                    </div>
                    <div className="text-right text-xs text-slate-500 mt-1">
                        {aprovacoesPercent.toFixed(1)}% da meta
                    </div>
                </div>

                {/* CAC Indicator */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-400 mb-1">CAC Médio Atual</div>
                        <div className={`text-xl font-bold ${isCacOk ? 'text-emerald-400' : 'text-red-400'}`}>
                            R$ {currentCAC.toFixed(2)}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-slate-400 mb-1">Meta Máxima</div>
                        <div className="text-sm font-medium text-slate-200">
                            {goal.cac_max ? `R$ ${goal.cac_max.toFixed(2)}` : 'Não definida'}
                        </div>
                    </div>

                    <div className={`p-2 rounded-full ${isCacOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isCacOk ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
