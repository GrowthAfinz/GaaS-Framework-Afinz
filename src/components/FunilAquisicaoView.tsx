import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';

type Granularity = 'daily' | 'weekly' | 'monthly';
type MetricMode = 'volume' | 'evolution';
type StageKey = 'consultas' | 'aprovados' | 'pedidos' | 'bio' | 'docs' | 'assinatura' | 'emitidos';
type Row = { date: Date; consultas: number; aprovados: number; pedidos: number; bio: number | null; docs: number; assinatura: number | null; emitidos: number };
type Totals = Record<StageKey, number> & { bioNulls: number };

const stageConfig: Array<{ key: StageKey; label: string; color: string; status: string }> = [
  { key: 'consultas', label: 'Consultas', color: '#0f2d64', status: 'confirmado' },
  { key: 'aprovados', label: 'Aprovados', color: '#2563eb', status: 'taxa operacional' },
  { key: 'pedidos', label: 'Pedidos', color: '#7c3aed', status: 'taxa operacional' },
  { key: 'bio', label: 'Foto biometria', color: '#f59e0b', status: 'cobertura parcial' },
  { key: 'docs', label: 'Documentos', color: '#ea580c', status: 'volume' },
  { key: 'assinatura', label: 'Assinaturas', color: '#db2777', status: 'volume' },
  { key: 'emitidos', label: 'Emitidos', color: '#0d9488', status: 'resultado' },
];
const empty: Totals = { consultas: 0, aprovados: 0, pedidos: 0, bio: 0, docs: 0, assinatura: 0, emitidos: 0, bioNulls: 0 };
const parseNumber = (v = '') => v.trim() === '' ? null : Number(v.replaceAll('.', '').replace(',', '.'));
const formatNumber = (v: number) => v.toLocaleString('pt-BR');
const percentage = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const percentageLabel = (v: number | null, digits = 1) => v == null ? '—' : `${v.toFixed(digits).replace('.', ',')}%`;
const parseDate = (v: string) => { const [d, m, y] = v.split('/').map(Number); return new Date(y, m - 1, d, 12); };
const shortDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
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

const EvolutionCell = ({ value, previous }: { value: number | null; previous: number | null }) => {
  const change = delta(value, previous);
  const strong = change != null && Math.abs(change) >= 20;
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  return <div className={`min-w-[82px] rounded-md px-2 py-1.5 text-right ${strong ? up ? 'bg-emerald-100' : 'bg-red-100' : value == null ? 'bg-amber-50' : ''}`}>
    <div className="font-mono text-[11px] font-semibold text-slate-900">{value == null ? '—' : formatNumber(value)}</div>
    <div className={`mt-0.5 flex items-center justify-end gap-0.5 text-[9px] font-semibold ${up ? 'text-emerald-700' : down ? 'text-red-700' : 'text-slate-400'}`}>
      {up ? <ArrowUp size={10} /> : down ? <ArrowDown size={10} /> : <ArrowRight size={10} />}
      {change == null ? 'sem base' : `${Math.abs(change).toFixed(1).replace('.', ',')}% D-1`}
    </div>
  </div>;
};

export const FunilAquisicaoView: React.FC = () => {
  const { startDate, endDate } = usePeriod();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [metricMode, setMetricMode] = useState<MetricMode>('volume');
  const [selectedStages, setSelectedStages] = useState<StageKey[]>(['consultas', 'aprovados', 'pedidos', 'emitidos']);
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
  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;
  const chartData = useMemo(() => {
    const groups = new Map<string, Row[]>();
    current.forEach(row => { const key = periodKey(row.date, granularity); groups.set(key, [...(groups.get(key) ?? []), row]); });
    const limit = granularity === 'daily' ? 31 : granularity === 'weekly' ? 12 : 7;
    const periods = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-limit).map(([key, values]) => {
      const t = sum(values), start = values[0].date;
      const label = granularity === 'daily' ? shortDate(start) : granularity === 'weekly' ? shortDate(start) : start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      return { key, period: label, ...t, taxaGeral: percentage(t.emitidos, t.consultas) };
    });
    return periods.map((period, index) => {
      const previous = periods[index - 1];
      const evolution = Object.fromEntries(stageConfig.map(stage => [stage.key, previous ? delta(period[stage.key], previous[stage.key]) : null]));
      return metricMode === 'volume' ? period : { ...period, ...evolution };
    });
  }, [current, granularity, metricMode]);

  const stages = [
    ['Consultas', total.consultas, null, 'confirmado'],
    ['Aprovados', total.aprovados, percentage(total.aprovados, total.consultas), 'taxa operacional'],
    ['Pedidos', total.pedidos, percentage(total.pedidos, total.aprovados), 'taxa operacional'],
    ['Foto biometria', total.bio, null, 'cobertura parcial'],
    ['Documentos', total.docs, null, 'volume'],
    ['Assinaturas', total.assinatura, null, 'volume'],
    ['Emitidos', total.emitidos, percentage(total.emitidos, total.consultas), 'resultado'],
  ] as const;
  const toggleStage = (key: StageKey) => setSelectedStages(currentStages => currentStages.includes(key) ? currentStages.filter(item => item !== key) : [...currentStages, key]);
  const exportCsv = () => {
    const csv = ['Data;Consultas;Aprovados;Pedidos;Foto biometria;Documentos;Assinaturas;Emitidos', ...current.map(r => [shortDate(r.date), r.consultas, r.aprovados, r.pedidos, r.bio ?? '', r.docs, r.assinatura ?? '', r.emitidos].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `funil-serasa-${iso(periodStart)}-${iso(periodEnd)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
    <div className="mx-auto max-w-[1780px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Análise · Serasa</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950">API Sersasa - Funil de Aquisição</h1><p className="text-sm text-slate-600">Acompanhamento de performance e evolução das etapas da jornada.</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados até {lastDate ? lastDate.toLocaleDateString('pt-BR') : '—'}</div>
      </header>
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><Info size={15} /><span><strong className="font-semibold">Escopo:</strong> somente Serasa. APP e total conciliado ficam fora até a série diária ser certificada.</span></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={16} /> {periodLabel}</p></div>
        <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(g => <button key={g} onClick={() => setGranularity(g)} className={`rounded-md px-4 py-2 transition ${granularity === g ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{g === 'daily' ? 'Diária' : g === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Selecione as etapas e acompanhe volume ou variação contra o período anterior.</p></div>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs font-semibold">{(['volume', 'evolution'] as MetricMode[]).map(mode => <button key={mode} onClick={() => setMetricMode(mode)} className={`rounded-md px-4 py-2 ${metricMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{mode === 'volume' ? 'Volume' : 'Variação %'}</button>)}</div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {stageConfig.map(stage => <button key={stage.key} onClick={() => toggleStage(stage.key)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${selectedStages.includes(stage.key) ? 'border-slate-300 bg-slate-50 text-slate-800' : 'border-slate-200 text-slate-400'}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedStages.includes(stage.key) ? stage.color : '#cbd5e1' }} />{stage.label}</button>)}
          <button onClick={() => setSelectedStages(stageConfig.map(stage => stage.key))} className="ml-1 text-[11px] font-semibold text-cyan-700">Selecionar todas</button>
          <button onClick={() => setSelectedStages([])} className="text-[11px] font-semibold text-slate-400">Limpar</button>
        </div>
        <div className="mt-3 h-[380px]">
          {selectedStages.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-slate-400">Selecione ao menos uma etapa para visualizar.</div> :
          <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 28, left: 8, bottom: 4 }} barGap={2} barCategoryGap="22%"><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} /><YAxis yAxisId="primary" axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => metricMode === 'evolution' ? `${value}%` : value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} />{metricMode === 'volume' && <YAxis yAxisId="rate" orientation="right" domain={[0, 'auto']} axisLine={{ stroke: '#64748b' }} tickLine={{ stroke: '#64748b' }} tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => `${value}%`} />}<Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 11, fontFamily: 'ui-monospace, monospace' }} labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }} formatter={(value: number, name: string) => [metricMode === 'evolution' || name === 'taxaGeral' ? percentageLabel(value, name === 'taxaGeral' ? 2 : 1) : formatNumber(value), name === 'taxaGeral' ? 'Taxa geral' : stageConfig.find(stage => stage.key === name)?.label ?? name]} />{metricMode === 'evolution' && <ReferenceLine yAxisId="primary" y={0} stroke="#334155" strokeWidth={1.25} />}{stageConfig.filter(stage => selectedStages.includes(stage.key)).map(stage => <Bar key={stage.key} yAxisId="primary" dataKey={stage.key} name={stage.key} fill={stage.color} maxBarSize={granularity === 'daily' ? 18 : 38} />)}{metricMode === 'volume' && <Line yAxisId="rate" type="linear" dataKey="taxaGeral" name="taxaGeral" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 5 }} />}</ComposedChart></ResponsiveContainer>}
        </div>
        <p className="text-[10px] text-slate-500">{metricMode === 'evolution' ? 'Colunas acima/abaixo de zero representam a variação contra o período anterior. Sem base quando o período anterior é zero ou nulo.' : 'Colunas: volumes das etapas selecionadas · linha laranja/eixo direito: taxa geral de emitidos sobre consultas.'}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2><p className="mb-4 text-xs text-slate-500">Síntese do período. Taxas apenas onde há compatibilidade operacional.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{stages.map(([label, value, conversion, status], i) => <div key={label} className={`rounded-xl border p-3 ${status === 'cobertura parcial' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold">{i + 1}</span><p className="min-h-8 text-[11px] font-semibold text-slate-700">{label}</p><p className="font-mono text-xl font-semibold text-slate-950">{formatNumber(value)}</p><p className="mt-1 text-[11px] font-semibold text-cyan-700">{conversion == null ? 'Volume do período' : percentageLabel(conversion)}</p><p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">{status}</p></div>)}</div>
        {total.bioNulls > 0 && <p className="mt-3 flex items-center gap-2 text-xs text-amber-800"><AlertTriangle size={14} /> Foto biométrica possui {total.bioNulls} dias sem valor neste período.</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-5"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe diário · {periodLabel}</h2><p className="text-xs text-slate-500">Volume e evolução contra o dia anterior. Destaques fortes indicam variação igual ou superior a 20%.</p></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div>
        <div className="max-h-[470px] overflow-auto"><table className="w-full min-w-[1120px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-600"><tr>{['Data','Consultas','Aprovados','Pedidos','Biometria','Documentos','Assinaturas','Emitidos','Taxa geral'].map(h => <th key={h} className="px-3 py-2.5 text-right font-semibold first:text-left">{h}</th>)}</tr></thead><tbody>{current.map((row, rowIndex) => {
          const globalIndex = rows.findIndex(item => iso(item.date) === iso(row.date));
          const previous = globalIndex > 0 ? rows[globalIndex - 1] : null;
          const currentRate = percentage(row.emitidos, row.consultas), previousRate = previous ? percentage(previous.emitidos, previous.consultas) : null;
          const rateDelta = currentRate != null && previousRate != null ? currentRate - previousRate : null;
          return <tr key={iso(row.date)} className={`border-t border-slate-100 ${rowIndex % 2 ? 'bg-slate-50/40' : ''}`}><td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-semibold text-slate-800">{shortDate(row.date)}</td>{stageConfig.map(stage => <td key={stage.key} className="px-1.5 py-1"><EvolutionCell value={row[stage.key]} previous={previous?.[stage.key] ?? null} /></td>)}<td className="px-3 py-2 text-right"><div className="font-mono text-[11px] font-semibold text-slate-900">{percentageLabel(currentRate, 2)}</div><div className={`mt-0.5 flex items-center justify-end gap-0.5 text-[9px] font-semibold ${rateDelta == null ? 'text-slate-400' : rateDelta > 0 ? 'text-emerald-700' : rateDelta < 0 ? 'text-red-700' : 'text-slate-400'}`}>{rateDelta == null ? <ArrowRight size={10} /> : rateDelta > 0 ? <ArrowUp size={10} /> : rateDelta < 0 ? <ArrowDown size={10} /> : <ArrowRight size={10} />}{rateDelta == null ? 'sem base' : `${Math.abs(rateDelta).toFixed(2).replace('.', ',')} p.p.`}</div></td></tr>;
        })}</tbody></table></div>
      </section>
    </div>
  </div>;
};
