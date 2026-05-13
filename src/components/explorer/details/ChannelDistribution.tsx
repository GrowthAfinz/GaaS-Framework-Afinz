import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChannelDistributionItem } from '../../../types/explorer';

interface ChannelDistributionProps {
  items: ChannelDistributionItem[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const d: ChannelDistributionItem = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-800 mb-1">{d.canal}</p>
      <p className="text-slate-600">{d.count} disparos ({d.percentage}%)</p>
    </div>
  );
};

export const ChannelDistribution: React.FC<ChannelDistributionProps> = ({ items }) => {
  if (items.length === 0) {
    return <p className="text-slate-500 text-xs">Sem dados de canal</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Canais</p>
      <div className="flex items-center gap-4">
        {/* Mini pie */}
        <div style={{ width: 72, height: 72, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items as any[]}
                dataKey="count"
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={34}
                paddingAngle={2}
              >
                {items.map((item) => (
                  <Cell key={item.canal} fill={item.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {items.map((item) => (
            <div key={item.canal} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 font-medium truncate">{item.canal}</span>
              <span className="text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded ml-auto tabular-nums">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
