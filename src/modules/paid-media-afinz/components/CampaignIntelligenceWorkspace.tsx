import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Crosshair,
  Gauge,
  LineChart,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { useTargets, type Target } from '../hooks/useTargets';
import { dataService } from '../../../services/dataService';
import { CampaignPerformanceTable } from './CampaignPerformanceTable';
import { InsightsPanel } from './InsightsPanel';
import { resolveFrente } from '../utils/aggregateMetrics';
import {
  compareEquivalentMonth,
  diagnoseEntity,
  projectMetrics,
  simulateIncrementalSpend,
} from '../utils/mediaIntelligence';
import type {
  DiagnosticSignal,
  IntelligenceEntity,
  IntelligenceMetric,
  IntelligenceViewMode,
} from '../types/intelligence';
import { format } from 'date-fns';

const modes: Array<{ id: IntelligenceViewMode; label: string; icon: React.ElementType }> = [
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'goals', label: 'Metas & Ritmo', icon: Gauge },
  { id: 'comparison', label: 'Comparativo', icon: LineChart },
  { id: 'diagnosis', label: 'Diagnóstico', icon: BrainCircuit },
  { id: 'opportunities', label: 'Oportunidades', icon: Sparkles },
  { id: 'simulation', label: 'Simulação', icon: Crosshair },
];

const metrics: Array<{ id: IntelligenceMetric; label: string; inverse: boolean }> = [
  { id: 'spend', label: 'Investimento', inverse: false },
  { id: 'cpm', label: 'CPM', inverse: true },
  { id: 'ctr', label: 'CTR', inverse: false },
  { id: 'cpc', label: 'CPC', inverse: true },
  { id: 'cpa', label: 'CPA plataforma', inverse: true },
];

const currency = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 2,
}).format(value || 0);
const number = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value || 0);
const percent = (value: number) => `${(value || 0).toFixed(2)}%`;
const metricValue = (metric: IntelligenceMetric, value: number) => metric === 'ctr' ? percent(value) : currency(value);
const deltaLabel = (value: number | null | undefined) => value == null ? 'Sem base' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const confidenceStyle = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-orange-50 text-orange-700 border-orange-200',
  blocked: 'bg-slate-100 text-slate-600 border-slate-200',
};

const severityStyle = {
  critical: 'border-red-200 bg-red-50/60 text-red-700',
  warning: 'border-amber-200 bg-amber-50/60 text-amber-700',
  opportunity: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};

function applyScope(rows: any[], filters: ReturnType<typeof useFilters>['filters']) {
  return rows.filter((row) => {
    if (!filters.selectedChannels.includes(row.channel)) return false;
    if (row.objective && !filters.selectedObjectives.includes(row.objective)) {
      if (!(row.objective === 'b2c' && filters.selectedObjectives.includes('aquisicao'))) return false;
    }
    if (filters.selectedCampaigns.length && !filters.selectedCampaigns.includes(row.campaign)) return false;
    if (filters.selectedAdsets.length && !filters.selectedAdsets.includes(row.adset_name)) return false;
    if (filters.selectedAds.length && !filters.selectedAds.includes(row.ad_name)) return false;
    return true;
  });
}

function buildEntities(
  scopedRows: any[],
  objectives: ReturnType<typeof useFilters>['objectives'],
  from: Date,
  to: Date,
): IntelligenceEntity[] {
  const currentRows = scopedRows.filter((row) => {
    const date = new Date(row.date);
    return date >= from && date <= to;
  });
  const groups = new Map<string, { label: string; objective: string; rows: any[]; level: 'objective' | 'campaign'; channel?: string }>();

  currentRows.forEach((row) => {
    const frente = resolveFrente(row.objective, objectives);
    const frontKey = `objective:${frente.key}`;
    const front = groups.get(frontKey) || { label: frente.label, objective: frente.key, rows: [], level: 'objective' as const };
    front.rows.push(row);
    groups.set(frontKey, front);

    const campaignKey = `campaign:${row.campaign}`;
    const campaign = groups.get(campaignKey) || {
      label: row.campaign, objective: frente.key, rows: [], level: 'campaign' as const, channel: row.channel,
    };
    campaign.rows.push(row);
    groups.set(campaignKey, campaign);
  });

  return [...groups.entries()].map(([key, group]) => {
    const entityUniverse = group.level === 'objective'
      ? scopedRows.filter((row) => resolveFrente(row.objective, objectives).key === group.objective)
      : scopedRows.filter((row) => row.campaign === group.label);
    return {
      key,
      label: group.label,
      level: group.level,
      objective: group.objective,
      channel: group.channel,
      rows: group.rows,
      previousRows: [],
      projection: projectMetrics(entityUniverse, to),
      comparison: compareEquivalentMonth(entityUniverse, from, to),
    };
  }).sort((a, b) => {
    if (a.level !== b.level) return a.level === 'objective' ? -1 : 1;
    return b.projection.current.spend - a.projection.current.spend;
  });
}

function findTarget(
  targets: Target[],
  month: string,
  entity: IntelligenceEntity,
  metric: IntelligenceMetric,
): Target | undefined {
  return targets.find((target) => {
    if (target.month !== month || target.metric !== metric) return false;
    const level = target.level || (target.objective ? 'objective' : 'global');
    const key = target.entity_key || target.objective || '__global__';
    if (level === 'campaign') return entity.level === 'campaign' && key === entity.label;
    if (level === 'objective') return entity.objective === key;
    return entity.level === 'objective';
  });
}

const ConfidenceBadge = ({ entity }: { entity: IntelligenceEntity }) => {
  const evidence = entity.projection.evidence;
  return (
    <span title={evidence.limitations.join(' ')} className={`inline-flex px-2 py-1 rounded-full border text-[11px] font-bold ${confidenceStyle[evidence.confidence]}`}>
      {evidence.confidence === 'high' ? 'Alta' : evidence.confidence === 'medium' ? 'Média' : evidence.confidence === 'low' ? 'Baixa' : 'Bloqueada'} · {evidence.confidenceScore}%
    </span>
  );
};

function MetricPicker({ value, onChange }: { value: IntelligenceMetric; onChange: (value: IntelligenceMetric) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 p-1">
      {metrics.map((metric) => (
        <button key={metric.id} onClick={() => onChange(metric.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${value === metric.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          {metric.label}
        </button>
      ))}
    </div>
  );
}

function GoalsView({ entities, targets, budgets, campaignBudgets, metric, onAddTarget, selectedMonth }: {
  entities: IntelligenceEntity[]; targets: Target[]; budgets: any[]; campaignBudgets: any[]; metric: IntelligenceMetric;
  onAddTarget: (target: Omit<Target, 'id'>) => Promise<void>; selectedMonth: string;
}) {
  const month = selectedMonth;
  const [editing, setEditing] = useState(false);
  const [entityKey, setEntityKey] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const visible = entities.filter((entity) => entity.level === 'objective' || entity.level === 'campaign');
  const targetFor = (entity: IntelligenceEntity) => {
    if (metric === 'spend') {
      const budget = entity.level === 'objective'
        ? budgets.find((item) => item.month === month && item.objective === entity.objective)?.budget
        : campaignBudgets.find((item) => item.month === month && item.campaign_name === entity.label)?.allocated_budget;
      return budget ?? findTarget(targets, month, entity, metric)?.value;
    }
    return findTarget(targets, month, entity, metric)?.value;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div><h3 className="font-bold text-slate-800">Meta, ritmo e projeção</h3><p className="text-xs text-slate-500 mt-1">Projeção híbrida: 60% últimos 7 dias fechados + 40% ritmo mensal.</p></div>
        <button onClick={() => { setEditing((value) => !value); if (!entityKey) setEntityKey(visible[0]?.key || ''); }} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold">{editing ? 'Fechar' : 'Configurar meta'}</button>
      </div>
      {editing && <form className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-end gap-3" onSubmit={async (event) => {
        event.preventDefault();
        const entity = visible.find((item) => item.key === entityKey);
        if (!entity || !targetValue) return;
        await onAddTarget({
          month,
          metric,
          value: Number(targetValue),
          level: entity.level,
          entity_key: entity.level === 'campaign' ? entity.label : entity.objective,
          objective: entity.objective,
          channel: entity.channel as 'meta' | 'google' | undefined,
          direction: metric === 'spend' ? 'range' : metric === 'ctr' ? 'min' : 'max',
          warning_tolerance_pct: 10,
          source: 'manual',
        });
        setTargetValue(''); setEditing(false);
      }}>
        <label className="text-xs font-bold text-slate-600">Escopo<select value={entityKey} onChange={(event) => setEntityKey(event.target.value)} className="block mt-1 min-w-[280px] border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-normal">{visible.map((entity) => <option key={entity.key} value={entity.key}>{entity.level === 'objective' ? 'Frente' : 'Campanha'} · {entity.label}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Métrica<input value={metrics.find((item) => item.id === metric)?.label} readOnly className="block mt-1 w-36 border border-slate-200 bg-slate-100 rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-bold text-slate-600">Valor<input type="number" min="0" step="0.01" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} required className="block mt-1 w-40 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#00AEB5] text-white text-sm font-bold">Salvar meta</button>
        <span className="text-[11px] text-slate-400 pb-2">{month} · tolerância padrão 10%</span>
      </form>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr>
            <th className="text-left px-5 py-3">Frente / Campanha</th><th className="text-right px-4 py-3">Realizado</th><th className="text-right px-4 py-3">Meta</th><th className="text-right px-4 py-3">Projeção</th><th className="text-right px-4 py-3">Faixa provável</th><th className="text-right px-4 py-3">Gap projetado</th><th className="text-center px-4 py-3">Confiança</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((entity) => {
              const target = targetFor(entity);
              const current = entity.projection.current[metric];
              const projected = entity.projection.projected[metric];
              const lower = entity.projection.lower[metric];
              const upper = entity.projection.upper[metric];
              const gap = target == null ? null : projected - target;
              const targetHealthy = target == null ? null
                : metric === 'spend' ? Math.abs(gap!) <= target * 0.05
                  : metric === 'ctr' ? projected >= target
                    : projected <= target;
              return <tr key={entity.key} className={entity.level === 'objective' ? 'bg-slate-50/60 font-semibold' : 'hover:bg-slate-50/50'}>
                <td className="px-5 py-3"><div className={entity.level === 'campaign' ? 'pl-5' : ''}><span className="text-slate-800">{entity.label}</span><div className="text-[11px] text-slate-400 font-normal">{entity.level === 'objective' ? 'Frente' : entity.channel?.toUpperCase()}</div></div></td>
                <td className="text-right px-4 py-3 tabular-nums">{metricValue(metric, current)}</td>
                <td className="text-right px-4 py-3 tabular-nums">{target == null ? <span className="text-amber-600 text-xs">Não definida</span> : metricValue(metric, target)}</td>
                <td className="text-right px-4 py-3 tabular-nums font-bold text-slate-800">{entity.projection.evidence.confidence === 'blocked' ? '—' : metricValue(metric, projected)}</td>
                <td className="text-right px-4 py-3 tabular-nums text-xs text-slate-500">{entity.projection.evidence.confidence === 'blocked' ? '—' : `${metricValue(metric, lower)} – ${metricValue(metric, upper)}`}</td>
                <td className={`text-right px-4 py-3 tabular-nums ${gap == null ? 'text-slate-400' : targetHealthy ? 'text-emerald-600' : 'text-red-600'}`}>{gap == null ? '—' : `${gap >= 0 ? '+' : ''}${metricValue(metric, gap)}`}</td>
                <td className="text-center px-4 py-3"><ConfidenceBadge entity={entity} /></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonView({ entities, metric }: { entities: IntelligenceEntity[]; metric: IntelligenceMetric }) {
  return <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
    <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-800">Mesmo período do mês anterior</h3><p className="text-xs text-slate-500 mt-1">Compara dias equivalentes e sinaliza diferença de cobertura.</p></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr>
      <th className="text-left px-5 py-3">Frente / Campanha</th><th className="text-right px-4 py-3">Atual</th><th className="text-right px-4 py-3">Anterior</th><th className="text-right px-4 py-3">Variação</th><th className="text-left px-4 py-3">Leitura</th>
    </tr></thead><tbody className="divide-y divide-slate-100">{entities.map((entity) => {
      const delta = entity.comparison.percent[metric];
      const inverse = metrics.find((item) => item.id === metric)?.inverse;
      const good = delta != null && (inverse ? delta < 0 : delta > 0);
      const deltaColor = delta == null || metric === 'spend' ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-red-600';
      return <tr key={entity.key} className={entity.level === 'objective' ? 'bg-slate-50/60 font-semibold' : 'hover:bg-slate-50/50'}>
        <td className="px-5 py-3"><div className={entity.level === 'campaign' ? 'pl-5' : ''}>{entity.label}<div className="text-[11px] text-slate-400 font-normal">{entity.comparison.currentLabel} vs {entity.comparison.previousLabel}</div></div></td>
        <td className="text-right px-4 py-3 tabular-nums">{metricValue(metric, entity.comparison.current[metric])}</td>
        <td className="text-right px-4 py-3 tabular-nums text-slate-500">{metricValue(metric, entity.comparison.previous[metric])}</td>
        <td className={`text-right px-4 py-3 font-bold ${deltaColor}`}>{deltaLabel(delta)}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{entity.comparison.comparable ? 'Cobertura equivalente' : entity.comparison.limitations.join(' ')}</td>
      </tr>;
    })}</tbody></table></div>
  </div>;
}

function SignalCard({ signal }: { signal: DiagnosticSignal }) {
  return <article className={`rounded-xl border p-4 ${severityStyle[signal.severity]}`}>
    <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{signal.entityLabel}</span><h4 className="font-bold mt-1">{signal.signal}</h4></div><span className="text-[11px] font-bold bg-white/70 rounded-full px-2 py-1">Score {signal.priorityScore}</span></div>
    <div className="mt-3 grid gap-2 text-xs text-slate-600">
      <p><strong>Impacto:</strong> {signal.impact}</p><p><strong>Causa provável:</strong> {signal.probableCause}</p><p><strong>Evidência:</strong> {signal.evidence.join(' · ')}</p><p><strong>Ação:</strong> {signal.action}</p>
    </div>
  </article>;
}

function DiagnosisView({ signals }: { signals: DiagnosticSignal[] }) {
  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}</div>;
}

function OpportunitiesView({ signals }: { signals: DiagnosticSignal[] }) {
  const buckets: Array<{ id: DiagnosticSignal['bucket']; label: string; copy: string }> = [
    { id: 'act', label: 'Agir hoje', copy: 'Ações materiais e de baixo arrependimento.' },
    { id: 'monitor', label: 'Acompanhar', copy: 'Sinais relevantes que precisam de nova janela.' },
    { id: 'investigate', label: 'Investigar', copy: 'Mensuração, cobertura ou hipótese ainda incerta.' },
  ];
  return <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">{buckets.map((bucket) => {
    const items = signals.filter((signal) => signal.bucket === bucket.id).sort((a, b) => b.priorityScore - a.priorityScore);
    return <section key={bucket.id} className="bg-white border border-slate-200 rounded-xl p-4"><div className="mb-4"><h3 className="font-bold text-slate-800">{bucket.label}</h3><p className="text-xs text-slate-500">{bucket.copy}</p></div><div className="space-y-3">{items.length ? items.map((signal) => <SignalCard key={signal.id} signal={signal} />) : <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">Nenhum item neste bucket.</div>}</div></section>;
  })}</div>;
}

function SimulationView({ entities }: { entities: IntelligenceEntity[] }) {
  const campaigns = entities.filter((entity) => entity.level === 'campaign');
  const [selected, setSelected] = useState(campaigns[0]?.key || '');
  const [amount, setAmount] = useState(1000);
  useEffect(() => { if (!campaigns.some((item) => item.key === selected)) setSelected(campaigns[0]?.key || ''); }, [campaigns, selected]);
  const entity = campaigns.find((item) => item.key === selected);
  const result = entity ? simulateIncrementalSpend(entity.projection, amount) : null;
  return <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800">Cenário de investimento</h3><p className="text-xs text-slate-500 mt-1">Estimativa direcional pelo histórico próprio da campanha.</p><label className="block text-xs font-bold text-slate-500 mt-5 mb-2">Campanha</label><select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">{campaigns.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><label className="block text-xs font-bold text-slate-500 mt-4 mb-2">Investimento incremental</label><input type="number" min={100} step={100} value={amount} onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" /><div className="mt-4">{entity && <ConfidenceBadge entity={entity} />}</div></div>
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><h3 className="font-bold text-slate-800">Impacto estimado</h3>{entity && result ? <><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5"><div className="bg-slate-50 rounded-xl p-4"><span className="text-xs text-slate-500">Impressões incrementais</span><strong className="block text-xl text-slate-800 mt-1">{number(result.impressions[0])}–{number(result.impressions[1])}</strong></div><div className="bg-slate-50 rounded-xl p-4"><span className="text-xs text-slate-500">Cliques incrementais</span><strong className="block text-xl text-slate-800 mt-1">{number(result.clicks[0])}–{number(result.clicks[1])}</strong></div><div className="bg-slate-50 rounded-xl p-4"><span className="text-xs text-slate-500">Conversões de plataforma</span><strong className="block text-xl text-slate-800 mt-1">{result.conversions ? `${number(result.conversions[0])}–${number(result.conversions[1])}` : 'Não estimável'}</strong></div></div><div className="mt-5 border border-amber-200 bg-amber-50 rounded-lg p-4 text-xs text-amber-800">Simulação correlacional. Conversão de plataforma não é cartão nem CAC. A faixa incorpora a volatilidade recente e não garante escala linear.</div></> : <div className="text-sm text-slate-400 mt-6">Selecione uma campanha com histórico.</div>}</div>
  </div>;
}

export function CampaignIntelligenceWorkspace() {
  const { filteredData, rawData, filters, objectives } = useFilters();
  const { targets, add: addTarget } = useTargets();
  const [mode, setMode] = useState<IntelligenceViewMode>(() => (localStorage.getItem('media_campaign_view_mode') as IntelligenceViewMode) || 'performance');
  const [metric, setMetric] = useState<IntelligenceMetric>('spend');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [campaignBudgets, setCampaignBudgets] = useState<any[]>([]);
  useEffect(() => { Promise.all([dataService.fetchPaidMediaBudgets(), dataService.fetchCampaignBudgets()]).then(([objective, campaign]) => { setBudgets(objective); setCampaignBudgets(campaign); }).catch(console.error); }, []);
  const scopedRows = useMemo(() => applyScope(rawData, filters), [rawData, filters]);
  const entities = useMemo(() => buildEntities(scopedRows, objectives, filters.dateRange.from, filters.dateRange.to), [scopedRows, objectives, filters.dateRange.from, filters.dateRange.to]);
  const signals = useMemo(() => entities.flatMap((entity) => diagnoseEntity(entity.key, entity.label, entity.comparison, entity.projection)).sort((a, b) => b.priorityScore - a.priorityScore), [entities]);
  const changeMode = (next: IntelligenceViewMode) => { setMode(next); localStorage.setItem('media_campaign_view_mode', next); };

  return <div className="space-y-6">
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1">{modes.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => changeMode(item.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === item.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}><Icon size={15} />{item.label}</button>; })}</div>
      {mode !== 'performance' && mode !== 'diagnosis' && mode !== 'opportunities' && mode !== 'simulation' && <MetricPicker value={metric} onChange={setMetric} />}
      {mode === 'simulation' && <span className="inline-flex items-center gap-2 text-xs text-slate-500 px-2"><Activity size={14} /> Modelo direcional e revisável</span>}
    </div>

    {mode === 'performance' && <><CampaignPerformanceTable data={filteredData} /><InsightsPanel /></>}
    {mode === 'goals' && <GoalsView entities={entities} targets={targets} budgets={budgets} campaignBudgets={campaignBudgets} metric={metric} onAddTarget={addTarget} selectedMonth={format(filters.dateRange.to, 'MM/yyyy')} />}
    {mode === 'comparison' && <ComparisonView entities={entities} metric={metric} />}
    {mode === 'diagnosis' && <DiagnosisView signals={signals} />}
    {mode === 'opportunities' && <OpportunitiesView signals={signals} />}
    {mode === 'simulation' && <SimulationView entities={entities} />}
    {mode !== 'performance' && <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1"><Settings2 size={13} /> Fonte: paid_media_metrics · mappings governados · apenas dias fechados · CPA é de plataforma, não CAC.</div>}
  </div>;
}
