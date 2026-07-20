import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Granularity = 'weekly' | 'monthly';
type Row = { date: Date; consultas: number; aprovados: number; pedidos: number; bio: number | null; docs: number; assinatura: number | null; emitidos: number };
const empty = { consultas: 0, aprovados: 0, pedidos: 0, bio: 0, docs: 0, assinatura: 0, emitidos: 0, bioNulls: 0 };
const n = (v = '') => v.trim() === '' ? null : Number(v.replaceAll('.', '').replace(',', '.'));
const fmt = (v: number) => v.toLocaleString('pt-BR');
const rate = (a: number, b: number) => b > 0 ? a / b * 100 : null;
const rateFmt = (v: number | null, d = 1) => v == null ? '—' : `${v.toFixed(d).replace('.', ',')}%`;
const parseDate = (v: string) => { const [d, m, y] = v.split('/').map(Number); return new Date(y, m - 1, d, 12); };
const shortDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function parseCsv(text: string): Row[] {
  return text.split(/\r?\n/).slice(1).map(line => line.split(';'))
    .filter(c => /^\d{2}\/\d{2}\/\d{4}$/.test(c[0] || ''))
    .map(c => ({ date: parseDate(c[0]), consultas: n(c[1]) ?? 0, aprovados: n(c[2]) ?? 0, pedidos: n(c[3]) ?? 0, bio: n(c[4]), docs: n(c[5]) ?? 0, assinatura: n(c[6]), emitidos: n(c[7]) ?? 0 }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
function sum(rows: Row[]) {
  return rows.reduce((a, r) => ({ consultas: a.consultas + r.consultas, aprovados: a.aprovados + r.aprovados, pedidos: a.pedidos + r.pedidos, bio: a.bio + (r.bio ?? 0), docs: a.docs + r.docs, assinatura: a.assinatura + (r.assinatura ?? 0), emitidos: a.emitidos + r.emitidos, bioNulls: a.bioNulls + (r.bio == null ? 1 : 0) }), { ...empty });
}
function periodKey(date: Date, granularity: Granularity) {
  if (granularity === 'monthly') return iso(date).slice(0, 7);
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return iso(monday);
}

export const FunilAquisicaoView: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/serasa-funnel-daily.csv`)
      .then(r => r.ok ? r.text() : Promise.reject(new Error('Fonte Serasa indisponível')))
      .then(t => setRows(parseCsv(t))).catch(e => setError(e.message));
  }, []);
  const lastDate = rows.at(-1)?.date;
  const current = useMemo(() => !lastDate ? [] : rows.filter(r => r.date.getFullYear() === lastDate.getFullYear() && r.date.getMonth() === lastDate.getMonth()), [rows, lastDate]);
  const total = useMemo(() => sum(current), [current]);
  const chartData = useMemo(() => {
    const groups = new Map<string, Row[]>();
    rows.forEach(row => { const key = periodKey(row.date, granularity); groups.set(key, [...(groups.get(key) ?? []), row]); });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(granularity === 'weekly' ? -10 : -7).map(([, values]) => {
      const t = sum(values), start = values[0].date;
      return { period: granularity === 'weekly' ? shortDate(start) : start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), consultas: t.consultas, emitidos: t.emitidos, conversao: rate(t.emitidos, t.consultas) };
    });
  }, [rows, granularity]);
  const stages = [
    ['Consultas', total.consultas, null, 'confirmado'],
    ['Aprovados', total.aprovados, rate(total.aprovados, total.consultas), 'taxa operacional'],
    ['Pedidos', total.pedidos, rate(total.pedidos, total.aprovados), 'taxa operacional'],
    ['Foto biometria', total.bio, null, 'cobertura parcial'],
    ['Documentos', total.docs, null, 'volume'],
    ['Assinaturas', total.assinatura, null, 'volume'],
    ['Emitidos', total.emitidos, rate(total.emitidos, total.consultas), 'resultado'],
  ] as const;
  const exportCsv = () => {
    const csv = ['Data;Consultas;Aprovados;Pedidos;Foto biometria;Documentos;Assinaturas;Emitidos', ...current.map(r => [shortDate(r.date), r.consultas, r.aprovados, r.pedidos, r.bio ?? '', r.docs, r.assinatura ?? '', r.emitidos].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'funil-serasa-jul-2026.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
    <div className="mx-auto max-w-[1780px] space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Análise · Serasa</p><h1 className="text-2xl font-black text-slate-950">Funil de Aquisição</h1><p className="text-sm text-slate-600">Volume, eficiência de entrada e acompanhamento operacional da jornada.</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados até {lastDate ? lastDate.toLocaleDateString('pt-BR') : '—'}</div>
      </header>
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900"><Info size={15} /><strong>Escopo:</strong> somente Serasa. APP e total conciliado ficam fora até a série diária ser certificada.</div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div><p className="text-[10px] font-bold text-slate-500">PERÍODO ANALISADO</p><p className="mt-1 flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} /> Julho de 2026 · até o último dia disponível</p></div>
        <div className="inline-flex rounded-lg border border-slate-200 p-1 text-xs font-bold">{(['weekly', 'monthly'] as Granularity[]).map(g => <button key={g} onClick={() => setGranularity(g)} className={`rounded-md px-4 py-2 ${granularity === g ? 'bg-cyan-50 text-cyan-700 shadow-sm' : 'text-slate-500'}`}>{g === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Consultas', fmt(total.consultas), 'Entrada do período'],
          ['Emitidos', fmt(total.emitidos), 'Resultado concluído'],
          ['Taxa proposta/emissão', rateFmt(rate(total.emitidos, total.consultas), 2), 'Indicador do período, não coorte'],
          ['Aprovação Neurotech', rateFmt(rate(total.aprovados, total.consultas)), `${fmt(total.aprovados)} aprovados`],
        ].map(([label, value, note]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>)}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap justify-between gap-2"><div><h2 className="font-black">Funil simples</h2><p className="text-xs text-slate-500">Leitura executiva entre entrada e resultado.</p></div><span className="h-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">TAXA DO PERÍODO · NÃO É COORTE</span></div>
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl bg-slate-950 p-5 text-white"><p className="text-xs font-bold text-slate-300">Consultas Neurotech</p><p className="text-3xl font-black">{fmt(total.consultas)}</p></div><div className="text-center text-sm font-black text-cyan-700">{rateFmt(rate(total.emitidos, total.consultas), 2)} →</div><div className="rounded-xl bg-cyan-600 p-5 text-white"><p className="text-xs font-bold text-cyan-50">Total emitidos</p><p className="text-3xl font-black">{fmt(total.emitidos)}</p></div></div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-black">Funil completo</h2><p className="mb-4 text-xs text-slate-500">Taxas apenas onde há compatibilidade operacional; demais etapas são acompanhadas por volume.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{stages.map(([label, value, conversion, status], i) => <div key={label} className={`rounded-xl border p-3 ${status === 'cobertura parcial' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}><span className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black">{i + 1}</span><p className="min-h-8 text-[11px] font-bold">{label}</p><p className="text-xl font-black text-slate-950">{fmt(value)}</p><p className="mt-1 text-[11px] font-bold text-cyan-700">{conversion == null ? 'Volume do período' : rateFmt(conversion)}</p><p className="mt-2 text-[9px] font-bold uppercase text-slate-400">{status}</p></div>)}</div>
        {total.bioNulls > 0 && <p className="mt-3 flex items-center gap-2 text-xs text-amber-800"><AlertTriangle size={14} /> Foto biométrica possui {total.bioNulls} dias sem valor neste período; nulos não viraram zero na tabela.</p>}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="font-black">Evolução {granularity === 'weekly' ? 'semanal' : 'mensal'}</h2><p className="text-xs text-slate-500">Consultas, emitidos e taxa ponderada.</p><div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}><CartesianGrid vertical={false} stroke="#e2e8f0" /><XAxis dataKey="period" tick={{ fontSize: 10 }} /><YAxis yAxisId="volume" tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)} mil`} /><YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10 }} unit="%" /><Tooltip /><Bar yAxisId="volume" dataKey="consultas" name="Consultas" fill="#0f2d64" /><Bar yAxisId="volume" dataKey="emitidos" name="Emitidos" fill="#14b8a6" /><Line yAxisId="rate" dataKey="conversao" name="Taxa" stroke="#f59e0b" strokeWidth={3} /></ComposedChart></ResponsiveContainer></div></div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between p-4"><div><h2 className="font-black">Detalhe diário · julho</h2><p className="text-xs text-slate-500">Células vazias permanecem sem valor.</p></div><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"><Download size={14} /> Exportar</button></div><div className="max-h-72 overflow-auto"><table className="w-full min-w-[760px] text-[10px]"><thead className="sticky top-0 bg-slate-100"><tr>{['Data','Consultas','Aprovados','Pedidos','Biometria','Docs','Assinaturas','Emitidos','Taxa'].map(h => <th key={h} className="px-3 py-2 text-right first:text-left">{h}</th>)}</tr></thead><tbody>{current.map(r => <tr key={iso(r.date)} className="border-t border-slate-100"><td className="px-3 py-2 font-bold">{shortDate(r.date)}</td>{[r.consultas,r.aprovados,r.pedidos,r.bio,r.docs,r.assinatura,r.emitidos].map((v, i) => <td key={i} className={`px-3 py-2 text-right ${v == null ? 'bg-amber-50 text-amber-700' : ''}`}>{v == null ? '—' : fmt(v)}</td>)}<td className="px-3 py-2 text-right font-bold">{rateFmt(rate(r.emitidos, r.consultas), 2)}</td></tr>)}</tbody></table></div></div>
      </section>
    </div>
  </div>;
};
