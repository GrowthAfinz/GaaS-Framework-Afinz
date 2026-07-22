import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CalendarDays, CheckCircle2, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';

type Scope = 'total' | 'afinz' | 'plurix';
type Granularity = 'daily' | 'weekly' | 'monthly';
type StageKey = 'cpf' | 'onboarding' | 'geo' | 'docs' | 'bio' | 'address' | 'personalization' | 'signature' | 'completed';
type RateKey = 'onboardingRate' | 'geoRate' | 'docsRate' | 'bioRate' | 'addressRate' | 'personalizationRate' | 'signatureRate' | 'completionRate';
type RawRow = { date: Date; stage: string; status: string; plurix: string; value: number };
type DailyRow = Record<StageKey, number | null> & { date: Date; auto: number | null; loss: number | null };

const stages: Array<{ key: StageKey; label: string; color: string }> = [
  { key: 'cpf', label: 'Digitação CPF', color: '#102f65' },
  { key: 'onboarding', label: 'Início onboarding', color: '#2563eb' },
  { key: 'geo', label: 'Geolocalização', color: '#7c3aed' },
  { key: 'docs', label: 'Fotos documento', color: '#db2777' },
  { key: 'bio', label: 'Biometria', color: '#ea580c' },
  { key: 'address', label: 'Endereço', color: '#d97706' },
  { key: 'personalization', label: 'Personalização', color: '#0891b2' },
  { key: 'signature', label: 'Assinatura', color: '#0d9488' },
  { key: 'completed', label: 'Cartão concluído', color: '#047857' },
];
const rates: Array<{ key: RateKey; label: string; numerator: StageKey; denominator: StageKey; color: string }> = [
  { key: 'onboardingRate', label: 'CPF → onboarding', numerator: 'onboarding', denominator: 'cpf', color: '#dc2626' },
  { key: 'geoRate', label: 'Onboarding → geolocalização', numerator: 'geo', denominator: 'onboarding', color: '#7c3aed' },
  { key: 'docsRate', label: 'Geolocalização → documentos', numerator: 'docs', denominator: 'geo', color: '#db2777' },
  { key: 'bioRate', label: 'Documentos → biometria', numerator: 'bio', denominator: 'docs', color: '#ea580c' },
  { key: 'addressRate', label: 'Biometria → endereço', numerator: 'address', denominator: 'bio', color: '#d97706' },
  { key: 'personalizationRate', label: 'Endereço → personalização', numerator: 'personalization', denominator: 'address', color: '#0891b2' },
  { key: 'signatureRate', label: 'Personalização → assinatura', numerator: 'signature', denominator: 'personalization', color: '#2563eb' },
  { key: 'completionRate', label: 'Assinatura → cartão concluído', numerator: 'completed', denominator: 'signature', color: '#059669' },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const stageKey = (label: string): StageKey | 'auto' | 'loss' | null => {
  const value = normalize(label);
  if (value.startsWith('0.')) return 'cpf';
  if (value.startsWith('1.')) return 'onboarding';
  if (value.startsWith('2.')) return 'geo';
  if (value.startsWith('3.')) return 'docs';
  if (value.startsWith('4.')) return 'bio';
  if (value.startsWith('5.')) return 'address';
  if (value.startsWith('6.')) return 'personalization';
  if (value.startsWith('7.1')) return 'auto';
  if (value.startsWith('7.')) return 'signature';
  if (value.startsWith('8.')) return 'completed';
  if (value === 'perda') return 'loss';
  return null;
};
const parseDate = (value: string) => { const [d, m, y] = value.split('/').map(Number); return new Date(y, m - 1, d, 12); };
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fmt = (value: number | null) => value == null ? '—' : value.toLocaleString('pt-BR');
const pct = (a: number | null, b: number | null) => a != null && b != null && b > 0 ? a / b * 100 : null;
const compatibleDailyRate = (a: number | null, b: number | null) => {
  const rate = pct(a, b);
  return rate != null && rate <= 100 ? rate : null;
};
const pctLabel = (value: number | null) => value == null ? '—' : `${value.toFixed(1).replace('.', ',')}%`;
const shortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toLowerCase();

function parseTsv(text: string): RawRow[] {
  return text.split(/\r?\n/).slice(1).map(line => line.split('\t')).filter(columns => /^\d{2}\/\d{2}\/\d{4}$/.test(columns[0] || '')).map(columns => ({
    date: parseDate(columns[0]), stage: columns[1] || '', status: columns[2] || '', plurix: columns[3] || '', value: Number((columns[4] || '0').replaceAll('.', '')),
  }));
}

function buildDaily(raw: RawRow[], scope: Scope): DailyRow[] {
  const dates = [...new Set(raw.map(row => iso(row.date)))].sort();
  return dates.map(key => {
    const source = raw.filter(row => iso(row.date) === key);
    const result = { date: parseDate(key.split('-').reverse().join('/')), cpf: null, onboarding: null, geo: null, docs: null, bio: null, address: null, personalization: null, signature: null, completed: null, auto: null, loss: null } as DailyRow;
    source.forEach(row => {
      const stage = stageKey(row.stage);
      if (!stage) return;
      const totalReference = (stage === 'cpf' || stage === 'onboarding') && row.status === '' && row.plurix === '0';
      const splitMeasure = row.status === 'APROVADO' && (row.plurix === 'SIM' || row.plurix === 'NAO');
      if (scope === 'total') {
        if (totalReference) result[stage] = row.value;
        else if (splitMeasure && stage !== 'onboarding') result[stage] = (result[stage] ?? 0) + row.value;
      } else if (splitMeasure && row.plurix === (scope === 'plurix' ? 'SIM' : 'NAO') && stage !== 'onboarding') result[stage] = row.value;
    });
    return result;
  });
}

const sumStage = (rows: DailyRow[], key: StageKey) => {
  const values = rows.map(row => row[key]).filter((value): value is number => value != null);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
};

export const AppAfinzFunnelView: React.FC = () => {
  const { startDate, endDate } = usePeriod();
  const [raw, setRaw] = useState<RawRow[]>([]);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<Scope>('total');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selected, setSelected] = useState<StageKey[]>(['cpf', 'onboarding', 'geo', 'completed']);
  const [selectedRates, setSelectedRates] = useState<RateKey[]>(['geoRate', 'completionRate']);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/app-afinz-funnel-raw.tsv`).then(response => response.ok ? response.text() : Promise.reject(new Error('Fonte do App Afinz indisponível'))).then(text => setRaw(parseTsv(text))).catch(reason => setError(reason.message));
  }, []);

  const lastClosed = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return raw.map(row => row.date).filter(date => date < today).sort((a, b) => b.getTime() - a.getTime())[0];
  }, [raw]);
  const allDaily = useMemo(() => buildDaily(raw, scope), [raw, scope]);
  const current = useMemo(() => allDaily.filter(row => row.date >= startDate && row.date <= endDate && (!lastClosed || row.date <= lastClosed)), [allDaily, startDate, endDate, lastClosed]);
  const totals = useMemo(() => Object.fromEntries(stages.map(stage => [stage.key, sumStage(current, stage.key)])) as Record<StageKey, number | null>, [current]);
  const availableStages = stages.filter(stage => totals[stage.key] != null);
  const availableRates = rates.filter(rate => compatibleDailyRate(totals[rate.numerator], totals[rate.denominator]) != null);

  const chartData = useMemo(() => {
    const groups = new Map<string, DailyRow[]>();
    current.forEach(row => {
      let key = iso(row.date);
      if (granularity === 'monthly') key = key.slice(0, 7);
      if (granularity === 'weekly') { const monday = new Date(row.date); monday.setDate(row.date.getDate() - ((row.date.getDay() + 6) % 7)); key = iso(monday); }
      groups.set(key, [...(groups.get(key) ?? []), row]);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => {
      const values = Object.fromEntries(stages.map(stage => [stage.key, sumStage(rows, stage.key)])) as Record<StageKey, number | null>;
      const first = rows[0].date, last = rows.at(-1)?.date ?? first;
      const label = granularity === 'daily' ? shortDate(first) : granularity === 'weekly' ? `${shortDate(first)}–${shortDate(last)}` : first.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const rateValues = Object.fromEntries(rates.map(rate => [rate.key, compatibleDailyRate(values[rate.numerator], values[rate.denominator])])) as Record<RateKey, number | null>;
      return { period: label, weekday: weekday(first), ...values, ...rateValues };
    });
  }, [current, granularity, scope]);

  const cardStages = availableStages;
  const firstComparable = scope === 'total' ? totals.onboarding : totals.geo;
  const completedRate = pct(totals.completed, firstComparable);
  const scopeLabel = scope === 'total' ? 'App completo' : scope === 'plurix' ? 'Plurix' : 'Afinz (B2C + B2B2C)';
  const toggleRate = (key: RateKey) => setSelectedRates(currentRates => currentRates.includes(key)
    ? currentRates.filter(item => item !== key)
    : currentRates.length < 4 ? [...currentRates, key] : currentRates);

  const exportCsv = () => {
    const header = ['Data', ...availableStages.map(stage => stage.label)];
    const csv = [header.join(';'), ...current.map(row => [iso(row.date), ...availableStages.map(stage => row[stage.key] ?? '')].join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `funil-app-afinz-${scope}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="min-h-full bg-slate-50 px-4 pb-6 text-slate-800">
    <div className="mx-auto flex max-w-[1780px] flex-col gap-4">
      <header className="flex justify-end">
        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={15} /> Dados fechados até {lastClosed?.toLocaleDateString('pt-BR') ?? '—'}</div>
      </header>
      <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><strong>Leitura certificada com limite:</strong> `SIM` identifica Plurix e `NAO` o restante do App, mas a fonte não separa B2C de B2B2C. A medida APROVADO da etapa 1 foi excluída por superar a entrada; ausência não vira zero.</span></div>
      {error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <section className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays size={16} /> {startDate.toLocaleDateString('pt-BR')} – {endDate.toLocaleDateString('pt-BR')}</p></div>
        <div className="flex border border-slate-300 text-[11px] font-semibold">{([['total', 'Funil Completo'], ['afinz', 'B2C + B2B2C'], ['plurix', 'Plurix']] as Array<[Scope, string]>).map(([key, label]) => <button key={key} onClick={() => setScope(key)} className={`border-r border-slate-300 px-3 py-2 last:border-r-0 ${scope === key ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>
      </section>

      <section className="border border-slate-200 bg-white p-4">
        <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Funil completo · {scopeLabel}</h2><p className="text-xs text-slate-500">Volumes somados apenas dentro da mesma população e janela.</p></div><p className="text-right"><span className="block text-[9px] uppercase tracking-wide text-slate-400">Conclusão observada</span><strong className="font-mono text-xl text-emerald-700">{pctLabel(completedRate)}</strong></p></div>
        <div className={`mt-3 grid gap-1.5 ${cardStages.length > 7 ? 'lg:grid-cols-9' : 'lg:grid-cols-7'} sm:grid-cols-3`}>{cardStages.map((stage, index) => { const prior = index > 0 ? totals[cardStages[index - 1].key] : null; const rate = index > 0 ? pct(totals[stage.key], prior) : null; return <div key={stage.key} className="border border-slate-200 bg-slate-50 px-3 py-2.5"><div className="flex items-center justify-between"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold">{index + 1}</span><span className="h-2 w-2" style={{ backgroundColor: stage.color }} /></div><p className="mt-2 min-h-[28px] text-[10px] font-semibold text-slate-700">{stage.label}</p><p className="font-mono text-lg font-bold text-slate-950">{fmt(totals[stage.key])}</p><p className="text-[9px] font-semibold text-cyan-700">{rate == null ? 'volume do período' : `${pctLabel(rate)} da etapa anterior`}</p></div>; })}</div>
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 text-[10px] md:grid-cols-4"><div><span className="text-slate-400">Cobertura temporal</span><p className="font-semibold">CPF: 01/01 · funil detalhado: 23/05</p></div><div><span className="text-slate-400">Segmentação disponível</span><p className="font-semibold">Total · Afinz combinado · Plurix</p></div><div><span className="text-slate-400">Etapa auxiliar</span><p className="font-semibold">Finalização automática: cobertura parcial</p></div><div><span className="text-slate-400">Bloqueio atual</span><p className="font-semibold text-amber-800">B2C vs B2B2C sem dimensão de origem</p></div></div>
      </section>

      <section className="border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Acompanhe volume e taxa de conclusão observada no mesmo eixo temporal.</p></div><div className="flex border border-slate-300 text-[11px] font-semibold">{(['daily', 'weekly', 'monthly'] as Granularity[]).map(key => <button key={key} onClick={() => setGranularity(key)} className={`border-r border-slate-300 px-3 py-1.5 last:border-r-0 ${granularity === key ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>{key === 'daily' ? 'Diária' : key === 'weekly' ? 'Semanal' : 'Mensal'}</button>)}</div></div>
        <div className="mt-4 flex flex-wrap items-center border-y border-slate-200 bg-slate-50 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-bold uppercase text-slate-500">Volumes</span>{availableStages.map(stage => <button key={stage.key} onClick={() => setSelected(value => value.includes(stage.key) ? value.filter(item => item !== stage.key) : [...value, stage.key])} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selected.includes(stage.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: selected.includes(stage.key) ? stage.color : '#cbd5e1' }} />{stage.label}</button>)}<button onClick={() => setSelected(availableStages.map(stage => stage.key))} className="px-2.5 py-2 font-semibold text-cyan-700">Todos</button><button onClick={() => setSelected([])} className="border-l border-slate-200 px-2.5 py-2 font-semibold text-slate-500">Limpar</button></div>
        <div className="flex flex-wrap items-center border-b border-slate-200 bg-slate-50 text-[10px]"><span className="border-r border-slate-200 px-2 py-2 font-bold uppercase text-slate-500">Taxas</span>{availableRates.map(rate => <button key={rate.key} onClick={() => toggleRate(rate.key)} className={`flex items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selectedRates.includes(rate.key) ? 'bg-white text-slate-900' : 'text-slate-400'}`}><span className="h-2 w-2" style={{ background: selectedRates.includes(rate.key) ? rate.color : '#cbd5e1' }} />{rate.label}</button>)}<span className="px-2 py-2 text-slate-400">máx. 4</span></div>
        <div className="h-[370px] pt-3"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 14, right: 42, left: 8, bottom: 20 }}><CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" /><XAxis dataKey="period" height={42} tick={({ x, y, payload }: any) => { const point = chartData.find(item => item.period === payload.value); return <g transform={`translate(${x},${y})`}><text y={12} textAnchor="middle" fill="#334155" fontSize={9} fontFamily="monospace">{payload.value}</text>{granularity === 'daily' && <text y={26} textAnchor="middle" fill="#94a3b8" fontSize={8}>{point?.weekday}</text>}</g>; }} /><YAxis yAxisId="volume" hide={!selected.length} tick={{ fontSize: 9 }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} /><YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={value => `${value}%`} /><Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #cbd5e1', fontSize: 10, fontFamily: 'monospace' }} formatter={(value: number, name: string) => { const rate = rates.find(item => item.key === name); return [rate ? pctLabel(value) : fmt(value), rate?.label ?? stages.find(stage => stage.key === name)?.label ?? name]; }} />{availableStages.filter(stage => selected.includes(stage.key)).map(stage => <Bar key={stage.key} yAxisId="volume" dataKey={stage.key} name={stage.key} fill={stage.color} maxBarSize={18} isAnimationActive={false} />)}{availableRates.filter(rate => selectedRates.includes(rate.key)).map(rate => <Line key={rate.key} yAxisId="rate" type="linear" dataKey={rate.key} name={rate.key} stroke={rate.color} strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: rate.color, strokeWidth: 2 }} activeDot={{ r: 4, fill: '#fff', stroke: rate.color, strokeWidth: 2 }} isAnimationActive={false} connectNulls={false} />)}</ComposedChart></ResponsiveContainer></div>
        <p className="mt-1 text-[10px] text-slate-500">Vazio = combinação ausente na fonte, não resultado zero. A taxa diária é omitida quando falta denominador ou quando as contagens não formam uma sequência compatível.</p>
      </section>

      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4"><div><h2 className="text-lg font-semibold text-slate-950">Detalhe diário</h2><p className="text-xs text-slate-500">Ausências permanecem vazias; os dados de 22/07 foram excluídos por serem parciais.</p></div><button onClick={exportCsv} className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div>
        <div className="max-h-[430px] overflow-auto"><table className="w-full min-w-[1100px] text-[10px]"><thead className="sticky top-0 z-10 bg-slate-100"><tr><th className="px-3 py-2 text-left">Data</th>{availableStages.map(stage => <th key={stage.key} className="px-3 py-2 text-right">{stage.label}</th>)}<th className="px-3 py-2 text-right">Conclusão</th></tr></thead><tbody>{current.map((row, index) => { const rate = compatibleDailyRate(row.completed, scope === 'total' ? row.onboarding : row.geo); const previous = index > 0 ? compatibleDailyRate(current[index - 1].completed, scope === 'total' ? current[index - 1].onboarding : current[index - 1].geo) : null; const change = rate != null && previous != null ? rate - previous : null; return <tr key={iso(row.date)} className="border-t border-slate-100 odd:bg-slate-50/40"><td className="px-3 py-2"><span className="font-mono font-semibold">{shortDate(row.date)}</span><span className="ml-2 text-slate-400">{weekday(row.date)}</span></td>{availableStages.map(stage => <td key={stage.key} className="px-3 py-2 text-right font-mono font-semibold">{fmt(row[stage.key])}</td>)}<td className="px-3 py-2 text-right"><span className="font-mono font-bold">{pctLabel(rate)}</span><span className={`ml-2 inline-flex items-center font-semibold ${change == null ? 'text-slate-400' : change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-700' : 'text-slate-400'}`}>{change == null ? <ArrowRight size={10} /> : change > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{change == null ? ' sem base' : ` ${Math.abs(change).toFixed(1).replace('.', ',')} p.p.`}</span></td></tr>; })}</tbody></table></div>
      </section>
      <p className="flex items-center gap-2 text-[10px] text-slate-500"><Info size={13} /> Fonte recebida em 22/07/2026 · 1.267 linhas · chave composta sem duplicidades.</p>
    </div>
  </div>;
};
