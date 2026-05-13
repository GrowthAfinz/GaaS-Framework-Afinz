import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface TopRankingItem {
  label: string;
  cartoes: number;
}

interface TopOffersTableProps {
  title?: string;
  items: TopRankingItem[];
}

const RANKING_COLORS = ['#2563EB', '#38BDF8', '#34D399', '#F59E0B', '#A78BFA'];

const formatCompact = (value: number) => (
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`
);

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as TopRankingItem & { percentage: number };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-slate-800 mb-1">{item.label}</p>
      <p className="text-slate-600">
        {formatCompact(item.cartoes)} cartões ({item.percentage}%)
      </p>
    </div>
  );
};

export const TopOffersTable: React.FC<TopOffersTableProps> = ({ title = 'Top Ofertas', items }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-slate-500 text-xs">Sem dados</p>
      </div>
    );
  }

  const totalCartoes = items.reduce((sum, item) => sum + item.cartoes, 0);
  const chartItems = items.map((item, index) => ({
    ...item,
    color: RANKING_COLORS[index % RANKING_COLORS.length],
    percentage: totalCartoes > 0 ? Math.round((item.cartoes / totalCartoes) * 100) : 0,
  }));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-center gap-4">
        <div style={{ width: 72, height: 72, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartItems}
                dataKey="cartoes"
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={34}
                paddingAngle={2}
              >
                {chartItems.map((item) => (
                  <Cell key={item.label} fill={item.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {chartItems.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 tabular-nums font-mono w-4 font-medium">{index + 1}.</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 font-medium truncate" title={item.label}>
                {item.label}
              </span>
              <span className="text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded ml-auto tabular-nums">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
