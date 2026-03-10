import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { CorrelationDataPoint } from '../../hooks/useMediaCorrelation';

interface Props {
    data: CorrelationDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const spend = payload.find((p: any) => p.dataKey === 'cumulativeSpend');
        const cards = payload.find((p: any) => p.dataKey === 'cumulativeCards');

        return (
            <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl">
                <p className="text-slate-700 text-xs mb-1">{label}</p>
                {spend && (
                    <p className="text-[#0066CC] font-bold text-sm">
                        Spend: {spend.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                )}
                {cards && (
                    <p className="text-[#00AA44] font-bold text-sm">
                        Cartões: {Math.round(cards.value).toLocaleString('pt-BR')}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export const DualAxisTimeline: React.FC<Props> = ({ data }) => {
    return (
        <div className="h-[350px] w-full bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-slate-900 font-bold mb-4 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0066CC]"></span> Spend Acumulado
                <span className="text-slate-500">vs</span>
                <span className="w-2 h-2 rounded-full bg-[#00AA44]"></span> Cartões Acumulados
            </h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#0066CC"
                        fontSize={11}
                        tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#00AA44"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        content={({ payload }) => (
                            <div className="flex justify-center gap-6 text-xs font-semibold mb-4">
                                {payload?.map((entry, index) => (
                                    <div key={`item-${index}`} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span style={{ color: '#94a3b8' }}>
                                            {entry.value === 'cumulativeSpend' ? 'Spend Acumulado (Meta+Google)' : 'Cartões B2C Acumulados (Data Original)'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    />

                    {/* The Bar component was commented out in the provided snippet, so it's not included in the final output. */}
                    {/* The original Line for cumulativeSpend is replaced by Area as per the provided snippet. */}
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="cumulativeSpend"
                        stroke="#0066CC"
                        fill="url(#colorSpend)"
                        strokeWidth={2}
                        name="Spend Acumulado"
                    />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulativeCards"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={false}
                        name="Cartões CRM Acumulados"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#00AA44' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
