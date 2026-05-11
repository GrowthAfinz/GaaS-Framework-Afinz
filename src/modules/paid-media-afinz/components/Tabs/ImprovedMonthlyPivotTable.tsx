import React, { useMemo, useState } from 'react';
import { DailyMetrics } from '../../types';
import { FilterState } from '../../context/FilterContext';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
}

const DeltaMoM: React.FC<DeltaMoMProps> = ({ curr, prev, inverse }) => {
  if (!prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  const isGood = inverse ? pct < 0 : pct > 0;
  const color = pct === 0 ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-red-500';
  const Icon = pct > 0 ? ArrowUp : pct < 0 ? ArrowDown : null;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ml-1.5 ${color}`}>
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

  // 📊 AGGREGATE BY MONTH AND OBJECTIVE
  const rows = useMemo<MonthRow[]>(() => {
    const monthMap = new Map<string, Map<string, any>>();

    filteredRawData.forEach(d => {
      const key = format(new Date(d.date), 'yyyy-MM');
      const objective = d.objective || 'Sem Objetivo';

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

    // APPLY SORTING
    result.sort((a, b) => {
      let aVal: any = a[sortKey as keyof MonthRow];
      let bVal: any = b[sortKey as keyof MonthRow];

      // Group headers sempre no topo
      if (a.isGroupHeader && !b.isGroupHeader) return -1;
      if (!a.isGroupHeader && b.isGroupHeader) return 1;

      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDir === 'asc' ? (aVal - bVal) : (bVal - aVal);
    });

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
      {/* Column Visibility Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colunas:</span>
        {allColumns.map(col => (
          <button
            key={col.key}
            onClick={() => toggleColumn(col.key)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              visibleColumns.has(col.key)
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-500 opacity-60'
            }`}
          >
            {visibleColumns.has(col.key) ? <Eye size={14} /> : <EyeOff size={14} />}
            {col.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => !col.key.startsWith('label') && handleSort(col.key)}
                  className={`px-4 py-3 font-semibold text-xs uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${
                    col.key !== 'label'
                      ? 'cursor-pointer hover:bg-slate-100 transition-colors'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
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
                      ? 'bg-slate-800 text-white font-bold hover:bg-slate-700'
                      : isObjectiveRow
                      ? 'bg-slate-50 hover:bg-blue-50/60'
                      : 'bg-white hover:bg-blue-50/40'
                  }`}
                >
                  {visibleCols.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {col.key === 'label' ? (
                        <span className={isObjectiveRow ? 'ml-6 text-xs font-medium' : 'font-semibold'}>
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
                            <DeltaMoM curr={row.ctr} prev={prev.ctr} />
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
                            <DeltaMoM curr={row.cpa} prev={prev.cpa} inverse />
                          )}
                        </span>
                      ) : (
                        <span className="font-mono">
                          {col.formatter(row[col.key as keyof MonthRow] as any)}
                          {prev && !prev.isGroupHeader && prev.objective === row.objective && (
                            <DeltaMoM
                              curr={row[col.key as keyof MonthRow] as number}
                              prev={prev[col.key as keyof MonthRow] as number}
                              inverse={col.inverse}
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
            <tr className="bg-slate-900 text-white font-bold">
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
    </div>
  );
};
