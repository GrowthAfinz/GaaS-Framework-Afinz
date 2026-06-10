import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineDataPoint {
  date: string;
  controle: number;
  variante: number;
}

interface Props {
  data: SparklineDataPoint[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export function ConversionSparkline({ data, color = '#3b82f6', height = 28, showTooltip = false }: Props) {
  if (!data || !data.length) {
    return <div className={`h-7 bg-slate-100 rounded animate-pulse w-full`} style={{ height }} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        {showTooltip && (
          <Tooltip
            formatter={(v: number) => [`${(v * 100).toFixed(2)}%`]}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              borderColor: '#e2e8f0', 
              color: '#334155', 
              fontSize: 11,
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#0f172a' }}
          />
        )}
        {/* Controle: dashed gray line */}
        <Line
          type="monotone"
          dataKey="controle"
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false} // Disable animation for list performance
        />
        {/* Variante: solid colored line */}
        <Line
          type="monotone"
          dataKey="variante"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
