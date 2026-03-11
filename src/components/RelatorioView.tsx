import React, { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { CalendarData, Activity } from '../types/framework';

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
const LIME_BORDER = '#8FD400';
const LIME_BG = '#F5FFD0';
const LIME_HEADER = '#CCFF33';

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

export const RelatorioView: React.FC<RelatorioViewProps> = ({ data, selectedBU }) => {
  const allActivities = useMemo(() => Object.values(data).flat(), [data]);

  const segmentoRows = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    allActivities.forEach(a => {
      const key = a.segmento || 'Sem Segmento';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    const rows: AggregatedRow[] = [];
    groups.forEach((acts, label) => rows.push(computeRow(acts, label)));
    return rows.sort((a, b) => b.emissoes - a.emissoes);
  }, [allActivities]);

  const segmentoTotal = useMemo(() => computeRow(allActivities, 'Total Geral'), [allActivities]);

  const canalRows = useMemo(() => {
    const groups = new Map<string, Activity[]>();
    allActivities.forEach(a => {
      const key = a.canal || 'Sem Canal';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    });
    const rows: AggregatedRow[] = [];
    groups.forEach((acts, label) => rows.push(computeRow(acts, label)));
    return rows.sort((a, b) => b.emissoes - a.emissoes);
  }, [allActivities]);

  const canalTotal = useMemo(() => computeRow(allActivities, 'Total Geral'), [allActivities]);
  const totalCanalEmissoes = canalTotal.emissoes;

  // d-3 cutoff: dates from today minus 3 days may still be consolidating
  const d3Cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3);
    return d;
  }, []);

  const detailRows = useMemo((): DetailRow[] => {
    return allActivities
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
  }, [allActivities, d3Cutoff]);

  const segmentColorMap = useMemo(() => {
    const map = new Map<string, (typeof SEGMENT_PALETTE)[0]>();
    segmentoRows.forEach((row, idx) => {
      map.set(row.label, SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length]);
    });
    return map;
  }, [segmentoRows]);

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

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Propostas</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Proposta</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Aprovados</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Aprovação</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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
                      className={`border-t border-slate-100 hover:brightness-95 transition-all ${color?.bg ?? (isBanded ? 'bg-slate-50' : 'bg-white')}`}
                    >
                      <td className={`px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap ${color?.border ?? ''}`}>
                        {row.label}
                      </td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEnviada)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEntregue)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaEntrega)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                      >{fmtN(row.propostas)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                      >{fmtPct(row.taxaProposta)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                      >{fmtN(row.aprovados)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                      >{fmtPct(row.taxaAprovacao)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >{fmtN(segmentoTotal.propostas)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderRight: `2px solid ${LIME_BORDER}` }}
                  >{fmtPct(segmentoTotal.taxaProposta)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >{fmtN(segmentoTotal.aprovados)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderRight: `2px solid ${LIME_BORDER}` }}
                  >{fmtPct(segmentoTotal.taxaAprovacao)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Propostas</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Proposta</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Aprovados</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Aprovação</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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
                    className={`border-t border-slate-100 hover:bg-cyan-50 transition-all ${idx % 2 !== 0 ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{row.label}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEnviada)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtN(row.baseEntregue)}</td>
                    <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaEntrega)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                    >{fmtN(row.propostas)}</td>
                    <td
                      className="text-right px-3 py-2.5 text-slate-700"
                      style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                    >{fmtPct(row.taxaProposta)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                    >{fmtN(row.aprovados)}</td>
                    <td
                      className="text-right px-3 py-2.5 text-slate-700"
                      style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                    >{fmtPct(row.taxaAprovacao)}</td>
                    <td
                      className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                      style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >{fmtN(canalTotal.propostas)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderRight: `2px solid ${LIME_BORDER}` }}
                  >{fmtPct(canalTotal.taxaProposta)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >{fmtN(canalTotal.aprovados)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderRight: `2px solid ${LIME_BORDER}` }}
                  >{fmtPct(canalTotal.taxaAprovacao)}</td>
                  <td
                    className="text-right px-3 py-2.5 font-bold text-slate-900"
                    style={{ background: '#F0F970', borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
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
            <div className="w-1 h-6 rounded-full" style={{ background: TEAL }} />
            <h2 className="text-base font-bold text-slate-800">Detalhamento por disparo</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{detailRows.length} disparos</span>
          </div>
          <button
            onClick={exportDetail}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
          >
            <FileSpreadsheet size={14} />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: '#1E293B' }} className="text-white">
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap w-20">Data</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap min-w-[260px]">Campanha (Jornada · Activity Name)</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap min-w-[120px]">Segmento</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Envios</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Entregas</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Entrega</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Propostas</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Proposta</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                  >Aprovados</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderRight: `2px solid ${LIME_BORDER}` }}
                  >% Aprovação</th>
                  <th
                    className={`text-right px-3 py-3 ${HIGHLIGHT_COLS_HEADER}`}
                    style={{ background: LIME_HEADER, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
                  >Emissões</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Finalização</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo / Cartão</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Custo Total</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">% Conv da Base</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, idx) => {
                  const color = segmentColorMap.get(row.segmento);
                  const isBanded = idx % 2 !== 0;
                  const campanhaLabel = row.jornada
                    ? `${row.jornada} · ${row.activityName}`
                    : row.activityName;
                  return (
                    <tr
                      key={`${row.date.toISOString()}-${row.activityName}`}
                      className={`border-t border-slate-100 hover:brightness-95 transition-all ${color?.bg ?? (isBanded ? 'bg-slate-50' : 'bg-white')}`}
                    >
                      <td className={`px-4 py-2.5 font-medium text-slate-500 whitespace-nowrap tabular-nums text-xs ${color?.border ?? ''}`}>
                        {format(row.date, 'dd/MM')}
                      </td>
                      <td className="px-4 py-2.5 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800 text-xs leading-tight truncate max-w-xs" title={row.activityName}>
                            {row.activityName}
                          </span>
                          {row.jornada && (
                            <span className={`text-[11px] font-medium ${color?.text ?? 'text-slate-500'}`}>
                              {row.jornada}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {row.segmento ? (
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${color?.bg ?? 'bg-slate-100'} ${color?.text ?? 'text-slate-600'} border ${color?.border ? 'border-current' : 'border-slate-200'}`}>
                            {row.segmento}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      {/* Envios */}
                      <td className="text-right px-4 py-2.5">
                        {row.aguardando
                          ? <span className="text-xs font-medium text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Aguardando</span>
                          : <span className="text-slate-600">{fmtN(row.baseEnviada)}</span>
                        }
                      </td>
                      {/* Entregas */}
                      <td className="text-right px-4 py-2.5">
                        {row.aguardando
                          ? <span className="text-xs font-medium text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Aguardando</span>
                          : <span className="text-slate-600">{fmtN(row.baseEntregue)}</span>
                        }
                      </td>
                      {/* % Entrega */}
                      <td className="text-right px-4 py-2.5">
                        {row.aguardando
                          ? <span className="text-xs font-medium text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Aguardando</span>
                          : <span className="text-slate-600">{fmtPct(row.taxaEntrega)}</span>
                        }
                      </td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                      >{fmtN(row.propostas)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                      >{fmtPct(row.taxaProposta)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `1px solid ${LIME_BORDER}` }}
                      >{fmtN(row.aprovados)}</td>
                      <td
                        className="text-right px-3 py-2.5 text-slate-700"
                        style={{ background: LIME_BG, borderRight: `2px solid ${LIME_BORDER}` }}
                      >{fmtPct(row.taxaAprovacao)}</td>
                      <td
                        className={`text-right px-3 py-2.5 ${HIGHLIGHT_CELL}`}
                        style={{ background: LIME_BG, borderLeft: `2px solid ${LIME_BORDER}`, borderRight: `2px solid ${LIME_BORDER}` }}
                      >{fmtN(row.emissoes)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct(row.taxaFinalizacao)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoPorCartao)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtBRL(row.custoTotal)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-600">{fmtPct4(row.taxaConversaoBase)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};
