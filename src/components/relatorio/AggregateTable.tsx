import React from 'react';
import { ColumnDef, ColumnKey, METRIC_COLUMNS, COLUMN_BY_KEY } from './reportColumnsConfig';
import { AggregatedRow } from './aggregations';
import { fmtN, fmtPct, fmtPct4, fmtBRL, formatMetric } from './reportFormatters';

const HIGHLIGHT_BORDER = '#7CD7DD';
const HIGHLIGHT_BG = '#F4FBFC';
const HIGHLIGHT_HEADER = '#DFF7F8';
const HIGHLIGHT_TOTAL = '#C8F1F4';
const HIGHLIGHT_COLS_HEADER = 'font-bold whitespace-nowrap text-slate-900';
const HIGHLIGHT_CELL = 'font-semibold text-slate-800';

type SegmentColor = { bg: string; border: string; text: string };

interface AggregateTableProps {
  groupColumnLabel: string;
  groupCellLabel: (label: string) => React.ReactNode;
  rows: AggregatedRow[];
  totalRow: AggregatedRow;
  previousRowsByLabel: Map<string, AggregatedRow>;
  previousTotal: AggregatedRow;
  visibleColumns: ColumnKey[];
  shouldShowComparison: boolean;
  totalEmissoesForParticipation: number;
  segmentColorMap?: Map<string, SegmentColor>;
  onRowClick?: (label: string) => void;
  onGroupCellClick?: (label: string) => void;
  rowTitle?: string;
  groupCellTitle?: string;
  MetricValue: React.ComponentType<{
    value: string;
    current: number;
    previous: number;
    previousValue?: string;
    invertPositive?: boolean;
    strong?: boolean;
    align?: 'right' | 'center';
    valueClassName?: string;
  }>;
}

function metricValueOfRow(row: AggregatedRow, key: ColumnKey, totalEmissoes: number): number {
  if (key === 'participacaoEmissoes') {
    return totalEmissoes > 0 ? row.emissoes / totalEmissoes : 0;
  }
  return (row as unknown as Record<string, number>)[key] ?? 0;
}

function formatRowValue(row: AggregatedRow, def: ColumnDef, totalEmissoes: number): string {
  const value = metricValueOfRow(row, def.key, totalEmissoes);
  return formatMetric(value, def.format);
}

function highlightCellStyle(def: ColumnDef, isTotalRow: boolean): React.CSSProperties | undefined {
  if (!def.highlight) return undefined;
  const idx = METRIC_COLUMNS.filter(c => c.highlight).findIndex(c => c.key === def.key);
  const total = METRIC_COLUMNS.filter(c => c.highlight).length;
  const isFirstOfBlock = idx % 2 === 0;
  const isLastOfBlock = idx % 2 === 1 || idx === total - 1;
  const isVeryLast = def.key === 'emissoes';
  return {
    background: isTotalRow ? HIGHLIGHT_TOTAL : HIGHLIGHT_BG,
    borderLeft: isFirstOfBlock ? `2px solid ${HIGHLIGHT_BORDER}` : undefined,
    borderRight: isVeryLast ? `2px solid ${HIGHLIGHT_BORDER}` : (isLastOfBlock ? `2px solid ${HIGHLIGHT_BORDER}` : `1px solid ${HIGHLIGHT_BORDER}`),
  };
}

export const AggregateTable: React.FC<AggregateTableProps> = ({
  groupColumnLabel,
  groupCellLabel,
  rows,
  totalRow,
  previousRowsByLabel,
  previousTotal,
  visibleColumns,
  shouldShowComparison,
  totalEmissoesForParticipation,
  segmentColorMap,
  onRowClick,
  onGroupCellClick,
  rowTitle,
  groupCellTitle,
  MetricValue,
}) => {
  const orderedDefs: ColumnDef[] = visibleColumns
    .map(k => COLUMN_BY_KEY[k])
    .filter((def): def is ColumnDef => Boolean(def && def.type === 'metric'));

  return (
    <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: '#1E293B' }} className="text-white">
              <th className="text-left px-4 py-3 font-semibold whitespace-nowrap min-w-[160px]">
                {groupColumnLabel}
              </th>
              {orderedDefs.map(def => {
                const style = def.highlight
                  ? { background: HIGHLIGHT_HEADER, ...highlightCellStyle(def, false) }
                  : undefined;
                return (
                  <th
                    key={def.key}
                    className={`text-right px-3 py-3 ${def.highlight ? HIGHLIGHT_COLS_HEADER : 'font-semibold whitespace-nowrap'}`}
                    style={style}
                  >
                    {def.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const color = segmentColorMap?.get(row.label);
              const isBanded = idx % 2 !== 0;
              const previousRow = previousRowsByLabel.get(row.label) ?? {
                ...row,
                baseEnviada: 0,
                baseEntregue: 0,
                aberturas: 0,
                cliques: 0,
                propostas: 0,
                aprovados: 0,
                emissoes: 0,
                emissoesIndependentes: 0,
                emissoesAssistidas: 0,
                custoTotal: 0,
                cac: 0,
                taxaEntrega: 0,
                taxaAbertura: 0,
                taxaProposta: 0,
                taxaAprovacao: 0,
                taxaFinalizacao: 0,
                custoPorCartao: 0,
                taxaConversaoBase: 0,
              };
              return (
                <tr
                  key={row.label}
                  className={`border-t border-slate-100 hover:brightness-95 transition-all ${onRowClick ? 'cursor-pointer' : ''} ${color?.bg ?? (isBanded ? 'bg-slate-50' : 'bg-white')}`}
                  onClick={() => onRowClick?.(row.label)}
                  title={rowTitle}
                >
                  <td
                    className={`px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap ${color?.border ?? ''} ${onGroupCellClick ? 'cursor-pointer' : ''}`}
                    onClick={(event) => {
                      if (onGroupCellClick) {
                        event.stopPropagation();
                        onGroupCellClick(row.label);
                      }
                    }}
                    title={groupCellTitle}
                  >
                    {groupCellLabel(row.label)}
                  </td>
                  {orderedDefs.map(def => {
                    const value = formatRowValue(row, def, totalEmissoesForParticipation);
                    const currentNum = metricValueOfRow(row, def.key, totalEmissoesForParticipation);
                    const previousNum = metricValueOfRow(previousRow, def.key, totalEmissoesForParticipation);
                    const previousFormatted = formatMetric(previousNum, def.format);
                    const style = highlightCellStyle(def, false);
                    return (
                      <td
                        key={def.key}
                        className={`text-right ${def.highlight ? `px-3 py-2.5 ${HIGHLIGHT_CELL}` : 'px-4 py-3 align-top text-slate-600'}`}
                        style={style}
                      >
                        <MetricValue
                          value={value}
                          current={currentNum}
                          previous={previousNum}
                          previousValue={previousFormatted}
                          invertPositive={def.invertPositive}
                          strong={def.highlight}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="border-t-2 border-amber-300" style={{ background: '#FFFBCC' }}>
              <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap border-l-4 border-amber-400">Total Geral</td>
              {orderedDefs.map(def => {
                const value = formatRowValue(totalRow, def, totalEmissoesForParticipation);
                const currentNum = metricValueOfRow(totalRow, def.key, totalEmissoesForParticipation);
                const previousNum = metricValueOfRow(previousTotal, def.key, totalEmissoesForParticipation);
                const previousFormatted = formatMetric(previousNum, def.format);
                const style = highlightCellStyle(def, true);
                return (
                  <td
                    key={def.key}
                    className={`text-right ${def.highlight ? 'px-3 py-2.5' : 'px-4 py-2.5'} font-bold text-slate-900`}
                    style={style}
                  >
                    <MetricValue
                      value={def.key === 'participacaoEmissoes' ? '100%' : value}
                      current={currentNum}
                      previous={previousNum}
                      previousValue={previousFormatted}
                      invertPositive={def.invertPositive}
                      strong
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
