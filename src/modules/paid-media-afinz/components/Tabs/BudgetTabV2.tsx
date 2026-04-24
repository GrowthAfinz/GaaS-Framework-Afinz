/**
 * BudgetTabV2
 *
 * Pacing cockpit for objective and campaign budget management.
 * Reuses the Claude UX direction while keeping the real data hooks and CRUD flows.
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Edit2,
  Loader2,
  Plus,
  Settings2,
  Shuffle,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { format, getDate, getDaysInMonth, isSameMonth, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { dataService } from '../../../../services/dataService';
import { useBudgetHierarchy } from '../../hooks/useBudgetHierarchy';
import { useFilters } from '../../context/FilterContext';
import { EditCampaignBudgetModal } from '../Modals/EditCampaignBudgetModal';
import { EditObjectiveBudgetModal } from '../Modals/EditObjectiveBudgetModal';
import { CampaignMappingsModal } from '../Modals/CampaignMappingsModal';
import { RealocateBudgetOrchestrator } from '../Modals/RealocateBudgetOrchestrator';
import {
  BudgetObjective,
  CampaignBudget,
  ObjectiveBudget,
  getObjectiveLabel,
} from '../../types/budget';
import type { DailyMetrics } from '../../types';

type PaceBucket = {
  key: 'overspend' | 'over' | 'under' | 'slight_under' | 'onpace' | 'empty';
  label: string;
  tone: 'red' | 'amber' | 'emerald' | 'slate';
};

type ObjectiveView = ObjectiveBudget & {
  label: string;
  realized: number;
  projection: number;
  pace: number;
  cpa: number | null;
  conversions: number;
  campaignCount: number;
  lastMonthComparable: number;
};

type CampaignView = CampaignBudget & {
  objectiveLabel: string;
  realized: number;
  projection: number;
  budget: number;
  idealDailyBudget: number;
  pace: number;
  deltaBudget: number;
  cpa: number | null;
  conversions: number;
  runwayDays: number | null;
};

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const currencyWithCents = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtBRL = (value: number) => currency.format(Number.isFinite(value) ? value : 0);
const fmtBRL2 = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? '—' : currencyWithCents.format(value);
const fmtPct = (value: number) => `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;

const getMonthKey = (date: string | Date) => {
  if (typeof date === 'string') return date.slice(0, 7);
  return format(date, 'yyyy-MM');
};

const getTargetMonth = (month: string) => {
  const [mm, yyyy] = month.split('/');
  return `${yyyy}-${mm}`;
};

const safeDiv = (num: number, den: number) => (den > 0 ? num / den : 0);

const paceBucket = (pace: number, planned = 1): PaceBucket => {
  if (planned <= 0) return { key: 'empty', label: 'Sem plano', tone: 'slate' };
  if (pace > 1.08) return { key: 'overspend', label: 'Estouro', tone: 'red' };
  if (pace > 1.02) return { key: 'over', label: 'Acima', tone: 'amber' };
  if (pace < 0.92) return { key: 'under', label: 'Subinvest.', tone: 'amber' };
  if (pace < 0.98) return { key: 'slight_under', label: 'Leve atraso', tone: 'slate' };
  return { key: 'onpace', label: 'No ritmo', tone: 'emerald' };
};

const toneClasses = {
  red: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    solid: 'bg-red-500',
    border: 'border-red-200',
    chip: 'bg-red-100 text-red-700',
  },
  amber: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    solid: 'bg-amber-500',
    border: 'border-amber-200',
    chip: 'bg-amber-100 text-amber-700',
  },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    solid: 'bg-emerald-500',
    border: 'border-emerald-200',
    chip: 'bg-emerald-100 text-emerald-700',
  },
  slate: {
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    solid: 'bg-slate-400',
    border: 'border-slate-200',
    chip: 'bg-slate-100 text-slate-700',
  },
};

const objectiveDotClass = (objective: string) => {
  const normalized = objective.toLowerCase();
  if (normalized.includes('b2c') || normalized.includes('performance')) return 'bg-blue-500';
  if (normalized.includes('marca') || normalized.includes('brand')) return 'bg-violet-500';
  if (normalized.includes('plurix')) return 'bg-emerald-500';
  if (normalized.includes('seguro')) return 'bg-amber-500';
  if (normalized.includes('rent')) return 'bg-cyan-500';
  return 'bg-slate-400';
};

const channelLabel = (channel: string) => {
  if (channel === 'meta') return 'Meta';
  if (channel === 'google') return 'Google';
  return channel || '—';
};

const metricsFor = (rows: DailyMetrics[], predicate: (row: DailyMetrics) => boolean) => {
  const scoped = rows.filter(predicate);
  const spend = scoped.reduce((sum, row) => sum + (row.spend || 0), 0);
  const conversions = scoped.reduce((sum, row) => sum + (row.conversions || 0), 0);
  return {
    spend,
    conversions,
    cpa: conversions > 0 ? spend / conversions : null,
  };
};

const getRunwayDays = (budget: number, realized: number, projection: number, daysInMonth: number) => {
  if (budget <= 0 || realized >= budget || projection <= 0 || daysInMonth <= 0) return null;
  const dailyPace = projection / daysInMonth;
  if (dailyPace <= 0) return null;
  return Math.max(0, Math.floor((budget - realized) / dailyPace));
};

const Delta: React.FC<{ value: number | null; invert?: boolean }> = ({ value, invert = false }) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-slate-300">—</span>;
  }
  const neutral = Math.abs(value) < 0.02;
  const good = invert ? value < 0 : value > 0;
  const color = neutral ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-red-600';
  const Icon = value >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 tabular-nums font-medium ${color}`}>
      {!neutral && <Icon size={11} />}
      <span>{value > 0 ? '+' : ''}{Math.round(value * 100)}%</span>
    </span>
  );
};

const ObjDot: React.FC<{ objective: string; size?: number }> = ({ objective, size = 8 }) => (
  <span
    className={`inline-block shrink-0 rounded-full ${objectiveDotClass(objective)}`}
    style={{ width: size, height: size }}
  />
);

const ChannelChip: React.FC<{ channel: string }> = ({ channel }) => {
  const colors = channel === 'meta'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : channel === 'google'
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold ${colors}`}>
      {channelLabel(channel)}
    </span>
  );
};

const PacePill: React.FC<{ pace: number; planned?: number; size?: 'sm' | 'md' }> = ({
  pace,
  planned = 1,
  size = 'md',
}) => {
  const bucket = paceBucket(pace, planned);
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-md font-semibold tabular-nums ${padding} ${toneClasses[bucket.tone].chip}`}>
      {planned > 0 ? `${pace.toFixed(2)}x` : '—'}
    </span>
  );
};

const PaceBar: React.FC<{
  planned: number;
  realized: number;
  projection: number;
  monthProgress: number;
  height?: number;
  showIdeal?: boolean;
}> = ({ planned, realized, projection, monthProgress, height = 10, showIdeal = true }) => {
  const pace = safeDiv(projection, planned);
  const bucket = paceBucket(pace, planned);
  const realizedPct = planned > 0 ? Math.min(1.35, realized / planned) : 0;
  const projectionPct = planned > 0 ? Math.min(1.35, projection / planned) : 0;
  const projectionWidth = Math.min(100, projectionPct * 100);
  const realizedWidth = Math.min(100, realizedPct * 100);
  const idealLeft = Math.max(0, Math.min(100, monthProgress * 100));

  return (
    <div className="w-full">
      <div className="relative w-full overflow-visible rounded-full bg-slate-100" style={{ height }}>
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${projectionPct > 1 ? 'bg-red-200' : 'bg-slate-200'}`}
          style={{ width: `${projectionWidth}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${toneClasses[bucket.tone].solid}`}
          style={{ width: `${realizedWidth}%` }}
        />
        {planned > 0 && (
          <div className="absolute bottom-[-3px] top-[-3px] w-[2px] bg-slate-700" style={{ left: '100%' }} />
        )}
        {showIdeal && planned > 0 && (
          <div
            className="absolute bottom-[-2px] top-[-2px] w-[2px] rounded-full bg-slate-400"
            style={{ left: `${idealLeft}%` }}
            title="Posição ideal hoje"
          />
        )}
      </div>
    </div>
  );
};

const KPI: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'slate' | 'blue' | 'red' | 'amber' | 'emerald';
}> = ({ label, value, sub, tone = 'slate' }) => {
  const toneClass = {
    slate: 'text-slate-800',
    blue: 'text-blue-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-lg font-bold leading-tight tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-tight text-slate-500">{sub}</p>}
    </div>
  );
};

const MonthStrip: React.FC<{
  daysPassed: number;
  daysInMonth: number;
  totalPlanned: number;
}> = ({ daysPassed, daysInMonth, totalPlanned }) => {
  const boundedDay = Math.max(0, Math.min(daysPassed, daysInMonth));
  const pctMonth = daysInMonth > 0 ? Math.round((boundedDay / daysInMonth) * 100) : 0;
  const daysRemaining = Math.max(0, daysInMonth - boundedDay);
  const idealBurn = daysInMonth > 0 && totalPlanned > 0 ? totalPlanned / daysInMonth : 0;

  return (
    <div className="flex min-w-0 flex-[1_1_360px] items-center gap-3">
      <div className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
        Dia {boundedDay}<span className="font-normal text-slate-400">/{daysInMonth}</span>
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 rounded-full bg-slate-700" style={{ width: `${pctMonth}%` }} />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold tabular-nums text-slate-700">{pctMonth}%</span>
        <span className="text-slate-300">·</span>
        <span><span className="font-medium text-slate-700">{daysRemaining}</span> dias restantes</span>
        {idealBurn > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span>Queima ideal <span className="font-medium text-slate-700">{fmtBRL(idealBurn)}/dia</span></span>
          </>
        )}
      </div>
    </div>
  );
};

export const BudgetTabV2: React.FC = () => {
  const { filters, rawData, previousPeriodData } = useFilters();
  const currentMonth = format(filters.dateRange.to || new Date(), 'MM/yyyy');
  const targetMonth = getTargetMonth(currentMonth);
  const [mm, yyyy] = currentMonth.split('/');
  const monthDate = parseISO(`${yyyy}-${mm}-01`);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR });
  const now = new Date();
  const isCurrentMonth = isSameMonth(now, monthDate);
  const daysInMonth = getDaysInMonth(monthDate);
  const daysPassed = isCurrentMonth ? getDate(now) : now > monthDate ? daysInMonth : 0;
  const monthProgress = daysInMonth > 0 ? daysPassed / daysInMonth : 0;

  const { objectives, campaigns, loading, error, refetch } = useBudgetHierarchy(currentMonth);

  const [focusObjectiveId, setFocusObjectiveId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const [editingObjective, setEditingObjective] = useState<ObjectiveBudget | undefined>();
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isMappingsModalOpen, setIsMappingsModalOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<CampaignBudget | undefined>();
  const [newCampaignObjectiveId, setNewCampaignObjectiveId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReallocateOpen, setIsReallocateOpen] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const monthRows = useMemo(() => {
    return rawData.filter((row) => {
      if (getMonthKey(row.date) !== targetMonth) return false;
      if (filters.selectedChannels.length > 0 && !filters.selectedChannels.includes(row.channel as 'meta' | 'google')) return false;
      if (filters.selectedObjectives.length > 0 && row.objective && !filters.selectedObjectives.includes(row.objective as any)) return false;
      if (filters.selectedCampaigns.length > 0 && !filters.selectedCampaigns.includes(row.campaign)) return false;
      if (filters.selectedAdsets.length > 0 && (!row.adset_name || !filters.selectedAdsets.includes(row.adset_name))) return false;
      if (filters.selectedAds.length > 0 && (!row.ad_name || !filters.selectedAds.includes(row.ad_name))) return false;
      return true;
    });
  }, [rawData, targetMonth, filters]);

  const previousMonthRows = useMemo(() => {
    const previousMonth = format(subMonths(monthDate, 1), 'yyyy-MM');
    const source = previousPeriodData.length > 0 ? previousPeriodData : rawData;
    return source.filter((row) => {
      const rowMonth = getMonthKey(row.date);
      if (previousPeriodData.length === 0 && rowMonth !== previousMonth) return false;
      if (filters.selectedChannels.length > 0 && !filters.selectedChannels.includes(row.channel as 'meta' | 'google')) return false;
      if (filters.selectedObjectives.length > 0 && row.objective && !filters.selectedObjectives.includes(row.objective as any)) return false;
      return true;
    });
  }, [previousPeriodData, rawData, monthDate, filters.selectedChannels, filters.selectedObjectives]);

  const filteredObjectives = useMemo(() => {
    const selected = filters.selectedObjectives;
    if (!selected || selected.length === 0) return objectives;
    return objectives.filter((objective) => selected.includes(objective.objective as any));
  }, [objectives, filters.selectedObjectives]);

  const visibleObjectiveIds = useMemo(
    () => new Set(filteredObjectives.map((objective) => objective.id)),
    [filteredObjectives]
  );

  const objectiveViews = useMemo<ObjectiveView[]>(() => {
    return filteredObjectives.map((objective) => {
      const objectiveRows = monthRows.filter((row) => row.objective === objective.objective);
      const previousRows = previousMonthRows.filter((row) => row.objective === objective.objective);
      const metric = metricsFor(objectiveRows, () => true);
      const previousMetric = metricsFor(previousRows, () => true);
      const realized = metric.spend;
      const projection = daysPassed > 0 ? (realized / daysPassed) * daysInMonth : 0;
      const totalBudget = objective.totalBudget || 0;
      return {
        ...objective,
        label: getObjectiveLabel(objective.objective),
        realized,
        projection,
        pace: safeDiv(projection, totalBudget),
        cpa: metric.cpa,
        conversions: metric.conversions,
        campaignCount: campaigns.filter((campaign) => campaign.objectiveBudgetId === objective.id).length,
        lastMonthComparable: previousMetric.spend * monthProgress,
      };
    });
  }, [filteredObjectives, monthRows, previousMonthRows, daysPassed, daysInMonth, campaigns, monthProgress]);

  const allCampaignViews = useMemo<CampaignView[]>(() => {
    return campaigns
      .filter((campaign) => visibleObjectiveIds.has(campaign.objectiveBudgetId))
      .filter((campaign) => filters.selectedChannels.length === 0 || filters.selectedChannels.includes(campaign.channel))
      .filter((campaign) => filters.selectedCampaigns.length === 0 || filters.selectedCampaigns.includes(campaign.campaignName))
      .map((campaign) => {
        const rows = monthRows.filter((row) => row.campaign === campaign.campaignName);
        const metric = metricsFor(rows, () => true);
        const objective = objectives.find((item) => item.id === campaign.objectiveBudgetId);
        const budget = campaign.allocatedBudget || 0;
        const realized = metric.spend;
        const projection = daysPassed > 0 ? (realized / daysPassed) * daysInMonth : 0;
        const pace = budget > 0 ? safeDiv(projection, budget) : (campaign.paceIndex || 0);
        return {
          ...campaign,
          objectiveLabel: objective ? getObjectiveLabel(objective.objective) : getObjectiveLabel(campaign.objective),
          budget,
          idealDailyBudget: daysInMonth > 0 ? budget / daysInMonth : 0,
          realized,
          projection,
          pace,
          deltaBudget: projection - budget,
          cpa: metric.cpa,
          conversions: metric.conversions,
          runwayDays: getRunwayDays(budget, realized, projection, daysInMonth),
        };
      });
  }, [campaigns, visibleObjectiveIds, filters.selectedChannels, filters.selectedCampaigns, monthRows, objectives, daysPassed, daysInMonth]);

  const visibleCampaigns = useMemo(() => {
    const scoped = focusObjectiveId
      ? allCampaignViews.filter((campaign) => campaign.objectiveBudgetId === focusObjectiveId)
      : allCampaignViews;

    return [...scoped].sort((a, b) => b.budget - a.budget);
  }, [allCampaignViews, focusObjectiveId]);

  const campaignsForReallocation = useMemo(() => {
    if (!isReallocateOpen) return [];
    return campaigns.filter((campaign) => campaign.objectiveBudgetId === isReallocateOpen);
  }, [campaigns, isReallocateOpen]);

  const totals = useMemo(() => {
    const scopedObjectives = focusObjectiveId
      ? objectiveViews.filter((objective) => objective.id === focusObjectiveId)
      : objectiveViews;
    const planned = scopedObjectives.reduce((sum, objective) => sum + objective.totalBudget, 0);
    const realized = scopedObjectives.reduce((sum, objective) => sum + objective.realized, 0);
    const projection = scopedObjectives.reduce((sum, objective) => sum + objective.projection, 0);
    const conversions = focusObjectiveId
      ? visibleCampaigns.reduce((sum, campaign) => sum + campaign.conversions, 0)
      : monthRows.reduce((sum, row) => sum + (row.conversions || 0), 0);
    return {
      planned,
      realized,
      projection,
      pace: safeDiv(projection, planned),
      conversions,
      cpa: conversions > 0 ? realized / conversions : null,
    };
  }, [objectiveViews, focusObjectiveId, visibleCampaigns, monthRows]);

  const realizedPrevAtThisDay = useMemo(() => {
    const previousSpend = previousMonthRows.reduce((sum, row) => sum + (row.spend || 0), 0);
    return previousSpend * monthProgress;
  }, [previousMonthRows, monthProgress]);

  const risks = useMemo(() => {
    return objectiveViews
      .map((objective) => ({ ...objective, bucket: paceBucket(objective.pace, objective.totalBudget) }))
      .filter((objective) => objective.bucket.key === 'overspend' || objective.bucket.key === 'under')
      .sort((a, b) => Math.abs(b.projection - b.totalBudget) - Math.abs(a.projection - a.totalBudget));
  }, [objectiveViews]);

  const topInsight = useMemo(() => {
    const sorted = [...objectiveViews]
      .map((objective) => ({ ...objective, delta: objective.projection - objective.totalBudget }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const worst = sorted[0];
    if (!worst || Math.abs(worst.delta) < 1000) return null;
    return {
      id: worst.id,
      label: worst.label,
      delta: Math.abs(worst.delta),
      over: worst.delta > 0,
      pace: worst.pace,
    };
  }, [objectiveViews]);

  const reallocationTargetId = useMemo(() => {
    if (focusObjectiveId) return focusObjectiveId;
    const highestRisk = [...objectiveViews].sort((a, b) => b.pace - a.pace)[0];
    return highestRisk?.id || null;
  }, [focusObjectiveId, objectiveViews]);

  const canOpenReallocation = Boolean(
    reallocationTargetId &&
    campaigns.filter((campaign) => campaign.objectiveBudgetId === reallocationTargetId).length > 1
  );

  const focusedObjective = focusObjectiveId
    ? objectiveViews.find((objective) => objective.id === focusObjectiveId)
    : null;

  const handleSaveObjective = async (data: {
    id?: string;
    month: string;
    objective: BudgetObjective;
    budget: number;
    channel?: string | null;
  }) => {
    setIsLoading(true);
    try {
      await dataService.upsertPaidMediaBudget({
        id: data.id || crypto.randomUUID(),
        month: data.month,
        objective: data.objective,
        budget: data.budget,
        channel: data.channel || null,
      });
      await refetch();
      setIsObjectiveModalOpen(false);
      setEditingObjective(undefined);
    } catch (err) {
      console.error('Error saving objective:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCampaign = async (campaign: Omit<CampaignBudget, 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      await dataService.upsertCampaignBudget({
        id: campaign.id || crypto.randomUUID(),
        month: campaign.month || currentMonth,
        objective_budget_id: campaign.objectiveBudgetId,
        campaign_name: campaign.campaignName,
        objective: campaign.objective,
        channel: campaign.channel,
        allocated_budget: campaign.allocatedBudget,
        notes: campaign.notes || null,
      });
      await refetch();
      setIsEditModalOpen(false);
      setEditingCampaign(undefined);
      setNewCampaignObjectiveId(null);
    } catch (err) {
      console.error('Error saving campaign:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta campanha?')) return;

    setIsLoading(true);
    try {
      await dataService.deleteCampaignBudget(id);
      await refetch();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert('Erro ao deletar campanha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReallocation = async (reallocations: Array<{ id: string; allocatedBudget: number }>) => {
    setIsLoading(true);
    try {
      const dbPayload = reallocations.map((item) => ({
        id: item.id,
        allocated_budget: item.allocatedBudget,
      }));
      await dataService.updateCampaignBudgetAllocations(dbPayload);
      await refetch();
      setIsReallocateOpen(null);
    } catch (err) {
      console.error('Error reallocating budget:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaignModalObjective = (): ObjectiveBudget => {
    if (editingCampaign) {
      return objectives.find((objective) => objective.id === editingCampaign.objectiveBudgetId) ?? objectives[0];
    }
    if (newCampaignObjectiveId) {
      return objectives.find((objective) => objective.id === newCampaignObjectiveId) ?? objectives[0];
    }
    return objectives[0];
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="font-medium text-slate-600">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Erro ao carregar orçamentos</p>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] shrink-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-xl font-bold text-slate-800">Orçamento</h2>
              <span className="text-sm font-medium text-slate-400">· {monthLabel} · Dia {daysPassed}/{daysInMonth}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Pacing, risco e eficiência por objetivo e campanha.</p>
          </div>
          <MonthStrip daysPassed={daysPassed} daysInMonth={daysInMonth} totalPlanned={totals.planned} />
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <button
            onClick={() => setCompareMode((current) => !current)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              compareMode
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <BarChart3 size={13} />
            vs mês anterior
          </button>
          <button
            onClick={() => reallocationTargetId && setIsReallocateOpen(reallocationTargetId)}
            disabled={!canOpenReallocation}
            title={canOpenReallocation ? 'Realocar budget' : 'É preciso ter pelo menos duas campanhas no objetivo.'}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Shuffle size={13} />
            Realocar budget
          </button>
          <button
            onClick={() => setIsMappingsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
          >
            <Settings2 size={13} />
            Gerenciar
          </button>
          <button
            onClick={() => {
              setEditingObjective(undefined);
              setIsObjectiveModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={13} />
            Novo objetivo
          </button>
          </div>
        </div>
      </div>

      {(risks.length > 0 || topInsight) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          {risks.length > 0 && (
            <div className="flex min-w-0 flex-1 items-center gap-2 text-amber-800">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span className="shrink-0 font-semibold">{risks.length} fora do ritmo</span>
              <span className="truncate text-amber-700">
                {risks.slice(0, 3).map((risk, index) => (
                  <span key={risk.id}>
                    <button
                      onClick={() => setFocusObjectiveId(risk.id)}
                      className="font-medium underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
                    >
                      {risk.label}
                    </button>
                    <span> {risk.pace.toFixed(2)}x</span>
                    {index < Math.min(risks.length, 3) - 1 && <span className="text-amber-400"> · </span>}
                  </span>
                ))}
                {risks.length > 3 && <span className="text-amber-500"> +{risks.length - 3}</span>}
              </span>
            </div>
          )}

          {topInsight && (
            <div className="flex min-w-[280px] flex-1 items-center gap-2 text-slate-600">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span className="truncate">
                <span className="font-semibold text-slate-800">{topInsight.label}</span>{' '}
                <span className={topInsight.over ? 'text-red-600' : 'text-amber-600'}>
                  {topInsight.over ? '+' : '-'}{fmtBRL(topInsight.delta)}
                </span>{' '}
                vs plano ({topInsight.pace.toFixed(2)}x)
              </span>
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {risks.length > 0 && (
              <button
                onClick={() => setAlertsExpanded((current) => !current)}
                className="font-medium text-slate-500 hover:text-slate-900"
              >
                {alertsExpanded ? 'ocultar' : 'detalhes'}
              </button>
            )}
            {topInsight && (
              <button
                onClick={() => setFocusObjectiveId(topInsight.id)}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                focar
              </button>
            )}
          </div>
        </div>
      )}

      {alertsExpanded && (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs md:grid-cols-2">
          {risks.map((risk) => {
            const delta = risk.projection - risk.totalBudget;
            const over = delta > 0;
            return (
              <div key={risk.id} className="flex items-start gap-2">
                <ObjDot objective={risk.objective} />
                <div>
                  <div className="font-semibold text-slate-800">
                    {risk.label} · {over ? `+${fmtBRL(delta)}` : `-${fmtBRL(Math.abs(delta))}`} vs plano
                  </div>
                  <div className="mt-0.5 text-slate-500">
                    {over ? 'Revisar campanhas ineficientes ou realocar saldo.' : 'Acelerar campanhas eficientes ou receber budget.'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KPI
          label="Planejado total"
          value={fmtBRL(totals.planned)}
          sub={`${objectiveViews.length} objetivos · ${allCampaignViews.length} campanhas`}
        />
        <KPI
          label="Realizado"
          value={fmtBRL(totals.realized)}
          tone="blue"
          sub={compareMode && realizedPrevAtThisDay > 0
            ? <>vs mês anterior <Delta value={(totals.realized - realizedPrevAtThisDay) / realizedPrevAtThisDay} /></>
            : `${fmtPct(safeDiv(totals.realized, totals.planned))} do plano`}
        />
        <KPI
          label="Projeção fim de mês"
          value={fmtBRL(totals.projection)}
          tone={totals.pace > 1.08 ? 'red' : totals.pace < 0.92 ? 'amber' : 'slate'}
          sub={<span className={totals.projection > totals.planned ? 'font-medium text-red-600' : 'text-slate-500'}>
            {totals.projection > totals.planned ? '+' : ''}{fmtBRL(totals.projection - totals.planned)} vs plano
          </span>}
        />
        <KPI
          label="Ritmo geral"
          value={<span className="flex items-center gap-2">{totals.pace.toFixed(2)}x <PacePill pace={totals.pace} planned={totals.planned} /></span>}
          sub="1.00x = no plano"
        />
        <KPI
          label="CPA médio"
          value={fmtBRL2(totals.cpa)}
          sub={totals.conversions > 0 ? `${totals.conversions.toLocaleString('pt-BR')} conversões` : 'Sem conversões no período'}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg font-bold text-slate-800">Pacing por objetivo</h3>
            <span className="text-sm text-slate-400">
              {focusedObjective ? `Filtro aplicado: ${focusedObjective.label}` : 'Clique num card para filtrar a tabela'}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-500">
            {focusedObjective && (
              <button
                onClick={() => setFocusObjectiveId(null)}
                className="flex items-center gap-1 rounded px-2 py-1 font-semibold text-blue-600 hover:bg-blue-50"
              >
                <X size={12} />
                limpar filtro
              </button>
            )}
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> no ritmo</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> atenção</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> risco</span>
          </div>
        </div>

        {objectives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Wallet size={22} className="text-slate-400" />
            </div>
            <p className="mb-1 font-medium text-slate-700">Nenhum orçamento configurado para {currentMonth}</p>
            <p className="mb-5 text-sm text-slate-400">Crie orçamentos por objetivo para acompanhar gastos e projeções.</p>
            <button
              onClick={() => {
                setEditingObjective(undefined);
                setIsObjectiveModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={15} />
              Criar primeiro orçamento
            </button>
          </div>
        ) : objectiveViews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-medium text-slate-500">Nenhum objetivo corresponde ao filtro selecionado.</p>
            <p className="mt-1 text-sm text-slate-400">Ajuste os filtros de objetivo na barra superior.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {objectiveViews.map((objective) => {
              const bucket = paceBucket(objective.pace, objective.totalBudget);
              const isFocused = focusObjectiveId === objective.id;
              const vsPrev = objective.lastMonthComparable > 0
                ? (objective.realized - objective.lastMonthComparable) / objective.lastMonthComparable
                : null;
              return (
                <button
                  key={objective.id}
                  onClick={() => setFocusObjectiveId(isFocused ? null : objective.id)}
                  className={`rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md ${
                    isFocused ? 'border-blue-300 shadow-md ring-2 ring-blue-500' : 'border-slate-200'
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ObjDot objective={objective.objective} />
                      <span className="truncate font-semibold text-slate-800">{objective.label}</span>
                      <span className="shrink-0 text-xs text-slate-400">· {objective.campaignCount}</span>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${toneClasses[bucket.tone].chip}`}>
                      {bucket.label}
                    </span>
                  </div>
                  <div className="mb-0.5 flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-slate-800">{fmtBRL(objective.realized)}</span>
                    <span className="text-xs text-slate-400">de {fmtBRL(objective.totalBudget)}</span>
                  </div>
                  {compareMode && (
                    <div className="mb-1 text-[11px] text-slate-500">
                      vs mês anterior <Delta value={vsPrev} />
                    </div>
                  )}
                  <div className="mb-3 mt-2">
                    <PaceBar
                      planned={objective.totalBudget}
                      realized={objective.realized}
                      projection={objective.projection}
                      monthProgress={monthProgress}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    <div>
                      <div className="text-slate-400">Proj.</div>
                      <div className={`font-semibold tabular-nums ${toneClasses[bucket.tone].text}`}>{fmtBRL(objective.projection)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Ritmo</div>
                      <div className="font-semibold tabular-nums text-slate-700">{objective.totalBudget > 0 ? `${objective.pace.toFixed(2)}x` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">CPA</div>
                      <div className="truncate font-semibold tabular-nums text-slate-700">{fmtBRL2(objective.cpa)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {focusedObjective ? `Campanhas de ${focusedObjective.label}` : 'Todas as campanhas'}
            </h3>
            <span className="text-xs text-slate-400">{visibleCampaigns.length} ativa{visibleCampaigns.length === 1 ? '' : 's'}</span>
            {focusedObjective && (
              <button onClick={() => setFocusObjectiveId(null)} className="ml-1 text-xs text-blue-600 hover:underline">
                ver todas
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={() => {
                const objectiveId = focusObjectiveId || objectiveViews[0]?.id;
                if (!objectiveId) return;
                setEditingCampaign(undefined);
                setNewCampaignObjectiveId(objectiveId);
                setFocusObjectiveId(objectiveId);
                setIsEditModalOpen(true);
              }}
              disabled={objectiveViews.length === 0}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={12} />
              Campanha
            </button>
          </div>
        </div>

        {visibleCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-500">Nenhuma campanha alocada neste escopo.</p>
            <p className="mt-1 text-sm text-slate-400">Crie uma campanha ou revise os filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1260px] text-sm">
              <thead className="bg-slate-50/60">
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left font-semibold">Campanha</th>
                  <th className="px-2 py-2 text-left font-semibold">Objetivo</th>
                  <th className="px-2 py-2 text-left font-semibold">Canal</th>
                  <th className="px-2 py-2 text-right font-semibold">Budget</th>
                  <th className="px-2 py-2 text-right font-semibold">Ideal/dia</th>
                  <th className="px-2 py-2 text-right font-semibold">Realizado</th>
                  <th className="w-48 px-4 py-2 text-left font-semibold">Pacing</th>
                  <th className="px-2 py-2 text-right font-semibold">Proj.</th>
                  <th className="px-2 py-2 text-right font-semibold">Delta plano</th>
                  <th className="px-2 py-2 text-right font-semibold">Ritmo</th>
                  <th className="px-2 py-2 text-right font-semibold">CPA</th>
                  <th className="px-2 py-2 text-right font-semibold">Runway</th>
                  <th className="w-20 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((campaign) => {
                  const bucket = paceBucket(campaign.pace, campaign.budget);
                  const runwayCritical = campaign.runwayDays !== null && campaign.runwayDays < 7;
                  const isUnbudgeted = campaign.budget <= 0;
                  return (
                    <tr key={campaign.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{campaign.campaignName}</td>
                      <td className="px-2 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <ObjDot objective={campaign.objective} />
                          {campaign.objectiveLabel}
                        </span>
                      </td>
                      <td className="px-2 py-2.5"><ChannelChip channel={campaign.channel} /></td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">{isUnbudgeted ? '—' : fmtBRL(campaign.budget)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-500">{isUnbudgeted ? '—' : fmtBRL(campaign.idealDailyBudget)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">{fmtBRL(campaign.realized)}</td>
                      <td className="px-4 py-2.5">
                        <PaceBar
                          planned={campaign.budget}
                          realized={campaign.realized}
                          projection={campaign.projection}
                          monthProgress={monthProgress}
                          height={8}
                        />
                      </td>
                      <td className={`px-2 py-2.5 text-right font-medium tabular-nums ${toneClasses[bucket.tone].text}`}>
                        {fmtBRL(campaign.projection)}
                      </td>
                      <td className={`px-2 py-2.5 text-right text-xs tabular-nums ${
                        campaign.deltaBudget > 0 ? 'text-red-600' : campaign.deltaBudget < 0 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {isUnbudgeted ? '—' : `${campaign.deltaBudget > 0 ? '+' : ''}${fmtBRL(campaign.deltaBudget)}`}
                      </td>
                      <td className="px-2 py-2.5 text-right"><PacePill pace={campaign.pace} planned={campaign.budget} size="sm" /></td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-slate-700">{fmtBRL2(campaign.cpa)}</td>
                      <td className={`px-2 py-2.5 text-right font-medium tabular-nums ${runwayCritical ? 'text-red-600' : 'text-slate-600'}`}>
                        {campaign.runwayDays === null ? '—' : `${campaign.runwayDays}d`}
                        {runwayCritical && <AlertTriangle size={12} className="ml-1 inline" />}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            title="Editar"
                            onClick={() => {
                              setEditingCampaign(
                                campaign.id.startsWith('unbudgeted-')
                                  ? { ...campaign, id: '' }
                                  : campaign
                              );
                              setNewCampaignObjectiveId(null);
                              setIsEditModalOpen(true);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title="Realocar"
                            onClick={() => setIsReallocateOpen(campaign.objectiveBudgetId)}
                            className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                          >
                            <Shuffle size={13} />
                          </button>
                          <button
                            title="Excluir"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600" colSpan={3}>
                    Total {focusedObjective ? focusedObjective.label : 'geral'}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-800">
                    {fmtBRL(visibleCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0))}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-600">
                    {fmtBRL(visibleCampaigns.reduce((sum, campaign) => sum + campaign.idealDailyBudget, 0))}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-800">
                    {fmtBRL(visibleCampaigns.reduce((sum, campaign) => sum + campaign.realized, 0))}
                  </td>
                  <td className="px-4 py-2.5">
                    <PaceBar
                      planned={visibleCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0)}
                      realized={visibleCampaigns.reduce((sum, campaign) => sum + campaign.realized, 0)}
                      projection={visibleCampaigns.reduce((sum, campaign) => sum + campaign.projection, 0)}
                      monthProgress={monthProgress}
                      height={8}
                    />
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-800">
                    {fmtBRL(visibleCampaigns.reduce((sum, campaign) => sum + campaign.projection, 0))}
                  </td>
                  <td className="px-2 py-2.5 text-right text-xs font-semibold tabular-nums text-slate-600">
                    {fmtBRL(visibleCampaigns.reduce((sum, campaign) => sum + campaign.deltaBudget, 0))}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <PacePill
                      pace={safeDiv(
                        visibleCampaigns.reduce((sum, campaign) => sum + campaign.projection, 0),
                        visibleCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
                      )}
                      planned={visibleCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0)}
                      size="sm"
                    />
                  </td>
                  <td className="px-2 py-2.5" colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <EditObjectiveBudgetModal
        isOpen={isObjectiveModalOpen}
        objective={editingObjective}
        month={currentMonth}
        onSave={handleSaveObjective}
        onClose={() => {
          setIsObjectiveModalOpen(false);
          setEditingObjective(undefined);
        }}
        isLoading={isLoading}
      />

      {objectives.length > 0 && (
        <EditCampaignBudgetModal
          isOpen={isEditModalOpen}
          campaign={editingCampaign}
          objective={getCampaignModalObjective()}
          currentMonth={currentMonth}
          onSave={handleSaveCampaign}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCampaign(undefined);
            setNewCampaignObjectiveId(null);
          }}
          isLoading={isLoading}
        />
      )}

      {isReallocateOpen && (
        <RealocateBudgetOrchestrator
          isOpen={true}
          campaigns={campaignsForReallocation}
          onConfirm={handleConfirmReallocation}
          onClose={() => setIsReallocateOpen(null)}
          isLoading={isLoading}
        />
      )}

      <CampaignMappingsModal
        isOpen={isMappingsModalOpen}
        onClose={() => setIsMappingsModalOpen(false)}
        onMappingsChanged={() => refetch()}
      />
    </div>
  );
};
