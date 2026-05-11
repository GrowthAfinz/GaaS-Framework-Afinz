import React, { useMemo, useState } from 'react';
import { DailyMetrics } from '../../types';
import { FilterState } from '../../context/FilterContext';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { format, parseISO, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthRow {
  key: string;
  label: string;
  objective?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
  cpm: number;
  isGroupHeader?: boolean;
  isExpanded?: boolean;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => `${v.toFixed(2)}%`;

interface DeltaMoMProps {
  curr: number;
  prev: number;
  inverse?: boolean;
  currDay?: number;  // Current day of month (e.g., 11)
  prevDay?: number;  // Previous month days (e.g., 30 for April)
}

const DeltaMoM: React.FC<DeltaMoMProps> = ({ curr, prev, inverse, currDay, prevDay }) => {
  if (!prev) return null;

  // 🔥 PROPORTIONAL MoM: If in incomplete month, normalize by days
  let currNormalized = curr;
  let prevNormalized = prev;

  if (currDay && prevDay && currDay < prevDay) {
    // Current month is incomplete, normalize both sides by days
    // Daily average: value / days completed
    const currDailyAvg = curr / currDay;
    const prevDailyAvg = prev / prevDay;

    // Compare using daily averages (for fair comparison)
    currNormalized = currDailyAvg;
    prevNormalized = prevDailyAvg;
  }

  const pct = ((currNormalized - prevNormalized) / prevNormalized) * 100;
  const isGood = inverse ? pct < 0 : pct > 0;
  const color = pct === 0 ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-red-500';
  const Icon = pct > 0 ? ArrowUp : pct < 0 ? ArrowDown : null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ml-1.5 ${color}`} title={currDay ? `Comparação proporcional: ${currDay} dias vs ${prevDay} dias` : ''}>
      {Icon && <Icon size={12} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

interface ColumnConfig {
  key: string;
  label: string;
  formatter: (v: any) => string;
  align: 'left' | 'right';
  inverse?: boolean;
}

interface ImprovedMonthlyPivotTableProps {
  rawData: DailyMetrics[];
  filters: FilterState;
}

export const ImprovedMonthlyPivotTable: React.FC<ImprovedMonthlyPivotTableProps> = ({ rawData, filters }) => {
  const [sortKey, setSortKey] = useState<string>('label');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['label', 'spend', 'impressions', 'clicks', 'conversions', 'ctr', 'cpa', 'cpm'])
  );

  const allColumns: ColumnConfig[] = useMemo(() => [
    { key: 'label', label: 'Mês', formatter: (v: any) => v, align: 'left' },
    { key: 'spend', label: 'Investimento', formatter: fmtBRL, align: 'right' },
    { key: 'impressions', label: 'Impressões', formatter: fmtNum, align: 'right' },
    { key: 'clicks', label: 'Cliques', formatter: fmtNum, align: 'right' },
    { key: 'conversions', label: 'Conversões', formatter: fmtNum, align: 'right' },
    { key: 'ctr', label: 'CTR', formatter: fmtPct, align: 'right' },
    { key: 'cpa', label: 'CPA', formatter: (v: number) => v > 0 ? fmtBRL(v) : '—', align: 'right', inverse: true },
    { key: 'cpm', label: 'CPM', formatter: fmtBRL, align: 'right', inverse: true },
  ], []);

  const visibleCols = allColumns.filter(c => visibleColumns.has(c.key));

  // 🔥 APPLY GLOBAL FILTERS (RESPEITA TODOS OS FILTROS)
  const filteredRawData = useMemo(() => {
    return rawData.filter(d => {
      if (filters.selectedChannels.length && !filters.selectedChannels.includes(d.channel as any)) return false;
      if (filters.selectedObjectives.length && !filters.selectedObjectives.includes(d.objective as any)) return false;
      if (filters.selectedCampaigns.length && !filters.selectedCampaigns.includes(d.campaign)) return false;
      if (filters.selectedAdsets.length && (!d.adset_name || !filters.selectedAdsets.includes(d.adset_name))) return false;
      if (filters.selectedAds.length && (!d.ad_name || !filters.selectedAds.includes(d.ad_name))) return false;
      return true;
    });
  }, [rawData, filters]);

  // 📊 Calculate days per month for MoM comparison (OUTSIDE useMemo for access in render)
  const daysPerMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredRawData.forEach(d => {
      const monthKey = format(new Date(d.date), 'yyyy-MM');
      const dayOfMonth = getDate(new Date(d.date));
      if (!map.has(monthKey) || dayOfMonth > map.get(monthKey)!) {
        map.set(monthKey, dayOfMonth);
      }
    });
    return map;
  }, [filteredRawData]);

  // 📊 AGGREGATE BY MONTH AND OBJECTIVE
  // WITH PROPORTIONAL MoM (respects incomplete months)
  const rows = useMemo<MonthRow[]>(() => {
    const monthMap = new Map<string, Map<string, any>>();
    const today = new Date();
    const currentDay = getDate(today);
    const currentMonth = format(today, 'yyyy-MM');

    filteredRawData.forEach(d => {
      const key = format(new Date(d.date), 'yyyy-MM');
      const objective = d.objective || 'Sem Objetivo';
      const dayOfMonth = getDate(new Date(d.date));

      // IMPORTANT: For current month, only include data up to today
      // For other months, include all data
      if (key === currentMonth && dayOfMonth > currentDay) return;

      if (!monthMap.has(key)) monthMap.set(key, new Map());
      const objMap = monthMap.get(key)!;

      if (!objMap.has(objective)) {
        objMap.set(objective, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
      }

      const obj = objMap.get(objective)!;
      obj.spend += d.spend;
      obj.impressions += d.impressions;
      obj.clicks += d.clicks;
      obj.conversions += d.conversions;
    });

    const result: MonthRow[] = [];

    Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([monthKey, objMap]) => {
        // Month header
        const monthLabel = format(parseISO(`${monthKey}-01`), 'MMM/yy', { locale: ptBR });
        let monthTotals = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };

        // Calculate month totals
        objMap.forEach(data => {
          monthTotals.spend += data.spend;
          monthTotals.impressions += data.impressions;
          monthTotals.clicks += data.clicks;
          monthTotals.conversions += data.conversions;
        });

        result.push({
          key: monthKey,
          label: monthLabel,
          spend: monthTotals.spend,
          impressions: monthTotals.impressions,
          clicks: monthTotals.clicks,
          conversions: monthTotals.conversions,
          ctr: monthTotals.impressions > 0 ? (monthTotals.clicks / monthTotals.impressions) * 100 : 0,
          cpa: monthTotals.conversions > 0 ? monthTotals.spend / monthTotals.conversions : 0,
          cpm: monthTotals.impressions > 0 ? (monthTotals.spend / monthTotals.impressions) * 1000 : 0,
          isGroupHeader: true,
        });

        // Objective rows
        objMap.forEach((data, objective) => {
          result.push({
            key: `${monthKey}-${objective}`,
            label: objective,
            objective,
            spend: data.spend,
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
            ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
            cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
            cpm: data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0,
          });
        });
      });

    // NO SORTING - Maintain month grouping structure
    // Months are already sorted chronologically from the Map iteration
    // (Maps maintain insertion order in JavaScript)
    // Sorting would break the header-objective grouping
    const finalResult: MonthRow[] = [];
    let monthHeaders: MonthRow[] = [];
    let monthObjectives: MonthRow[] = [];

    result.forEach(row => {
      if (row.isGroupHeader) {
        // Flush previous month's data
        if (monthHeaders.length > 0) {
          finalResult.push(...monthHeaders);
          finalResult.push(...monthObjectives);
        }
        monthHeaders = [row];
        monthObjectives = [];
      } else {
        monthObjectives.push(row);
      }
    });

    // Flush last month
    if (monthHeaders.length > 0) {
      finalResult.push(...monthHeaders);
      finalResult.push(...monthObjectives);
    }

    return finalResult;

    return result;
  }, [filteredRawData, sortKey, sortDir]);

  const total = useMemo<MonthRow>(() => {
    const t = rows
      .filter(r => !r.isGroupHeader)
      .reduce(
        (acc, r) => ({
          spend: acc.spend + r.spend,
          impressions: acc.impressions + r.impressions,
          clicks: acc.clicks + r.clicks,
          conversions: acc.conversions + r.conversions,
        }),
        { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
      );

    return {
      key: 'total',
      label: 'TOTAL GERAL',
      ...t,
      ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
      cpa: t.conversions > 0 ? t.spend / t.conversions : 0,
      cpm: t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0,
    };
  }, [rows]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleColumn = (key: string) => {
    const newCols = new Set(visibleColumns);
    if (newCols.has(key)) {
      newCols.delete(key);
    } else {
      newCols.add(key);
    }
    setVisibleColumns(newCols);
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">Nenhum dado disponível para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-sm border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-b from-slate-100 to-slate-50 border-b border-slate-200">
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => !col.key.startsWith('label') && handleSort(col.key)}
                  className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-700 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${
                    col.key !== 'label'
                      ? 'cursor-pointer hover:bg-slate-200 transition-colors'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-teal-600">
                        {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const prev = idx > 0 ? rows[idx - 1] : null;
              const isObjectiveRow = !row.isGroupHeader && row.objective;

              return (
                <tr
                  key={row.key}
                  className={`border-b border-slate-100 transition-colors ${
                    row.isGroupHeader
                      ? 'bg-slate-200 font-bold text-slate-800 hover:bg-slate-300'
                      : isObjectiveRow
                      ? 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                      : 'bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {visibleCols.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {col.key === 'label' ? (
                        <span className={isObjectiveRow ? 'ml-6 text-xs font-medium text-slate-600' : 'font-semibold text-slate-800'}>
                          {row.label}
                        </span>
                      ) : col.key === 'ctr' ? (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            row.ctr >= 1 ? 'bg-emerald-100 text-emerald-700' :
                            row.ctr >= 0.5 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'
                          }`}
                        >
                          {fmtPct(row.ctr)}
                          {prev && !prev.isGroupHeader && prev.objective === row.objective && (
                            <DeltaMoM
                              curr={row.ctr}
                              prev={prev.ctr}
                              currDay={daysPerMonth.get(row.key.split('-')[0])}
                              prevDay={daysPerMonth.get(prev.key.split('-')[0])}
                            />
                          )}
                        </span>
                      ) : col.key === 'cpa' ? (
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            row.cpa === 0 ? 'text-slate-400' :
                            row.cpa <= total.cpa * 0.8 ? 'bg-emerald-100 text-emerald-700' :
                            row.cpa <= total.cpa * 1.2 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-600'
                          }`}
                        >
                          {col.formatter(row.cpa)}
                          {prev && prev.cpa > 0 && row.cpa > 0 && !prev.isGroupHeader && prev.objective === row.objective && (
                            <DeltaMoM
                              curr={row.cpa}
                              prev={prev.cpa}
                              inverse
                              currDay={daysPerMonth.get(row.key.split('-')[0])}
                              prevDay={daysPerMonth.get(prev.key.split('-')[0])}
                            />
                          )}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-700">
                          {col.formatter(row[col.key as keyof MonthRow] as any)}
                          {prev && !prev.isGroupHeader && prev.objective === row.objective && (
                            <DeltaMoM
                              curr={row[col.key as keyof MonthRow] as number}
                              prev={prev[col.key as keyof MonthRow] as number}
                              inverse={col.inverse}
                              currDay={daysPerMonth.get(row.key.split('-')[0])}
                              prevDay={daysPerMonth.get(prev.key.split('-')[0])}
                            />
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 text-slate-800 font-bold border-t-2 border-slate-300">
              {visibleCols.map(col => (
                <td key={col.key} className={`px-4 py-3 text-xs uppercase tracking-wider ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}>
                  {col.key === 'label' ? 'TOTAL GERAL' : col.formatter(total[col.key as keyof MonthRow] as any)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Column Visibility Controls - Subtle Footer */}
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mostrar:</span>
        {allColumns.map(col => (
          <button
            key={col.key}
            onClick={() => toggleColumn(col.key)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              visibleColumns.has(col.key)
                ? 'bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-70'
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
