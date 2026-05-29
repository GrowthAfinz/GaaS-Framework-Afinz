import React, { useMemo, useState } from 'react';
import { DailyMetrics } from '../../types';
import { FilterState } from '../../context/FilterContext';
import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { format, parseISO, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Formatadores ────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => `${v.toFixed(2)}%`;

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Metrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface KPIs extends Metrics {
  ctr: number;
  cpa: number;
  cpm: number;
  cpc: number;
}

interface ColumnConfig {
  key: keyof KPIs | 'label';
  label: string;
  formatter: (v: number) => string;
  align: 'left' | 'right' | 'center';
  inverse?: boolean;
}

interface ImprovedMonthlyPivotTableProps {
  rawData: DailyMetrics[];
  filters: FilterState;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const deriveKPIs = (m: Metrics): KPIs => ({
  ...m,
  ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  cpa: m.conversions > 0 ? m.spend / m.conversions : 0,
  cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
  cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
});

const getPrevMonth = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

// ─── DeltaMoM ────────────────────────────────────────────────────────────────

const DeltaMoM: React.FC<{
  curr: number;
  prev: number;
  inverse?: boolean;
  currDay?: number;
  prevDay?: number;
}> = ({ curr, prev, inverse, currDay, prevDay }) => {
  if (!prev || !curr) return null;

  // Comparação proporcional para meses incompletos
  let currNorm = curr;
  let prevNorm = prev;
  if (currDay && prevDay && currDay < prevDay) {
    currNorm = curr / currDay;
    prevNorm = prev / prevDay;
  }

  const pct = ((currNorm - prevNorm) / prevNorm) * 100;
  const isGood = inverse ? pct < 0 : pct > 0;
  const color = pct === 0 ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-red-500';
  const Icon = pct > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ml-1.5 ${color}`}
      title={currDay && prevDay && currDay < prevDay ? `Proporcional: ${currDay} dias vs ${prevDay} dias` : ''}
    >
      <Icon size={12} />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

// ─── Célula de valor com badge de cor para KPIs ───────────────────────────────

const CTRCell: React.FC<{ value: number; prev?: number; currDay?: number; prevDay?: number }> = ({ value, prev, currDay, prevDay }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
    value >= 1 ? 'bg-emerald-100 text-emerald-700' :
    value >= 0.5 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-600'
  }`}>
    {fmtPct(value)}
    {prev != null && <DeltaMoM curr={value} prev={prev} currDay={currDay} prevDay={prevDay} />}
  </span>
);

const CPACell: React.FC<{ value: number; avgCPA: number; prev?: number; currDay?: number; prevDay?: number }> = ({ value, avgCPA, prev, currDay, prevDay }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
    value === 0 ? 'text-slate-400' :
    value <= avgCPA * 0.8 ? 'bg-emerald-100 text-emerald-700' :
    value <= avgCPA * 1.2 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-600'
  }`}>
    {value > 0 ? fmtBRL(value) : '—'}
    {prev != null && value > 0 && prev > 0 && <DeltaMoM curr={value} prev={prev} inverse currDay={currDay} prevDay={prevDay} />}
  </span>
);

// ─── Componente Principal ────────────────────────────────────────────────────

export const ImprovedMonthlyPivotTable: React.FC<ImprovedMonthlyPivotTableProps> = ({ rawData, filters }) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['label', 'spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpa', 'cpc', 'cpm'])
  );

  const allColumns: ColumnConfig[] = useMemo(() => [
    { key: 'label',       label: 'Mês',         formatter: (v: any) => v,                                align: 'left'  },
    { key: 'spend',       label: 'Investimento', formatter: fmtBRL,                                       align: 'center' },
    { key: 'impressions', label: 'Impressões',   formatter: fmtNum,                                       align: 'center' },
    { key: 'clicks',      label: 'Cliques',      formatter: fmtNum,                                       align: 'center' },
    { key: 'conversions', label: 'Conversões',   formatter: fmtNum,                                       align: 'center' },
    { key: 'ctr',         label: 'CTR',          formatter: fmtPct,                                       align: 'center' },
    { key: 'cpa',         label: 'CPA',          formatter: (v: number) => v > 0 ? fmtBRL(v) : '—',      align: 'center', inverse: true },
    { key: 'cpc',         label: 'CPC',          formatter: (v: number) => v > 0 ? fmtBRL(v) : '—',      align: 'center', inverse: true },
    { key: 'cpm',         label: 'CPM',          formatter: fmtBRL,                                       align: 'center', inverse: true },
  ], []);

  // 'label' (Mês) é sempre visível e não aparece nos controles de colunas
  const toggleableColumns = allColumns.filter(c => c.key !== 'label');
  const visibleCols = allColumns.filter(c => c.key === 'label' || visibleColumns.has(c.key));

  // 1. Filtros globais
  const filteredRawData = useMemo(() => {
    const today = new Date();
    const currentDay = getDate(today);
    const currentMonthKey = format(today, 'yyyy-MM');

    return rawData.filter(d => {
      if (filters.selectedChannels.length && !filters.selectedChannels.includes(d.channel as any)) return false;
      if (d.objective && filters.selectedObjectives.length && !filters.selectedObjectives.includes(d.objective as any)) return false;
      if (filters.selectedCampaigns.length && !filters.selectedCampaigns.includes(d.campaign)) return false;
      if (filters.selectedAdsets.length && (!d.adset_name || !filters.selectedAdsets.includes(d.adset_name))) return false;
      if (filters.selectedAds.length && (!d.ad_name || !filters.selectedAds.includes(d.ad_name))) return false;

      // Mês atual: só inclui até hoje
      const monthKey = format(new Date(d.date), 'yyyy-MM');
      if (monthKey === currentMonthKey && getDate(new Date(d.date)) > currentDay) return false;

      return true;
    });
  }, [rawData, filters]);

  // 2. Mapa mensal: monthKey → { total, byObj }
  const monthlyData = useMemo(() => {
    const map = new Map<string, { total: Metrics; byObj: Map<string, Metrics> }>();

    filteredRawData.forEach(d => {
      const monthKey = format(new Date(d.date), 'yyyy-MM');
      const objective = d.objective || 'Sem Objetivo';

      if (!map.has(monthKey)) {
        map.set(monthKey, { total: { spend: 0, impressions: 0, clicks: 0, conversions: 0 }, byObj: new Map() });
      }
      const entry = map.get(monthKey)!;

      entry.total.spend += d.spend;
      entry.total.impressions += d.impressions;
      entry.total.clicks += d.clicks;
      entry.total.conversions += d.conversions;

      if (!entry.byObj.has(objective)) {
        entry.byObj.set(objective, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
      }
      const obj = entry.byObj.get(objective)!;
      obj.spend += d.spend;
      obj.impressions += d.impressions;
      obj.clicks += d.clicks;
      obj.conversions += d.conversions;
    });

    return map;
  }, [filteredRawData]);

  // 3. Objetivos únicos (para decidir se mostra sub-linhas)
  const uniqueObjectiveCount = useMemo(() => {
    const set = new Set<string>();
    filteredRawData.forEach(d => set.add(d.objective || 'Sem Objetivo'));
    return set.size;
  }, [filteredRawData]);

  // 4. Dias por mês (para MoM proporcional)
  const daysPerMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredRawData.forEach(d => {
      const monthKey = format(new Date(d.date), 'yyyy-MM');
      const day = getDate(new Date(d.date));
      if (!map.has(monthKey) || day > map.get(monthKey)!) map.set(monthKey, day);
    });
    return map;
  }, [filteredRawData]);

  // 5. Meses ordenados cronologicamente
  const sortedMonths = useMemo(() => Array.from(monthlyData.keys()).sort(), [monthlyData]);

  // 6. Totais gerais
  const grandTotalKPIs = useMemo(() => {
    const total = sortedMonths.reduce((acc, k) => {
      const { total: t } = monthlyData.get(k)!;
      acc.spend += t.spend;
      acc.impressions += t.impressions;
      acc.clicks += t.clicks;
      acc.conversions += t.conversions;
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 } as Metrics);
    return deriveKPIs(total);
  }, [sortedMonths, monthlyData]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const hasMultipleObjectives = uniqueObjectiveCount > 1;

  if (sortedMonths.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">Nenhum dado disponível para os filtros selecionados.</p>
      </div>
    );
  }

  // ─── Render célula de valor com DeltaMoM ─────────────────────────────────

  const renderCell = (col: ColumnConfig, kpis: KPIs, prevKPIs: KPIs | null, currDay?: number, prevDay?: number) => {
    const val = kpis[col.key as keyof KPIs] as number;
    const prevVal = prevKPIs ? prevKPIs[col.key as keyof KPIs] as number : undefined;

    if (col.key === 'ctr') return <CTRCell value={val} prev={prevVal} currDay={currDay} prevDay={prevDay} />;
    if (col.key === 'cpa') return <CPACell value={val} avgCPA={grandTotalKPIs.cpa} prev={prevVal} currDay={currDay} prevDay={prevDay} />;

    return (
      <span className="font-mono">
        {col.formatter(val)}
        {prevVal != null && (
          <DeltaMoM curr={val} prev={prevVal} inverse={col.inverse} currDay={currDay} prevDay={prevDay} />
        )}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200">
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedMonths.map(monthKey => {
              const { total, byObj } = monthlyData.get(monthKey)!;
              const prevMonthKey = getPrevMonth(monthKey);
              const prevData = monthlyData.get(prevMonthKey);

              const kpis = deriveKPIs(total);
              const prevKPIs = prevData ? deriveKPIs(prevData.total) : null;
              const currDay = daysPerMonth.get(monthKey);
              const prevDay = prevData ? daysPerMonth.get(prevMonthKey) : undefined;

              const monthLabel = format(parseISO(`${monthKey}-01`), 'MMM/yy', { locale: ptBR });

              return (
                <React.Fragment key={monthKey}>
                  {/* ── Header do Mês ── */}
                  <tr className="bg-slate-200 font-bold text-slate-800 border-b border-slate-300 hover:bg-slate-300 transition-colors">
                    {visibleCols.map(col => (
                      <td key={col.key} className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {col.key === 'label'
                          ? <span className="font-semibold">{monthLabel}</span>
                          : renderCell(col, kpis, prevKPIs, currDay, prevDay)
                        }
                      </td>
                    ))}
                  </tr>

                  {/* ── Sub-linhas por Objetivo (só quando há mais de 1) ── */}
                  {hasMultipleObjectives && Array.from(byObj.entries()).map(([objective, objMetrics]) => {
                    const objKPIs = deriveKPIs(objMetrics);
                    const prevObjMetrics = prevData?.byObj.get(objective);
                    const prevObjKPIs = prevObjMetrics ? deriveKPIs(prevObjMetrics) : null;

                    return (
                      <tr key={`${monthKey}-${objective}`} className="bg-white text-slate-700 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        {visibleCols.map(col => (
                          <td key={col.key} className={`px-4 py-2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                            {col.key === 'label'
                              ? <span className="ml-6 text-xs font-medium text-slate-500">{objective}</span>
                              : renderCell(col, objKPIs, prevObjKPIs, currDay, prevDay)
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* ── Rodapé com Totais Gerais ── */}
          <tfoot>
            <tr className="bg-slate-100 text-slate-800 font-bold border-t-2 border-slate-300">
              {visibleCols.map(col => (
                <td key={col.key} className={`px-4 py-3 text-xs uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {col.key === 'label' ? (
                    'TOTAL GERAL'
                  ) : col.key === 'ctr' ? (
                    <CTRCell value={grandTotalKPIs.ctr} />
                  ) : col.key === 'cpa' ? (
                    <CPACell value={grandTotalKPIs.cpa} avgCPA={grandTotalKPIs.cpa} />
                  ) : (
                    <span className="font-mono">{col.formatter(grandTotalKPIs[col.key as keyof KPIs] as number)}</span>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Controles de visibilidade de colunas (sem o Mês, que é sempre fixo) */}
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colunas:</span>
        {toggleableColumns.map(col => (
          <button
            key={col.key}
            onClick={() => toggleColumn(col.key)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              visibleColumns.has(col.key)
                ? 'bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-slate-50 text-slate-400 border border-slate-200 opacity-60'
            }`}
          >
            {visibleColumns.has(col.key) ? <Eye size={12} /> : <EyeOff size={12} />}
            {col.label}
          </button>
        ))}
      </div>
    </div>
  );
};
