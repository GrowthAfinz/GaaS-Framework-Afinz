
import React, { useMemo } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CorrelationDataPoint, CorrelationStats } from '../../hooks/useMediaCorrelation';

interface Props {
    data: CorrelationDataPoint[];
    stats: CorrelationStats | null;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        // payload[0] is usually the scatter point
        const pt = payload[0].payload;
        // Check if it's the Line point (which we don't want tooltip for? or simplify)
        if (pt.isRegression) return null;

        return (
            <div className="bg-white border border-slate-200 p-2 rounded shadow-lg text-xs">
                <p className="text-slate-500 mb-1">{pt.displayDate}</p>
                <p className="text-slate-900">Spend: <strong>R$ {pt.spendTotal.toLocaleString('pt-BR')}</strong></p>
                <p className="text-slate-900">Cartões: <strong>{pt.cards}</strong></p>
            </div>
        );
    }
    return null;
};

export const ScatterRegression: React.FC<Props> = ({ data, stats }) => {

    const regressionPoints = useMemo(() => {
        if (!stats || data.length === 0) return [];
        const { slope, intercept } = stats;

        // Find min/max X (Spend)
        const spends = data.map(d => d.spendTotal);
        const minX = Math.min(...spends);
        const maxX = Math.max(...spends);

        // Extend slightly for visual
        const x1 = minX;
        const x2 = maxX;
        const y1 = slope * x1 + intercept;
        const y2 = slope * x2 + intercept;

        return [
            { spendTotal: x1, cards: y1, isRegression: true },
            { spendTotal: x2, cards: y2, isRegression: true }
        ];
    }, [data, stats]);

    return (
        <div className="h-[350px] w-full bg-white p-4 rounded-xl border border-slate-200 relative">
            <h4 className="text-slate-900 font-bold mb-4 text-sm">Dispersão + Regressão Linear</h4>

            {/* R^2 Display */}
            {stats && (
                <div className="absolute top-4 right-4 bg-white border border-slate-200 rounded px-2 py-1 shadow-sm z-10">
                    <p className="text-xs font-bold text-black">R² = {stats.rSquared.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">{stats.formula}</p>
                </div>
            )}
            {stats && (
                <div className="absolute top-14 right-4 text-[10px] italic text-slate-400 text-right max-w-[150px]">
                    "A cada R$ 1.000 em spend, estimado +{(stats.slope * 1000).toFixed(0)} cartões"
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} />
                    <XAxis
                        dataKey="spendTotal"
                        type="number"
                        name="Spend"
                        stroke="#64748b"
                        fontSize={11}
                        tickFormatter={(val) => `R$${val / 1000}k`}
                        domain={['auto', 'auto']}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="Cartões B2C (Lag)"
                        unit=""
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Cartões B2C (Deslocados)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white border border-slate-200 p-3 rounded shadow-lg text-xs">
                                        <p className="border-b border-slate-200 pb-1 mb-1 font-bold text-slate-900">{data.date}</p>
                                        <p className="text-blue-600">Spend: {data.x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        <p className="text-emerald-600">Cartões B2C (Lag): {data.y}</p>
                                        <p className="text-slate-500 italic mt-1 scale-90 origin-left">Resultados de {data.y} dias depois</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="Dias" data={data} fill="#94a3b8" shape="circle" />
                    <Line
                        data={regressionPoints}
                        dataKey="cards"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                        name="Regressão"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
