import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { PaidMediaFunnelView } from './PaidMediaFunnelView';
import { AppAfinzFunnelView } from './AppAfinzFunnelView';

type Granularity = 'daily' | 'weekly' | 'monthly';
type StageKey = 'consultas' | 'aprovados' | 'pedidos' | 'bio' | 'docs' | 'assinatura' | 'emitidos';
type RateKey = 'taxaAprovacao' | 'taxaConfirmacao' | 'taxaFinalizacao' | 'coberturaBio' | 'coberturaDocs' | 'coberturaAssinatura';
type SortKey = 'date' | StageKey | 'finalization';
type SortDirection = 'asc' | 'desc';
type Row = { date: Date; consultas: number; aprovados: number; pedidos: number; bio: number | null; docs: number; assinatura: number | null; emitidos: number };
type Totals = Record<StageKey, number> & { bioNulls: number };
type HoverDetail = { row: Row; metric: SortKey; x: number; y: number };

const stageConfig: Array<{ key: StageKey; label: string; color: string; status: string }> = [
  { key: 'consultas', label: 'Consultas', color: '#0f2d64', status: 'confirmado' },
  { key: 'aprovados', label: 'Aprovados', color: '#2563eb', status: 'conversão' },
  { key: 'pedidos', label: 'Pedidos', color: '#7c3aed', status: 'conversão' },
  { key: 'bio', label: 'Foto biometria', color: '#f59e0b', status: 'cobertura parcial' },
  { key: 'docs', label: 'Documentos', color: '#ea580c', status: 'cobertura' },
  { key: 'assinatura', label: 'Assinaturas', color: '#db2777', status: 'cobertura' },
  { key: 'emitidos', label: 'Emitidos', color: '#0d9488', status: 'resultado' },
];

const rateConfig: Array<{ key: RateKey; label: string; shortLabel: string; color: string; group: 'Conversão' | 'Cobertura'; formula: string; calculate: (t: Totals) => number | null }> = [
  { key: 'taxaAprovacao', label: 'Aprovação', shortLabel: 'Aprovados ÷ Consultas', color: '#dc2626', group: 'Conversão', formula: 'Aprovados ÷ Consultas', calculate: t => percentage(t.aprovados, t.consultas) },
  { key: 'taxaConfirmacao', label: 'Confirmação da proposta', shortLabel: 'Pedidos ÷ Aprovados', color: '#9333ea', group: 'Conversão', formula: 'Pedidos ÷ Aprovados', calculate: t => percentage(t.pedidos, t.aprovados) },
  { key: 'taxaFinalizacao', label: 'Finalização da proposta', shortLabel: 'Emitidos ÷ Pedidos', color: '#059669', group: 'Conversão', formula: 'Emitidos ÷ Pedidos', calculate: t => percentage(t.emitidos, t.pedidos) },
  { key: 'coberturaBio', label: 'Cobertura de biometria', shortLabel: 'Biometria ÷ Pedidos', color: '#d97706', group: 'Cobertura', formula: 'Biometria ÷ Pedidos', calculate: t => percentage(t.bio, t.pedidos) },
  { key: 'coberturaDocs', label: 'Cobertura de documentos', shortLabel: 'Documentos ÷ Pedidos', color: '#0284c7', group: 'Cobertura', formula: 'Documentos ÷ Pedidos', calculate: t => percentage(t.docs, t.pedidos) },
  { key: 'coberturaAssinatura', label: 'Cobertura de assinatura', shortLabel: 'Assinaturas ÷ Pedidos', color: '#c026d3', group: 'Cobertura', formula: 'Assinaturas ÷ Pedidos', calculate: t => percentage(t.assinatura, t.pedidos) },
];

const empty: Totals = { consultas: 0, aprovados: 0, pedidos: 0, bio: 0, docs: 0, assinatura: 0, emitidos: 0, bioNulls: 0 };
const parseNumber = (v = '') => v.trim() === '' ? null : Number(v.replaceAll('.', '').replace(',', '.'));
const formatNumber = (v: number) => v.toLocaleString('pt-BR');
const percentage = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const percentageLabel = (v: number | null, digits = 1) => v == null ? '—' : `${v.toFixed(digits).replace('.', ',')}%`;
const parseDate = (v: string) => { const [d, m, y] = v.split('/').map(Number); return new Date(y, m - 1, d, 12); };
const shortDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const shortWeekday = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();
const fullWeekday = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long' });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const delta = (current: number | null, previous: number | null) => current == null || previous == null || previous === 0 ? null : (current - previous) / previous * 100;

function parseCsv(text: string): Row[] {
  return text.split(/\r?\n/).slice(1).map(line => line.split(';'))
    .filter(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c[0] || ''))
    .map(c => ({ date: parseDate(c[0]), consultas: parseNumber(c[1]) ?? 0, aprovados: parseNumber(c[2]) ?? 0, pedidos: parseNumber(c[3]) ?? 0, bio: parseNumber(c[4]), docs: parseNumber(c[5]) ?? 0, assinatura: parseNumber(c[6]), emitidos: parseNumber(c[7]) ?? 0 }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function sum(rows: Row[]): Totals {
  return rows.reduce((a, r) => ({ consultas: a.consultas + r.consultas, aprovados: a.aprovados + r.aprovados, pedidos: a.pedidos + r.pedidos, bio: a.bio + (r.bio ?? 0), docs: a.docs + r.docs, assinatura: a.assinatura + (r.assinatura ?? 0), emitidos: a.emitidos + r.emitidos, bioNulls: a.bioNulls + (r.bio == null ? 1 : 0) }), { ...empty });
}

function periodKey(date: Date, granularity: Granularity) {
  if (granularity === 'daily') return iso(date);
  if (granularity === 'monthly') return iso(date).slice(0, 7);
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(monday);
}

function metricValue(row: Row, metric: SortKey): number | null {
  if (metric === 'date') return row.date.getTime();
  if (metric === 'finalization') return percentage(row.emitidos, row.pedidos);
  return row[metric];
}

function metricMeta(metric: SortKey) {
  if (metric === 'date') return { label: 'Finalização da proposta', formula: 'Emitidos ÷ Pedidos', percentage: true };
  if (metric === 'finalization') return { label: 'Finalização da proposta', formula: 'Emitidos ÷ Pedidos', percentage: true };
  return { label: stageConfig.find(stage => stage.key === metric)?.label ?? metric, formula: 'Volume diário', percentage: false };
}

const EvolutionCell = ({ value, previous, onEnter, onLeave }: { value: number | null; previous: number | null; onEnter: (event: React.MouseEvent<HTMLDivElement>) => void; onLeave: () => void }) => {
  const change = delta(value, previous);
  const strong = change != null && Math.abs(change) >= 20;
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  return <div onMouseEnter={onEnter} onMouseLeave={onLeave} className={`min-w-[82px] rounded-md px-2 py-1.5 text-right ${strong ? up ? 'bg-emerald-100' : 'bg-red-100' : value == null ? 'bg-amber-50' : ''}`}>
    <div className="font-mono text-[11px] font-semibold text-slate-900">{value == null ? '—' : formatNumber(value)}</div>
    <div className={`mt-0.5 flex items-center justify-end gap-0.5 text-[9px] font-semibold ${up ? 'text-emerald-700' : down ? 'text-red-700' : 'text-slate-400'}`}>
      {up ? <ArrowUp size={10} /> : down ? <ArrowDown size={10} /> : <ArrowRight size={10} />}
      {change == null ? 'sem base' : `${Math.abs(change).toFixed(1).replace('.', ',')}% D-1`}
    </div>
  </div>;
};

const SerasaFunnelView: React.FC = () => {
  const { startDate, endDate } = usePeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selectedStages, setSelectedStages] = useState<StageKey[]>(['consultas', 'aprovados', 'pedidos', 'emitidos']);
  const [selectedRates, setSelectedRates] = useState<RateKey[]>(['taxaAprovacao', 'taxaConfirmacao', 'taxaFinalizacao']);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeMetric, setActiveMetric] = useState<SortKey>('finalization');
  const [hoverDetail, setHoverDetail] = useState<HoverDetail | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/serasa-funnel-daily.csv`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error('Fonte Serasa indisponível')))
      .then(t => setRows(parseCsv(t))).catch(e => setError(e.message));
  }, []);

  const lastDate = rows.at(-1)?.date;
  const periodStart = useMemo(() => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()), [startDate]);
  const periodEnd = useMemo(() => new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999), [endDate]);
  const current = useMemo(() => rows.filter(row => row.date >= periodStart && row.date <= periodEnd), [rows, periodStart, periodEnd]);
  const total = useMemo(() => sum(current), [current]);
  const previousPeriod = useMemo(() => {
    const duration = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1);
    const previousEnd = new Date(periodStart); previousEnd.setDate(previousEnd.getDate() - 1); previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(previousEnd); previousStart.setDate(previousStart.getDate() - duration + 1); previousStart.setHours(0, 0, 0, 0);
    return rows.filter(row => row.date >= previousStart && row.date <= previousEnd);
  }, [rows, periodStart, periodEnd]);
  const previousTotal = useMemo(() => sum(previousPeriod), [previousPeriod]);
  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;

  const chartData = useMemo(() => {
    const groups = new Map<string, Row[]>();
    current.forEach(row => { const key = periodKey(row.date, granularity); groups.set(key, [...(groups.get(key) ?? []), row]); });
    const limit = granularity === 'daily' ? 31 : granularity === 'weekly' ? 12 : 7;
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-limit).map(([key, values]) => {
      const totals = sum(values), start = values[0].date, end = values.at(-1)?.date ?? start;
      const label = granularity === 'daily' ? shortDate(start) : granularity === 'weekly' ? `${shortDate(start)}–${shortDate(end)}` : start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { key, period: label, weekday: shortWeekday(start), ...totals, ...Object.fromEntries(rateConfig.map(rate => [rate.key, rate.calculate(totals)])) };
    });
  }, [current, granularity]);

  const sortedCurrent = useMemo(() => [...current].sort((a, b) => {
    const aValue = metricValue(a, sortKey), bValue = metricValue(b, sortKey);
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  }), [current, sortKey, sortDirection]);

  const stageCards = useMemo(() => [
    { key: 'consultas' as StageKey, label: 'Consultas', value: total.consultas, rate: null, previousRate: null, status: 'confirmado' },
    { key: 'aprovados' as StageKey, label: 'Aprovados', value: total.aprovados, rate: percentage(total.aprovados, total.consultas), previousRate: percentage(previousTotal.aprovados, previousTotal.consultas), status: 'conversão' },
    { key: 'pedidos' as StageKey, label: 'Pedidos', value: total.pedidos, rate: percentage(total.pedidos, total.aprovados), previousRate: percentage(previousTotal.pedidos, previousTotal.aprovados), status: 'conversão' },
    { key: 'bio' as StageKey, label: 'Foto biometria', value: total.bio, rate: percentage(total.bio, total.pedidos), previousRate: percentage(previousTotal.bio, previousTotal.pedidos), status: 'cobertura parcial' },
    { key: 'docs' as StageKey, label: 'Documentos', value: total.docs, rate: percentage(total.docs, total.pedidos), previousRate: percentage(previousTotal.docs, previousTotal.pedidos), status: 'cobertura' },
    { key: 'assinatura' as StageKey, label: 'Assinaturas', value: total.assinatura, rate: percentage(total.assinatura, total.pedidos), previousRate: percentage(previousTotal.assinatura, previousTotal.pedidos), status: 'cobertura' },
    { key: 'emitidos' as StageKey, label: 'Emitidos', value: total.emitidos, rate: percentage(total.emitidos, total.pedidos), previousRate: percentage(previousTotal.emitidos, previousTotal.pedidos), status: 'resultado' },
  ], [total, previousTotal]);

  const certifiedRates = stageCards.filter(card => ['aprovados', 'pedidos', 'emitidos'].includes(card.key));
  const largestLoss = [...certifiedRates].sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))[0];
  const bestEvolution = [...stageCards].filter(card => card.rate != null && card.previousRate != null).map(card => ({ ...card, change: (card.rate ?? 0) - (card.previousRate ?? 0) })).sort((a, b) => b.change - a.change)[0];

  const toggleStage = (key: StageKey) => setSelectedStages(currentStages => currentStages.includes(key) ? currentStages.filter(item => item !== key) : [...currentStages, key]);
  const toggleRate = (key: RateKey) => setSelectedRates(currentRates => currentRates.includes(key) ? currentRates.filter(item => item !== key) : currentRates.length >= 4 ? [...currentRates.slice(1), key] : [...currentRates, key]);
  const changeSort = (key: SortKey) => {
    setActiveMetric(key === 'date' ? activeMetric : key);
    if (sortKey === key) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection(key === 'date' ? 'asc' : 'desc'); }
  };
  const showHover = (event: React.MouseEvent<HTMLElement>, row: Row, metric: SortKey) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHoverDetail({ row, metric: metric === 'date' ? activeMetric : metric, x: Math.min(window.innerWidth - 286, Math.max(12, box.left)), y: Math.min(window.innerHeight - 190, box.bottom + 6) });
  };

  const hoverSeries = useMemo(() => {
    if (!hoverDetail) return [];
    const index = rows.findIndex(row => iso(row.date) === iso(hoverDetail.row.date));
    return rows.slice(Math.max(0, index - 14), index + 1).map(row => ({ date: shortDate(row.date), value: metricValue(row, hoverDetail.metric) }));
  }, [hoverDetail, rows]);
  const hoverValues = hoverSeries.map(item => item.value).filter((value): value is number => value != null);
  const hoverAverage = hoverValues.length ? hoverValues.reduce((acc, value) => acc + value, 0) / hoverValues.length : null;
  const hoverMeta = hoverDetail ? metricMeta(hoverDetail.metric) : null;

  const exportCsv = () => {
    const csv = ['Data;Consultas;Aprovados;Pedidos;Foto biometria;Documentos;Assinaturas;Emitidos', ...current.map(r => [shortDate(r.date), r.consultas, r.aprovados, r.pedidos, r.bio ?? '', r.docs, r.assinatura ?? '', r.emitidos].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `funil-serasa-${iso(periodStart)}-${iso(periodEnd)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }: { column: SortKey }) => sortKey !== column ? <ArrowUpDown size={11} className="text-slate-400" /> : sortDirection === 'asc' ? <ChevronUp size={12} className="text-cyan-700" /> : <ChevronDown size={12} className="text-cyan-700" />;

  return <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
    <div className="mx-auto flex max-w-[1780px] flex-col gap-4">
      <header className="flex justify-end">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados até {lastDate ? lastDate.toLocaleDateString('pt-BR') : '—'}</div>
      </header>
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><Info size={15} /><span><strong className="font-semibold">Escopo:</strong> somente Serasa. APP e total conciliado ficam fora até a série diária ser certificada.</span></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={16} /> {periodLabel}</p></div>
      </section>

      <section className="order-2 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Combine volumes e taxas no mesmo período de análise.</p></div>
          <div className="inline-flex border border-slate-300 bg-white text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(g => <button key={g} onClick={() => setGranularity(g)} className={`border-r border-slate-300 px-3 py-1.5 last:border-r-0 ${granularity === g ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{g === 'daily' ? 'Diária' : g === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center border-y border-slate-200 bg-slate-50/60 text-[10px]">
          <span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide text-slate-500">Volumes</span>
          {stageConfig.map(stage => <button key={stage.key} onClick={() => toggleStage(stage.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selectedStages.includes(stage.key) ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white'}`}><span className="h-2 w-2" style={{ backgroundColor: selectedStages.includes(stage.key) ? stage.color : '#cbd5e1' }} />{stage.label}</button>)}
          <button onClick={() => setSelectedStages(stageConfig.map(stage => stage.key))} className="px-2.5 py-2 font-semibold text-cyan-700">Todos</button><button onClick={() => setSelectedStages([])} className="border-l border-slate-200 px-2.5 py-2 font-semibold text-slate-500">Limpar</button>
        </div>
        <div className="flex flex-wrap items-center border-b border-slate-200 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide text-slate-500">Taxas</span>{rateConfig.map(rate => <button key={rate.key} title={rate.formula} onClick={() => toggleRate(rate.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selectedRates.includes(rate.key) ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}><span className="h-2 w-2" style={{ backgroundColor: selectedRates.includes(rate.key) ? rate.color : '#cbd5e1' }} />{rate.label}</button>)}<span className="px-2 py-2 text-slate-400">máx. 4</span></div>
        <div className="mt-3 h-[380px]">
          {selectedStages.length === 0 && selectedRates.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-slate-400">Selecione ao menos uma métrica para visualizar.</div> :
          <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 42, left: 8, bottom: granularity === 'daily' ? 20 : 4 }} barGap={2} barCategoryGap="22%"><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" height={granularity === 'daily' ? 42 : 30} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={granularity === 'daily' ? ({ x, y, payload }: any) => { const point = chartData.find(item => item.period === payload.value); return <g transform={`translate(${x},${y})`}><text y={12} textAnchor="middle" fill="#334155" fontSize={10} fontFamily="ui-monospace, monospace" fontWeight={600}>{payload.value}</text><text y={26} textAnchor="middle" fill="#94a3b8" fontSize={9}>{point?.weekday}</text></g>; } : { fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} /><YAxis yAxisId="volume" hide={selectedStages.length === 0} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} /><YAxis yAxisId="rate" orientation="right" domain={[0, 'auto']} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => `${value}%`} /><Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'ui-monospace, monospace' }} labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }} formatter={(value: number, name: string) => { const rate = rateConfig.find(item => item.key === name); return [rate ? percentageLabel(value, 2) : formatNumber(value), rate ? `${rate.label} · ${rate.formula}` : stageConfig.find(stage => stage.key === name)?.label ?? name]; }} />{stageConfig.filter(stage => selectedStages.includes(stage.key)).map(stage => <Bar key={stage.key} yAxisId="volume" dataKey={stage.key} name={stage.key} fill={stage.color} maxBarSize={granularity === 'daily' ? 18 : 38} isAnimationActive={false} />)}{rateConfig.filter(rate => selectedRates.includes(rate.key)).map(rate => <Line key={rate.key} yAxisId="rate" type="linear" dataKey={rate.key} name={rate.key} stroke={rate.color} strokeWidth={3} connectNulls={false} dot={{ r: 3.5, fill: '#fff', strokeWidth: 2.5 }} activeDot={{ r: 5.5 }} isAnimationActive={false} />)}</ComposedChart></ResponsiveContainer>}
        </div>
        <p className="text-[10px] text-slate-500">Barras/eixo esquerdo: volumes absolutos · linhas/eixo direito: taxas selecionadas.</p>
      </section>

      <section className="order-1 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2><p className="mb-3 text-xs text-slate-500">Síntese compacta do período, com comparação contra a janela imediatamente anterior.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{stageCards.map((card, index) => { const rateChange = card.rate != null && card.previousRate != null ? card.rate - card.previousRate : null; const volumeChange = card.key === 'consultas' ? delta(card.value, previousTotal.consultas) : null; const change = rateChange ?? volumeChange; return <div key={card.key} className={`rounded-lg border px-3 py-2.5 ${card.status === 'cobertura parcial' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center justify-between"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold">{index + 1}</span><span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{card.status}</span></div><p className="mt-1.5 text-[11px] font-semibold text-slate-700">{card.label}</p><div className="mt-0.5 flex items-end justify-between gap-2"><p className="font-mono text-lg font-semibold leading-none text-slate-950">{formatNumber(card.value)}</p>{change != null && <span className={`flex items-center text-[9px] font-semibold ${change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-700' : 'text-slate-400'}`}>{change > 0 ? <ArrowUp size={10} /> : change < 0 ? <ArrowDown size={10} /> : <ArrowRight size={10} />}{Math.abs(change).toFixed(1).replace('.', ',')}{rateChange != null ? ' p.p.' : '%'}</span>}</div><p className="mt-1 text-[10px] font-semibold text-cyan-700">{card.rate == null ? 'Volume do período' : percentageLabel(card.rate)}</p></div>; })}</div>
        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-[10px] sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-slate-400">Maior perda</span><p className="font-semibold text-slate-800">{largestLoss?.label ?? '—'} · {percentageLabel(largestLoss?.rate ?? null)}</p></div><div><span className="text-slate-400">Melhor evolução</span><p className="font-semibold text-slate-800">{bestEvolution ? `${bestEvolution.label} · ${bestEvolution.change > 0 ? '+' : ''}${bestEvolution.change.toFixed(1).replace('.', ',')} p.p.` : 'Sem base anterior'}</p></div><div><span className="text-slate-400">Qualidade da fonte</span><p className={`font-semibold ${total.bioNulls ? 'text-amber-800' : 'text-emerald-700'}`}>{total.bioNulls ? `${total.bioNulls} dias sem biometria` : 'Período completo'}</p></div><div><span className="text-slate-400">Último dia fechado</span><p className="font-semibold text-slate-800">{lastDate?.toLocaleDateString('pt-BR') ?? '—'}</p></div></div>
        {total.bioNulls > 0 && <p className="mt-2 flex items-center gap-2 text-[10px] text-amber-800"><AlertTriangle size={13} /> Ausência de biometria é tratada como dado não informado, não como zero.</p>}
      </section>

      <section className="order-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-5"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe diário · {periodLabel}</h2><p className="text-xs text-slate-500">Ordene pelos cabeçalhos. Passe o mouse sobre uma célula para ver os últimos 15 dias da métrica.</p></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div>
        <div className="max-h-[470px] overflow-auto"><table className="w-full min-w-[1120px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr><th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left"><button onClick={() => changeSort('date')} className="flex items-center gap-1 font-semibold">Data <SortIcon column="date" /></button></th>{stageConfig.map(stage => <th key={stage.key} className="px-3 py-2 text-right"><button onClick={() => changeSort(stage.key)} className="ml-auto flex items-center gap-1 font-semibold">{stage.label === 'Foto biometria' ? 'Biometria' : stage.label}<SortIcon column={stage.key} /></button></th>)}<th className="px-3 py-2 text-right"><button onClick={() => changeSort('finalization')} className="ml-auto flex items-center gap-1 font-semibold">Finalização proposta <SortIcon column="finalization" /></button></th></tr></thead><tbody>{sortedCurrent.map((row, rowIndex) => { const globalIndex = rows.findIndex(item => iso(item.date) === iso(row.date)); const previous = globalIndex > 0 ? rows[globalIndex - 1] : null; const currentRate = percentage(row.emitidos, row.pedidos), previousRate = previous ? percentage(previous.emitidos, previous.pedidos) : null; const rateDelta = currentRate != null && previousRate != null ? currentRate - previousRate : null; return <tr key={iso(row.date)} className={`border-t border-slate-100 ${rowIndex % 2 ? 'bg-slate-50/40' : ''}`}><td onMouseEnter={event => showHover(event, row, 'date')} onMouseLeave={() => setHoverDetail(null)} className="sticky left-0 z-[5] whitespace-nowrap bg-white px-3 py-2"><div className="font-mono text-[11px] font-semibold text-slate-800">{shortDate(row.date)}</div><div className="mt-0.5 text-[9px] capitalize text-slate-400">{fullWeekday(row.date)}</div></td>{stageConfig.map(stage => <td key={stage.key} className="px-1.5 py-1"><EvolutionCell value={row[stage.key]} previous={previous?.[stage.key] ?? null} onEnter={event => showHover(event, row, stage.key)} onLeave={() => setHoverDetail(null)} /></td>)}<td onMouseEnter={event => showHover(event, row, 'finalization')} onMouseLeave={() => setHoverDetail(null)} className="px-3 py-2 text-right"><div className="font-mono text-[11px] font-semibold text-slate-900">{percentageLabel(currentRate, 2)}</div><div className={`mt-0.5 flex items-center justify-end gap-0.5 text-[9px] font-semibold ${rateDelta == null ? 'text-slate-400' : rateDelta > 0 ? 'text-emerald-700' : rateDelta < 0 ? 'text-red-700' : 'text-slate-400'}`}>{rateDelta == null ? <ArrowRight size={10} /> : rateDelta > 0 ? <ArrowUp size={10} /> : rateDelta < 0 ? <ArrowDown size={10} /> : <ArrowRight size={10} />}{rateDelta == null ? 'sem base' : `${Math.abs(rateDelta).toFixed(2).replace('.', ',')} p.p.`}</div></td></tr>; })}</tbody></table></div>
      </section>
    </div>

    {hoverDetail && hoverMeta && <div className="fixed z-50 w-[274px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl" style={{ left: hoverDetail.x, top: hoverDetail.y }}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-slate-900">{hoverMeta.label}</p><p className="text-[9px] capitalize text-slate-400">{shortDate(hoverDetail.row.date)} · {fullWeekday(hoverDetail.row.date)}</p></div><p className="font-mono text-sm font-semibold text-slate-950">{hoverMeta.percentage ? percentageLabel(metricValue(hoverDetail.row, hoverDetail.metric), 2) : metricValue(hoverDetail.row, hoverDetail.metric) == null ? '—' : formatNumber(metricValue(hoverDetail.row, hoverDetail.metric) as number)}</p></div><div className="mt-2 h-12"><ResponsiveContainer width="100%" height="100%"><LineChart data={hoverSeries} margin={{ top: 3, right: 3, bottom: 2, left: 3 }}>{hoverAverage != null && <ReferenceLine y={hoverAverage} stroke="#94a3b8" strokeDasharray="3 3" />}<Line type="linear" dataKey="value" stroke="#0891b2" strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer></div><div className="mt-1 flex justify-between font-mono text-[8px] text-slate-400"><span>mín. {hoverValues.length ? hoverMeta.percentage ? percentageLabel(Math.min(...hoverValues), 1) : formatNumber(Math.min(...hoverValues)) : '—'}</span><span>média {hoverAverage == null ? '—' : hoverMeta.percentage ? percentageLabel(hoverAverage, 1) : formatNumber(Math.round(hoverAverage))}</span><span>máx. {hoverValues.length ? hoverMeta.percentage ? percentageLabel(Math.max(...hoverValues), 1) : formatNumber(Math.max(...hoverValues)) : '—'}</span></div><p className="mt-2 border-t border-slate-100 pt-2 text-[9px] text-slate-500">15 dias fechados · {hoverMeta.formula}</p></div>}
  </div>;
};

export const FunilAquisicaoView: React.FC = () => {
  const [funnel, setFunnel] = useState<'serasa' | 'paid-media' | 'app-afinz'>('serasa');
  const options = [
    { key: 'serasa' as const, label: 'Funil Onboarding - Serasa', detail: 'Originação via API' },
    { key: 'paid-media' as const, label: 'Funil Onboarding - Mídia Paga', detail: 'Aquisição App Install' },
    { key: 'app-afinz' as const, label: 'Funil Onboarding - Apps', detail: 'B2C + B2B2C + Plurix' },
  ];
  const activeContext = {
    serasa: {
      eyebrow: 'Análise · Serasa',
      title: 'API Sersasa - Funil de Aquisição',
      description: 'Acompanhamento de performance e evolução das etapas da jornada.',
    },
    'paid-media': {
      eyebrow: 'Análise · Mídia Paga B2C',
      title: 'Funil de Aquisição · App Install',
      description: 'Família de campanhas B2C App Install · atribuição Meta preservada por fase.',
    },
    'app-afinz': {
      eyebrow: 'Análise · App Afinz',
      title: 'Funil do App Afinz',
      description: 'Leitura operacional de B2C + B2B2C e Plurix, sem misturar populações incompatíveis.',
    },
  }[funnel];
  return <div className="min-h-full bg-slate-50">
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="mx-auto max-w-[1780px]">
        <h2 className="text-2xl font-bold text-slate-900">Funis de onboarding</h2>
        <p className="mt-0.5 text-sm text-slate-500">Acompanhe cada origem de aquisição em sua própria jornada, sem misturar fontes incompatíveis.</p>
      </div>
    </div>
    <div className="mx-auto mb-4 max-w-[1780px] px-4 pt-5">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-gradient-to-br from-[#063b3d] via-[#0a5f63] to-[#00838a] px-6 py-5 text-white shadow-sm">
        <div className="min-w-[280px] flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-cyan-100">{activeContext.eyebrow}</p>
          <h1 className="mt-1.5 max-w-[560px] text-xl font-bold leading-tight tracking-tight text-white">{activeContext.title}</h1>
          <p className="mt-1 max-w-[560px] text-sm text-white/75">{activeContext.description}</p>
        </div>
        <nav aria-label="Selecionar funil de onboarding" className="grid min-w-0 flex-[1.6] grid-cols-1 gap-2 md:grid-cols-3">
          {options.map(option => {
            const active = funnel === option.key;
            return <button key={option.key} onClick={() => setFunnel(option.key)} aria-current={active ? 'page' : undefined} className={`relative min-h-[72px] rounded-xl border px-4 py-3 text-left transition-colors ${active ? 'border-cyan-200 bg-white text-slate-900 shadow-lg' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
              <span className="block text-xs font-bold leading-snug">{option.label}</span>
              <span className={`mt-1 block text-[10px] ${active ? 'text-cyan-700' : 'text-white/65'}`}>{option.detail}</span>
              {active && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-cyan-500" />}
            </button>;
          })}
        </nav>
      </div>
    </div>
    {funnel === 'serasa' ? <SerasaFunnelView /> : funnel === 'paid-media' ? <PaidMediaFunnelView /> : <AppAfinzFunnelView />}
  </div>;
};
