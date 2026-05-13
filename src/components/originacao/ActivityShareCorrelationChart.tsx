import React, { useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { DailyAnalysis } from '../../types/b2c';
import { startOfWeek, format, parseISO } from 'date-fns';

interface ActivityShareCorrelationChartProps {
    data: DailyAnalysis[];
    onBarClick?: (date: string) => void;
}

export const ActivityShareCorrelationChart: React.FC<ActivityShareCorrelationChartProps> = ({ data, onBarClick }) => {

    // Internal Weekly Aggregation to reduce visual pollution
    const aggregatedData = useMemo(() => {
        const grouped: Record<string, {
            num_campanhas_crm: number;
            emissoes_crm: number;
            emissoes_b2c_total: number;
            originalDate: Date;
        }> = {}; // Key: YYYY-MM-DD (Start of Week)

        data.forEach(day => {
            // Parse YYYY-MM-DD manually to be safe or use parseISO if standard
            // day.data is YYYY-MM-DD
            const dateObj = parseISO(day.data);

            const start = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday
            const key = format(start, 'yyyy-MM-dd');

            if (!grouped[key]) {
                grouped[key] = {
                    num_campanhas_crm: 0,
                    emissoes_crm: 0,
                    emissoes_b2c_total: 0,
                    originalDate: start
                };
            }

            grouped[key].num_campanhas_crm += day.num_campanhas_crm || 0;
            grouped[key].emissoes_crm += day.emissoes_crm || 0;
            grouped[key].emissoes_b2c_total += day.emissoes_b2c_total || 0;
        });

        return Object.keys(grouped).sort().map(key => {
            const g = grouped[key];
            const share = g.emissoes_b2c_total > 0 ? (g.emissoes_crm / g.emissoes_b2c_total) * 100 : 0;

            return {
                data: key,
                displayDate: format(g.originalDate, 'dd/MM'), // Format for X-Axis
                num_campanhas_crm: g.num_campanhas_crm,
                share_emissoes_crm_percentual: share,
                // Add validation/clipping if needed, but raw is better
            };
        });
    }, [data]);

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50 mt-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-100 mb-2 opacity-90">Eficiência de Campanhas: Volume de Disparos vs Share CRM</h3>
            <p className="text-xs text-slate-500 mb-6">
                Análise de quantas campanhas foram disparadas e seu impacto no share de participação no total B2C (Agrupado por Semana).
            </p>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={aggregatedData}
                        onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload.length > 0) {
                                const clickedDate = state.activePayload[0].payload.data;
                                if (onBarClick) onBarClick(clickedDate);
                            }
                        }}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            scale="band"
                            stroke="#64748b"
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#64748b"
                            tick={{ fontSize: 10 }}
                            label={{ value: 'Campanhas/Semana', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#64748b"
                            tick={{ fontSize: 10 }}
                            unit="%"
                            label={{ value: 'Share CRM %', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: 10 } }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                            formatter={(value: number, name: string) => {
                                if (name === 'Share CRM %') return [`${value.toFixed(1)}%`, name];
                                return [value, name];
                            }}
                            labelFormatter={(label) => `Semana de ${label}`}
                        />
                        <Legend />
                        <Bar
                            yAxisId="left"
                            dataKey="num_campanhas_crm"
                            name="Campanhas Disparadas"
                            barSize={30}
                            fill="#3b82f6"
                            fillOpacity={0.6}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="share_emissoes_crm_percentual"
                            name="Share CRM %"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
