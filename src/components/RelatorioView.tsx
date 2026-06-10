import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileSpreadsheet, FileText, Save, ArrowLeft, TrendingUp, DollarSign, BarChart2, Info, ChevronUp, ChevronDown, Search, FilterX } from 'lucide-react';
import { CalendarData, Activity } from '../types/framework';
import { supabase } from '../services/supabaseClient';
import { ActivityRow } from '../types/activity';
import { useAppStore } from '../store/useAppStore';
import { useBU } from '../contexts/BUContext';
import { formatVariation } from '../utils/variationDisplay';
import { MonthlyReportView } from './relatorio/MonthlyReportView';
import { exportAquisicaoCrmXlsx } from '../utils/aquisicaoCrmExcelExport';
import { exportRentabilizacaoCrmXlsx } from '../utils/rentabilizacaoCrmExcelExport';
import { SegmentLabel, formatSegmentText } from './relatorio/segmentLabels';
import {
  ColumnKey,
  DimensionKey,
  MetricKey,
  ColumnDef,
  METRIC_COLUMNS,
  DIMENSION_COLUMNS,
  COLUMN_BY_KEY,
  GROUPABLE_DIMENSIONS,
  DEFAULT_AGGREGATE_COLUMNS,
  DEFAULT_CANAL_EXTRA_COLUMNS,
  DEFAULT_DETAIL_DIMENSIONS,
  DEFAULT_DETAIL_METRICS,
  ENGAGEMENT_AGGREGATE_COLUMNS,
  ENGAGEMENT_DETAIL_METRICS,
  getDimensionValue,
  getGroupableDimensionLabel,
} from './relatorio/reportColumnsConfig';
import { AggregatedRow, computeRow, groupActivitiesByDimension, groupActivitiesByDimensionAsMap } from './relatorio/aggregations';
import { ColumnsCustomizer } from './relatorio/ColumnsCustomizer';
import { GroupBySelector } from './relatorio/GroupBySelector';
import { fmtN, fmtPct, fmtPct4, fmtBRL, formatMetric } from './relatorio/reportFormatters';
import { AggregateTable } from './relatorio/AggregateTable';
import { DetailTable } from './relatorio/DetailTable';

interface RelatorioViewProps {
  data: CalendarData;
  previousData?: CalendarData;
  compareMode?: 'previousPeriod' | 'samePeriodLastMonth' | null;
  selectedBU?: string;
  periodStart: Date;
  periodEnd: Date;
}

interface DetailRow {
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
  taxaClique: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
  participacaoEmissoes: number;
  aguardando: boolean;
}

function calcVariation(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const SEGMENT_PALETTE = [
  { bg: 'bg-pink-50', border: 'border-l-4 border-pink-400', text: 'text-pink-700' },
  { bg: 'bg-blue-50', border: 'border-l-4 border-blue-400', text: 'text-blue-700' },
  { bg: 'bg-violet-50', border: 'border-l-4 border-violet-400', text: 'text-violet-700' },
  { bg: 'bg-emerald-50', border: 'border-l-4 border-emerald-400', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-l-4 border-amber-400', text: 'text-amber-700' },
  { bg: 'bg-orange-50', border: 'border-l-4 border-orange-400', text: 'text-orange-700' },
  { bg: 'bg-sky-50', border: 'border-l-4 border-sky-400', text: 'text-sky-700' },
  { bg: 'bg-rose-50', border: 'border-l-4 border-rose-400', text: 'text-rose-700' },
];

const TEAL = '#00C6CC';
const HIGHLIGHT_BORDER = '#7CD7DD';
const HIGHLIGHT_BG = '#F4FBFC';
const HIGHLIGHT_HEADER = '#DFF7F8';
const HIGHLIGHT_TOTAL = '#C8F1F4';

function buildCsvBlob(headers: string[], rows: string[][]): Blob {
  const lines = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  return new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const HIGHLIGHT_COLS_HEADER = `font-bold whitespace-nowrap text-slate-900`;
const HIGHLIGHT_CELL = `font-semibold text-slate-800`;

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

export const RelatorioView: React.FC<RelatorioViewProps> = ({ data, previousData, compareMode = null, selectedBU, periodStart, periodEnd }) => {
  const { viewSettings, setGlobalFilters } = useAppStore();
  const globalFilters = viewSettings.filtrosGlobais;
  const rentab = viewSettings.frente === 'rentabilizacao';
  const { selectedBUs } = useBU();
  const [reportMode, setReportMode] = useState<'performance' | 'monthly'>('performance');
  const allActivities = useMemo(() => Object.values(data).flat(), [data]);
  const previousAllActivities = useMemo(() => Object.values(previousData ?? {}).flat(), [previousData]);
  const filterReportActivities = useCallback((activities: Activity[]) => (
    activities.filter((activity) => {
      // Filtro de BU — respeita seleção do painel superior
      if (selectedBUs.length > 0 && !selectedBUs.includes(activity.bu as import('../contexts/BUContext').BU)) {
        return false;
      }
      if (globalFilters.segmentos.length > 0 && !globalFilters.segmentos.includes(activity.segmento)) {
        return false;
      }
      if (globalFilters.canais.length > 0 && !globalFilters.canais.includes(activity.canal)) {
        return false;
      }
      if (globalFilters.jornadas.length > 0 && !globalFilters.jornadas.includes(activity.jornada)) {
        return false;
      }
      if (globalFilters.parceiros.length > 0 && !globalFilters.parceiros.includes(activity.parceiro)) {
        return false;
      }
      return true;
    })
  ), [globalFilters, selectedBUs]);
  const reportActivities = useMemo(() => filterReportActivities(allActivities), [allActivities, filterReportActivities]);
  const previousReportActivities = useMemo(() => filterReportActivities(previousAllActivities), [filterReportActivities, previousAllActivities]);
  const shouldShowComparison = compareMode !== null && previousData !== undefined;

  // ── Descrições por disparo ──
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [editingDescs, setEditingDescs] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<Set<string>>(new Set());
  const [selectedActivityRow, setSelectedActivityRow] = useState<ActivityRow | null>(null);

  // ── Filtros Destaque ──
  const [destaqueFilter, setDestaqueFilter] = useState<'top-conversores' | 'conversores' | 'aguardando' | null>(null);
  const [showDestaqueMenu, setShowDestaqueMenu] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [detailSegmentFilter, setDetailSegmentFilter] = useState<string | null>(null);
  const [detailCanalFilter, setDetailCanalFilter] = useState<string | null>(null);
  const [isExportingAquisicao, setIsExportingAquisicao] = useState(false);
  const [isExportingRnt, setIsExportingRnt] = useState(false);

  // ── Personalização de colunas / agrupamentos ──
  // Defaults por frente: Rentabilização usa visão de engajamento (sem aquisição).
  const aggregateDefaults = rentab ? ENGAGEMENT_AGGREGATE_COLUMNS : DEFAULT_AGGREGATE_COLUMNS;
  const detailMetricDefaults = rentab ? ENGAGEMENT_DETAIL_METRICS : DEFAULT_DETAIL_METRICS;
  const [campanhasGroupBy, setCampanhasGroupBy] = useState<DimensionKey>('segmento');
  const [campanhasColumns, setCampanhasColumns] = useState<ColumnKey[]>([...aggregateDefaults]);
  const [detailDimensionCols, setDetailDimensionCols] = useState<ColumnKey[]>([...DEFAULT_DETAIL_DIMENSIONS]);
  const [detailMetricCols, setDetailMetricCols] = useState<ColumnKey[]>([...detailMetricDefaults]);

  // Ao trocar de frente, repõe os conjuntos de colunas padrão da frente ativa.
  useEffect(() => {
    setCampanhasColumns([...aggregateDefaults]);
    setDetailMetricCols([...detailMetricDefaults]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentab]);

  // Reset internal filters when external data (global filters) change
  useEffect(() => {
    setDestaqueFilter(null);
    setSortKey(null);
    setSortDir('desc');
    setTableSearch('');
    setDetailSegmentFilter(null);
    setDetailCanalFilter(null);
  }, [data]);

  // ── Ordenação ──
  const [sortKey, setSortKey] = useState<keyof DetailRow | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const detailColumnsOrdered = useMemo((): ColumnDef[] => {
    const visibleSet = new Set<ColumnKey>([...detailDimensionCols, ...detailMetricCols]);
    return [...DIMENSION_COLUMNS, ...METRIC_COLUMNS].filter(def => visibleSet.has(def.key));
  }, [detailDimensionCols, detailMetricCols]);

  // Mapeia Activity → ActivityRow para o DisparoDetailModal
  const toActivityRow = (a: Activity): ActivityRow => ({
    id: a.id,
    prog_gaas: false,
    status: (a.status as ActivityRow['status']) ?? 'Enviado',
    created_at: '',
    updated_at: '',
    BU: a.bu as ActivityRow['BU'],
    jornada: a.jornada ?? '',
    'Activity name / Taxonomia': a.id,
    Canal: a.canal,
    'Data de Disparo': a.dataDisparo ? format(a.dataDisparo, 'yyyy-MM-dd') : '',
    'Data Fim': '',
    Segmento: a.segmento ?? '',
    Parceiro: a.parceiro,
    Oferta: a.oferta,
    Promocional: a.promocional,
    Produto: (a.raw as Record<string, unknown>)?.['Produto'] as string | undefined,
    'Oferta 2': (a.raw as Record<string, unknown>)?.['Oferta 2'] as string | undefined,
    'Promocional 2': (a.raw as Record<string, unknown>)?.['Promocional 2'] as string | undefined,
    'Etapa de aquisição': (a.raw as Record<string, unknown>)?.['Etapa de aquisição'] as string | undefined,
    'Perfil de Crédito': (a.raw as Record<string, unknown>)?.['Perfil de Crédito'] as string | undefined,
    'Ordem de disparo': a.ordemDisparo,
    'Horário de Disparo': (a.raw as Record<string, unknown>)?.['Horário de Disparo'] as string | undefined,
    'Base Total': a.kpis.baseEnviada,
    'Base Acionável': a.kpis.baseEntregue,
    'Taxa de Entrega': a.kpis.taxaEntrega,
    'Taxa de Proposta': a.kpis.taxaPropostas,
    'Taxa de Aprovação': a.kpis.taxaAprovacao,
    'Taxa de Finalização': a.kpis.taxaFinalizacao,
    'Taxa de Conversão': a.kpis.taxaConversao,
    'Taxa de Abertura': a.kpis.taxaAbertura,
    Propostas: a.kpis.propostas,
    Aprovados: a.kpis.aprovados,
    'Cartões Gerados': a.kpis.cartoes ?? a.kpis.emissoes,
    CAC: a.kpis.cac,
    'Custo Total Campanha': a.kpis.custoTotal,
  });

  const segmentoRows = useMemo(
    () => groupActivitiesByDimension(reportActivities, campanhasGroupBy),
    [reportActivities, campanhasGroupBy]
  );

  const segmentoTotal = useMemo(() => computeRow(reportActivities, 'Total Geral'), [reportActivities]);
  const previousSegmentoTotal = useMemo(() => computeRow(previousReportActivities, 'Total Geral'), [previousReportActivities]);
  const previousSegmentoRowsByLabel = useMemo(
    () => groupActivitiesByDimensionAsMap(previousReportActivities, campanhasGroupBy),
    [previousReportActivities, campanhasGroupBy]
  );

  const canalRows = useMemo(
    () => groupActivitiesByDimension(reportActivities, 'canal'),
    [reportActivities]
  );

  const canalTotal = useMemo(() => computeRow(reportActivities, 'Total Geral'), [reportActivities]);
  const previousCanalTotal = useMemo(() => computeRow(previousReportActivities, 'Total Geral'), [previousReportActivities]);
  const previousCanalRowsByLabel = useMemo(
    () => groupActivitiesByDimensionAsMap(previousReportActivities, 'canal'),
    [previousReportActivities]
  );
  const totalCanalEmissoes = canalTotal.emissoes;

  // d-3 cutoff: dates from today minus 3 days may still be consolidating
  const d3Cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3);
    return d;
  }, []);

  const totalDetailEmissoes = useMemo(
    () => reportActivities.reduce((s, a) => s + ((a.kpis.emissoes ?? a.kpis.cartoes) ?? 0), 0),
    [reportActivities]
  );

  const detailRows = useMemo((): DetailRow[] => {
    return reportActivities
      .filter(a => a.dataDisparo && !isNaN(a.dataDisparo.getTime()))
      .map(a => {
        const baseEnviada = a.kpis.baseEnviada ?? 0;
        const baseEntregue = a.kpis.baseEntregue ?? 0;
        const aberturas = a.kpis.aberturas ?? 0;
        const cliques = a.kpis.cliques ?? 0;
        const propostas = a.kpis.propostas ?? 0;
        const aprovados = a.kpis.aprovados ?? 0;
        const emissoes = (a.kpis.emissoes ?? a.kpis.cartoes) ?? 0;
        const emissoesIndependentes = a.kpis.emissoesIndependentes ?? 0;
        const emissoesAssistidas = a.kpis.emissoesAssistidas ?? 0;
        const custoTotal = a.kpis.custoTotal ?? 0;
        const cac = a.kpis.cac ?? 0;
        const dispDate = new Date(a.dataDisparo);
        dispDate.setHours(0, 0, 0, 0);
        const aguardando = baseEnviada === 0 && dispDate >= d3Cutoff;
        return {
          date: a.dataDisparo,
          jornada: a.jornada || '',
          activityName: a.id,
          segmento: a.segmento || '',
          canal: a.canal || '',
          bu: a.bu || '',
          parceiro: getDimensionValue(a, 'parceiro'),
          subgrupo: getDimensionValue(a, 'subgrupo'),
          oferta: getDimensionValue(a, 'oferta'),
          oferta2: getDimensionValue(a, 'oferta2'),
          promocional: getDimensionValue(a, 'promocional'),
          promocional2: getDimensionValue(a, 'promocional2'),
          produto: getDimensionValue(a, 'produto'),
          etapaAquisicao: getDimensionValue(a, 'etapaAquisicao'),
          perfilCredito: getDimensionValue(a, 'perfilCredito'),
          safraKey: getDimensionValue(a, 'safraKey'),
          ordemDisparo: getDimensionValue(a, 'ordemDisparo'),
          status: getDimensionValue(a, 'status'),
          propostas,
          aprovados,
          emissoes,
          emissoesIndependentes,
          emissoesAssistidas,
          custoTotal,
          cac,
          baseEnviada,
          baseEntregue,
          aberturas,
          cliques,
          taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
          taxaAbertura: baseEntregue > 0 ? aberturas / baseEntregue : 0,
          taxaClique: aberturas > 0 ? cliques / aberturas : 0,
          taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
          taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
          taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
          custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
          taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
          participacaoEmissoes: totalDetailEmissoes > 0 ? emissoes / totalDetailEmissoes : 0,
          aguardando,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [d3Cutoff, reportActivities, totalDetailEmissoes]);

  // ── Filtro destaque sobre detailRows ──
  const filteredRows = useMemo((): DetailRow[] => {
    let rows = detailRows;

    if (detailSegmentFilter) {
      rows = rows.filter(r => r.segmento === detailSegmentFilter);
    }

    if (detailCanalFilter) {
      rows = rows.filter(r => r.canal === detailCanalFilter);
    }

    const search = tableSearch.trim().toLowerCase();
    if (search) {
      rows = rows.filter(r => {
        const description = editingDescs[r.activityName] ?? descriptions[r.activityName] ?? '';
        return [
          r.activityName,
          r.jornada,
          r.segmento,
          r.canal,
          r.parceiro,
          description,
        ].some(value => value?.toLowerCase().includes(search));
      });
    }

    if (destaqueFilter === 'top-conversores') {
      const withEmissoes = rows.filter(r => r.emissoes > 0);
      const base = withEmissoes.length > 0 ? withEmissoes : rows;
      const sorted = [...base].sort((a, b) => b.taxaConversaoBase - a.taxaConversaoBase);
      const top40 = Math.max(3, Math.ceil(sorted.length * 0.4));
      return sorted.slice(0, top40);
    }
    if (destaqueFilter === 'conversores') {
      return rows.filter(r => r.emissoes > 0);
    }
    if (destaqueFilter === 'aguardando') {
      return rows.filter(r => r.aguardando);
    }
    return rows;
  }, [descriptions, detailCanalFilter, detailRows, detailSegmentFilter, destaqueFilter, editingDescs, tableSearch]);

  // ── Ordenação sobre filteredRows ──
  const displayRows = useMemo((): DetailRow[] => {
    if (!sortKey) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = sortKey === 'date' ? (a.date as Date).getTime() : a[sortKey] as number;
      const bv = sortKey === 'date' ? (b.date as Date).getTime() : b[sortKey] as number;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [filteredRows, sortKey, sortDir]);

  // ── Linha de totais ──
  const summaryRow = useMemo(() => {
    const totalEnviadas = displayRows.reduce((s, r) => s + r.baseEnviada, 0);
    const totalEntregas = displayRows.reduce((s, r) => s + r.baseEntregue, 0);
    const totalPropostas = displayRows.reduce((s, r) => s + r.propostas, 0);
    const totalAprovados = displayRows.reduce((s, r) => s + r.aprovados, 0);
    const totalEmissoes = displayRows.reduce((s, r) => s + r.emissoes, 0);
    const totalCusto = displayRows.reduce((s, r) => s + r.custoTotal, 0);
    const rowsComEmissao = displayRows.filter(r => r.emissoes > 0);
    const avgCustoCartao = rowsComEmissao.length > 0
      ? rowsComEmissao.reduce((s, r) => s + r.custoPorCartao, 0) / rowsComEmissao.length
      : 0;
    return {
      totalEntregas,
      totalPropostas,
      totalAprovados,
      totalEmissoes,
      totalCusto,
      avgCustoCartao,
      taxaProposta: totalEntregas > 0 ? totalPropostas / totalEntregas : 0,
      taxaAprovacao: totalPropostas > 0 ? totalAprovados / totalPropostas : 0,
      taxaFinalizacao: totalEntregas > 0 ? totalEmissoes / totalEntregas : 0,
      taxaConversaoBase: totalEnviadas > 0 ? totalEmissoes / totalEnviadas : 0,
    };
  }, [displayRows]);

  const handleSort = useCallback((key: keyof DetailRow) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  const detailLeadCellClass = (color?: { bg: string; border: string; text: string }, isBanded?: boolean) => (
    `${color?.bg ?? (isBanded ? 'bg-slate-50' : 'bg-white')} ${color?.text ?? 'text-slate-700'}`
  );

  useEffect(() => {
    if (detailRows.length === 0) return;
    const names = detailRows.map(r => r.activityName);
    supabase
      .from('dispatch_descriptions')
      .select('activity_name, description')
      .in('activity_name', names)
      .then(({ data: rows }) => {
        if (!rows) return;
        const map: Record<string, string> = {};
        rows.forEach(row => { map[row.activity_name] = row.description; });
        setDescriptions(map);
        setEditingDescs(prev => ({ ...map, ...prev }));
      });
  }, [detailRows]);

  const saveDescription = async (activityName: string) => {
    const text = editingDescs[activityName] ?? '';
    setSavingDesc(prev => new Set(prev).add(activityName));
    await supabase.from('dispatch_descriptions').upsert({
      activity_name: activityName,
      description: text,
      updated_at: new Date().toISOString(),
    });
    setDescriptions(prev => ({ ...prev, [activityName]: text }));
    setSavingDesc(prev => { const s = new Set(prev); s.delete(activityName); return s; });
  };

  const segmentColorMap = useMemo(() => {
    const map = new Map<string, (typeof SEGMENT_PALETTE)[0]>();
    segmentoRows.forEach((row, idx) => {
      map.set(row.label, SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length]);
    });
    return map;
  }, [segmentoRows]);

  const applyGlobalSegmentFilter = useCallback((segmento: string) => {
    const next = globalFilters.segmentos.length === 1 && globalFilters.segmentos[0] === segmento
      ? []
      : [segmento];
    setGlobalFilters({ segmentos: next });
  }, [globalFilters.segmentos, setGlobalFilters]);

  const applyGlobalCanalFilter = useCallback((canal: string) => {
    const next = globalFilters.canais.length === 1 && globalFilters.canais[0] === canal
      ? []
      : [canal];
    setGlobalFilters({ canais: next });
  }, [globalFilters.canais, setGlobalFilters]);

  const clearDetailQuickFilters = useCallback(() => {
    setTableSearch('');
    setDetailSegmentFilter(null);
    setDetailCanalFilter(null);
    setDestaqueFilter(null);
  }, []);

  const destaqueOptions = [
    { key: 'top-conversores' as const, label: 'Top Conversores', desc: 'Top 40% por taxa de conversão entre os disparos conversores' },
    { key: 'conversores' as const, label: 'Conversores', desc: 'Todos os disparos com emissões/conversão' },
    { key: 'aguardando' as const, label: 'Aguardando Resultado', desc: 'Disparos em janela D-3' },
  ];

  const exportSegmento = useCallback(() => {
    const headers = ['Segmento', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base'];
    const toRow = (r: AggregatedRow) => [
      r.label, fmtN(r.baseEnviada), fmtN(r.baseEntregue), fmtPct(r.taxaEntrega),
      fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao),
      fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase),
    ];
    downloadBlob(buildCsvBlob(headers, [...segmentoRows, segmentoTotal].map(toRow)), `relatorio_segmento_${format(new Date(), 'yyyyMMdd')}.csv`);
  }, [segmentoRows, segmentoTotal]);

  const exportAquisicaoCrm = useCallback(async () => {
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
    const end = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());

    setIsExportingAquisicao(true);
    try {
      await exportAquisicaoCrmXlsx(start, end);
    } catch (error) {
      console.error('Erro ao exportar XLSX de Aquisição CRM', error);
      window.alert('Não foi possível gerar o XLSX de Aquisição CRM. Verifique a conexão com a base de dados e tente novamente.');
    } finally {
      setIsExportingAquisicao(false);
    }
  }, [periodEnd, periodStart]);

  const exportRentabilizacaoCrm = useCallback(async () => {
    const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
    const end = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());

    setIsExportingRnt(true);
    try {
      await exportRentabilizacaoCrmXlsx(start, end);
    } catch (error) {
      console.error('Erro ao exportar XLSX de Rentabilização CRM', error);
      window.alert('Não foi possível gerar o XLSX de Rentabilização CRM. Verifique a conexão com a base de dados e tente novamente.');
    } finally {
      setIsExportingRnt(false);
    }
  }, [periodEnd, periodStart]);

  const exportCanal = useCallback(() => {
    const headers = ['Canal', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base', '% Participação'];
    const toRow = (r: AggregatedRow, isTotal = false) => [
      r.label, fmtN(r.baseEnviada), fmtN(r.baseEntregue), fmtPct(r.taxaEntrega),
      fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao),
      fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase),
      isTotal ? '100%' : (totalCanalEmissoes > 0 ? fmtPct(r.emissoes / totalCanalEmissoes, 0) : '0%'),
    ];
    downloadBlob(buildCsvBlob(headers, [...canalRows.map(r => toRow(r)), toRow(canalTotal, true)]), `relatorio_canal_${format(new Date(), 'yyyyMMdd')}.csv`);
  }, [canalRows, canalTotal, totalCanalEmissoes]);

  const exportDetail = useCallback(() => {
    const headers = ['Data', 'Jornada', 'Activity Name', 'Segmento', 'Canal', 'Envios', 'Entregas', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base'];
    const rows = detailRows.map(r => [
      format(r.date, 'dd/MM/yyyy'), r.jornada, r.activityName, r.segmento, r.canal,
      r.aguardando ? 'Aguardando' : fmtN(r.baseEnviada),
      r.aguardando ? 'Aguardando' : fmtN(r.baseEntregue),
      r.aguardando ? 'Aguardando' : fmtPct(r.taxaEntrega),
      fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao),
      fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase),
    ]);
    downloadBlob(buildCsvBlob(headers, rows), `relatorio_disparos_${format(new Date(), 'yyyyMMdd')}.csv`);
  }, [detailRows]);

  const exportAll = useCallback(() => {
    const escape = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
    const toLine = (cols: string[]) => cols.map(escape).join(',');

    // ── Section 1: Performance Campanhas ──────────────────────────────────
    const segHeaders = ['Segmento', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base'];
    const toSegRow = (r: AggregatedRow) => [r.label, fmtN(r.baseEnviada), fmtN(r.baseEntregue), fmtPct(r.taxaEntrega), fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao), fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase)];

    const segLines = [
      toLine(['=== PERFORMANCE CAMPANHAS ===']),
      toLine(segHeaders),
      ...[...segmentoRows, segmentoTotal].map(r => toLine(toSegRow(r))),
    ];

    // ── Section 2: Performance Canais ─────────────────────────────────────
    const canalHeaders = ['Canal', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base', '% Participação'];
    const toCanalRow = (r: AggregatedRow, isTotal = false) => [r.label, fmtN(r.baseEnviada), fmtN(r.baseEntregue), fmtPct(r.taxaEntrega), fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao), fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase), isTotal ? '100%' : (totalCanalEmissoes > 0 ? fmtPct(r.emissoes / totalCanalEmissoes, 0) : '0%')];

    const canalLines = [
      toLine(['=== PERFORMANCE CANAIS ===']),
      toLine(canalHeaders),
      ...[...canalRows.map(r => toCanalRow(r)), toCanalRow(canalTotal, true)].map(r => toLine(r)),
    ];

    // ── Section 3: Detalhamento por Disparo ───────────────────────────────
    const detailHeaders = ['Data', 'Jornada', 'Activity Name', 'Segmento', 'Canal', 'Envios', 'Entregas', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base'];
    const detailLines = [
      toLine(['=== DETALHAMENTO POR DISPARO ===']),
      toLine(detailHeaders),
      ...detailRows.map(r => toLine([
        format(r.date, 'dd/MM/yyyy'), r.jornada, r.activityName, r.segmento, r.canal,
        r.aguardando ? 'Aguardando' : fmtN(r.baseEnviada),
        r.aguardando ? 'Aguardando' : fmtN(r.baseEntregue),
        r.aguardando ? 'Aguardando' : fmtPct(r.taxaEntrega),
        fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao),
        fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase),
      ])),
    ];

    // ── Combine all sections with blank separators ─────────────────────────
    const allLines = [...segLines, '', ...canalLines, '', ...detailLines];
    const blob = new Blob(['\uFEFF' + allLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `relatorio_completo_${format(new Date(), 'yyyyMMdd')}.csv`);
  }, [segmentoRows, segmentoTotal, canalRows, canalTotal, totalCanalEmissoes, detailRows]);

  const ComparisonBadge = ({
    current,
    previous,
    invertPositive = false,
    className = '',
  }: {
    current: number;
    previous: number;
    invertPositive?: boolean;
    className?: string;
  }) => {
    if (!shouldShowComparison) return null;

    const display = formatVariation(calcVariation(current, previous), invertPositive);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${display.bg} ${display.border} ${display.color} ${className}`}
        title={`Período anterior: ${previous.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}`}
      >
        {display.label}
      </span>
    );
  };

  const MetricValue = ({
    value,
    current,
    previous,
    previousValue,
    invertPositive = false,
    align = 'right',
    strong = false,
    valueClassName = '',
  }: {
    value: string;
    current: number;
    previous: number;
    previousValue?: string;
    invertPositive?: boolean;
    align?: 'right' | 'center';
    strong?: boolean;
    valueClassName?: string;
  }) => (
    <div className={`flex flex-col gap-1 leading-tight ${align === 'center' ? 'items-center text-center' : 'items-end text-right'}`}>
      <div className={`flex max-w-full flex-wrap items-baseline gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-end'}`}>
        <span className={`whitespace-nowrap tabular-nums ${strong ? 'font-bold text-slate-900' : ''} ${valueClassName}`}>{value}</span>
        {shouldShowComparison && (
          <ComparisonBadge current={current} previous={previous} invertPositive={invertPositive} />
        )}
      </div>
      {shouldShowComparison && (
        <span className="whitespace-nowrap text-[10px] font-medium text-slate-500">
          <span className="text-slate-400">Anterior: </span>
          <span className="tabular-nums text-slate-600">
            {previousValue ?? previous.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
          </span>
        </span>
      )}
    </div>
  );

  if (reportActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <FileText size={40} className="opacity-40" />
        <p className="text-base font-medium">Nenhum dado disponível para o período selecionado.</p>
        <p className="text-sm">Ajuste os filtros ou faça upload de um arquivo CSV.</p>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-8 max-w-full">

      {/* ── PAGE HEADER ── */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #00A8B0 100%)` }} className="px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Relatório de Performance</h1>
                <div className="ml-2 flex rounded-xl border border-white/30 bg-white/15 p-1">
                  {[ 
                    { key: 'performance' as const, label: 'Overview' },
                    { key: 'monthly' as const, label: 'Mensal' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setReportMode(option.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        reportMode === option.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-white/80 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-cyan-100 text-sm">
                {reportActivities.length} disparos analisados
                {selectedBU ? ` · BU: ${selectedBU}` : ' · Todas as BUs'}
                {' · '}
                {segmentoRows.length} segmentos · {canalRows.length} canais
                <span className="ml-2 opacity-70">· sem filtro de período</span>
              </p>
            </div>
          </div>
        </div>

        {/* KPI Summary Strip */}
        {reportMode === 'performance' && <div className="grid grid-cols-4 divide-x divide-slate-200 bg-white border-x border-b border-slate-200">
          {(rentab
            ? [
              { label: 'Base Enviada', value: fmtN(segmentoTotal.baseEnviada), current: segmentoTotal.baseEnviada, previous: previousSegmentoTotal.baseEnviada },
              { label: 'Base Entregue', value: fmtN(segmentoTotal.baseEntregue), current: segmentoTotal.baseEntregue, previous: previousSegmentoTotal.baseEntregue },
              { label: 'Aberturas', value: fmtN(segmentoTotal.aberturas), current: segmentoTotal.aberturas, previous: previousSegmentoTotal.aberturas },
              { label: 'Cliques', value: fmtN(segmentoTotal.cliques), current: segmentoTotal.cliques, previous: previousSegmentoTotal.cliques },
            ]
            : [
              { label: 'Base Enviada', value: fmtN(segmentoTotal.baseEnviada), current: segmentoTotal.baseEnviada, previous: previousSegmentoTotal.baseEnviada },
              { label: 'Propostas', value: fmtN(segmentoTotal.propostas), current: segmentoTotal.propostas, previous: previousSegmentoTotal.propostas },
              { label: 'Aprovados', value: fmtN(segmentoTotal.aprovados), current: segmentoTotal.aprovados, previous: previousSegmentoTotal.aprovados },
              { label: 'Emissões', value: fmtN(segmentoTotal.emissoes), current: segmentoTotal.emissoes, previous: previousSegmentoTotal.emissoes },
            ]
          ).map(kpi => (
            <div key={kpi.label} className="px-6 py-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{kpi.label}</p>
              <div className="mt-0.5">
                <MetricValue
                  value={kpi.value}
                  current={kpi.current}
                  previous={kpi.previous}
                  previousValue={fmtN(kpi.previous)}
                  align="center"
                  strong
                  valueClassName="text-xl text-slate-800"
                />
              </div>
            </div>
          ))}
        </div>}
      </div>

      {reportMode === 'monthly' ? (
        <MonthlyReportView data={data} selectedBU={selectedBU} rentabilizacao={rentab} />
      ) : (
      <>
      {/* ── PERFORMANCE CAMPANHAS ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">Performance campanhas</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {segmentoRows.length} {getGroupableDimensionLabel(campanhasGroupBy).toLowerCase()}{segmentoRows.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <GroupBySelector
              value={campanhasGroupBy}
              options={GROUPABLE_DIMENSIONS}
              onChange={setCampanhasGroupBy}
            />
            <ColumnsCustomizer
              value={campanhasColumns}
              defaults={[...aggregateDefaults]}
              available={METRIC_COLUMNS.filter(c => aggregateDefaults.includes(c.key as MetricKey))}
              onChange={setCampanhasColumns}
            />
            {!rentab && <button
              onClick={exportAquisicaoCrm}
              disabled={isExportingAquisicao}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 disabled:cursor-wait disabled:opacity-60 transition-colors font-medium"
              title="Exportar Excel diarizado de aquisição CRM com abas Aquisição CRM e Auditoria"
            >
              <FileSpreadsheet size={14} />
              {isExportingAquisicao ? 'Gerando XLSX...' : 'Exportar XLSX Aquisição'}
            </button>}
            <button
              onClick={exportRentabilizacaoCrm}
              disabled={isExportingRnt}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-500 disabled:cursor-wait disabled:opacity-60 transition-colors font-medium"
              title="Exportar Excel diarizado de Rentabilização CRM (cross-sell, ativação, seguros)"
            >
              <FileSpreadsheet size={14} />
              {isExportingRnt ? 'Gerando XLSX...' : 'Exportar XLSX Rentabilização'}
            </button>
            <button
              onClick={exportSegmento}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
            >
              <FileSpreadsheet size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        <AggregateTable
          groupColumnLabel={getGroupableDimensionLabel(campanhasGroupBy)}
          groupCellLabel={(label) => (
            campanhasGroupBy === 'segmento'
              ? <SegmentLabel value={label} />
              : <>{label}</>
          )}
          rows={segmentoRows}
          totalRow={segmentoTotal}
          previousRowsByLabel={previousSegmentoRowsByLabel}
          previousTotal={previousSegmentoTotal}
          visibleColumns={campanhasColumns}
          shouldShowComparison={shouldShowComparison}
          totalEmissoesForParticipation={segmentoTotal.emissoes}
          segmentColorMap={campanhasGroupBy === 'segmento' ? segmentColorMap : undefined}
          onRowClick={campanhasGroupBy === 'segmento' ? (label) => {
            setDetailSegmentFilter(current => current === label ? null : label);
            setSelectedActivityRow(null);
          } : undefined}
          onGroupCellClick={campanhasGroupBy === 'segmento' ? applyGlobalSegmentFilter : undefined}
          rowTitle={campanhasGroupBy === 'segmento' ? 'Filtrar detalhamento por este segmento' : undefined}
          groupCellTitle={campanhasGroupBy === 'segmento' ? 'Aplicar este segmento no filtro global' : undefined}
          MetricValue={MetricValue}
        />
      </section>

      {/* ── PERFORMANCE CANAIS ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">Performance canais</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {canalRows.length} canai{canalRows.length === 1 ? 'l' : 's'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportCanal}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
            >
              <FileSpreadsheet size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        <AggregateTable
          groupColumnLabel="Canal"
          groupCellLabel={(label) => <>{label}</>}
          rows={canalRows}
          totalRow={canalTotal}
          previousRowsByLabel={previousCanalRowsByLabel}
          previousTotal={previousCanalTotal}
          visibleColumns={rentab ? ENGAGEMENT_AGGREGATE_COLUMNS : [...DEFAULT_AGGREGATE_COLUMNS, ...DEFAULT_CANAL_EXTRA_COLUMNS]}
          shouldShowComparison={shouldShowComparison}
          totalEmissoesForParticipation={totalCanalEmissoes}
          onRowClick={(label) => {
            setDetailCanalFilter(current => current === label ? null : label);
            setSelectedActivityRow(null);
          }}
          onGroupCellClick={applyGlobalCanalFilter}
          rowTitle="Filtrar detalhamento por este canal"
          groupCellTitle="Aplicar este canal no filtro global"
          MetricValue={MetricValue}
        />
      </section>

      {/* ── DETALHAMENTO POR DISPARO ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {selectedActivityRow && (
              <button
                onClick={() => setSelectedActivityRow(null)}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">
              {selectedActivityRow ? 'Detalhe do Disparo' : 'Detalhamento por disparo'}
            </h2>
            {!selectedActivityRow && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {destaqueFilter
                  ? `${displayRows.length} de ${detailRows.length} disparos`
                  : `${detailRows.length} disparos`}
              </span>
            )}
          </div>
          {!selectedActivityRow && (
            <div className="flex items-center gap-2 flex-wrap">
              <ColumnsCustomizer
                value={detailDimensionCols}
                defaults={[...DEFAULT_DETAIL_DIMENSIONS]}
                available={DIMENSION_COLUMNS}
                onChange={setDetailDimensionCols}
                label="Dimensões"
                buttonLabel="Dimensões"
              />
              <ColumnsCustomizer
                value={detailMetricCols}
                defaults={[...detailMetricDefaults]}
                available={METRIC_COLUMNS.filter(c => detailMetricDefaults.includes(c.key as MetricKey))}
                onChange={setDetailMetricCols}
                label="Métricas"
                buttonLabel="Métricas"
              />
              {/* Filtros Destaque */}
              <div className="relative">
                <button
                  onClick={() => setShowDestaqueMenu(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium ${
                    destaqueFilter
                      ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                      : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Info size={13} />
                  {destaqueFilter === 'top-conversores'
                    ? 'Top Conversores'
                    : destaqueFilter === 'conversores'
                    ? 'Conversores'
                    : destaqueFilter === 'aguardando'
                    ? 'Aguardando'
                    : 'Filtros'}
                  {destaqueFilter && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                </button>
                {showDestaqueMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[240px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-1 pb-1.5">Filtros</p>
                    {destaqueOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setDestaqueFilter(destaqueFilter === opt.key ? null : opt.key); setShowDestaqueMenu(false); }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${destaqueFilter === opt.key ? 'bg-amber-50' : ''}`}
                      >
                        <p className={`text-xs font-semibold ${destaqueFilter === opt.key ? 'text-amber-600' : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                    {destaqueFilter && (
                      <>
                        <div className="border-t border-slate-100 mt-1 mb-1" />
                        <button
                          onClick={() => { setDestaqueFilter(null); setShowDestaqueMenu(false); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Limpar filtro
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Exportar CSV */}
              <button
                onClick={exportDetail}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
              >
                <FileSpreadsheet size={14} />
                Exportar CSV
              </button>
            </div>
          )}
        </div>

        {/* ── Inline detail view ── */}
        {selectedActivityRow && (() => {
          const a = selectedActivityRow;
          const fmtR = (v?: number | null) => v != null ? v.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) : '—';
          const fmtP = (v?: number | null) => v != null ? `${(v * 100).toFixed(2)}%` : '—';
          const fmtBR = (v?: number | null) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
          const BU_COLOR: Record<string, string> = { B2C: '#3B82F6', B2B2C: '#10B981', Plurix: '#A855F7', Seguros: '#F97316' };
          const buColor = BU_COLOR[a.BU] ?? '#64748B';
          const CANAL_EMOJI: Record<string, string> = { 'E-mail': '📧', 'SMS': '💬', 'WhatsApp': '📱', 'Push': '🔔' };
          return (
            <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
              {/* Header bar */}
              <div className="px-5 py-4 border-b border-slate-100" style={{ borderLeft: `4px solid ${buColor}` }}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: buColor }}>{a.BU}</span>
                  {a.Canal && <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{CANAL_EMOJI[a.Canal] ?? ''} {a.Canal}</span>}
                  {a.status && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{a.status}</span>}
                  {a['Data de Disparo'] && <span className="text-xs text-slate-400">{a['Data de Disparo']}</span>}
                </div>
                <p className="text-sm font-mono text-slate-700 break-all">{a['Activity name / Taxonomia']}</p>
                {a.jornada && <p className="text-xs text-slate-400 mt-0.5">{a.jornada}</p>}
              </div>

              {/* KPI summary */}
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                {[
                  { label: 'Cartões Gerados', value: fmtR(a['Cartões Gerados']), icon: <BarChart2 size={14} /> },
                  { label: 'CAC', value: fmtBR(a.CAC), icon: <DollarSign size={14} /> },
                  { label: 'Base Total', value: fmtR(a['Base Total']), icon: <TrendingUp size={14} /> },
                  { label: 'Custo Total', value: fmtBR(a['Custo Total Campanha']), icon: <DollarSign size={14} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="px-5 py-4">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{icon}{label}</div>
                    <div className="text-xl font-bold text-slate-800">{value}</div>
                  </div>
                ))}
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
                {/* Identificação */}
                <div className="px-5 py-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identificação</p>
                  {[
                    ['Segmento', a.Segmento],
                    ['Parceiro', a.Parceiro],
                    ['Etapa Funil', a['Etapa de aquisição']],
                    ['Perfil Crédito', a['Perfil de Crédito']],
                    ['Ordem', a['Ordem de disparo'] != null ? String(a['Ordem de disparo']) : undefined],
                    ['Oferta', a.Oferta],
                    ['Promocional', a.Promocional],
                    ['Produto', a.Produto],
                  ].map(([k, v]) => v ? (
                    <div key={String(k)}>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{k}</p>
                      <p className="text-sm font-medium text-slate-700">{v}</p>
                    </div>
                  ) : null)}
                </div>

                {/* Taxas de funil */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxas de Funil</p>
                  {[
                    ['Taxa de Entrega', fmtP(a['Taxa de Entrega'])],
                    ['Taxa de Abertura', fmtP(a['Taxa de Abertura'])],
                    ['Taxa de Proposta', fmtP(a['Taxa de Proposta'])],
                    ['Taxa de Aprovação', fmtP(a['Taxa de Aprovação'])],
                    ['Taxa de Finalização', fmtP(a['Taxa de Finalização'])],
                    ['Taxa de Conversão', fmtP(a['Taxa de Conversão'])],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{k}</span>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Resultados */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Resultados</p>
                  {[
                    ['Base Total', fmtR(a['Base Total'])],
                    ['Base Acionável', fmtR(a['Base Acionável'])],
                    ['Propostas', fmtR(a.Propostas)],
                    ['Aprovados', fmtR(a.Aprovados)],
                    ['Cartões Gerados', fmtR(a['Cartões Gerados'])],
                    ['Custo Total', fmtBR(a['Custo Total Campanha'])],
                    ['CAC', fmtBR(a.CAC)],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{k}</span>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {!selectedActivityRow && <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-3 py-3 bg-slate-50/70">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                  placeholder="Buscar campanha, jornada, segmento ou descrição..."
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              {detailSegmentFilter && (
                <button
                  type="button"
                  onClick={() => setDetailSegmentFilter(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"
                >
                  Segmento: {detailSegmentFilter}
                </button>
              )}
              {detailCanalFilter && (
                <button
                  type="button"
                  onClick={() => setDetailCanalFilter(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700"
                >
                  Canal: {detailCanalFilter}
                </button>
              )}
              {(detailSegmentFilter || detailCanalFilter || tableSearch || destaqueFilter) && (
                <button
                  type="button"
                  onClick={clearDetailQuickFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-white"
                >
                  <FilterX size={13} />
                  Limpar tabela
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="font-medium">Atalhos:</span>
              <span>Clique em um segmento ou canal nos blocos acima para filtrar o detalhamento.</span>
              <span>Clique nos chips da tabela para aplicar o filtro global da tela.</span>
            </div>
          </div>
          <DetailTable
            rows={displayRows}
            visibleDimensions={detailDimensionCols}
            visibleMetrics={detailMetricCols}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (key === 'date') {
                handleSort('date');
              } else {
                handleSort(key as keyof DetailRow);
              }
            }}
            segmentColorMap={segmentColorMap}
            descriptions={descriptions}
            editingDescs={editingDescs}
            savingDesc={savingDesc}
            onChangeDescription={(name, value) => setEditingDescs(prev => ({ ...prev, [name]: value }))}
            onSaveDescription={saveDescription}
            applyGlobalSegmentFilter={applyGlobalSegmentFilter}
            applyGlobalCanalFilter={applyGlobalCanalFilter}
            onRowClick={(activityName) => {
              const act = allActivities.find((a: Activity) => a.id === activityName);
              if (act) setSelectedActivityRow(toActivityRow(act));
            }}
            summary={summaryRow}
            destaqueFilter={destaqueFilter}
          />
        </div>}
      </section>

      </>
      )}
    </div>
    </>
  );
};
