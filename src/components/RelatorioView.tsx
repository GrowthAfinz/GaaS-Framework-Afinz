import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, FileSpreadsheet, FileText, Save, ArrowLeft, TrendingUp, DollarSign, BarChart2, Info, ChevronUp, ChevronDown, Search, PanelRightClose, PanelRightOpen, FilterX } from 'lucide-react';
import { CalendarData, Activity } from '../types/framework';
import { supabase } from '../services/supabaseClient';
import { ActivityRow } from '../types/activity';
import { useAppStore } from '../store/useAppStore';

interface RelatorioViewProps {
  data: CalendarData;
  selectedBU?: string;
}

interface AggregatedRow {
  label: string;
  baseEnviada: number;
  baseEntregue: number;
  propostas: number;
  aprovados: number;
  emissoes: number;
  custoTotal: number;
  taxaEntrega: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
}

interface DetailRow {
  date: Date;
  jornada: string;
  activityName: string;
  segmento: string;
  canal: string;
  bu: string;
  parceiro: string;
  propostas: number;
  aprovados: number;
  emissoes: number;
  custoTotal: number;
  baseEnviada: number;
  baseEntregue: number;
  taxaEntrega: number;
  taxaProposta: number;
  taxaAprovacao: number;
  taxaFinalizacao: number;
  custoPorCartao: number;
  taxaConversaoBase: number;
  aguardando: boolean; // true when baseEnviada is 0 AND date is within d-3
}

function computeRow(activities: Activity[], label: string): AggregatedRow {
  const baseEnviada = activities.reduce((s, a) => s + (a.kpis.baseEnviada ?? 0), 0);
  const baseEntregue = activities.reduce((s, a) => s + (a.kpis.baseEntregue ?? 0), 0);
  const propostas = activities.reduce((s, a) => s + (a.kpis.propostas ?? 0), 0);
  const aprovados = activities.reduce((s, a) => s + (a.kpis.aprovados ?? 0), 0);
  const emissoes = activities.reduce((s, a) => s + ((a.kpis.emissoes ?? a.kpis.cartoes) ?? 0), 0);
  const custoTotal = activities.reduce((s, a) => s + (a.kpis.custoTotal ?? 0), 0);
  return {
    label,
    baseEnviada,
    baseEntregue,
    propostas,
    aprovados,
    emissoes,
    custoTotal,
    taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
    taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
    taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
    taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
    custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
    taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
  };
}

function fmtN(n: number): string {
  return n.toLocaleString('pt-BR');
}

function fmtPct(n: number, decimals = 2): string {
  return `${(n * 100).toFixed(decimals).replace('.', ',')}%`;
}

function fmtPct4(n: number): string {
  return `${(n * 100).toFixed(4).replace('.', ',')}%`;
}

function fmtBRL(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export const RelatorioView: React.FC<RelatorioViewProps> = ({ data, selectedBU }) => {
  const { viewSettings, setGlobalFilters } = useAppStore();
  const globalFilters = viewSettings.filtrosGlobais;
  const allActivities = useMemo(() => Object.values(data).flat(), [data]);
  const reportActivities = useMemo(() => (
    allActivities.filter((activity) => {
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
  ), [allActivities, globalFilters.canais, globalFilters.jornadas, globalFilters.parceiros, globalFilters.segmentos]);

  // ── Descrições por disparo ──
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [editingDescs, setEditingDescs] = useState<Record<string, string>>({});
  const [savingDesc, setSavingDesc] = useState<Set<string>>(new Set());
  const [selectedActivityRow, setSelectedActivityRow] = useState<ActivityRow | null>(null);

  // ── Filtros Destaque ──
  const [destaqueFilter, setDestaqueFilter] = useState<'top-conversores' | 'aguardando' | null>(null);
  const [showDestaqueMenu, setShowDestaqueMenu] = useState(false);
  const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [detailSegmentFilter, setDetailSegmentFilter] = useState<string | null>(null);
  const [detailCanalFilter, setDetailCanalFilter] = useState<string | null>(null);

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

  const segmentoRows = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    reportActivities.forEach(a => {
      const key = a.segmento || 'Sem Segmento';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    const rows: AggregatedRow[] = [];
    groups.forEach((acts, label) => rows.push(computeRow(acts, label)));
    return rows.sort((a, b) => b.emissoes - a.emissoes);
  }, [reportActivities]);

  const segmentoTotal = useMemo(() => computeRow(reportActivities, 'Total Geral'), [reportActivities]);

  const canalRows = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    reportActivities.forEach(a => {
      const key = a.canal || 'Sem Canal';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    const rows: AggregatedRow[] = [];
    groups.forEach((acts, label) => rows.push(computeRow(acts, label)));
    return rows.sort((a, b) => b.emissoes - a.emissoes);
  }, [reportActivities]);

  const canalTotal = useMemo(() => computeRow(reportActivities, 'Total Geral'), [reportActivities]);
  const totalCanalEmissoes = canalTotal.emissoes;

  // d-3 cutoff: dates from today minus 3 days may still be consolidating
  const d3Cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3);
    return d;
  }, []);

  const detailRows = useMemo((): DetailRow[] => {
    return reportActivities
      .filter(a => a.dataDisparo && !isNaN(a.dataDisparo.getTime()))
      .map(a => {
        const baseEnviada = a.kpis.baseEnviada ?? 0;
        const baseEntregue = a.kpis.baseEntregue ?? 0;
        const propostas = a.kpis.propostas ?? 0;
        const aprovados = a.kpis.aprovados ?? 0;
        const emissoes = (a.kpis.emissoes ?? a.kpis.cartoes) ?? 0;
        const custoTotal = a.kpis.custoTotal ?? 0;
        // Aguardando: sem envios E data dentro do janela d-3 (pode ainda consolidar)
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
          parceiro: (() => {
            if (a.bu?.toLowerCase() === 'plurix') return 'Plurix';
            const p = a.parceiro ?? '';
            return (!p || p.toLowerCase() === 'n/a') ? 'Afinz' : p;
          })(),
          propostas,
          aprovados,
          emissoes,
          custoTotal,
          baseEnviada,
          baseEntregue,
          taxaEntrega: baseEnviada > 0 ? baseEntregue / baseEnviada : 0,
          taxaProposta: baseEntregue > 0 ? propostas / baseEntregue : 0,
          taxaAprovacao: propostas > 0 ? aprovados / propostas : 0,
          taxaFinalizacao: baseEntregue > 0 ? emissoes / baseEntregue : 0,
          custoPorCartao: emissoes > 0 ? custoTotal / emissoes : 0,
          taxaConversaoBase: baseEnviada > 0 ? emissoes / baseEnviada : 0,
          aguardando,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [d3Cutoff, reportActivities]);

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
      const top20 = Math.max(1, Math.ceil(sorted.length * 0.2));
      return sorted.slice(0, top20);
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

  const exportSegmento = useCallback(() => {
    const headers = ['Segmento', 'Base Enviada', 'Base Entregue', '% Entrega', 'Propostas', '% Proposta', 'Aprovados', '% Aprovação', 'Emissões', '% Finalização', 'Custo/Cartão', 'Custo Total', '% Conv da Base'];
    const toRow = (r: AggregatedRow) => [
      r.label, fmtN(r.baseEnviada), fmtN(r.baseEntregue), fmtPct(r.taxaEntrega),
      fmtN(r.propostas), fmtPct(r.taxaProposta), fmtN(r.aprovados), fmtPct(r.taxaAprovacao),
      fmtN(r.emissoes), fmtPct(r.taxaFinalizacao), fmtBRL(r.custoPorCartao), fmtBRL(r.custoTotal), fmtPct4(r.taxaConversaoBase),
    ];
    downloadBlob(buildCsvBlob(headers, [...segmentoRows, segmentoTotal].map(toRow)), `relatorio_segmento_${format(new Date(), 'yyyyMMdd')}.csv`);
  }, [segmentoRows, segmentoTotal]);

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

  if (allActivities.length === 0) {
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
                <span className="text-[11px] font-semibold bg-white/20 text-white border border-white/30 rounded-full px-2.5 py-0.5 tracking-wide uppercase">
                  Histórico Completo
                </span>
              </div>
              <p className="text-cyan-100 text-sm">
                {allActivities.length} disparos analisados
                {selectedBU ? ` · BU: ${selectedBU}` : ' · Todas as BUs'}
                {' · '}
                {segmentoRows.length} segmentos · {canalRows.length} canais
                <span className="ml-2 opacity-70">· sem filtro de período</span>
              </p>
            </div>
            <button
              onClick={exportAll}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border border-white/40 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-sm shrink-0"
            >
              <Download size={15} />
              Exportar Tudo
            </button>
          </div>
        </div>
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-200 bg-white border-x border-b border-slate-200">
          {[
            { label: 'Base Enviada', value: fmtN(segmentoTotal.baseEnviada) },
            { label: 'Propostas', value: fmtN(segmentoTotal.propostas) },
            { label: 'Aprovados', value: fmtN(segmentoTotal.aprovados) },
            { label: 'Emissões', value: fmtN(segmentoTotal.emissoes) },
          ].map(kpi => (
            <div key={kpi.label} className="px-6 py-3 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PERFORMANCE CAMPANHAS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">Performance campanhas</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{segmentoRows.length} segmentos</span>
          </div>
          <button
            onClick={exportSegmento}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
          >
            <FileSpreadsheet size={14} />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: '#1E293B' }} className="text-white">
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap min-w-[160px]">Segmentos</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Base enviada</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Base entregue</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Entrega.</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >Propostas</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >% Proposta</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >Aprovados</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >% Aprovação</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >Emissões</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Finalização</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo / Cartão</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo Total</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Conv da Base</th>
                </tr>
              </thead>
              <tbody>
                {segmentoRows.map((row, idx) => {
                  const color = segmentColorMap.get(row.label);
                  const isBanded = idx % 2 !== 0;
                  return (
                    <tr
                      key={row.label}
                      className={`border-t border-slate-100 hover:brightness-95 transition-all cursor-pointer ${color?.bg ?? (isBanded ? 'bg-slate-50' : 'bg-white')}`}
                      onClick={() => {
                        setDetailSegmentFilter(current => current === row.label ? null : row.label);
                        setSelectedActivityRow(null);
                      }}
                      title="Filtrar detalhamento por este segmento"
                    >
                      <td
                        className={`px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap ${color?.border ?? ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          applyGlobalSegmentFilter(row.label);
                        }}
                        title="Aplicar este segmento no filtro global"
                      >
                        {row.label}
                      </td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEnviada)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEntregue)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaEntrega)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.propostas)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtPct(row.taxaProposta)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.aprovados)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtPct(row.taxaAprovacao)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.emissoes)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaFinalizacao)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoPorCartao)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoTotal)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct4(row.taxaConversaoBase)}</td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="border-t-2 border-amber-300" style={{ background: '#FFFBCC' }}>
                  <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap border-l-4 border-amber-400">Total Geral</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtN(segmentoTotal.baseEnviada)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtN(segmentoTotal.baseEntregue)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct(segmentoTotal.taxaEntrega)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(segmentoTotal.propostas)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtPct(segmentoTotal.taxaProposta)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(segmentoTotal.aprovados)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtPct(segmentoTotal.taxaAprovacao)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(segmentoTotal.emissoes)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct(segmentoTotal.taxaFinalizacao)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtBRL(segmentoTotal.custoPorCartao)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtBRL(segmentoTotal.custoTotal)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct4(segmentoTotal.taxaConversaoBase)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE CANAIS ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">Performance canais</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{canalRows.length} canais</span>
          </div>
          <button
            onClick={exportCanal}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
          >
            <FileSpreadsheet size={14} />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: '#1E293B' }} className="text-white">
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap min-w-[120px]">Canal</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Base enviada</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Base entregue</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Entrega.</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >Propostas</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >% Proposta</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >Aprovados</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >% Aprovação</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >Emissões</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Finalização</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo / Cartão</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo Total</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Conv da Base</th>
                  <th
                    className="text-right px-4 py-3 font-semibold whitespace-nowrap"
                    style={{ background: TEAL }}
                  >% Participação</th>
                </tr>
              </thead>
              <tbody>
                {canalRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={`border-t border-slate-100 hover:bg-cyan-50 transition-all cursor-pointer ${idx % 2 !== 0 ? 'bg-slate-50' : 'bg-white'}`}
                    onClick={() => {
                      setDetailCanalFilter(current => current === row.label ? null : row.label);
                      setSelectedActivityRow(null);
                    }}
                    title="Filtrar detalhamento por este canal"
                  >
                    <td
                      className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap"
                      onClick={(event) => {
                        event.stopPropagation();
                        applyGlobalCanalFilter(row.label);
                      }}
                      title="Aplicar este canal no filtro global"
                    >
                      {row.label}
                    </td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEnviada)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEntregue)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaEntrega)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(row.propostas)}</td>
                    <td
                      className="text-right px-3 py-2.5 text-slate-700"
                      style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtPct(row.taxaProposta)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(row.aprovados)}</td>
                    <td
                      className="text-right px-3 py-2.5 text-slate-700"
                      style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtPct(row.taxaAprovacao)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(row.emissoes)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaFinalizacao)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoPorCartao)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoTotal)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct4(row.taxaConversaoBase)}</td>
                    <td className="text-right px-4 py-2.5 font-bold text-cyan-700">
                      {totalCanalEmissoes > 0 ? fmtPct(row.emissoes / totalCanalEmissoes, 0) : '0%'}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t-2 border-amber-300" style={{ background: '#FFFBCC' }}>
                  <td className="px-4 py-2.5 font-bold text-slate-900 whitespace-nowrap border-l-4 border-amber-400">Total Geral</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtN(canalTotal.baseEnviada)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtN(canalTotal.baseEntregue)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct(canalTotal.taxaEntrega)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(canalTotal.propostas)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtPct(canalTotal.taxaProposta)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(canalTotal.aprovados)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtPct(canalTotal.taxaAprovacao)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: HIGHLIGHT_TOTAL, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                  >{fmtN(canalTotal.emissoes)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct(canalTotal.taxaFinalizacao)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtBRL(canalTotal.custoPorCartao)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtBRL(canalTotal.custoTotal)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">{fmtPct4(canalTotal.taxaConversaoBase)}</td>
                  <td className="text-right px-4 py-2.5 font-bold text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDescriptionCollapsed(value => !value)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium ${
                  isDescriptionCollapsed
                    ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                }`}
                title={isDescriptionCollapsed ? 'Mostrar coluna de descrição' : 'Ocultar coluna de descrição'}
              >
                {isDescriptionCollapsed ? <PanelRightOpen size={13} /> : <PanelRightClose size={13} />}
                {isDescriptionCollapsed ? 'Mostrar descrição' : 'Ocultar descrição'}
              </button>
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
                    : destaqueFilter === 'aguardando'
                    ? 'Aguardando'
                    : 'Filtros'}
                  {destaqueFilter && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                </button>
                {showDestaqueMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-1 pb-1.5">Filtros</p>
                    {([
                      { key: 'top-conversores' as const, label: '🏆 Top Conversores', desc: 'Top 20% por taxa de conversão' },
                      { key: 'aguardando' as const, label: '⏳ Aguardando Resultado', desc: 'Disparos em janela D-3' },
                    ] as const).map(opt => (
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
          const BU_COLOR: Record<string, string> = { B2C: '#3B82F6', B2B2C: '#10B981', Plurix: '#A855F7' };
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: '#1E293B' }} className="text-white">
                  <th
                    className="text-left px-2 py-2 font-semibold whitespace-nowrap w-12 cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center gap-1">
                      Data
                      {sortKey === 'date' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th className="text-left px-2 py-2 font-semibold whitespace-nowrap" style={{ minWidth: 140, maxWidth: 180 }}>Campanha</th>
                  <th className="text-center px-2 py-2 font-semibold whitespace-nowrap min-w-[90px]">Segmento</th>
                  <th className="text-center px-2 py-2 font-semibold whitespace-nowrap">Parceiro</th>
                  <th className="text-center px-2 py-2 font-semibold whitespace-nowrap">Canal</th>
                  {!isDescriptionCollapsed && <th className="text-left px-2 py-2 font-semibold whitespace-nowrap min-w-[130px]">Descrição</th>}
                  <th
                    className="text-center px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('baseEntregue')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Entregas
                      {sortKey === 'baseEntregue' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className={`text-center px-2 py-2 ${HIGHLIGHT_COLS_HEADER} cursor-pointer select-none group hover:brightness-90 transition-all`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    onClick={() => handleSort('propostas')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Propostas
                      {sortKey === 'propostas' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className={`text-center px-2 py-2 ${HIGHLIGHT_COLS_HEADER} cursor-pointer select-none group hover:brightness-90 transition-all`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    onClick={() => handleSort('taxaProposta')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      % Proposta
                      {sortKey === 'taxaProposta' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className={`text-center px-2 py-2 ${HIGHLIGHT_COLS_HEADER} cursor-pointer select-none group hover:brightness-90 transition-all`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    onClick={() => handleSort('aprovados')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Aprovados
                      {sortKey === 'aprovados' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className={`text-center px-2 py-2 ${HIGHLIGHT_COLS_HEADER} cursor-pointer select-none group hover:brightness-90 transition-all`}
                    style={{ background: HIGHLIGHT_HEADER, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    onClick={() => handleSort('taxaAprovacao')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      % Aprovação
                      {sortKey === 'taxaAprovacao' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className={`text-center px-2 py-2 ${HIGHLIGHT_COLS_HEADER} cursor-pointer select-none group hover:brightness-90 transition-all`}
                    style={{ background: HIGHLIGHT_HEADER, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    onClick={() => handleSort('emissoes')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Emissões
                      {sortKey === 'emissoes' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className="text-center px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('taxaFinalizacao')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      % Final.
                      {sortKey === 'taxaFinalizacao' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className="text-center px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('custoPorCartao')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      C./Cartão
                      {sortKey === 'custoPorCartao' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className="text-center px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('custoTotal')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Custo Total
                      {sortKey === 'custoTotal' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                  <th
                    className="text-center px-2 py-2 font-semibold whitespace-nowrap cursor-pointer select-none group hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort('taxaConversaoBase')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      % Conv
                      {sortKey === 'taxaConversaoBase' ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-0 group-hover:opacity-40" />}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => {
                  const color = segmentColorMap.get(row.segmento);
                  const isBanded = idx % 2 !== 0;
                  return (
                    <tr
                      key={`${row.date.toISOString()}-${row.activityName}`}
                      className={`border-t border-slate-100 hover:bg-slate-50 transition-all cursor-pointer ${isBanded ? 'bg-slate-50/40' : 'bg-white'}`}
                      onClick={() => {
                        const act = allActivities.find((a: Activity) => a.id === row.activityName);
                        if (act) setSelectedActivityRow(toActivityRow(act));
                      }}
                      title="Clique para ver detalhes do disparo"
                    >
                      <td className={`px-2 py-1.5 font-semibold whitespace-nowrap tabular-nums text-xs ${detailLeadCellClass(color, isBanded)} ${color?.border ?? ''}`}>
                        {format(row.date, 'dd/MM')}
                      </td>
                      <td className={`px-2 py-1.5 ${detailLeadCellClass(color, isBanded)}`} style={{ minWidth: 140, maxWidth: 180 }}>
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
                      <td className={`px-2 py-1.5 text-center ${detailLeadCellClass(color, isBanded)}`}>
                        {row.segmento ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              applyGlobalSegmentFilter(row.segmento);
                            }}
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${color?.bg ?? 'bg-slate-100'} ${color?.text ?? 'text-slate-600'} border ${color?.border ? 'border-current' : 'border-slate-200'}`}
                            title="Aplicar este segmento no filtro global"
                          >
                            {row.segmento}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      {/* Parceiro */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center bg-white">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${PARCEIRO_COLORS[row.parceiro] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {row.parceiro}
                        </span>
                      </td>
                      {/* Canal */}
                      <td className="px-2 py-1.5 whitespace-nowrap text-center bg-white">
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
                      </td>
                      {/* Descrição */}
                      {!isDescriptionCollapsed && <td className="px-2 py-1.5 bg-white" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start gap-1.5">
                          <textarea
                            className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400 min-w-[120px]"
                            rows={2}
                            placeholder="Adicionar descrição..."
                            value={editingDescs[row.activityName] ?? ''}
                            onChange={e => setEditingDescs(prev => ({ ...prev, [row.activityName]: e.target.value }))}
                          />
                          {(editingDescs[row.activityName] ?? '') !== (descriptions[row.activityName] ?? '') && (
                            <button
                              onClick={() => saveDescription(row.activityName)}
                              disabled={savingDesc.has(row.activityName)}
                              className="flex-shrink-0 p-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50"
                              title="Salvar descrição"
                            >
                              <Save size={13} />
                            </button>
                          )}
                        </div>
                      </td>}
                      {/* Entregas */}
                      <td className="text-center px-2 py-1.5">
                        {row.aguardando
                          ? <span className="text-[11px] font-medium text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Aguardando</span>
                          : <span className="text-slate-600 text-xs tabular-nums">{fmtN(row.baseEntregue)}</span>
                        }
                      </td>
                      <td
                        className={`text-center px-2 py-1.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.propostas)}</td>
                      <td
                        className="text-center px-2 py-1.5 text-slate-700"
                        style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtPct(row.taxaProposta)}</td>
                      <td
                        className={`text-center px-2 py-1.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.aprovados)}</td>
                      <td
                        className="text-center px-2 py-1.5 text-slate-700"
                        style={{ background: HIGHLIGHT_BG, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtPct(row.taxaAprovacao)}</td>
                      <td
                        className={`text-center px-2 py-1.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: HIGHLIGHT_BG, borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                      >{fmtN(row.emissoes)}</td>
                      <td className="text-center px-2 py-1.5 text-slate-600 text-xs tabular-nums">{fmtPct(row.taxaFinalizacao)}</td>
                      <td className="text-center px-2 py-1.5 text-slate-600 text-xs tabular-nums">{fmtBRL(row.custoPorCartao)}</td>
                      <td className="text-center px-2 py-1.5 text-slate-600 text-xs tabular-nums">{fmtBRL(row.custoTotal)}</td>
                      <td className="text-center px-2 py-1.5 text-slate-600 text-xs tabular-nums">{fmtPct4(row.taxaConversaoBase)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {displayRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#1E293B' }} className="text-white text-xs font-bold">
                    <td colSpan={isDescriptionCollapsed ? 5 : 6} className="px-2 py-2 font-bold whitespace-nowrap">
                      Totais · {displayRows.length} disparo{displayRows.length !== 1 ? 's' : ''}
                      {destaqueFilter && <span className="ml-1.5 text-amber-300 font-normal">(filtrado)</span>}
                    </td>
                    <td className="text-center px-2 py-2 tabular-nums">{fmtN(summaryRow.totalEntregas)}</td>
                    <td
                      className="text-center px-2 py-2 tabular-nums font-bold"
                      style={{ background: HIGHLIGHT_TOTAL, color: '#0f172a', borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(summaryRow.totalPropostas)}</td>
                    <td
                      className="text-center px-2 py-2 tabular-nums"
                      style={{ background: HIGHLIGHT_TOTAL, color: '#0f172a', borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtPct(summaryRow.taxaProposta)}</td>
                    <td
                      className="text-center px-2 py-2 tabular-nums font-bold"
                      style={{ background: HIGHLIGHT_TOTAL, color: '#0f172a', borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `1px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(summaryRow.totalAprovados)}</td>
                    <td
                      className="text-center px-2 py-2 tabular-nums"
                      style={{ background: HIGHLIGHT_TOTAL, color: '#0f172a', borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtPct(summaryRow.taxaAprovacao)}</td>
                    <td
                      className="text-center px-2 py-2 tabular-nums font-bold"
                      style={{ background: HIGHLIGHT_TOTAL, color: '#0f172a', borderLeft: `2px solid ${HIGHLIGHT_BORDER}`, borderRight: `2px solid ${HIGHLIGHT_BORDER}` }}
                    >{fmtN(summaryRow.totalEmissoes)}</td>
                    <td className="text-center px-2 py-2 tabular-nums">{fmtPct(summaryRow.taxaFinalizacao)}</td>
                    <td className="text-center px-2 py-2 tabular-nums">{fmtBRL(summaryRow.avgCustoCartao)}</td>
                    <td className="text-center px-2 py-2 tabular-nums">{fmtBRL(summaryRow.totalCusto)}</td>
                    <td className="text-center px-2 py-2 tabular-nums">{fmtPct4(summaryRow.taxaConversaoBase)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>}
      </section>

    </div>
    </>
  );
};
