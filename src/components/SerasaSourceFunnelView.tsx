import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Database, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';
import { FunnelStageLabel, GranularityToggle, SeriesConfigurator, StageMetricCell, granularityLabel, type FunnelGranularity } from './FunnelDetailControls';
import { OnboardingFunnelWorkspace } from './OnboardingFunnelWorkspace';

type Source = 'marketplace' | 'bi';
type MetricKey =
  | 'ofertasMarketplace'
  | 'pedidosMarketplace'
  | 'confirmadosMarketplace'
  | 'aprovadosMarketplace'
  | 'consultasNeurotech'
  | 'aprovadosNeurotech'
  | 'pedidosConfirmadosJourney'
  | 'fotoBiometria'
  | 'documentos'
  | 'assinaturas'
  | 'emitidos'
  | 'consultasMotor'
  | 'cpfsUnicos'
  | 'aprovados'
  | 'ofertas'
  | 'pedidosCriados'
  | 'pedidosConfirmados'
  | 'cartoes';
type CostKey = 'feeCanal' | 'cpa' | 'custosCredito' | 'custosPlastico' | 'custosEnvio' | 'cacCanal';
type QualityStatus = 'complete' | 'partial' | 'suspect';

type FunnelRow = Record<MetricKey | CostKey, number | null> & {
  data: string;
  date: Date;
  qualityStatus: QualityStatus;
  qualityNotes: string[];
  sourceSheet: string | null;
  sourceHash: string | null;
};

type StageConfig = {
  key: MetricKey;
  label: string;
  color: string;
  denominatorKey?: MetricKey;
};

type GroupedRow = {
  key: string;
  label: string;
  rows: FunnelRow[];
};

const marketplaceStages: StageConfig[] = [
  { key: 'ofertasMarketplace', label: 'Ofertas', color: '#0f2d64' },
  { key: 'pedidosMarketplace', label: 'Pedidos', color: '#2563eb' },
  { key: 'confirmadosMarketplace', label: 'Confirmados', color: '#7c3aed' },
  { key: 'aprovadosMarketplace', label: 'Aprovados', color: '#0d9488' },
];

const biStages: StageConfig[] = [
  { key: 'consultasNeurotech', label: 'Consultas Neurotech', color: '#0f2d64' },
  { key: 'aprovadosNeurotech', label: 'Aprovados Neurotech', color: '#2563eb', denominatorKey: 'consultasNeurotech' },
  { key: 'pedidosConfirmadosJourney', label: 'Pedidos confirmados', color: '#7c3aed', denominatorKey: 'aprovadosNeurotech' },
  { key: 'fotoBiometria', label: 'Envio foto biometria', color: '#d97706', denominatorKey: 'pedidosConfirmadosJourney' },
  { key: 'documentos', label: 'Envio documento', color: '#ea580c', denominatorKey: 'pedidosConfirmadosJourney' },
  { key: 'assinaturas', label: 'Assinatura do cartão', color: '#db2777', denominatorKey: 'pedidosConfirmadosJourney' },
  { key: 'emitidos', label: 'Total emitidos', color: '#0d9488', denominatorKey: 'pedidosConfirmadosJourney' },
];

const integratedBiStages: StageConfig[] = [
  { key: 'consultasMotor', label: 'Consultas motor', color: '#0f2d64' },
  { key: 'cpfsUnicos', label: 'CPFs únicos', color: '#2563eb' },
  { key: 'aprovados', label: 'Aprovados', color: '#7c3aed' },
  { key: 'ofertas', label: 'Ofertas exibidas', color: '#d97706' },
  { key: 'pedidosCriados', label: 'Pedidos criados', color: '#ea580c' },
  { key: 'pedidosConfirmados', label: 'Pedidos confirmados', color: '#db2777' },
  { key: 'cartoes', label: 'Cartões', color: '#0d9488' },
];

const costColumns: Array<{ key: CostKey; label: string; currency: boolean }> = [
  { key: 'feeCanal', label: 'Fee canal', currency: true },
  { key: 'cpa', label: 'CPA BI', currency: true },
  { key: 'custosCredito', label: 'Custo crédito', currency: true },
  { key: 'custosPlastico', label: 'Custo plástico', currency: true },
  { key: 'custosEnvio', label: 'Custo envio', currency: true },
  { key: 'cacCanal', label: 'CAC canal BI', currency: true },
];

const emptyMetrics = (): Record<MetricKey | CostKey, null> => ({
  ofertasMarketplace: null,
  pedidosMarketplace: null,
  confirmadosMarketplace: null,
  aprovadosMarketplace: null,
  consultasNeurotech: null,
  aprovadosNeurotech: null,
  pedidosConfirmadosJourney: null,
  fotoBiometria: null,
  documentos: null,
  assinaturas: null,
  emitidos: null,
  consultasMotor: null,
  cpfsUnicos: null,
  aprovados: null,
  ofertas: null,
  pedidosCriados: null,
  pedidosConfirmados: null,
  cartoes: null,
  feeCanal: null,
  cpa: null,
  custosCredito: null,
  custosPlastico: null,
  custosEnvio: null,
  cacCanal: null,
});

const asNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const formatNumber = (value: number | null) => value == null ? '—' : Math.round(value).toLocaleString('pt-BR');
const formatCurrency = (value: number | null) => value == null ? '—' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
const formatRate = (value: number | null, digits = 2) => value == null ? '—' : `${value.toFixed(digits).replace('.', ',')}%`;
const sumMetric = (rows: FunnelRow[], key: MetricKey | CostKey): number | null => {
  const values = rows.map(row => row[key]).filter((value): value is number => value != null);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
};
const weightedMetric = (rows: FunnelRow[], key: CostKey, weightKey: MetricKey): number | null => {
  const comparable = rows.filter(row => row[key] != null && row[weightKey] != null && (row[weightKey] ?? 0) > 0);
  const weight = comparable.reduce((total, row) => total + (row[weightKey] ?? 0), 0);
  return weight > 0
    ? comparable.reduce((total, row) => total + (row[key] ?? 0) * (row[weightKey] ?? 0), 0) / weight
    : null;
};
const comparableRate = (rows: FunnelRow[], numerator: MetricKey, denominator: MetricKey): number | null => {
  const comparable = rows.filter(row => row[numerator] != null && row[denominator] != null);
  const numeratorTotal = comparable.reduce((total, row) => total + (row[numerator] ?? 0), 0);
  const denominatorTotal = comparable.reduce((total, row) => total + (row[denominator] ?? 0), 0);
  return denominatorTotal > 0 ? numeratorTotal / denominatorTotal * 100 : null;
};
const comparableDays = (rows: FunnelRow[], numerator: MetricKey, denominator: MetricKey) =>
  rows.filter(row => row[numerator] != null && row[denominator] != null).length;
const stageDenominator = (stages: StageConfig[], index: number): MetricKey | null =>
  stages[index]?.denominatorKey ?? stages[index - 1]?.key ?? null;

const periodKey = (date: Date, granularity: FunnelGranularity) => {
  if (granularity === 'daily') return iso(date);
  if (granularity === 'monthly') return iso(date).slice(0, 7);
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return iso(monday);
};

const groupRows = (rows: FunnelRow[], granularity: FunnelGranularity): GroupedRow[] => {
  const groups = new Map<string, FunnelRow[]>();
  rows.forEach(row => {
    const key = periodKey(row.date, granularity);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, values]) => {
    const first = values[0].date;
    const last = values.at(-1)?.date ?? first;
    const label = granularity === 'daily'
      ? shortDate(first)
      : granularity === 'weekly'
        ? `${shortDate(first)}–${shortDate(last)}`
        : first.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
    return { key, label, rows: values };
  });
};

const sourceStatus = (rows: FunnelRow[]): QualityStatus => {
  if (rows.some(row => row.qualityStatus === 'suspect')) return 'suspect';
  if (rows.some(row => row.qualityStatus === 'partial')) return 'partial';
  return 'complete';
};

const escapeCsv = (value: string | number | null) => {
  if (value == null) return '';
  const text = String(value);
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const downloadCsv = (name: string, header: string[], rows: Array<Array<string | number | null>>) => {
  const csv = [header, ...rows].map(row => row.map(escapeCsv).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const SerasaSourceFunnelView: React.FC<{ source: Source; navigation: React.ReactNode }> = ({ source, navigation }) => {
  const { startDate, endDate } = usePeriod();
  const stages = source === 'marketplace' ? marketplaceStages : biStages;
  const [marketplaceRows, setMarketplaceRows] = useState<FunnelRow[]>([]);
  const [biJourneyRows, setBiJourneyRows] = useState<FunnelRow[]>([]);
  const [biIntegratedRows, setBiIntegratedRows] = useState<FunnelRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<FunnelGranularity>('daily');
  const [detailGranularity, setDetailGranularity] = useState<FunnelGranularity>('daily');
  const [selectedStages, setSelectedStages] = useState<MetricKey[]>(() => stages.map(stage => stage.key));
  const [selectedRates, setSelectedRates] = useState<MetricKey[]>(() => source === 'marketplace'
    ? ['pedidosMarketplace', 'confirmadosMarketplace', 'aprovadosMarketplace']
    : ['aprovadosNeurotech', 'pedidosConfirmadosJourney', 'documentos', 'emitidos']);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [marketplaceResult, biJourneyResult, biIntegratedResult] = await Promise.all([
        supabase
          .from('serasa_marketplace_daily_funnel')
          .select('data, ofertas, pedidos, confirmados, aprovados, quality_status, quality_notes, source_hash')
          .order('data', { ascending: true }),
        supabase
          .from('serasa_bi_neurotech_daily_funnel')
          .select('data, consultas_neurotech, aprovados_neurotech, pedidos_confirmados, env_foto_biometria, env_documento, assinatura_cartao, total_emitidos, quality_status, quality_notes, source_file, source_hash')
          .order('data', { ascending: true }),
        supabase
          .from('serasa_bi_daily_funnel')
          .select('data, consultas_motor, cpfs_unicos, aprovados_cpfs_unicos, ofertas_exibidas, pedidos_criados, pedidos_confirmados, cartoes, fee_canal, cpa, custos_credito, custos_plastico, custos_envio, cac_canal, quality_status, quality_notes, source_sheet, source_hash')
          .order('data', { ascending: true }),
      ]);
      if (!active) return;
      if (marketplaceResult.error || biJourneyResult.error || biIntegratedResult.error) {
        setError([
          marketplaceResult.error?.message,
          biJourneyResult.error?.message,
          biIntegratedResult.error?.message,
        ].filter(Boolean).join(' · '));
      }
      setMarketplaceRows((marketplaceResult.data ?? []).map(raw => ({
        ...emptyMetrics(),
        data: raw.data,
        date: parseDate(raw.data),
        ofertasMarketplace: asNumber(raw.ofertas),
        pedidosMarketplace: asNumber(raw.pedidos),
        confirmadosMarketplace: asNumber(raw.confirmados),
        aprovadosMarketplace: asNumber(raw.aprovados),
        qualityStatus: (raw.quality_status as QualityStatus) ?? 'partial',
        qualityNotes: Array.isArray(raw.quality_notes) ? raw.quality_notes : [],
        sourceSheet: null,
        sourceHash: raw.source_hash,
      })));
      setBiJourneyRows((biJourneyResult.data ?? []).map(raw => ({
        ...emptyMetrics(),
        data: raw.data,
        date: parseDate(raw.data),
        consultasNeurotech: asNumber(raw.consultas_neurotech),
        aprovadosNeurotech: asNumber(raw.aprovados_neurotech),
        pedidosConfirmadosJourney: asNumber(raw.pedidos_confirmados),
        fotoBiometria: asNumber(raw.env_foto_biometria),
        documentos: asNumber(raw.env_documento),
        assinaturas: asNumber(raw.assinatura_cartao),
        emitidos: asNumber(raw.total_emitidos),
        qualityStatus: (raw.quality_status as QualityStatus) ?? 'partial',
        qualityNotes: Array.isArray(raw.quality_notes) ? raw.quality_notes : [],
        sourceSheet: raw.source_file,
        sourceHash: raw.source_hash,
      })));
      setBiIntegratedRows((biIntegratedResult.data ?? []).map(raw => ({
        ...emptyMetrics(),
        data: raw.data,
        date: parseDate(raw.data),
        consultasMotor: asNumber(raw.consultas_motor),
        cpfsUnicos: asNumber(raw.cpfs_unicos),
        aprovados: asNumber(raw.aprovados_cpfs_unicos),
        ofertas: asNumber(raw.ofertas_exibidas),
        pedidosCriados: asNumber(raw.pedidos_criados),
        pedidosConfirmados: asNumber(raw.pedidos_confirmados),
        cartoes: asNumber(raw.cartoes),
        feeCanal: asNumber(raw.fee_canal),
        cpa: asNumber(raw.cpa),
        custosCredito: asNumber(raw.custos_credito),
        custosPlastico: asNumber(raw.custos_plastico),
        custosEnvio: asNumber(raw.custos_envio),
        cacCanal: asNumber(raw.cac_canal),
        qualityStatus: (raw.quality_status as QualityStatus) ?? 'partial',
        qualityNotes: Array.isArray(raw.quality_notes) ? raw.quality_notes : [],
        sourceSheet: raw.source_sheet,
        sourceHash: raw.source_hash,
      })));
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, []);

  const sourceRows = source === 'marketplace' ? marketplaceRows : biJourneyRows;
  const start = useMemo(() => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()), [startDate]);
  const end = useMemo(() => new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999), [endDate]);
  const current = useMemo(() => sourceRows.filter(row => row.date >= start && row.date <= end), [sourceRows, start, end]);
  const currentMarketplace = useMemo(() => marketplaceRows.filter(row => row.date >= start && row.date <= end), [marketplaceRows, start, end]);
  const currentBiJourney = useMemo(() => biJourneyRows.filter(row => row.date >= start && row.date <= end), [biJourneyRows, start, end]);
  const currentBiIntegrated = useMemo(() => biIntegratedRows.filter(row => row.date >= start && row.date <= end), [biIntegratedRows, start, end]);
  const periodLabel = `${startDate.toLocaleDateString('pt-BR')} – ${endDate.toLocaleDateString('pt-BR')}`;
  const lastDate = sourceRows.at(-1)?.date ?? null;
  const lastComplete = [...sourceRows].reverse().find(row => row.qualityStatus === 'complete')?.date ?? null;
  const partialDays = current.filter(row => row.qualityStatus !== 'complete').length;

  const rateStages = stages.slice(1);
  const chartData = useMemo(() => {
    const limit = granularity === 'daily' ? 31 : granularity === 'weekly' ? 12 : 7;
    return groupRows(current, granularity).slice(-limit).map(group => {
      const values: Record<string, string | number | null> = { period: group.label };
      stages.forEach(stage => { values[stage.key] = sumMetric(group.rows, stage.key); });
      stages.slice(1).forEach((stage, index) => {
        const denominator = stageDenominator(stages, index + 1);
        values[`rate_${stage.key}`] = denominator ? comparableRate(group.rows, stage.key, denominator) : null;
      });
      return values;
    });
  }, [current, granularity, stages]);

  const detailRows = useMemo(() => groupRows(current, detailGranularity), [current, detailGranularity]);
  const biByDate = useMemo(() => new Map(currentBiIntegrated.map(row => [row.data, row])), [currentBiIntegrated]);
  const reconciliation = useMemo(() => currentMarketplace
    .map(marketplace => ({ marketplace, bi: biByDate.get(marketplace.data) }))
    .filter((pair): pair is { marketplace: FunnelRow; bi: FunnelRow } =>
      pair.bi != null
      && pair.marketplace.ofertasMarketplace != null
      && pair.marketplace.pedidosMarketplace != null
      && pair.marketplace.confirmadosMarketplace != null
      && pair.bi.ofertas != null
      && pair.bi.pedidosCriados != null
      && pair.bi.pedidosConfirmados != null), [currentMarketplace, biByDate]);
  const reconciliationTotals = useMemo(() => {
    const marketplaceOffers = reconciliation.reduce((total, pair) => total + (pair.marketplace.ofertasMarketplace ?? 0), 0);
    const biOffers = reconciliation.reduce((total, pair) => total + (pair.bi.ofertas ?? 0), 0);
    const marketplaceOrders = reconciliation.reduce((total, pair) => total + (pair.marketplace.pedidosMarketplace ?? 0), 0);
    const biOrders = reconciliation.reduce((total, pair) => total + (pair.bi.pedidosCriados ?? 0), 0);
    const marketplaceConfirmed = reconciliation.reduce((total, pair) => total + (pair.marketplace.confirmadosMarketplace ?? 0), 0);
    const biConfirmed = reconciliation.reduce((total, pair) => total + (pair.bi.pedidosConfirmados ?? 0), 0);
    const delta = (marketplace: number, bi: number) => bi ? (marketplace - bi) / bi * 100 : null;
    return {
      marketplaceOffers,
      biOffers,
      marketplaceOrders,
      biOrders,
      marketplaceConfirmed,
      biConfirmed,
      offersDelta: delta(marketplaceOffers, biOffers),
      ordersDelta: delta(marketplaceOrders, biOrders),
      confirmedDelta: delta(marketplaceConfirmed, biConfirmed),
    };
  }, [reconciliation]);

  const toggleStage = (key: MetricKey) => setSelectedStages(values =>
    values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  const toggleRate = (key: MetricKey) => setSelectedRates(values =>
    values.includes(key)
      ? values.filter(value => value !== key)
      : values.length >= 4 ? [...values.slice(1), key] : [...values, key]);

  const exportData = () => {
    if (source === 'marketplace') {
      downloadCsv(
        `funil-api-serasa-marketplace-${iso(start)}-${iso(end)}.csv`,
        ['Data', 'Ofertas Marketplace', 'Pedidos Marketplace', 'Taxa pedidos', 'Confirmados Marketplace', 'Taxa confirmação', 'Aprovados Marketplace', 'Taxa aprovação', 'Ofertas BI', 'Pedidos criados BI', 'Pedidos confirmados BI', 'Qualidade', 'Notas'],
        currentMarketplace.map(marketplace => {
          const bi = biByDate.get(marketplace.data);
          return [
            marketplace.data,
            marketplace.ofertasMarketplace,
            marketplace.pedidosMarketplace,
            comparableRate([marketplace], 'pedidosMarketplace', 'ofertasMarketplace'),
            marketplace.confirmadosMarketplace,
            comparableRate([marketplace], 'confirmadosMarketplace', 'pedidosMarketplace'),
            marketplace.aprovadosMarketplace,
            comparableRate([marketplace], 'aprovadosMarketplace', 'confirmadosMarketplace'),
            bi?.ofertas ?? null,
            bi?.pedidosCriados ?? null,
            bi?.pedidosConfirmados ?? null,
            marketplace.qualityStatus,
            marketplace.qualityNotes.join(','),
          ];
        }),
      );
      return;
    }
    downloadCsv(
      `funil-api-serasa-bi-${iso(start)}-${iso(end)}.csv`,
      [
        'Data',
        ...biStages.map(stage => stage.label),
        'Qualidade Neurotech',
        'Notas Neurotech',
        'Fonte histórica',
        ...integratedBiStages.map(stage => `Integrado · ${stage.label}`),
        ...costColumns.map(column => `Integrado · ${column.label}`),
        'Qualidade Integrado',
        'Notas Integrado',
        'Aba Integrado',
      ],
      currentBiJourney.map(row => {
        const integrated = biByDate.get(row.data);
        return [
          row.data,
          ...biStages.map(stage => row[stage.key]),
          row.qualityStatus,
          row.qualityNotes.join(','),
          row.sourceSheet,
          ...integratedBiStages.map(stage => integrated?.[stage.key] ?? null),
          ...costColumns.map(column => integrated?.[column.key] ?? null),
          integrated?.qualityStatus ?? null,
          integrated?.qualityNotes.join(',') ?? null,
          integrated?.sourceSheet ?? null,
        ];
      }),
    );
  };

  const stageCards = stages.map((stage, index) => {
    const denominator = stageDenominator(stages, index);
    return {
      ...stage,
      value: sumMetric(current, stage.key),
      rate: denominator ? comparableRate(current, stage.key, denominator) : null,
      comparable: denominator ? comparableDays(current, stage.key, denominator) : current.filter(row => row[stage.key] != null).length,
      coverage: current.filter(row => row[stage.key] != null).length,
    };
  });
  const integratedStageCards = integratedBiStages.map(stage => ({
    ...stage,
    value: sumMetric(currentBiIntegrated, stage.key),
    coverage: currentBiIntegrated.filter(row => row[stage.key] != null).length,
  }));

  const sourceComplete = sourceStatus(current);
  const sourceLabel = source === 'marketplace' ? 'Marketplace · ofertas e pedidos diários' : 'Serasa BI · Neurotech + Integrado diário';
  const sourceDescription = source === 'marketplace'
    ? 'Fonte Marketplace com 100% dos volumes recebidos. O dia corrente permanece parcial e as taxas são recalculadas a partir dos volumes.'
    : 'Funil histórico Neurotech restaurado na sequência principal. Ausências continuam nulas; o Integrado diário permanece separado como base complementar.';

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-800">
      <div className="mx-auto max-w-[1780px] space-y-4">
        <OnboardingFunnelWorkspace
          navigation={navigation}
          sidebarMeta={(
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  sourceComplete === 'complete'
                    ? 'border-emerald-200/40 bg-emerald-50 text-emerald-900'
                    : sourceComplete === 'suspect'
                      ? 'border-red-200/40 bg-red-50 text-red-900'
                      : 'border-amber-200/40 bg-amber-50 text-amber-900'
                }`}>
                  {sourceComplete === 'complete' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  {loading ? 'Carregando fonte' : `Dados até ${lastDate?.toLocaleDateString('pt-BR') ?? '—'}`}
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-blue-200/50 bg-blue-50 px-3 py-2 text-[10px] leading-relaxed text-blue-950">
                  <Database size={14} className="mt-0.5 shrink-0" />
                  <span><strong>Fonte:</strong> {sourceLabel}</span>
                </div>
              </div>
              {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
              <div className="mt-4 grid gap-x-4 gap-y-3 text-[10px] sm:grid-cols-2 xl:grid-cols-1">
                <div><span className="text-white/55">Último registro</span><p className="font-semibold text-white">{lastDate?.toLocaleDateString('pt-BR') ?? '—'}</p></div>
                <div><span className="text-white/55">Último dia completo</span><p className="font-semibold text-white">{lastComplete?.toLocaleDateString('pt-BR') ?? '—'}</p></div>
                <div><span className="text-white/55">Dias no período</span><p className="font-semibold text-white">{current.length}</p></div>
                <div><span className="text-white/55">Qualidade</span><p className={`font-semibold ${partialDays ? 'text-amber-200' : 'text-emerald-200'}`}>{partialDays ? `${partialDays} dias com ressalva` : 'Período completo'}</p></div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-white/75"><Info size={13} className="mt-0.5 shrink-0" /> {sourceDescription}</p>
            </>
          )}
        >
          <section className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Período analisado</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={16} /> {periodLabel}</p>
            </div>
          </section>

          <section className="order-2 border-t border-slate-200 px-4 pb-4 pt-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold text-slate-950">Evolução do funil</h2><p className="text-xs text-slate-500">Volumes em barras; razões entre etapas calculadas somente nos dias comparáveis.</p></div>
              <GranularityToggle value={granularity} onChange={setGranularity} />
            </div>
            <SeriesConfigurator summary={`${selectedStages.length} volumes · ${selectedRates.length}/4 taxas`}>
              <div className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap bg-slate-50/60 text-[10px]">
                <span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide text-slate-500">Volumes</span>
                {stages.map((stage, index) => (
                  <button key={stage.key} type="button" onClick={() => toggleStage(stage.key)} aria-pressed={selectedStages.includes(stage.key)} className={`flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selectedStages.includes(stage.key) ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white'}`}>
                    <span className="h-2 w-2" style={{ backgroundColor: selectedStages.includes(stage.key) ? stage.color : '#cbd5e1' }} />
                    <FunnelStageLabel index={index} label={stage.label} compact />
                  </button>
                ))}
              </div>
              <div className="flex flex-nowrap items-center overflow-x-auto whitespace-nowrap border-t border-slate-200 text-[10px]">
                <span className="border-r border-slate-200 px-2 py-2 font-semibold uppercase tracking-wide text-slate-500">Taxas</span>
                {rateStages.map((stage, index) => (
                  <button key={stage.key} type="button" onClick={() => toggleRate(stage.key)} aria-pressed={selectedRates.includes(stage.key)} className={`flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-2.5 py-2 font-semibold ${selectedRates.includes(stage.key) ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white'}`}>
                    <span className="h-2 w-2" style={{ backgroundColor: selectedRates.includes(stage.key) ? stage.color : '#cbd5e1' }} />
                    {stage.label} ÷ {stages.find(candidate => candidate.key === stageDenominator(stages, index + 1))?.label ?? 'base'}
                  </button>
                ))}
                <span className="shrink-0 px-2 py-2 text-slate-400">máx. 4</span>
              </div>
            </SeriesConfigurator>
            <div className="mt-2 h-[355px]">
              {current.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Sem dados da fonte no período selecionado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 18, right: 42, left: 8, bottom: 20 }} barGap={2} barCategoryGap="22%">
                    <CartesianGrid stroke="#dbe3ec" strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} />
                    <YAxis yAxisId="volume" tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value)} />
                    <YAxis yAxisId="rate" orientation="right" tick={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', fill: '#475569' }} tickFormatter={value => `${value}%`} />
                    <Tooltip formatter={(value: any, name: string) => [name.startsWith('rate_') ? formatRate(Number(value)) : formatNumber(Number(value)), name.startsWith('rate_') ? 'Taxa comparável' : stages.find(stage => stage.key === name)?.label ?? name]} />
                    {stages.filter(stage => selectedStages.includes(stage.key)).map(stage => <Bar key={stage.key} yAxisId="volume" dataKey={stage.key} fill={stage.color} maxBarSize={granularity === 'daily' ? 18 : 38} isAnimationActive={false} />)}
                    {rateStages.filter(stage => selectedRates.includes(stage.key)).map(stage => <Line key={stage.key} yAxisId="rate" type="linear" dataKey={`rate_${stage.key}`} stroke={stage.color} strokeWidth={3} connectNulls={false} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} isAnimationActive={false} />)}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="order-1 px-4 pb-3 pt-4">
            <h2 className="text-lg font-semibold text-slate-950">Funil completo</h2>
            <p className="mb-3 text-xs text-slate-500">Cada razão usa apenas a interseção de dias preenchidos das duas etapas.</p>
            <div className={`grid gap-2 sm:grid-cols-2 ${source === 'marketplace' ? 'lg:grid-cols-4' : 'lg:grid-cols-7'}`}>
              {stageCards.map((card, index) => (
                <div key={card.key} className={`rounded-lg border px-3 py-2.5 ${card.coverage < current.length ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold">{index + 1}</span>
                    <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{card.coverage}/{current.length} dias</span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{card.label}</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold leading-none text-slate-950">{formatNumber(card.value)}</p>
                  <p className="mt-1 text-[10px] font-semibold text-cyan-700">{index === 0 ? 'Volume do período' : `${formatRate(card.rate)} · ${card.comparable} dias comparáveis`}</p>
                </div>
              ))}
            </div>
          </section>
        </OnboardingFunnelWorkspace>

        {source === 'marketplace' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Marketplace × Serasa BI</h2>
              <p className="text-xs text-slate-500">Comparação apenas nas etapas semanticamente compatíveis e na interseção de datas. “Aprovados” não é comparado porque representa conceitos diferentes nas duas fontes.</p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Dias comparáveis</p><p className="mt-1 font-mono text-xl font-semibold">{reconciliation.length}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Ofertas Mkt. × BI</p><p className="mt-1 font-mono text-sm font-semibold">{formatNumber(reconciliationTotals.marketplaceOffers)} × {formatNumber(reconciliationTotals.biOffers)}</p><p className="mt-1 text-[10px] text-cyan-700">Delta {formatRate(reconciliationTotals.offersDelta, 1)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Pedidos Mkt. × BI</p><p className="mt-1 font-mono text-sm font-semibold">{formatNumber(reconciliationTotals.marketplaceOrders)} × {formatNumber(reconciliationTotals.biOrders)}</p><p className="mt-1 text-[10px] text-cyan-700">Delta {formatRate(reconciliationTotals.ordersDelta, 1)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Confirmados Mkt. × BI</p><p className="mt-1 font-mono text-sm font-semibold">{formatNumber(reconciliationTotals.marketplaceConfirmed)} × {formatNumber(reconciliationTotals.biConfirmed)}</p><p className="mt-1 text-[10px] text-cyan-700">Delta {formatRate(reconciliationTotals.confirmedDelta, 1)}</p></div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Leitura</p><p className="mt-1 text-xs font-semibold text-slate-800">{reconciliation.length ? 'Fontes com universos diferentes' : 'Sem interseção suficiente no período'}</p><p className="mt-1 text-[10px] text-slate-600">Os deltas são reconciliação operacional, não soma nem validação independente.</p></div>
            </div>
          </section>
        )}

        {source === 'bi' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Base complementar · Integrado diário</h2>
              <p className="text-xs text-slate-500">Mantida separada do funil Neurotech para não misturar universos. Os volumes e custos continuam disponíveis no mesmo corte e também entram na exportação.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-7">
              {integratedStageCards.map((card, index) => (
                <div key={card.key} className={`rounded-lg border p-3 ${card.coverage < currentBiIntegrated.length ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{index + 1}. {card.label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-950">{formatNumber(card.value)}</p>
                  <p className="mt-1 text-[9px] text-slate-500">{card.coverage}/{currentBiIntegrated.length} dias preenchidos</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {source === 'bi' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-semibold text-slate-950">Leitura econômica do BI</h2><p className="text-xs text-slate-500">Todos os campos de valor do XLSX estão preservados; CPA e CAC são médias ponderadas por cartões.</p></div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
              {costColumns.map(column => {
                const value = column.key === 'cpa' || column.key === 'cacCanal'
                  ? weightedMetric(currentBiIntegrated, column.key, 'cartoes')
                  : sumMetric(currentBiIntegrated, column.key);
                return <div key={column.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{column.label}</p><p className="mt-1 font-mono text-sm font-semibold text-slate-950">{column.currency ? formatCurrency(value) : formatNumber(value)}</p></div>;
              })}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div><h2 className="text-lg font-semibold text-slate-950">Detalhe {granularityLabel(detailGranularity).toLowerCase()} · {periodLabel}</h2><p className="text-xs text-slate-500">{source === 'marketplace' ? 'A exportação inclui as quatro etapas Marketplace, taxas recalculadas, pares BI compatíveis e qualidade.' : 'A tabela restaura todas as linhas Neurotech; a exportação acrescenta também o Integrado diário e seus custos.'}</p></div>
            <div className="flex flex-wrap items-center gap-2"><GranularityToggle value={detailGranularity} onChange={setDetailGranularity} /><button type="button" onClick={exportData} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14} /> Exportar</button></div>
          </div>
          <div className="max-h-[470px] overflow-auto">
            <table className={`w-full text-[10px] ${source === 'bi' ? 'min-w-[980px]' : 'min-w-[620px]'}`}>
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                <tr>
                  <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left">Período</th>
                  {stages.map((stage, index) => <th key={stage.key} className="px-3 py-2 text-right"><span className="flex justify-end"><FunnelStageLabel index={index} label={stage.label} compact /></span></th>)}
                  {source !== 'bi' && <th className="px-3 py-2 text-right">Qualidade</th>}
                </tr>
              </thead>
              <tbody>
                {detailRows.map((group, rowIndex) => {
                  const quality = sourceStatus(group.rows);
                  return (
                    <tr key={group.key} className={`border-t border-slate-100 ${rowIndex % 2 ? 'bg-slate-50/40' : ''}`}>
                      <td className="sticky left-0 z-[5] whitespace-nowrap bg-white px-3 py-2 font-mono text-[11px] font-semibold text-slate-800">{group.label}</td>
                      {stages.map((stage, index) => {
                        const denominator = stageDenominator(stages, index);
                        return <td key={stage.key} className="px-3 py-2"><StageMetricCell value={formatNumber(sumMetric(group.rows, stage.key))} rate={denominator ? formatRate(comparableRate(group.rows, stage.key, denominator)) : null} note={denominator ? (source === 'bi' ? 'taxa de sucesso' : 'razão') : 'base'} tone={sumMetric(group.rows, stage.key) == null ? 'amber' : index === 0 ? 'slate' : 'teal'} /></td>;
                      })}
                      {source !== 'bi' && <td className="px-3 py-2 text-right"><span className={`inline-flex rounded-sm px-2 py-1 font-semibold ${quality === 'complete' ? 'bg-emerald-50 text-emerald-700' : quality === 'suspect' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{quality === 'complete' ? 'completo' : quality === 'suspect' ? 'suspeito' : 'parcial'}</span></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export const SerasaMarketplaceFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => (
  <SerasaSourceFunnelView source="marketplace" navigation={navigation} />
);

export const SerasaBiFunnelView: React.FC<{ navigation: React.ReactNode }> = ({ navigation }) => (
  <SerasaSourceFunnelView source="bi" navigation={navigation} />
);
