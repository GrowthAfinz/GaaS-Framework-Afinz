import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, CreditCard } from 'lucide-react';

export const ResultEstimates: React.FC = () => {
    // Mock State for Simulation
    const [mediaBudget, setMediaBudget] = useState(150000);
    const [efficiencyTarget, setEfficiencyTarget] = useState(50); // CAC Target

    // Mock Calculations
    const estimatedCards = Math.floor(mediaBudget / efficiencyTarget);
    const organicCards = 1200;
    const totalCards = organicCards + estimatedCards;
    const uplift = ((totalCards - organicCards) / organicCards) * 100;

    const fmtMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Simulation Controls */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Calculator className="text-blue-500" />
                    Simulado de Impacto
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">
                            Investimento de Mídia (Mensal)
                        </label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                value={mediaBudget}
                                onChange={(e) => setMediaBudget(Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <input
                            type="range"
                            min="10000"
                            max="500000"
                            step="5000"
                            value={mediaBudget}
                            onChange={(e) => setMediaBudget(Number(e.target.value))}
                            className="w-full mt-2 accent-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">
                            Meta de Eficiência (CAC Alvo)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                            <input
                                type="number"
                                value={efficiencyTarget}
                                onChange={(e) => setEfficiencyTarget(Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <input
                            type="range"
                            min="20"
                            max="150"
                            step="1"
                            value={efficiencyTarget}
                            onChange={(e) => setEfficiencyTarget(Number(e.target.value))}
                            className="w-full mt-2 accent-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Results Display */}
            <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Cards Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-700">Total de Cartões Estimados</p>
                        <h2 className="text-4xl font-bold text-slate-900 mt-1">{fmtNum(totalCards)}</h2>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 py-1.5 px-3 rounded-lg w-fit">
                        <CreditCard size={16} />
                        <span>{fmtNum(estimatedCards)} via Mídia Paga</span>
                    </div>
                </div>

                {/* Uplift Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-6 rounded-xl flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">Uplift sobre Orgânico</p>
                        <h2 className="text-4xl font-bold text-slate-900 mt-1">+{uplift.toFixed(1)}%</h2>
                        <p className="text-xs text-emerald-600 mt-1">Base Orgânica: {fmtNum(organicCards)} cartões</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg w-fit">
                        <TrendingUp size={16} />
                        <span>Aceleração de Crescimento</span>
                    </div>
                </div>

                {/* Performance Summary Table */}
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Resumo da Projeção</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Cenário</th>
                                    <th className="px-4 py-3">Investimento</th>
                                    <th className="px-4 py-3">Cartões Totais</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Retorno Estimado (LTV)</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                <tr className="border-b border-slate-200">
                                    <td className="px-4 py-3 font-medium">Atual (Projetado)</td>
                                    <td className="px-4 py-3">{fmtMoney(mediaBudget)}</td>
                                    <td className="px-4 py-3">{fmtNum(totalCards)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{fmtMoney(totalCards * 450)}</td>
                                </tr>
                                <tr className="border-b border-slate-200 opacity-50">
                                    <td className="px-4 py-3 font-medium">Conservador (-20%)</td>
                                    <td className="px-4 py-3">{fmtMoney(mediaBudget)}</td>
                                    <td className="px-4 py-3">{fmtNum(organicCards + (estimatedCards * 0.8))}</td>
                                    <td className="px-4 py-3 text-right">{fmtMoney((organicCards + (estimatedCards * 0.8)) * 450)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-right">* LTV Estimado de R$ 450,00 por cliente cartão.</p>
                </div>
            </div>
        </div>
    );
};
