import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ShareBySegmentChartProps {
    segmentStats: { name: string; value: number }[];
    totalB2CEmissoes: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#475569']; // Last color gray for others

export const ShareBySegmentChart: React.FC<ShareBySegmentChartProps> = ({ segmentStats, totalB2CEmissoes }) => {
    const [showOthers, setShowOthers] = useState(true);

    // Calculate share for each segment relative to Total B2C
    const dataWithShare = segmentStats.map(stat => ({
        ...stat,
        share: totalB2CEmissoes > 0 ? (stat.value / totalB2CEmissoes) * 100 : 0
    }));

    // Filter based on toggle
    const filteredData = showOthers ? dataWithShare : dataWithShare.filter(d => d.name !== 'Outros B2C');

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 h-full flex flex-col relative">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-slate-100 opacity-90">Share por Campanha</h3>

                {/* Toggle Button for "Outros B2C" */}
                {dataWithShare.some(d => d.name === 'Outros B2C') && (
                    <button
                        onClick={() => setShowOthers(!showOthers)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${showOthers
                                ? 'bg-slate-700 border-slate-600 text-slate-300'
                                : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-400'
                            }`}
                        title={showOthers ? "Ocultar Outros B2C" : "Mostrar Outros B2C"}
                    >
                        {showOthers ? 'Com Outros' : 'Sem Outros'}
                    </button>
                )}
            </div>

            <p className="text-xs text-slate-500 mb-6">
                Participação de cada campanha no total de emissões B2C.
            </p>

            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filteredData}
                            cx="40%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            cornerRadius={4}
                        >
                            {filteredData.map((entry, index) => {
                                // Default color mapping, ensuring "Outros" gets grey if present
                                let color = COLORS[index % COLORS.length];
                                if (entry.name === 'Outros B2C') color = '#475569';
                                return <Cell key={`cell-${index}`} fill={color} stroke="rgba(0,0,0,0)" />;
                            })}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value: number, name: string, props: any) => {
                                const share = props.payload.share || 0;
                                return [`${value.toLocaleString()} (${share.toFixed(1)}%)`, name];
                            }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                            formatter={(value, entry: any) => {
                                const { payload } = entry;
                                return (
                                    <span className="ml-1 text-slate-400">
                                        {value} <span className="text-slate-600 mx-1">|</span> <span className="text-slate-200 font-medium">{payload.share.toFixed(2)}%</span>
                                    </span>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
