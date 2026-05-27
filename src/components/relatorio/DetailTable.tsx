import React from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Save } from 'lucide-react';
import {
  ColumnDef,
  ColumnKey,
  DimensionKey,
  COLUMN_BY_KEY,
  DIMENSION_COLUMNS,
  METRIC_COLUMNS,
} from './reportColumnsConfig';
import { fmtN, fmtPct, fmtPct4, fmtBRL, formatMetric } from './reportFormatters';
import { SegmentLabel } from './segmentLabels';

const HIGHLIGHT_BORDER = '#7CD7DD';
const HIGHLIGHT_BG = '#F4FBFC';
const HIGHLIGHT_HEADER = '#DFF7F8';
const HIGHLIGHT_TOTAL = '#C8F1F4';
const HIGHLIGHT_COLS_HEADER = 'font-bold whitespace-nowrap text-slate-900';
const HIGHLIGHT_CELL = 'font-semibold text-slate-800';

const CANAL_COLORS: Record<string, string> = {
  'WhatsApp': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'SMS': 'bg-sky-50 text-sky-600 border-sky-100',
  'E-mail': 'bg-violet-50 text-violet-500 border-violet-100',
  'Push': 'bg-orange-50 text-orange-500 border-orange-100',
};
const PARCEIRO_COLORS: Record<string, string> = {
  'Afinz': 'bg-teal-50 text-teal-600 border-teal-100',
  'Plurix': 'bg-purple-50 text-purple-500 border-purple-100',
};

type SegmentColor = { bg: string; border: string; text: string };

export interface DetailTableRow {
  date: Date;
  jornada: string;
  activityName: string;
  segmento: string;
  canal: string;
  bu: string;
  parceiro: string;
  subgrupo: string;
  oferta: string;
  oferta2: string;
  promocional: string;
  promocional2: string;
  produto: string;
  etapaAquisicao: string;
  perfilCredito: string;
  safraKey: string;
  ordemDisparo: string;
  status: string;
  propostas: number;
  aprovados: number;
  emissoes: number;
  emissoesIndependentes: number;
  emissoesAssistidas: number;
  custoTotal: number;
  cac: number;
  baseEnviada: number;
  baseEntregue: number;
  aberturas: number;
  cliques: number;
  taxaEntrega: number;
  taxaAbertura: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
  participacaoEmissoes: number;
  aguardando: boolean;
}

export interface DetailSummary {
  totalEntregas: number;
  totalPropostas: number;
  totalAprovados: number;
  totalEmissoes: number;
  totalCusto: number;
  avgCustoCartao: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  taxaConversaoBase: number;
}

interface DetailTableProps {
  rows: DetailTableRow[];
  visibleDimensions: ColumnKey[];
  visibleMetrics: ColumnKey[];
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  segmentColorMap: Map<string, SegmentColor>;
  descriptions: Record<string, string>;
  editingDescs: Record<string, string>;
  savingDesc: Set<string>;
  onChangeDescription: (activityName: string, value: string) => void;
  onSaveDescription: (activityName: string) => void;
  applyGlobalSegmentFilter: (segmento: string) => void;
  applyGlobalCanalFilter: (canal: string) => void;
  onRowClick: (activityName: string) => void;
  summary: DetailSummary;
  destaqueFilter: string | null;
}

function isHighlightMetric(key: string): boolean {
  return ['propostas', 'taxaProposta', 'aprovados', 'taxaAprovacao', 'emissoes'].includes(key);
}

function highlightHeaderStyle(key: string): React.CSSProperties | undefined {
  if (!isHighlightMetric(key)) return undefined;
  if (key === 'propostas') return { background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'taxaProposta') return { background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'aprovados') return { background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'taxaAprovacao') return { background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'emissoes') return { background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  return undefined;
}

function highlightCellStyle(key: string, totalRow = false): React.CSSProperties | undefined {
  if (!isHighlightMetric(key)) return undefined;
  const bg = totalRow ? HIGHLIGHT_TOTAL : HIGHLIGHT_BG;
  if (key === 'propostas') return { background: bg, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'taxaProposta') return { background: bg, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'aprovados') return { background: bg, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'taxaAprovacao') return { background: bg, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  if (key === 'emissoes') return { background: bg, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` };
  return undefined;
}

function dimensionCellContent(
  row: DetailTableRow,
  key: ColumnKey,
  color: SegmentColor | undefined,
  applyGlobalSegmentFilter: (s: string) => void,
  applyGlobalCanalFilter: (c: string) => void,
  descriptions: Record<string, string>,
  editingDescs: Record<string, string>,
  savingDesc: Set<string>,
  onChangeDescription: (activityName: string, value: string) => void,
  onSaveDescription: (activityName: string) => void
): React.ReactNode {
  switch (key) {
    case 'segmento':
      return row.segmento ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            applyGlobalSegmentFilter(row.segmento);
          }}
          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${color?.bg ?? 'bg-slate-100'} ${color?.text ?? 'text-slate-600'} border ${color?.border ? 'border-current' : 'border-slate-200'}`}
          title="Aplicar este segmento no filtro global"
        >
          <SegmentLabel value={row.segmento} />
        </button>
      ) : <span className="text-slate-400 text-xs">—</span>;
    case 'parceiro':
      return (
        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${PARCEIRO_COLORS[row.parceiro] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
          {row.parceiro || '—'}
        </span>
      );
    case 'canal':
      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (row.canal) applyGlobalCanalFilter(row.canal);
          }}
          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${CANAL_COLORS[row.canal ?? ''] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}
          title="Aplicar este canal no filtro global"
        >
          {row.canal || '—'}
        </button>
      );
    case 'descricao':
      return (
        <div className="flex items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
          <textarea
            className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400 min-w-[120px]"
            rows={2}
            placeholder="Adicionar descrição..."
            value={editingDescs[row.activityName] ?? ''}
            onChange={(e) => onChangeDescription(row.activityName, e.target.value)}
          />
          {(editingDescs[row.activityName] ?? '') !== (descriptions[row.activityName] ?? '') && (
            <button
              onClick={() => onSaveDescription(row.activityName)}
              disabled={savingDesc.has(row.activityName)}
              className="flex-shrink-0 p-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50"
              title="Salvar descrição"
            >
              <Save size={13} />
            </button>
          )}
        </div>
      );
    case 'bu':           return row.bu || '—';
    case 'jornada':      return <span className="text-[11px]" title={row.jornada}>{row.jornada || '—'}</span>;
    case 'subgrupo':     return row.subgrupo || '—';
    case 'oferta':       return row.oferta || '—';
    case 'oferta2':      return row.oferta2 || '—';
    case 'promocional':  return row.promocional || '—';
    case 'promocional2': return row.promocional2 || '—';
    case 'produto':      return row.produto || '—';
    case 'etapaAquisicao': return row.etapaAquisicao || '—';
    case 'perfilCredito':  return row.perfilCredito || '—';
    case 'safraKey':     return row.safraKey || '—';
    case 'ordemDisparo': return row.ordemDisparo || '—';
    case 'status':       return row.status || '—';
    default:             return '—';
  }
}

function metricValue(row: DetailTableRow, def: ColumnDef): React.ReactNode {
  if (def.key === 'baseEntregue' && row.aguardando) {
    return <span className="text-[11px] font-medium text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Aguardando</span>;
  }
  const raw = (row as unknown as Record<string, number>)[def.key] ?? 0;
  return formatMetric(raw, def.format);
}

export const DetailTable: React.FC<DetailTableProps> = ({
  rows,
  visibleDimensions,
  visibleMetrics,
  sortKey,
  sortDir,
  onSort,
  segmentColorMap,
  descriptions,
  editingDescs,
  savingDesc,
  onChangeDescription,
  onSaveDescription,
  applyGlobalSegmentFilter,
  applyGlobalCanalFilter,
  onRowClick,
  summary,
  destaqueFilter,
}) => {
  const dimensionDefs: ColumnDef[] = visibleDimensions
    .map(k => COLUMN_BY_KEY[k])
    .filter((def): def is ColumnDef => Boolean(def && def.type === 'dimension'));
  const metricDefs: ColumnDef[] = visibleMetrics
    .map(k => COLUMN_BY_KEY[k])
    .filter((def): def is ColumnDef => Boolean(def && def.type === 'metric'));

  const renderSortIcon = (key: string) => (
    sortKey === key
      ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)
      : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />
  );

  const summaryByKey: Record<string, number> = {
    baseEnviada: 0,
    baseEntregue: summary.totalEntregas,
    propostas: summary.totalPropostas,
    aprovados: summary.totalAprovados,
    emissoes: summary.totalEmissoes,
    custoTotal: summary.totalCusto,
    custoPorCartao: summary.avgCustoCartao,
    taxaProposta: summary.taxaProposta,
    taxaAprovacao: summary.taxaAprovacao,
    taxaFinalizacao: summary.taxaFinalizacao,
    taxaConversaoBase: summary.taxaConversaoBase,
    aberturas: 0,
    cliques: 0,
    taxaEntrega: 0,
    taxaAbertura: 0,
    emissoesIndependentes: 0,
    emissoesAssistidas: 0,
    cac: 0,
    participacaoEmissoes: 0,
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: '#1E293B' }} className="text-white">
            {/* Data sempre */}
            <th
              className="text-left px-2 py-2 font-semibold whitespace-nowrap w-12 cursor-pointer select-none group hover:bg-slate-700 transition-colors"
              onClick={() => onSort('date')}
            >
              <span className="flex items-center gap-1">
                Data
                {renderSortIcon('date')}
              </span>
            </th>
            {/* Campanha sempre */}
            <th className="text-left px-2 py-2 font-semibold whitespace-nowrap" style={{ minWidth: 140, maxWidth: 180 }}>
              Campanha
            </th>
            {/* Dimensões dinâmicas */}
            {dimensionDefs.map(def => (
              <th key={def.key} className="text-center px-2 py-2 font-semibold whitespace-nowrap">
                {def.label}
              </th>
            ))}
            {/* Métricas dinâmicas */}
            {metricDefs.map(def => {
              const headerStyle = highlightHeaderStyle(def.key);
              return (
                <th
                  key={def.key}
                  className={`text-center px-2 py-2 ${def.highlight ? HIGHLIGHT_COLS_HEADER : 'font-semibold whitespace-nowrap'} cursor-pointer select-none group hover:brightness-90 transition-all`}
                  style={headerStyle}
                  onClick={() => onSort(def.key)}
                >
                  <span className="flex items-center justify-center gap-1">
                    {def.label}
                    {renderSortIcon(def.key)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const color = segmentColorMap.get(row.segmento);
            const isBanded = idx % 2 !== 0;
            const leadBg = color?.bg ?? (isBanded ? 'bg-slate-50/40' : 'bg-white');
            const leadText = color?.text ?? 'text-slate-700';
            return (
              <tr
                key={`${row.date.toISOString()}-${row.activityName}`}
                className={`border-t border-slate-100 hover:bg-slate-50 transition-all cursor-pointer ${isBanded ? 'bg-slate-50/40' : 'bg-white'}`}
                onClick={() => onRowClick(row.activityName)}
                title="Clique para ver detalhes do disparo"
              >
                <td className={`px-2 py-1.5 font-semibold whitespace-nowrap tabular-nums text-xs ${leadBg} ${leadText} ${color?.border ?? ''}`}>
                  {format(row.date, 'dd/MM')}
                </td>
                <td className={`px-2 py-1.5 ${leadBg} ${leadText}`} style={{ minWidth: 140, maxWidth: 180 }}>
                  <div className="flex flex-col gap-0.5">
                    {row.jornada && (
                      <span className={`text-[11px] font-semibold truncate ${color?.text ?? 'text-slate-600'}`} style={{ maxWidth: 160 }} title={row.jornada}>
                        {row.jornada}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 break-all leading-tight" title={row.activityName}>
                      {row.activityName}
                    </span>
                  </div>
                </td>
                {dimensionDefs.map(def => (
                  <td key={def.key} className="px-2 py-1.5 text-center whitespace-nowrap bg-white text-xs text-slate-600">
                    {dimensionCellContent(
                      row,
                      def.key,
                      color,
                      applyGlobalSegmentFilter,
                      applyGlobalCanalFilter,
                      descriptions,
                      editingDescs,
                      savingDesc,
                      onChangeDescription,
                      onSaveDescription,
                    )}
                  </td>
                ))}
                {metricDefs.map(def => {
                  const style = highlightCellStyle(def.key);
                  const cellClass = def.highlight
                    ? `text-center px-2 py-1.5 ${HIGHLIGHT_CELL}`
                    : 'text-center px-2 py-1.5 text-slate-600 text-xs tabular-nums';
                  return (
                    <td key={def.key} className={cellClass} style={style}>
                      {metricValue(row, def)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr style={{ background: '#1E293B' }} className="text-white text-xs font-bold">
              <td colSpan={2 + dimensionDefs.length} className="px-2 py-2 font-bold whitespace-nowrap">
                Totais · {rows.length} disparo{rows.length !== 1 ? 's' : ''}
                {destaqueFilter && <span className="ml-1.5 text-amber-300 font-normal">(filtrado)</span>}
              </td>
              {metricDefs.map(def => {
                const style = highlightCellStyle(def.key, true);
                const value = summaryByKey[def.key] ?? 0;
                return (
                  <td
                    key={def.key}
                    className={`text-center px-2 py-2 tabular-nums ${def.highlight ? 'font-bold' : ''}`}
                    style={style ? { ...style, color: '#0f172a' } : undefined}
                  >
                    {formatMetric(value, def.format)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
