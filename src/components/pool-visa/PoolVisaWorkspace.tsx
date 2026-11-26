import React, { useEffect, useMemo, useState } from 'react';
import { PoolVisaVitrine } from './vitrine/PoolVisaVitrine';
import { RefreshCw } from 'lucide-react';
import { ReportDailyModeControl, ReportKpiStrip, ReportWorkspaceHeader, type ReportView } from '../relatorio/ReportWorkspace';
import { ReportTimeSeriesChart } from '../relatorio/ReportTimeSeriesChart';
import { ReportDataTable } from '../relatorio/ReportDataTable';
import {
  aggregatePool, coverageLabel, dateRange, filterPoolRows, poolTotals,
  type PoolAggregate, type PoolDimensionKey, type PoolDispatchRow, type PoolFilters,
} from './poolVisaModel';
import {
  POOL_GROUP_LABELS, byDay, byMonth, knownGroupsAndCells, lpByPeriod, lpTotals, originsForChannels,
  type LpFilters, type LpTotals, type PoolCellKey, type PoolGroupKey,
} from './poolVisaLpModel';
import { POOL_FIELD_BY_KEY, formatPoolMetric, type PoolMetricField } from './poolVisaFields';
import { fetchPoolVisaDispatches, fetchPoolVisaLp, type PoolVisaLoad, type PoolVisaLpLoad } from './poolVisaService';
import { MetricCell, PartialBadge } from './PoolVisaExplorer';
import { BrandRankingCard, CellMatrixCard, DualTimeline, LpQualityCard, PartnerRankingCard, WhatsAppPiecesCard } from './PoolVisaLpPanels';

const VIEWS: ReportView[] = ['performance', 'daily', 'monthly', 'xlsx'];
const CHART_METRICS = ['sent', 'delivered', 'opens', 'clicks'] as const;
const fmtDate = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—');
const fmtMonth = (ym: string) => new Date(`${ym}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
const nf = (n: number) => n.toLocaleString('pt-BR');

const metric = (key: string) => POOL_FIELD_BY_KEY.get(key) as PoolMetricField;

/** Camadas de dado e o que se sabe de cada uma. Texto de estado, sem número externo. */
const LAYERS = [
  { key: 'sfmc', title: 'Comunicação · SFMC', state: 'Integrado', tone: 'ok', text: 'Enviados, entregues, aberturas e cliques por disparo, via importação para rentabilizacao_activities. Sem célula, sem custo e sem template vinculado.' },
  { key: 'ga4', title: 'LP dinâmica · GA4', state: 'Integrado', tone: 'ok', text: 'Sessões e cliques em /black afinz, carregados do GA4 para pool_visa_lp_*. O GA4 não tem BU. Grupo e célula entraram no clique_oferta em 26/11 e dependem da troca dos links do Pool; antes disso aparecem como não definido. O WhatsApp chega quase todo como tráfego direto, e pelo desenho o e-mail leva direto às ofertas.' },
  { key: 'vitrine', title: 'Vitrine e safra', state: 'Não integrado', tone: 'pending', text: 'Posição das marcas por rodada e população por célula vivem em DEs do SFMC, e a da vitrine já teve rodada alterada depois de usada. É preciso guardar extrações datadas antes de afirmar qual vitrine foi exibida.' },
  { key: 'negocio', title: 'Uso do cartão e compras', state: 'Sem fonte', tone: 'missing', text: 'Compra no estabelecimento ou na categoria da oferta depende da medição da IN e ainda não chegou ao GaaS. É a única fonte que mede ganho contra os controles. Clique não é compra.' },
] as const;

const maxDate = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);
const minDate = (a: string | null, b: string | null) => (!a ? b : !b ? a : a < b ? a : b);

export const PoolVisaWorkspace: React.FC = () => {
  const [view, setView] = useState<ReportView | 'vitrine'>(() => new URLSearchParams(window.location.search).get('aba') === 'vitrine' ? 'vitrine' : 'performance');
  const [load, setLoad] = useState<PoolVisaLoad | null>(null);
  const [lp, setLp] = useState<PoolVisaLpLoad | null>(null);
  const [error, setError] = useState('');
  const [lpError, setLpError] = useState('');
  const [busy, setBusy] = useState(true);
  const [filters, setFilters] = useState<PoolFilters>({ start: null, end: null, bu: 'all', channels: [], includeOptout: false });
  const [group, setGroup] = useState<PoolGroupKey | null>(null);
  const [cell, setCell] = useState<PoolCellKey | null>(null);
  const [chartMetric, setChartMetric] = useState<(typeof CHART_METRICS)[number]>('sent');
  const [split, setSplit] = useState<'channel' | 'bu'>('channel');
  const [accumulated, setAccumulated] = useState(false);

  const refresh = () => {
    setBusy(true);
    setError('');
    setLpError('');
    Promise.allSettled([fetchPoolVisaDispatches(), fetchPoolVisaLp()])
      .then(([sf, lpResult]) => {
        let min: string | null = null;
        let max: string | null = null;
        if (sf.status === 'fulfilled') {
          setLoad(sf.value);
          const r = dateRange(sf.value.rows);
          min = r.min; max = r.max;
        } else setError(sf.reason instanceof Error ? sf.reason.message : String(sf.reason));
        if (lpResult.status === 'fulfilled') {
          setLp(lpResult.value);
          for (const d of [...lpResult.value.traffic.map((r) => r.date), ...lpResult.value.events.map((r) => r.date)]) { min = minDate(min, d); max = maxDate(max, d); }
        } else setLpError(lpResult.reason instanceof Error ? lpResult.reason.message : String(lpResult.reason));
        setFilters((f) => ({ ...f, start: f.start ?? min, end: f.end ?? max }));
      })
      .finally(() => setBusy(false));
  };
  useEffect(refresh, []);

  const all = load?.rows ?? [];
  const rows = useMemo(() => filterPoolRows(all, filters), [all, filters]);
  const totals = useMemo(() => poolTotals(rows), [rows]);
  const channels = useMemo(() => [...new Set(all.map((r) => r.channel))].sort(), [all]);
  const fullRange = useMemo(() => {
    const r = dateRange(all);
    let { min, max } = r;
    for (const d of [...(lp?.traffic ?? []).map((x) => x.date), ...(lp?.events ?? []).map((x) => x.date)]) { min = minDate(min, d); max = maxDate(max, d); }
    return { min, max };
  }, [all, lp]);
  const lastUpdate = useMemo(() => all.reduce<string | null>((m, r) => (r.updatedAt && (!m || r.updatedAt > m) ? r.updatedAt : m), null), [all]);
  const optoutCount = useMemo(() => filterPoolRows(all, { ...filters, includeOptout: true }).filter((r) => r.kind === 'optout').length, [all, filters]);
  const buLabel = filters.bu === 'all' ? 'Afinz + Plurix' : filters.bu;

  const traffic = lp?.traffic ?? [];
  const events = lp?.events ?? [];
  const lpBlocked = filters.bu !== 'all';
  const lpFilters: LpFilters = useMemo(() => ({ start: filters.start, end: filters.end, origins: originsForChannels(filters.channels), group, cell }), [filters.start, filters.end, filters.channels, group, cell]);
  const lpTot = useMemo(() => lpTotals(traffic, events, lpFilters), [traffic, events, lpFilters]);
  const known = useMemo(() => knownGroupsAndCells(events), [events]);
  const lpReady = Boolean(lp);

  const kpi = (key: string, label: string) => {
    const f = metric(key);
    const c = f.coverage?.(totals);
    return { label, value: <span>{formatPoolMetric(f.value(totals), f.format)}<PartialBadge label={c ? coverageLabel(c) : null} /></span> };
  };
  const lpKpi = (label: string, value: number | null, title: string) => ({
    label,
    value: !lpReady ? <span className="text-sm text-slate-400">sem leitura</span>
      : lpBlocked ? <span className="text-sm text-slate-400" title="O GA4 não identifica BU">sem BU no GA4</span>
        : value === null ? <span className="text-sm text-slate-400" title="Visita não tem grupo nem célula">n/d com filtro</span>
          : <span title={title}>{nf(value)}</span>,
  });

  const groupCellTitle = 'Vale só para os dados da LP (GA4). Fica disponível quando os links do Pool levarem grupo e célula até a LP.';

  return (
    <section className="space-y-6" aria-label="Relatórios do Pool Visa">
      <ReportWorkspaceHeader
        title="Relatórios | Pool Visa"
        view={view === 'vitrine' ? null : view}
        extraView={<button type="button" aria-current={view === 'vitrine' ? 'page' : undefined} onClick={() => setView('vitrine')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${view === 'vitrine' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}>Vitrine Pool</button>}
        onViewChange={setView}
        views={VIEWS}
        description={<>{buLabel} · Pool de Ofertas Vai de Visa · SFMC{lastUpdate ? ` atualizado em ${new Date(lastUpdate).toLocaleDateString('pt-BR')}` : ''}{lp?.lastRun ? ` · GA4 lido em ${new Date(lp.lastRun.createdAt).toLocaleDateString('pt-BR')}` : ''}</>}
        actions={
          <button type="button" onClick={refresh} disabled={busy} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-xs font-black text-cyan-800 shadow-sm transition hover:bg-cyan-50 disabled:opacity-60">
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Recarregar
          </button>
        }
        summaryStrip={
          <ReportKpiStrip items={[
            kpi('sent', 'Enviados'), kpi('delivered', 'Entregues'), kpi('opens', 'Aberturas / leituras'), kpi('clicks', 'Cliques na comunicação'),
            lpKpi('LP · Sessões', lpTot.sessions, 'Soma diária de sessões em /black afinz (GA4)'),
            lpKpi('LP · Cliques em ofertas', lpTot.offerClicks, 'Eventos clique_oferta: contagem de eventos, não de pessoas'),
            lpKpi('LP · Cliques site Visa', lpTot.visaClicks, 'Eventos clique_site_visa'),
          ]} />
        }
      />

      {view === 'vitrine' ? <PoolVisaVitrine events={events} lpReady={lpReady} dispatches={all} /> : <>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{load ? ' Mostrando a última leitura carregada.' : ''}</div>}
      {lpError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Dados da LP (GA4) indisponíveis: {lpError}. A comunicação SFMC segue normal.</div>}
      {busy && !load && <p role="status" className="text-sm text-slate-500">Carregando os disparos do Pool…</p>}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">De
          <input type="date" value={filters.start ?? ''} min={fullRange.min ?? undefined} max={filters.end ?? undefined} onChange={(e) => setFilters({ ...filters, start: e.target.value || null })} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
        </label>
        <label className="text-xs font-semibold text-slate-600">Até
          <input type="date" value={filters.end ?? ''} min={filters.start ?? undefined} onChange={(e) => setFilters({ ...filters, end: e.target.value || null })} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
        </label>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="BU">
          {(['all', 'Afinz', 'Plurix'] as const).map((bu) => (
            <button key={bu} type="button" aria-pressed={filters.bu === bu} onClick={() => setFilters({ ...filters, bu })} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filters.bu === bu ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              {bu === 'all' ? 'Afinz + Plurix' : bu}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Canais">
          <span className="text-xs font-semibold text-slate-600">Canal</span>
          {channels.map((ch) => {
            const on = filters.channels.includes(ch);
            return (
              <button key={ch} type="button" aria-pressed={on} onClick={() => setFilters({ ...filters, channels: on ? filters.channels.filter((c) => c !== ch) : [...filters.channels, ch] })} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {ch}
              </button>
            );
          })}
          {filters.channels.length > 0 && <button type="button" onClick={() => setFilters({ ...filters, channels: [] })} className="text-[11px] text-slate-400 underline">todos</button>}
        </div>
        <label className="text-xs font-semibold text-slate-600" title={groupCellTitle}>Grupo
          <select aria-label="Grupo do Pool (LP)" value={group ?? ''} disabled={!known.groups.length} onChange={(e) => setGroup((e.target.value || null) as PoolGroupKey | null)} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:bg-slate-50 disabled:text-slate-400">
            <option value="">Todos</option>
            {known.groups.map((g) => <option key={g} value={g}>{POOL_GROUP_LABELS[g]}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600" title={groupCellTitle}>Célula
          <select aria-label="Célula do Pool (LP)" value={cell ?? ''} disabled={!known.cells.length} onChange={(e) => setCell((e.target.value || null) as PoolCellKey | null)} className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:bg-slate-50 disabled:text-slate-400">
            <option value="">Todas</option>
            {known.cells.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600" title="Linhas com token optout no nome: respostas automáticas de opt-out do WhatsApp, não disparos do Pool.">
          <input type="checkbox" checked={filters.includeOptout} onChange={(e) => setFilters({ ...filters, includeOptout: e.target.checked })} />
          Incluir respostas de opt-out ({optoutCount})
        </label>
        {(filters.start !== fullRange.min || filters.end !== fullRange.max) && (
          <button type="button" onClick={() => setFilters({ ...filters, start: fullRange.min, end: fullRange.max })} className="text-xs font-semibold text-cyan-700 underline">Todo o histórico do Pool</button>
        )}
      </div>
      {(group || cell) && <p className="-mt-3 text-[11px] text-slate-500">Filtro de grupo e célula aplicado só aos cliques da LP. A comunicação SFMC não tem célula e segue sem esse filtro.</p>}

      {load && !rows.length && view !== 'xlsx' && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {all.length
            ? <>Nenhum disparo do Pool entre {fmtDate(filters.start)} e {fmtDate(filters.end)} com esses filtros. O histórico vai de {fmtDate(fullRange.min)} a {fmtDate(fullRange.max)}.</>
            : <>Ainda não há disparos das jornadas do Pool Visa carregados em rentabilizacao_activities. Assim que a importação trouxer as jornadas, eles aparecem aqui.</>}
        </div>
      )}

      {load && view === 'performance' && (rows.length > 0 || traffic.length > 0) && (
        <div className="space-y-6">
          {filters.start && filters.end && <DualTimeline rows={rows} traffic={traffic} lpFilters={lpFilters} lpBlocked={lpBlocked || !lpReady} start={filters.start} end={filters.end} />}
          {lpReady && (
            <div className="grid gap-6 lg:grid-cols-2">
              <BrandRankingCard events={events} lpFilters={lpFilters} lpBlocked={lpBlocked} />
              <PartnerRankingCard events={events} lpFilters={lpFilters} lpBlocked={lpBlocked} />
            </div>
          )}
          <WhatsAppPiecesCard rows={rows} />
          {lpReady && <CellMatrixCard events={events} lpFilters={lpFilters} lpBlocked={lpBlocked} />}
          {lpReady && !lpBlocked && <LpQualityCard traffic={traffic} events={events} lpFilters={lpFilters} lastRun={lp?.lastRun ?? null} />}
          {rows.length > 0 && <Overview rows={rows} />}
        </div>
      )}
      {load && rows.length > 0 && (view === 'daily' || view === 'monthly') && (
        <TimeView
          rows={rows}
          lp={lpReady ? { traffic, events, filters: lpFilters, blocked: lpBlocked, coverage: lp?.coverage ?? null } : null}
          grain={view === 'daily' ? 'date' : 'month'}
          chartMetric={chartMetric}
          onChartMetric={setChartMetric}
          split={split}
          onSplit={setSplit}
          accumulated={accumulated}
          onAccumulated={setAccumulated}
        />
      )}
      {view === 'xlsx' && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
          <p className="text-3xl" aria-hidden="true">🚧</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Ainda faremos algo aqui...</p>
        </div>
      )}

      <CoveragePanel load={load} />
      </>}
    </section>
  );
};

const aggCols = (keys: string[]) => keys.map((k) => {
  const f = metric(k);
  return { key: k, label: f.label, render: (r: PoolAggregate) => <MetricCell field={f} row={r} />, csv: (r: PoolAggregate) => f.value(r) };
});

const Overview: React.FC<{ rows: PoolDispatchRow[] }> = ({ rows }) => {
  const mix = useMemo(() => aggregatePool(rows, ['bu', 'channel']).sort((a, b) => a.dims.bu.localeCompare(b.dims.bu) || a.dims.channel.localeCompare(b.dims.channel)), [rows]);
  return (
    <ReportDataTable
      title="Mix por BU e canal"
      kicker="Overview · comunicação SFMC"
      rows={mix}
      rowKey={(r) => r.key}
      firstLabel="BU · Canal"
      firstValue={(r) => `${r.dims.bu} · ${r.dims.channel}`}
      columns={aggCols(['dispatches', 'sent', 'delivered', 'deliveryRate', 'opens', 'openRate', 'clicks', 'ctrDelivered', 'ctor'])}
      minWidth={1000}
    />
  );
};

/** Disparos por dia, BU, canal e toque. Só aparece no Diário. */
const DispatchByTouchTable: React.FC<{ rows: PoolDispatchRow[] }> = ({ rows }) => {
  const timeline = useMemo(() => aggregatePool(rows, ['date', 'bu', 'channel', 'touch', 'kind']).sort((a, b) => a.dims.date.localeCompare(b.dims.date) || a.dims.bu.localeCompare(b.dims.bu)), [rows]);
  const cols = aggCols;
  return (
      <ReportDataTable
        title="Disparos por dia e toque"
        kicker="Diário · comunicação SFMC"
        rows={timeline}
        rowKey={(r) => r.key}
        firstLabel="Data"
        firstValue={(r) => fmtDate(r.dims.date)}
        columns={[
          { key: 'bu', label: 'BU', render: (r) => r.dims.bu, csv: (r) => r.dims.bu },
          { key: 'channel', label: 'Canal', render: (r) => r.dims.channel, csv: (r) => r.dims.channel },
          { key: 'touch', label: 'Toque', render: (r) => r.dims.touch, csv: (r) => r.dims.touch },
          { key: 'kind', label: 'Tipo', render: (r) => r.dims.kind, csv: (r) => r.dims.kind },
          { key: 'pieces', label: 'Peças', render: (r) => r.dispatches, csv: (r) => r.dispatches },
          ...cols(['sent', 'delivered', 'deliveryRate', 'opens', 'clicks']),
        ]}
        csvName="pool-visa-linha-do-tempo.csv"
        minWidth={1000}
      />
  );
};

interface PeriodRow { key: string; sf: PoolAggregate | null; lp: LpTotals | null }

const TimeView: React.FC<{
  rows: PoolDispatchRow[];
  lp: { traffic: PoolVisaLpLoad['traffic']; events: PoolVisaLpLoad['events']; filters: LpFilters; blocked: boolean; coverage: PoolVisaLpLoad['coverage'] } | null;
  grain: 'date' | 'month';
  chartMetric: (typeof CHART_METRICS)[number];
  onChartMetric: (m: (typeof CHART_METRICS)[number]) => void;
  split: 'channel' | 'bu';
  onSplit: (s: 'channel' | 'bu') => void;
  accumulated: boolean;
  onAccumulated: (v: boolean) => void;
}> = ({ rows, lp, grain, chartMetric, onChartMetric, split, onSplit, accumulated, onAccumulated }) => {
  const field = metric(chartMetric);
  const periodRows = useMemo<PeriodRow[]>(() => {
    const sf = new Map(aggregatePool(rows, [grain]).map((a) => [a.dims[grain], a]));
    const lpMap = lp && !lp.blocked ? lpByPeriod(lp.traffic, lp.events, lp.filters, grain === 'date' ? byDay : byMonth) : new Map<string, LpTotals>();
    return [...new Set([...sf.keys(), ...lpMap.keys()])].sort().map((k) => ({ key: k, sf: sf.get(k) ?? null, lp: lpMap.get(k) ?? null }));
  }, [rows, lp, grain]);
  const chart = useMemo(() => {
    const cells = aggregatePool(rows, [grain, split] as PoolDimensionKey[]);
    const series = [...new Set(cells.map((c) => c.dims[split]))].sort();
    const periods = [...new Set(cells.map((c) => c.dims[grain]))].sort();
    const running: Record<string, number | null> = {};
    const data = periods.map((p) => {
      const point: Record<string, string | number | null> = { label: grain === 'date' ? fmtDate(p).slice(0, 5) : fmtMonth(p) };
      for (const s of series) {
        const c = cells.find((x) => x.dims[grain] === p && x.dims[split] === s);
        const v = c ? field.value(c) : null;
        if (accumulated) {
          if (v !== null) running[s] = (running[s] ?? 0) + v;
          point[s] = running[s] ?? null;
        } else point[s] = v;
      }
      return point;
    });
    return { data, series };
  }, [rows, grain, split, field, accumulated]);
  const singleMonth = grain === 'month' && periodRows.length === 1;
  const sfCols = ['sent', 'delivered', 'deliveryRate', 'opens', 'openRate', 'clicks', 'ctrDelivered'].map((k) => {
    const f = metric(k);
    return {
      key: k, label: f.label,
      render: (r: PeriodRow) => (r.sf ? <MetricCell field={f} row={r.sf} /> : k === 'sent' ? <span className="text-slate-400">sem disparo</span> : null),
      csv: (r: PeriodRow) => (r.sf ? f.value(r.sf) : null),
    };
  });
  const covered = (key: string) => {
    const c = lp?.coverage;
    if (!c) return false;
    return grain === 'date' ? key >= c.start && key <= c.end : key >= c.start.slice(0, 7) && key <= c.end.slice(0, 7);
  };
  // Período fora das cargas do GA4 é desconhecido (n/d), não zero.
  const lpVal = (r: PeriodRow, k: keyof LpTotals) => (lp?.blocked || !lp ? null : r.lp ? r.lp[k] : covered(r.key) ? 0 : null);
  const lpCol = (k: keyof LpTotals, label: string) => ({
    key: `lp_${k}`, label,
    render: (r: PeriodRow) => {
      const v = lpVal(r, k);
      return v === null ? <span className="text-slate-400">{lp?.blocked ? 'sem BU' : 'n/d'}</span> : <span className="text-violet-800">{nf(v)}</span>;
    },
    csv: (r: PeriodRow) => lpVal(r, k),
  });

  return (
    <div className="space-y-6">
      <ReportTimeSeriesChart
        title={grain === 'date' ? 'Evolução por dia de disparo' : 'Evolução por mês'}
        kicker={grain === 'date' ? 'Diário · comunicação SFMC' : 'Mensal · comunicação SFMC'}
        description={
          <>
            Só aparecem dias com disparo registrado. Barra ausente = canal sem disparo naquele dia ou métrica não informada pela fonte (o SMS não informa abertura nem clique; o WhatsApp não informa clique).
            {singleMonth && ' Há um único mês com dados do Pool no recorte, então ainda não existe comparação mês a mês.'}
          </>
        }
        data={chart.data}
        xKey="label"
        series={chart.series}
        formatValue={(v) => v.toLocaleString('pt-BR')}
        labelPrefix={grain === 'date' ? 'Dia' : 'Mês'}
        controls={
          <>
            <select aria-label="Métrica do gráfico" value={chartMetric} onChange={(e) => onChartMetric(e.target.value as (typeof CHART_METRICS)[number])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
              {CHART_METRICS.map((k) => <option key={k} value={k}>{metric(k).label}</option>)}
            </select>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(['channel', 'bu'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={split === s} onClick={() => onSplit(s)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${split === s ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {s === 'channel' ? 'Por canal' : 'Por BU'}
                </button>
              ))}
            </div>
            <ReportDailyModeControl accumulated={accumulated} onChange={onAccumulated} />
          </>
        }
      />
      <ReportDataTable
        title={grain === 'date' ? 'Resultados por dia' : 'Resultados por mês'}
        kicker="Comunicação SFMC e LP GA4 lado a lado · sem taxa entre as duas"
        rows={periodRows}
        rowKey={(r) => r.key}
        firstLabel={grain === 'date' ? 'Dia' : 'Mês'}
        firstValue={(r) => (grain === 'date' ? fmtDate(r.key) : fmtMonth(r.key))}
        columns={[
          ...sfCols,
          lpCol('sessions', 'LP · Sessões'),
          lpCol('offerClicks', 'LP · Cliques em ofertas'),
          lpCol('visaClicks', 'LP · Cliques site Visa'),
        ]}
        csvName={grain === 'date' ? 'pool-visa-diario.csv' : 'pool-visa-mensal.csv'}
        minWidth={1200}
      />
      {grain === 'date' && <DispatchByTouchTable rows={rows} />}
    </div>
  );
};

const CoveragePanel: React.FC<{ load: PoolVisaLoad | null }> = ({ load }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Fontes e cobertura">
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Fontes e cobertura</p>
    <h3 className="text-base font-bold text-slate-900">O que esta página mede e o que ainda não mede</h3>
    <p className="mt-1 text-xs text-slate-500">
      Cada camada tem fonte e grão próprios. Esta página não calcula taxa entre camadas (por exemplo, sessões na LP ÷ enviados), porque não existe chave comum nem janela definida.
      {load && ` Leitura feita em ${new Date(load.fetchedAt).toLocaleString('pt-BR')}.`}
      {load && load.discarded > 0 && ` ${load.discarded} linha(s) da fonte ignorada(s) por data inválida.`}
    </p>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {LAYERS.map((l) => (
        <div key={l.key} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">{l.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${l.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : l.tone === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{l.state}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{l.text}</p>
        </div>
      ))}
    </div>
  </section>
);
