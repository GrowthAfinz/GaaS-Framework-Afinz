import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Activity, AnomalyType, CalendarData } from '../../types/framework';
import { ANOMALY_LABELS, ANOMALY_TYPES, anomalyFlags } from '../jornada/anomalies';

const COLORS: Record<AnomalyType, string> = { pending: '#64748b', no_sent: '#dc2626', no_delivered: '#f97316', no_open: '#eab308' };
type GroupBy = 'daily' | 'weekly' | 'monthly';

interface Props {
  data: CalendarData;
  filters: AnomalyType[];
  accept: (activity: Activity) => boolean;
  onDayClick: (date: Date) => void;
}

/** Quantidade de disparos com cada tipo de anomalia ao longo do tempo. Um disparo pode ter mais de um tipo. */
export function AnomalyEvolutionChart({ data, filters, accept, onDayClick }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('daily');
  const types = filters.length ? filters : ANOMALY_TYPES;

  const { rows, totals } = useMemo(() => {
    const buckets = new Map<string, Record<string, number | string>>();
    const sum: Record<AnomalyType, number> = { pending: 0, no_sent: 0, no_delivered: 0, no_open: 0 };
    for (const [dateKey, activities] of Object.entries(data)) {
      const day = parseISO(dateKey);
      const key = groupBy === 'daily' ? dateKey : groupBy === 'weekly' ? format(startOfWeek(day, { weekStartsOn: 0 }), 'yyyy-MM-dd') : format(day, 'yyyy-MM');
      const label = groupBy === 'daily' ? format(day, 'dd/MM') : groupBy === 'weekly' ? `Sem. ${format(startOfWeek(day, { weekStartsOn: 0 }), 'dd/MM')}` : format(day, 'MMM/yy', { locale: ptBR });
      const bucket = buckets.get(key) || { key, label, pending: 0, no_sent: 0, no_delivered: 0, no_open: 0 };
      for (const activity of activities) {
        if (!accept(activity)) continue;
        const flags = anomalyFlags(activity);
        for (const type of ANOMALY_TYPES) if (flags[type]) { bucket[type] = Number(bucket[type]) + 1; sum[type] += 1; }
      }
      buckets.set(key, bucket);
    }
    return { rows: [...buckets.values()].sort((a, b) => String(a.key).localeCompare(String(b.key))), totals: sum };
  }, [data, groupBy, accept]);

  const shown = types.reduce((acc, type) => acc + totals[type], 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Evolução de anomalias</h3>
          <p className="mt-1 text-xs text-slate-500">
            {types.map(type => `${ANOMALY_LABELS[type]}: ${totals[type]}`).join(' · ')}
            {groupBy === 'daily' ? ' · clique numa barra para ver os disparos do dia' : ''}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {(['daily', 'weekly', 'monthly'] as GroupBy[]).map(g => (
            <button key={g} type="button" aria-pressed={groupBy === g} onClick={() => setGroupBy(g)}
              className={`rounded px-3 py-1 text-xs font-medium ${groupBy === g ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {g === 'daily' ? 'Diário' : g === 'weekly' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>
      </div>
      {shown === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">Nenhuma anomalia no período e nos filtros atuais.</p>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              onClick={(state: { activeLabel?: string | number; activeIndex?: number | string } | null) => {
                if (groupBy !== 'daily' || !state) return;
                const index = Number(state.activeIndex);
                const row = Number.isFinite(index) ? rows[index] : rows.find(r => r.label === state.activeLabel);
                if (row) onDayClick(parseISO(String(row.key)));
              }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Legend />
              {types.map(type => <Bar key={type} dataKey={type} name={ANOMALY_LABELS[type]} stackId="a" fill={COLORS[type]} className={groupBy === 'daily' ? 'cursor-pointer' : ''} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
