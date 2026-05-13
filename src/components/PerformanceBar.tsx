import React from 'react';

export interface PerformanceMetric {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
}

interface PerformanceBarProps {
  metrics: PerformanceMetric[];
  title?: string;
}

export const PerformanceBar: React.FC<PerformanceBarProps> = ({ metrics, title }) => {
  if (metrics.length === 0) return null;

  // Encontrar o máximo para normalizar
  const maxValue = Math.max(...metrics.map((m) => m.value));

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-bold text-slate-100">{title}</h3>}
      <div className="space-y-3">
        {metrics.map((metric, idx) => {
          const percentage = maxValue > 0 ? (metric.value / maxValue) * 100 : 0;
          const displayValue = metric.unit ? `${metric.value}${metric.unit}` : `${metric.value}%`;
          const color = metric.color || 'bg-blue-600';

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{metric.label}</span>
                <span className={`text-sm font-bold ${metric.value >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {displayValue}
                </span>
              </div>
              <div className="h-5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} flex items-center justify-end pr-2 transition-all duration-300 rounded-full`}
                  style={{ width: `${Math.max(percentage, 15)}%` }}
                >
                  {percentage > 25 && (
                    <span className="text-xs font-bold text-white">{Math.round(percentage)}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
