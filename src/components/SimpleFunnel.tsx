import React from 'react';

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface SimpleFunnelProps {
  stages: FunnelStage[];
  title?: string;
}

export const SimpleFunnel: React.FC<SimpleFunnelProps> = ({ stages, title }) => {
  if (stages.length === 0) return null;

  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-bold text-slate-100 mb-4">{title}</h3>}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const percentage = (stage.value / maxValue) * 100;
          const conversionRate =
            idx > 0
              ? Math.round((stage.value / stages[idx - 1].value) * 100)
              : 100;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{stage.label}</span>
                <span className="text-slate-400">
                  {stage.value.toLocaleString()} 
                  {idx > 0 && <span className="text-amber-400 ml-2">({conversionRate}%)</span>}
                </span>
              </div>
              <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} flex items-center justify-end pr-2 transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 20 && (
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
