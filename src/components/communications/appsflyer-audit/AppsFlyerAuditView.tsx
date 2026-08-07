import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, Check, CheckCircle2, ChevronRight, CircleDashed, Database,
  Eye, Filter, GitBranch, Loader2, RefreshCw, Search, ShieldCheck, Split, XCircle,
} from 'lucide-react';
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useAppsFlyerAudit } from '../../../hooks/useAppsFlyerAudit';
import type { AppsFlyerAuditActivity, AppsFlyerAuditCase, AuditStatus } from '../../../types/appsflyerAudit';

const fmt = new Intl.NumberFormat('pt-BR');
const shortDate = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—';

const SEGMENT_COLORS: Record<string, string> = {
  Abandonados: '#ec4899', Negados: '#3b82f6', 'Aprovados não convertidos': '#22c55e',
  'Base Proprietária': '#8b5cf6', CRM: '#06b6d4', 'Não classificado': '#94a3b8',
};
const fallbackColors = ['#0ea5e9', '#f59e0b', '#14b8a6', '#a855f7', '#ef4444', '#64748b'];

const STATUS: Record<AuditStatus, { label: string; description: string; className: string; icon: React.ReactNode }> = {
  synchronized: { label: 'Sincronizado', description: 'Activity, template e AppsFlyer sem ambiguidade', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={13} /> },
  rule_d2_d4: { label: 'Regra D2→D4', description: 'Reuso esperado aguardando aprovação', className: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: <Split size={13} /> },
  approved: { label: 'Aprovado', description: 'Regra revisada e registrada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <ShieldCheck size={13} /> },
  shared: { label: 'Compartilhado', description: 'Mais de uma Activity sem regra aprovada', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <CircleDashed size={13} /> },
  conflict: { label: 'Conflito', description: 'O cadastro contradiz a regra da régua', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: <AlertTriangle size={13} /> },
  no_appsflyer: { label: 'Sem AppsFlyer', description: 'Vínculo existe, mas não há installs no recorte', className: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Database size={13} /> },
  no_template: { label: 'Sem template', description: 'Activity ainda não possui template_id', className: 'bg-slate-50 text-slate-500 border-slate-200', icon: <XCircle size={13} /> },
};

const StatusBadge = ({ status }: { status: AuditStatus }) => {
  const item = STATUS[status];
  return <span title={item.description} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${item.className}`}>{item.icon}{item.label}</span>;
};

const Kpi = ({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'cyan' | 'green' | 'amber' | 'rose' }) => {
  const toneClass = { slate: 'text-slate-900', cyan: 'text-cyan-700', green: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700' }[tone];
  return <div className="min-w-0 border-r border-slate-100 px-4 last:border-r-0"><div className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400" title={label}>{label}</div><div className={`mt-1 text-2xl font-black ${toneClass}`}>{fmt.format(value)}</div></div>;
};

const ChainState = ({ active, label, detail }: { active: boolean; label: string; detail: string }) => (
  <div className={`min-w-0 flex-1 rounded-xl border p-3 ${active ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'}`}>
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{active ? <CheckCircle2 size={13} className="text-emerald-600" /> : <CircleDashed size={13} />}{label}</div>
    <div className="mt-1 truncate text-xs font-semibold text-slate-800" title={detail}>{detail}</div>
  </div>
);

const AuditDetail = ({ auditCase, activity }: { auditCase: AppsFlyerAuditCase | null; activity: AppsFlyerAuditActivity | null }) => {
  if (!auditCase && !activity) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">Selecione um disparo ou caso para inspecionar a sincronização.</div>;
  const selectedActivity = activity ?? auditCase?.activities[0] ?? null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Evidência selecionada</div>
          <h3 className="mt-1 truncate text-sm font-bold text-slate-900" title={selectedActivity?.activityName}>{selectedActivity?.activityName ?? auditCase?.templateId}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{selectedActivity ? `${shortDate(selectedActivity.dispatchDate)} · ${selectedActivity.segment} · ${selectedActivity.channel}` : `${auditCase?.activityNames.length ?? 0} Activities candidatas`}</p>
        </div>
        {auditCase && <StatusBadge status={auditCase.status} />}
      </div>
      <div className="mt-4 flex items-stretch gap-2">
        <ChainState active={!!selectedActivity} label="Activity" detail={selectedActivity?.activityName ?? 'Não localizada'} />
        <ChevronRight size={16} className="mt-7 flex-none text-slate-300" />
        <ChainState active={!!auditCase?.templateId} label="Template ID" detail={auditCase?.templateId ?? 'Sem template'} />
        <ChevronRight size={16} className="mt-7 flex-none text-slate-300" />
        <ChainState active={(auditCase?.installs ?? 0) > 0} label="AppsFlyer" detail={auditCase ? `${fmt.format(auditCase.installs)} installs observados` : 'Sem correspondência'} />
      </div>
      {auditCase && <div className="mt-4 grid gap-2 sm:grid-cols-2">{auditCase.reasons.map(reason => <div key={reason} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><Check size={13} className="mt-0.5 flex-none text-cyan-600" />{reason}</div>)}</div>}
      {auditCase?.decision?.reviewed_at && <p className="mt-3 text-[11px] text-slate-400">Última revisão: {new Date(auditCase.decision.reviewed_at).toLocaleString('pt-BR')} · regra {auditCase.decision.rule_code}</p>}
    </section>
  );
};

export const AppsFlyerAuditView: React.FC = () => {
  const { cases, activities, days, loading, saving, error, refetch, decide, range } = useAppsFlyerAudit();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AuditStatus | 'all'>('all');
  const [segment, setSegment] = useState('all');
  const [selectedCaseKey, setSelectedCaseKey] = useState<string | null>(null);
  const [selectedActivityKey, setSelectedActivityKey] = useState<string | null>(null);

  const segmentNames = useMemo(() => [...new Set(activities.map(item => item.segment))].sort(), [activities]);
  const colors = useMemo(() => new Map(segmentNames.map((name, index) => [name, SEGMENT_COLORS[name] ?? fallbackColors[index % fallbackColors.length]])), [segmentNames]);
  const chartData = useMemo(() => days.map(day => ({ ...day, ...day.segments })), [days]);
  const selectedCase = cases.find(item => item.caseKey === selectedCaseKey) ?? null;
  const selectedActivity = activities.find(item => item.key === selectedActivityKey) ?? null;

  const filteredCases = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cases.filter(item => (status === 'all' || item.status === status)
      && (segment === 'all' || item.activities.some(activity => activity.segment === segment))
      && (!needle || item.templateId.toLowerCase().includes(needle) || item.activityNames.some(name => name.toLowerCase().includes(needle))));
  }, [cases, query, segment, status]);

  const filteredActivities = useMemo(() => activities.filter(item => (segment === 'all' || item.segment === segment)
    && (status === 'all' || item.status === status)), [activities, segment, status]);

  const counts = useMemo(() => ({
    total: activities.length,
    synchronized: cases.filter(item => item.status === 'synchronized' || item.status === 'approved').length,
    rule: cases.filter(item => item.status === 'rule_d2_d4').length,
    review: cases.filter(item => item.status === 'shared' || item.status === 'rule_d2_d4').length,
    conflict: cases.filter(item => item.status === 'conflict').length,
    sharedInstalls: cases.filter(item => ['shared', 'conflict', 'rule_d2_d4'].includes(item.status)).reduce((sum, item) => sum + item.installs, 0),
  }), [activities.length, cases]);

  const selectCase = (item: AppsFlyerAuditCase) => { setSelectedCaseKey(item.caseKey); setSelectedActivityKey(null); };
  const selectActivity = (item: AppsFlyerAuditActivity) => { setSelectedActivityKey(item.key); setSelectedCaseKey(item.caseKey); };

  if (loading) return <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Cruzando Activities, templates e AppsFlyer…</div>;

  return (
    <div className="flex h-full flex-col bg-slate-50/70">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-2xl font-bold text-slate-900">Auditoria AppsFlyer</h2><p className="mt-0.5 text-sm text-slate-500">Activity → template ID → installs · {shortDate(range.from)}–{shortDate(range.to)}</p></div>
          <button onClick={() => void refetch()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-300 hover:text-cyan-700"><RefreshCw size={14} />Atualizar</button>
        </div>
        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-3 sm:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Disparos" value={counts.total} /><Kpi label="Sincronizados" value={counts.synchronized} tone="green" /><Kpi label="Regra D2→D4" value={counts.rule} tone="cyan" /><Kpi label="Aguardando revisão" value={counts.review} tone="amber" /><Kpi label="Conflitos" value={counts.conflict} tone="rose" /><Kpi label="Installs compartilhados" value={counts.sharedInstalls} tone="amber" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5">
        {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertTriangle size={16} className="mt-0.5 flex-none" />{error}</div>}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar Activity ou template ID" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-400" /></div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500"><Filter size={14} /><select value={segment} onChange={event => setSegment(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="all">Todos os segmentos</option>{segmentNames.map(name => <option key={name}>{name}</option>)}</select></div>
          <select value={status} onChange={event => setStatus(event.target.value as AuditStatus | 'all')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option value="all">Todos os estados</option>{Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.8fr)]">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-900">Linha do tempo operacional</h3><p className="text-xs text-slate-500">Barras: disparos por segmento · linha tracejada: installs observados</p></div><div className="flex flex-wrap gap-2">{segmentNames.map(name => <span key={name} className="inline-flex items-center gap-1 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.get(name) }} />{name}</span>)}</div></div>
            <div className="mt-3 h-[310px]">
              <ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 12, right: 28, left: -16, bottom: 12 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={24} /><YAxis yAxisId="dispatches" allowDecimals={false} tick={{ fontSize: 10 }} /><YAxis yAxisId="installs" orientation="right" tick={{ fontSize: 10 }} /><Tooltip labelFormatter={shortDate} formatter={(value: number, name: string) => [fmt.format(value), name === 'installs' ? 'Installs observados' : name]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />{segmentNames.map(name => <Bar key={name} yAxisId="dispatches" dataKey={name} stackId="segments" fill={colors.get(name)} maxBarSize={18} isAnimationActive={false} />)}<Line yAxisId="installs" dataKey="installs" name="installs" stroke="#0f172a" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} /></ComposedChart></ResponsiveContainer>
            </div>
            <div className="mt-1 border-t border-slate-100 pt-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Disparos clicáveis</span><span className="text-[10px] text-slate-400">cor = segmento · forma = sincronização</span></div><div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">{filteredActivities.map(item => <button key={item.key} onClick={() => selectActivity(item)} title={`${shortDate(item.dispatchDate)} · ${item.activityName} · ${STATUS[item.status].label}`} aria-label={`Abrir ${item.activityName}`} className={`h-4 w-4 border-2 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${item.status === 'conflict' ? 'rotate-45 rounded-sm border-rose-700' : item.status === 'shared' || item.status === 'rule_d2_d4' ? 'rounded-full border-slate-700 bg-white' : 'rounded-full border-white shadow-sm'}`} style={{ backgroundColor: item.status === 'shared' || item.status === 'rule_d2_d4' ? 'white' : colors.get(item.segment), boxShadow: item.status === 'rule_d2_d4' ? `0 0 0 2px ${colors.get(item.segment)}` : undefined }} />)}{filteredActivities.length === 0 && <span className="py-3 text-xs text-slate-400">Nenhum disparo neste filtro.</span>}</div></div>
          </section>

          <aside className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Fila de aprovação</h3><p className="text-xs text-slate-500">{filteredCases.length} casos no recorte</p></div><ShieldCheck size={18} className="text-cyan-600" /></div></div>
            <div className="max-h-[430px] flex-1 overflow-y-auto p-2">{filteredCases.map(item => <div key={item.caseKey} className={`mb-2 rounded-xl border p-3 transition-colors ${selectedCaseKey === item.caseKey ? 'border-cyan-300 bg-cyan-50/40' : 'border-slate-100 hover:border-slate-200'}`}><button onClick={() => selectCase(item)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate font-mono text-[11px] font-bold text-slate-800" title={item.templateId}>{item.templateId}</div><div className="mt-1 text-[11px] text-slate-500">{item.activityNames.length} {item.activityNames.length === 1 ? 'Activity' : 'Activities'} · {fmt.format(item.installs)} installs</div></div><StatusBadge status={item.status} /></div></button>{(item.status === 'rule_d2_d4' || item.status === 'shared' || item.status === 'conflict') && <div className="mt-3 flex gap-2"><button onClick={() => selectCase(item)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><Eye size={12} />Visualizar</button>{item.status === 'rule_d2_d4' && <button disabled={saving === item.caseKey} onClick={() => void decide(item, 'approved', 'd2_d4_cutover', 'Regra D2→D4 aprovada na Auditoria AppsFlyer.')} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-cyan-700 disabled:opacity-50">{saving === item.caseKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}Aprovar regra</button>}{item.status !== 'rule_d2_d4' && <button disabled={saving === item.caseKey} onClick={() => void decide(item, item.status === 'conflict' ? 'conflict' : 'shared', 'none', 'Mantido fora dos resultados até correção ou regra aprovada.')} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-slate-900 disabled:opacity-50"><GitBranch size={12} />Registrar</button>}</div>}</div>)}{filteredCases.length === 0 && <div className="py-16 text-center text-sm text-slate-400">Nenhum caso neste filtro.</div>}</div>
          </aside>
        </div>
        <div className="mt-4"><AuditDetail auditCase={selectedCase} activity={selectedActivity} /></div>
      </main>
    </div>
  );
};
