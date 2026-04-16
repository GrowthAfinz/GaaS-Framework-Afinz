
import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { DailyAnalysis } from '../../types/b2c';
import { OriginacaoDashboardRow } from '../../hooks/useOriginacaoDashboard';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { ViewMode } from '../../hooks/useB2CAnalysis';

interface OriginacaoChartsProps {
    data: DailyAnalysis[];
    dashboardRows: OriginacaoDashboardRow[];
    shareThreshold?: number;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    onPointClick?: (date: Date) => void;
}

const tooltipFormatter = (value: number, name: string) => {
    if (name.includes('%') || name.includes('Taxa') || name.includes('Share') || name.includes('Conv')) {
        return [`${value.toFixed(2)}%`, name];
    }
    if (name.includes('CAC') || name.includes('Custo')) {
        return [`R$ ${value.toFixed(2)}`, name];
    }
    return [value, name];
};

export const OriginacaoCharts: React.FC<OriginacaoChartsProps> = ({
    data,
    dashboardRows,
    shareThreshold = 15,
    viewMode,
    setViewMode,
    onPointClick
}) => {

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0 && onPointClick) {
            const item = data.activePayload[0].payload;
            if (item && item.data) {
                const [y, m, d] = item.data.split('-').map(Number);
                onPointClick(new Date(y, m - 1, d));
            }
        }
    };

    const fmt = (val: number, isPercent = false) => {
        if (isPercent) return `${val.toFixed(1)}%`;
        return val.toLocaleString('pt-BR');
    };

    const getGroupKey = (dateKey: string) => {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        if (viewMode === 'weekly') {
            return format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        }

        if (viewMode === 'monthly') {
            return format(startOfMonth(dateObj), 'yyyy-MM-dd');
        }

        return dateKey;
    };

    // Prepare data for charts with derived fields
    const chartData = useMemo(() => {
        return data.map(d => {
            // SAFEGUARD: If B2C data is missing (0), we can't calculate 'Outros'.
            const outros_propostas = Math.max(0, d.propostas_b2c_total - d.propostas_crm);
            const outros_emissoes = Math.max(0, d.emissoes_b2c_total - d.emissoes_crm);

            // Date formatting for X-Axis
            const [y, m, day] = d.data.split('-').map(Number);
            const dateObj = new Date(y, m - 1, day);
            const formattedDate = format(dateObj, 'dd/MM', { locale: ptBR });

            return {
                ...d,
                displayDate: formattedDate,
                outros_propostas,
                outros_emissoes
            };
        });
    }, [data]);

    const volumeChartData = useMemo(() => {
        const grouped = new Map<string, {
            data: string;
            crm_propostas: number;
            serasa_propostas: number;
            outros_propostas: number;
            crm_emissoes: number;
            serasa_emissoes: number;
            outros_emissoes: number;
        }>();

        dashboardRows.forEach((row) => {
            const key = getGroupKey(row.date);
            const current = grouped.get(key) || {
                data: key,
                crm_propostas: 0,
                serasa_propostas: 0,
                outros_propostas: 0,
                crm_emissoes: 0,
                serasa_emissoes: 0,
                outros_emissoes: 0
            };

            const otherProposals = Math.max(0, row.totalProposals - row.crmProposals - row.serasaProposals);
            const otherCards = Math.max(0, row.totalCards - row.crmCards - row.serasaCards);

            current.crm_propostas += row.crmProposals;
            current.serasa_propostas += row.serasaProposals;
            current.outros_propostas += otherProposals;
            current.crm_emissoes += row.crmCards;
            current.serasa_emissoes += row.serasaCards;
            current.outros_emissoes += otherCards;

            grouped.set(key, current);
        });

        return Array.from(grouped.values())
            .sort((a, b) => a.data.localeCompare(b.data))
            .map((row) => {
                const [y, m, day] = row.data.split('-').map(Number);
                return {
                    ...row,
                    displayDate: format(new Date(y, m - 1, day), 'dd/MM', { locale: ptBR })
                };
            });
    }, [dashboardRows, viewMode]);

    // Aggregate data by Day of Week for the Share Chart
    const shareByDay = useMemo(() => {
        const aggr: Record<string, { total: number; crm: number }> = {};
        const daysOrder = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

        // Initialize
        daysOrder.forEach(d => aggr[d] = { total: 0, crm: 0 });

        data.forEach(d => {
            if (d.dia_semana && aggr[d.dia_semana]) {
                aggr[d.dia_semana].total += d.emissoes_b2c_total;
                aggr[d.dia_semana].crm += d.emissoes_crm;
            }
        });

        return daysOrder.map(day => {
            const t = aggr[day];
            const share = t.total > 0 ? (t.crm / t.total) * 100 : 0;
            return {
                dia: day.charAt(0).toUpperCase() + day.slice(1),
                share
            };
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="p-10 text-center text-slate-500">Sem dados para exibir nos gráficos</div>;
    }

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Análise Gráfica</h3>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === mode
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                        >
                            {mode === 'daily' ? 'Dia' : mode === 'weekly' ? 'Semana' : 'Mês'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* 1. Volume: Propostas CRM vs B2C */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Volume de Propostas: CRM vs B2C Total</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeChartData} onClick={handleChartClick}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    cursor={{ fill: '#E2E8F0', opacity: 0.4 }}
                                    formatter={tooltipFormatter}
                                />
                                <Legend />
                                <Bar dataKey="crm_propostas" name="CRM" stackId="a" fill="#14b8a6" />
                                <Bar dataKey="serasa_propostas" name="Serasa API" stackId="a" fill="#2563eb" />
                                <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Taxa de Conversão Comparativa */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Taxa de Conversão: CRM vs Média B2C</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} onClick={handleChartClick}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    formatter={tooltipFormatter}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="taxa_conversao_crm" name="Conv. CRM" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="taxa_conversao_b2c" name="Conv. B2C" stroke="#94a3b8" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Tendência Share CRM (%) [Was #4] */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Tendência Share CRM (%)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} onClick={handleChartClick}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    itemStyle={{ color: '#1e293b' }}
                                    formatter={tooltipFormatter}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="share_emissoes_crm_percentual"
                                    name="Share CRM %"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={() => shareThreshold}
                                    name="Meta Mínima"
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    strokeWidth={1}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Volume de Emissões: CRM vs B2C [Was #3] */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Volume de Emissões: CRM vs B2C</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeChartData} onClick={handleChartClick}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    cursor={{ fill: '#E2E8F0', opacity: 0.4 }}
                                    formatter={tooltipFormatter}
                                />
                                <Legend />
                                <Bar dataKey="crm_emissoes" name="CRM" stackId="a" fill="#14b8a6" />
                                <Bar dataKey="serasa_emissoes" name="Serasa API" stackId="a" fill="#2563eb" />
                                <Bar dataKey="outros_emissoes" name="Outros B2C" stackId="a" fill="#64748b" opacity={0.5} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. CAC Evolution (R$) [Was #6] */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">CAC Evolution (R$)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} onClick={handleChartClick}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    formatter={tooltipFormatter}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="cac_medio"
                                    name="CAC Médio"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Share por Dia da Semana [Was #5] */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Share por Dia da Semana</h3>
                    <div className="flex-1 flex items-end gap-2 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shareByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="dia" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" unit="%" fontSize={10} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0' }}
                                    formatter={(val: number) => fmt(val, true)}
                                />
                                <Bar dataKey="share" name="Share Médio" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">* Dados agregados do período</p>
                </div>
            </div>
        </div>
    );
};
