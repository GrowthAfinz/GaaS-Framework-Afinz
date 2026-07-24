import React, { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, EyeOff, Info, Layers3 } from 'lucide-react';
import { Activity, Goal } from '../../types/framework';
import { useB2CAnalysis } from '../../hooks/useB2CAnalysis';
import { useBU } from '../../contexts/BUContext';
import { useAppStore } from '../../store/useAppStore';
import { deriveActivityMetrics } from '../../utils/activityMetrics';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { ChartTooltip } from '../ui/ChartTooltip';
import {
    ACQUISITION_BUS,
    AcquisitionBU,
    BU_ANALYTICS_PROFILES,
    canConsolidateBUs,
    getCardsGoal,
    getCacGoal,
} from './buAnalyticsProfiles';

interface LaunchPlannerKPIsProps {
    activities: Activity[];
    goals: Goal[];
    currentMonth: string;
}

interface ChartHeadingProps {
    title: string;
    helpText: string;
    onClick?: () => void;
}

type ChartMode = 'monthly' | 'daily';
type MultiBUMode = 'comparison' | 'consolidated';

interface ActivityAggregate {
    propostas: number;
    cartoes: number;
    custo: number;
    base: number;
}

const EMPTY_AGGREGATE: ActivityAggregate = {
    propostas: 0,
    cartoes: 0,
    custo: 0,
    base: 0,
};

const DIMENSION_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F97316'];

const ChartHeading: React.FC<ChartHeadingProps> = ({ title, helpText, onClick }) => (
    <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="h-3.5 w-0.5 shrink-0 bg-cyan-500" />
        {onClick ? (
            <button
                type="button"
                onClick={onClick}
                className="truncate text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 transition-colors hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
                title={`${title} — abrir Análise no modo Diário`}
            >
                {title}
            </button>
        ) : (
            <h3 className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                {title}
            </h3>
        )}
        <span title={helpText} className="shrink-0">
            <Info size={11} className="cursor-help text-slate-400" />
        </span>
    </div>
);

const metricValue = (activity: Activity): ActivityAggregate => {
    const metrics = deriveActivityMetrics(activity);
    return {
        propostas: Number(activity.kpis?.propostas) || 0,
        cartoes: metrics.cartoes,
        custo: metrics.custoTotal,
        base: Number(activity.kpis?.baseEntregue) || Number(activity.kpis?.baseEnviada) || 0,
    };
};

const addAggregate = (target: ActivityAggregate, value: ActivityAggregate) => {
    target.propostas += value.propostas;
    target.cartoes += value.cartoes;
    target.custo += value.custo;
    target.base += value.base;
};

const getPeriodKey = (date: Date, mode: ChartMode) =>
    format(date, mode === 'daily' ? 'yyyy-MM-dd' : 'yyyy-MM');

const getDimensionValue = (activity: Activity, dimension: 'segmento' | 'parceiro') => {
    const value = dimension === 'parceiro' ? activity.parceiro : activity.segmento;
    return value?.trim() || (dimension === 'parceiro' ? 'Sem parceiro' : 'Sem segmento');
};

const formatCompact = (value: number) =>
    value.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({
    activities,
    goals,
    currentMonth,
}) => {
    const rentab = useAppStore((state) => state.viewSettings.frente === 'rentabilizacao');
    const allStoreActivities = useAppStore((state) => state.activities);
    const setTab = useAppStore((state) => state.setTab);
    const setReportDeepLink = useAppStore((state) => state.setReportDeepLink);
    const { dailyAnalysis, yearMonthlyAnalysis } = useB2CAnalysis();
    const { selectedBUs } = useBU();

    const [chartMode, setChartMode] = useState<ChartMode>('daily');
    const [multiBUMode, setMultiBUMode] = useState<MultiBUMode>('comparison');
    const [showSerasa, setShowSerasa] = useState(false);
    const [showOtherB2C, setShowOtherB2C] = useState(true);
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDrillBU, setSelectedDrillBU] = useState<AcquisitionBU | null>(null);

    const chartBUs = useMemo<AcquisitionBU[]>(() => {
        if (selectedBUs.length === 0) return ACQUISITION_BUS;
        return ACQUISITION_BUS.filter((bu) => selectedBUs.includes(bu));
    }, [selectedBUs]);

    const excludedBUs = useMemo(
        () => selectedBUs.filter((bu) => !ACQUISITION_BUS.includes(bu as AcquisitionBU)),
        [selectedBUs],
    );

    const singleBU = chartBUs.length === 1 ? chartBUs[0] : null;
    const profile = singleBU ? BU_ANALYTICS_PROFILES[singleBU] : null;
    const isMultiBU = chartBUs.length > 1;
    const canConsolidate = canConsolidateBUs(chartBUs);
    const isConsolidated = isMultiBU && multiBUMode === 'consolidated' && canConsolidate;
    const isMonthly = chartMode === 'monthly';
    const currentGoal = goals.find((goal) => goal.mes === currentMonth);

    useEffect(() => {
        if (!canConsolidate && multiBUMode === 'consolidated') {
            setMultiBUMode('comparison');
        }
    }, [canConsolidate, multiBUMode]);

    useEffect(() => {
        setSelectedSeries(null);
    }, [chartMode, singleBU, multiBUMode]);

    const sourceActivities = useMemo(
        () => (isMonthly ? allStoreActivities : activities).filter(
            (activity) => chartBUs.includes(activity.bu as AcquisitionBU),
        ),
        [activities, allStoreActivities, chartBUs, isMonthly],
    );

    const periodRows = useMemo(() => {
        const source = isMonthly ? yearMonthlyAnalysis : dailyAnalysis;
        return source.map((item) => {
            const dateKey = isMonthly ? item.data.slice(0, 7) : item.data;
            const date = isMonthly
                ? new Date(Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)) - 1, 1)
                : new Date(`${dateKey}T12:00:00`);

            return {
                data: isMonthly ? `${dateKey}-01` : dateKey,
                periodKey: dateKey,
                displayDate: format(date, isMonthly ? 'MMM/yy' : 'dd/MM', { locale: ptBR }),
                b2cTotalPropostas: Number(item.propostas_b2c_total) || 0,
                b2cTotalCartoes: Number(item.emissoes_b2c_total) || 0,
                serasaPropostas: Number(item.propostas_serasa) || 0,
                serasaCartoes: Number(item.emissoes_serasa) || 0,
            };
        });
    }, [dailyAnalysis, isMonthly, yearMonthlyAnalysis]);

    const aggregates = useMemo(() => {
        const byPeriod = new Map<string, Record<AcquisitionBU, ActivityAggregate>>();
        const byPeriodDimension = new Map<string, Record<string, ActivityAggregate>>();
        const dimensionTotals = new Map<string, number>();

        sourceActivities.forEach((activity) => {
            const date = activity.dataDisparo;
            if (!date || Number.isNaN(date.getTime())) return;

            const bu = activity.bu as AcquisitionBU;
            if (!chartBUs.includes(bu)) return;

            const periodKey = getPeriodKey(date, chartMode);
            const periodBU = byPeriod.get(periodKey) ?? {} as Record<AcquisitionBU, ActivityAggregate>;
            const value = metricValue(activity);
            periodBU[bu] = periodBU[bu] ?? { ...EMPTY_AGGREGATE };
            addAggregate(periodBU[bu], value);
            byPeriod.set(periodKey, periodBU);

            if (profile) {
                const dimension = getDimensionValue(activity, profile.breakdown);
                const periodDimensions = byPeriodDimension.get(periodKey) ?? {};
                periodDimensions[dimension] = periodDimensions[dimension] ?? { ...EMPTY_AGGREGATE };
                addAggregate(periodDimensions[dimension], value);
                byPeriodDimension.set(periodKey, periodDimensions);
                dimensionTotals.set(
                    dimension,
                    (dimensionTotals.get(dimension) ?? 0) + value.propostas + value.cartoes,
                );
            }
        });

        return { byPeriod, byPeriodDimension, dimensionTotals };
    }, [chartBUs, chartMode, profile, sourceActivities]);

    const dimensionSeries = useMemo(() => {
        if (!profile) return [] as Array<{ name: string; sourceNames: string[]; color: string }>;

        const sorted = Array.from(aggregates.dimensionTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => name);
        const maximumDimensionSeries = profile.bu === 'B2C' && showOtherB2C ? 3 : 4;
        const needsRemainderGroup = sorted.length > maximumDimensionSeries;
        const namedSeriesLimit = needsRemainderGroup
            ? maximumDimensionSeries - 1
            : maximumDimensionSeries;
        const visible = sorted.slice(0, namedSeriesLimit);
        const remaining = sorted.slice(namedSeriesLimit);

        const series = visible.map((name, index) => ({
            name,
            sourceNames: [name],
            color: DIMENSION_COLORS[index % DIMENSION_COLORS.length],
        }));

        if (remaining.length > 0) {
            series.push({
                name: profile.breakdown === 'parceiro' ? 'Demais parceiros' : 'Demais segmentos',
                sourceNames: remaining,
                color: '#64748B',
            });
        }

        return series;
    }, [aggregates.dimensionTotals, profile, showOtherB2C]);

    const timeChartData = useMemo(() => periodRows.map((row) => {
        const periodBU = aggregates.byPeriod.get(row.periodKey) ?? {} as Record<AcquisitionBU, ActivityAggregate>;
        const result: Record<string, string | number | null> = { ...row };

        chartBUs.forEach((bu) => {
            const value = periodBU[bu] ?? EMPTY_AGGREGATE;
            result[`propostas_${bu}`] = value.propostas;
            result[`cartoes_${bu}`] = value.cartoes;
            result[`cac_${bu}`] = value.cartoes > 0 && value.custo > 0 ? value.custo / value.cartoes : null;
            result[`conversao_${bu}`] = value.base > 0 ? (value.cartoes / value.base) * 100 : null;
        });

        if (profile) {
            const dimensions = aggregates.byPeriodDimension.get(row.periodKey) ?? {};
            dimensionSeries.forEach((series, index) => {
                const combined = series.sourceNames.reduce<ActivityAggregate>((total, name) => {
                    addAggregate(total, dimensions[name] ?? EMPTY_AGGREGATE);
                    return total;
                }, { ...EMPTY_AGGREGATE });
                result[`dim_propostas_${index}`] = combined.propostas;
                result[`dim_cartoes_${index}`] = combined.cartoes;
            });

            const profileValue = periodBU[profile.bu] ?? EMPTY_AGGREGATE;
            result.cac_single = profileValue.cartoes > 0 && profileValue.custo > 0
                ? profileValue.custo / profileValue.cartoes
                : null;

            if (profile.bu === 'B2C') {
                result.propostas_crm = profileValue.propostas;
                result.cartoes_crm = profileValue.cartoes;
                result.serasa_propostas = row.serasaPropostas;
                result.serasa_cartoes = row.serasaCartoes;
                result.outros_propostas = Math.max(
                    0,
                    row.b2cTotalPropostas - profileValue.propostas - row.serasaPropostas,
                );
                result.outros_cartoes = Math.max(
                    0,
                    row.b2cTotalCartoes - profileValue.cartoes - row.serasaCartoes,
                );
            }
        }

        if (isConsolidated) {
            const consolidated = chartBUs.reduce<ActivityAggregate>((total, bu) => {
                addAggregate(total, periodBU[bu] ?? EMPTY_AGGREGATE);
                return total;
            }, { ...EMPTY_AGGREGATE });
            result.cac_consolidado = consolidated.cartoes > 0 && consolidated.custo > 0
                ? consolidated.custo / consolidated.cartoes
                : null;
        }

        return result;
    }), [aggregates.byPeriod, aggregates.byPeriodDimension, chartBUs, dimensionSeries, isConsolidated, periodRows, profile]);

    const pacingData = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const dailyActivities = activities.filter(
            (activity) =>
                chartBUs.includes(activity.bu as AcquisitionBU) &&
                format(activity.dataDisparo, 'yyyy-MM').startsWith(monthPrefix),
        );
        const activityByDate = new Map<string, Record<AcquisitionBU, ActivityAggregate>>();

        dailyActivities.forEach((activity) => {
            const dateKey = format(activity.dataDisparo, 'yyyy-MM-dd');
            const period = activityByDate.get(dateKey) ?? {} as Record<AcquisitionBU, ActivityAggregate>;
            const bu = activity.bu as AcquisitionBU;
            period[bu] = period[bu] ?? { ...EMPTY_AGGREGATE };
            addAggregate(period[bu], metricValue(activity));
            activityByDate.set(dateKey, period);
        });

        const b2cByDate = new Map(
            dailyAnalysis
                .filter((day) => day.data.startsWith(monthPrefix))
                .map((day) => [day.data, Number(day.emissoes_b2c_total) || 0] as const),
        );
        const b2cHasExternal = Array.from(b2cByDate.values()).some((value) => value > 0);
        const cumulativeByBU: Record<AcquisitionBU, number> = { B2C: 0, B2B2C: 0, Plurix: 0 };
        const goalsByBU = Object.fromEntries(
            chartBUs.map((bu) => [bu, getCardsGoal(currentGoal, bu)]),
        ) as Record<AcquisitionBU, number>;

        const data = Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const dateKey = `${monthPrefix}-${String(day).padStart(2, '0')}`;
            const byBU = activityByDate.get(dateKey) ?? {} as Record<AcquisitionBU, ActivityAggregate>;
            const result: Record<string, string | number | null> = {
                data: dateKey,
                displayDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
            };

            chartBUs.forEach((bu) => {
                const dayCards = bu === 'B2C' && b2cHasExternal
                    ? b2cByDate.get(dateKey) ?? 0
                    : byBU[bu]?.cartoes ?? 0;
                cumulativeByBU[bu] += dayCards;
                const goal = goalsByBU[bu] ?? 0;
                result[`realizado_${bu}`] = cumulativeByBU[bu];
                result[`meta_${bu}`] = goal > 0 ? (goal * day) / daysInMonth : 0;
                result[`atingimento_${bu}`] = goal > 0 ? (cumulativeByBU[bu] / goal) * 100 : null;
            });

            if (singleBU || isConsolidated) {
                const included = singleBU ? [singleBU] : chartBUs;
                result.realizado_consolidado = included.reduce(
                    (sum, bu) => sum + cumulativeByBU[bu],
                    0,
                );
                const totalGoal = included.reduce((sum, bu) => sum + (goalsByBU[bu] ?? 0), 0);
                result.meta_consolidada = totalGoal > 0 ? (totalGoal * day) / daysInMonth : 0;
            }

            return result;
        });

        const lastActivityDate = dailyActivities.reduce<string | null>((latest, activity) => {
            const dateKey = format(activity.dataDisparo, 'yyyy-MM-dd');
            return !latest || dateKey > latest ? dateKey : latest;
        }, null);
        const lastExternalB2CDate = b2cHasExternal
            ? Array.from(b2cByDate.entries()).reduce<string | null>(
                (latest, [dateKey, value]) => value > 0 && (!latest || dateKey > latest) ? dateKey : latest,
                null,
            )
            : null;
        const observedDates = [lastActivityDate, lastExternalB2CDate]
            .filter((value): value is string => Boolean(value))
            .sort();
        const lastObservedDate = observedDates[observedDates.length - 1] ?? null;
        const lastObservedIndex = lastObservedDate ? Number(lastObservedDate.slice(-2)) - 1 : -1;

        data.forEach((row, index) => {
            if (index > lastObservedIndex) {
                chartBUs.forEach((bu) => {
                    row[`realizado_${bu}`] = null;
                    row[`atingimento_${bu}`] = null;
                });
                row.realizado_consolidado = null;
            }
        });

        const totalsByBU = Object.fromEntries(chartBUs.map((bu) => {
            const lastValue = lastObservedIndex >= 0 ? data[lastObservedIndex]?.[`realizado_${bu}`] : 0;
            return [bu, Number(lastValue) || 0];
        })) as Record<AcquisitionBU, number>;

        return { data, totalsByBU, goalsByBU, lastObservedIndex };
    }, [activities, chartBUs, currentGoal, currentMonth, dailyAnalysis, isConsolidated, singleBU]);

    const singleSummary = useMemo(() => {
        const included = singleBU ? [singleBU] : chartBUs;
        const totalCards = included.reduce((sum, bu) => sum + (pacingData.totalsByBU[bu] ?? 0), 0);
        const goalCards = included.reduce((sum, bu) => sum + (pacingData.goalsByBU[bu] ?? 0), 0);
        return {
            totalCards,
            goalCards,
            progress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0,
        };
    }, [chartBUs, pacingData.goalsByBU, pacingData.totalsByBU, singleBU]);

    const selectedActivities = useMemo(() => {
        if (!selectedDate) return [];
        return activities.filter((activity) => {
            const activityDate = format(activity.dataDisparo, 'yyyy-MM-dd');
            return activityDate === selectedDate && (!selectedDrillBU || activity.bu === selectedDrillBU);
        });
    }, [activities, selectedDate, selectedDrillBU]);

    const openDailyResults = () => {
        setReportDeepLink({ mode: 'daily' });
        setTab('relatorio');
    };

    const handleChartClick = (event: any) => {
        if (isMonthly) return;
        const active = event?.activePayload?.[0];
        const payload = active?.payload;
        if (!payload?.data) return;

        const dataKey = String(active?.dataKey ?? '');
        const clickedBU = chartBUs.find((bu) => dataKey.endsWith(`_${bu}`)) ?? singleBU;
        setSelectedDrillBU(clickedBU ?? null);
        setSelectedDate(payload.data);
    };

    const handleDotClick = (props: any) => {
        if (isMonthly || !props?.payload?.data) return;
        setSelectedDrillBU(singleBU);
        setSelectedDate(props.payload.data);
    };

    const toggleSeries = (name: string) => {
        setSelectedSeries((current) => current === name ? null : name);
    };
    const isSeriesHidden = (name: string) => Boolean(selectedSeries && selectedSeries !== name);
    const legendProps = {
        iconSize: 8,
        wrapperStyle: { fontSize: '10px', paddingTop: '5px' },
        onClick: (entry: any) => {
            const name = entry?.value ?? entry?.payload?.value;
            if (name) toggleSeries(String(name));
        },
        formatter: (value: string) => (
            <span style={{
                color: isSeriesHidden(value) ? '#cbd5e1' : '#475569',
                cursor: 'pointer',
                fontWeight: selectedSeries === value ? 700 : 400,
            }}>
                {value}
            </span>
        ),
    };

    const chartTooltip = (
        <ChartTooltip
            totalLabel={`Total no ${isMonthly ? 'mês' : 'dia'}`}
            formatValue={(value, entry) => {
                const name = String(entry?.name ?? '');
                if (name.includes('CAC')) return formatCurrency(value);
                if (name.includes('%') || name.includes('Conversão') || name.includes('Atingimento')) {
                    return `${value.toFixed(2).replace('.', ',')}%`;
                }
                return value.toLocaleString('pt-BR');
            }}
            formatTotal={(total) => total.toLocaleString('pt-BR')}
            isRate={(entry) => {
                const name = String(entry?.name ?? '');
                return name.includes('CAC') || name.includes('%') || name.includes('Conversão') || name.includes('Atingimento');
            }}
        />
    );

    const renderModeControls = () => (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {isMultiBU && (
                <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <button
                        type="button"
                        aria-pressed={!isConsolidated}
                        onClick={() => setMultiBUMode('comparison')}
                        className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                            !isConsolidated ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Comparativo
                    </button>
                    <button
                        type="button"
                        aria-pressed={isConsolidated}
                        disabled={!canConsolidate}
                        onClick={() => canConsolidate && setMultiBUMode('consolidated')}
                        title={!canConsolidate
                            ? 'O total B2C pode compartilhar universo com B2B2C. Use o modo Comparativo.'
                            : 'Somar B2B2C e Plurix com taxas recalculadas'}
                        className={`border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                            isConsolidated
                                ? 'bg-cyan-600 text-white'
                                : canConsolidate
                                    ? 'text-slate-500 hover:bg-slate-50'
                                    : 'cursor-not-allowed bg-slate-50 text-slate-300'
                        }`}
                    >
                        Consolidado
                    </button>
                </div>
            )}

            {singleBU === 'B2C' && (
                <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <button
                        type="button"
                        aria-pressed={showSerasa}
                        onClick={() => setShowSerasa((value) => !value)}
                        className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                            showSerasa
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Serasa API
                    </button>
                    <button
                        type="button"
                        aria-pressed={showOtherB2C}
                        onClick={() => {
                            setShowOtherB2C((value) => !value);
                            if (selectedSeries === 'Outros B2C') setSelectedSeries(null);
                        }}
                        className={`inline-flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                            showOtherB2C
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        {showOtherB2C ? <Eye size={12} /> : <EyeOff size={12} />}
                        Outros B2C
                    </button>
                </div>
            )}

            <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                {([
                    { key: 'monthly', label: 'Mensal' },
                    { key: 'daily', label: 'Diário' },
                ] as const).map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setChartMode(key)}
                        aria-pressed={chartMode === key}
                        className={`border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold first:border-l-0 ${
                            chartMode === key
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );

    if (rentab || chartBUs.length === 0) {
        const title = rentab ? 'Rentabilização fora desta leitura' : 'Seguros fora desta leitura';
        const description = rentab
            ? 'Os gráficos de metas, cartões e CAC são exclusivos da frente de Aquisição.'
            : 'Selecione B2C, B2B2C ou Plurix para visualizar metas e resultados de aquisição.';
        return (
            <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <div className="max-w-md">
                    <Layers3 className="mx-auto mb-3 text-slate-400" size={24} />
                    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
            </div>
        );
    }

    const chartCardClass = 'flex h-52 flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]';
    const lineCommonProps = {
        type: 'linear' as const,
        connectNulls: false,
        strokeWidth: 2.25,
        strokeLinecap: 'square' as const,
        dot: { r: 2.5, strokeWidth: 1.5, stroke: '#fff' },
    };

    const excludedNotice = excludedBUs.length > 0
        ? `${excludedBUs.join(', ')} ${excludedBUs.length > 1 ? 'ficam' : 'fica'} fora destes gráficos`
        : null;

    return (
        <div className="mb-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    {chartBUs.map((bu) => (
                        <span
                            key={bu}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                        >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BU_ANALYTICS_PROFILES[bu].color }} />
                            {bu}
                        </span>
                    ))}
                    {excludedNotice && (
                        <span className="text-[10px] text-slate-400">{excludedNotice}</span>
                    )}
                </div>
                {renderModeControls()}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <div className={chartCardClass}>
                        <div className="mb-2 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <ChartHeading
                                    title={
                                        profile
                                            ? profile.accumulatedTitle
                                            : isConsolidated
                                                ? 'ACUMULADO TOTAL B2B2C + PLURIX VS META'
                                                : 'ATINGIMENTO ACUMULADO DA META POR BU'
                                    }
                                    helpText={
                                        profile || isConsolidated
                                            ? 'Realizado acumulado até o último dia observado versus a meta acumulada esperada.'
                                            : 'Cada BU é comparada contra sua própria meta; os percentuais não são somados.'
                                    }
                                    onClick={openDailyResults}
                                />
                                {(profile || isConsolidated) && (
                                    <div className="mt-0.5 flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-slate-800">
                                            {singleSummary.totalCards.toLocaleString('pt-BR')}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            / {singleSummary.goalCards.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {(profile || isConsolidated) && (
                                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                    singleSummary.progress >= 100
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                }`}>
                                    {singleSummary.progress.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="min-h-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pacingData.data} onClick={handleChartClick} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                                    <CartesianGrid stroke="#e8edf3" vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={18} />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                                        width={44}
                                        tickFormatter={(value) => profile || isConsolidated ? formatCompact(value) : `${Number(value).toFixed(0)}%`}
                                    />
                                    <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                    {profile || isConsolidated ? (
                                        <>
                                            <Line
                                                {...lineCommonProps}
                                                dataKey="meta_consolidada"
                                                name="Meta acumulada"
                                                stroke="#10B981"
                                                strokeDasharray="5 4"
                                                dot={false}
                                            />
                                            <Line
                                                {...lineCommonProps}
                                                dataKey="realizado_consolidado"
                                                name="Realizado acumulado"
                                                stroke={profile?.color ?? '#2563EB'}
                                                dot={false}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <ReferenceLine
                                                y={100}
                                                stroke="#94A3B8"
                                                strokeDasharray="4 4"
                                                label={{ value: 'Meta', position: 'insideTopRight', fontSize: 9, fill: '#64748B' }}
                                            />
                                            {chartBUs.map((bu) => (
                                                <Line
                                                    key={bu}
                                                    {...lineCommonProps}
                                                    dataKey={`atingimento_${bu}`}
                                                    name={`Atingimento ${bu}`}
                                                    stroke={BU_ANALYTICS_PROFILES[bu].color}
                                                    hide={isSeriesHidden(`Atingimento ${bu}`)}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {!profile && !isConsolidated && <Legend {...legendProps} />}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={chartCardClass}>
                        <div className="mb-2">
                            <ChartHeading
                                title={
                                    profile
                                        ? profile.cacTitle
                                        : isConsolidated
                                            ? 'EVOLUÇÃO DE CAC CONSOLIDADO B2B2C + PLURIX'
                                            : 'EVOLUÇÃO DE CAC POR BU'
                                }
                                helpText="CAC recalculado como custo total dividido pelos cartões do período. Dias sem cartão ou custo permanecem como lacuna."
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="min-h-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeChartData} onClick={handleChartClick} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                                    <CartesianGrid stroke="#e8edf3" vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} tickFormatter={(value) => `R$${Number(value).toFixed(0)}`} />
                                    <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                    {profile && getCacGoal(currentGoal, profile.bu) > 0 && (
                                        <ReferenceLine
                                            y={getCacGoal(currentGoal, profile.bu)}
                                            stroke="#94A3B8"
                                            strokeDasharray="4 4"
                                            label={{ value: 'Limite', position: 'insideTopRight', fontSize: 9, fill: '#64748B' }}
                                        />
                                    )}
                                    {!profile && !isConsolidated && chartBUs.map((bu) => {
                                        const cacGoal = getCacGoal(currentGoal, bu);
                                        return cacGoal > 0 ? (
                                            <ReferenceLine
                                                key={`cac-goal-${bu}`}
                                                y={cacGoal}
                                                stroke={BU_ANALYTICS_PROFILES[bu].color}
                                                strokeOpacity={0.45}
                                                strokeDasharray="3 4"
                                            />
                                        ) : null;
                                    })}
                                    {profile ? (
                                        <Line
                                            {...lineCommonProps}
                                            dataKey="cac_single"
                                            name={isMonthly ? 'CAC do mês' : 'CAC do dia'}
                                            stroke={profile.color}
                                            dot={{ ...lineCommonProps.dot, fill: profile.color }}
                                            activeDot={{ r: 5, onClick: handleDotClick, fill: profile.color, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    ) : isConsolidated ? (
                                        <Line
                                            {...lineCommonProps}
                                            dataKey="cac_consolidado"
                                            name="CAC consolidado"
                                            stroke="#0EA5E9"
                                            dot={{ ...lineCommonProps.dot, fill: '#0EA5E9' }}
                                        />
                                    ) : (
                                        chartBUs.map((bu) => (
                                            <Line
                                                key={bu}
                                                {...lineCommonProps}
                                                dataKey={`cac_${bu}`}
                                                name={`CAC ${bu}`}
                                                stroke={BU_ANALYTICS_PROFILES[bu].color}
                                                dot={{ ...lineCommonProps.dot, fill: BU_ANALYTICS_PROFILES[bu].color }}
                                                hide={isSeriesHidden(`CAC ${bu}`)}
                                            />
                                        ))
                                    )}
                                    {!profile && !isConsolidated && <Legend {...legendProps} />}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={chartCardClass}>
                        <div className="mb-2">
                            <ChartHeading
                                title={
                                    profile
                                        ? profile.proposalsTitle
                                        : isConsolidated
                                            ? 'EVOLUÇÃO DE PROPOSTAS B2B2C + PLURIX'
                                            : 'EVOLUÇÃO DE RESULTADOS POR BU'
                                }
                                helpText={
                                    profile
                                        ? `Propostas distribuídas por ${profile.breakdownLabel}, limitadas às quatro séries mais relevantes.`
                                        : isConsolidated
                                            ? 'Propostas das BUs compatíveis, mantendo cada BU visível na composição.'
                                            : 'Cartões do período por BU em valores absolutos; use o atingimento para comparar ritmos.'
                                }
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="min-h-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                {profile || isConsolidated ? (
                                    <BarChart data={timeChartData} onClick={handleChartClick} barCategoryGap="30%" maxBarSize={18}>
                                        <CartesianGrid stroke="#e8edf3" vertical={false} />
                                        <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                        <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                        <Legend {...legendProps} />
                                        {profile ? (
                                            <>
                                                {showSerasa && profile.bu === 'B2C' ? (
                                                    <>
                                                        <Bar dataKey="propostas_crm" name="CRM B2C" stackId="a" fill={profile.color} hide={isSeriesHidden('CRM B2C')} />
                                                        <Bar dataKey="serasa_propostas" name="Serasa API" stackId="a" fill="#F59E0B" hide={isSeriesHidden('Serasa API')} />
                                                    </>
                                                ) : dimensionSeries.map((series, index) => (
                                                    <Bar
                                                        key={series.name}
                                                        dataKey={`dim_propostas_${index}`}
                                                        name={series.name}
                                                        stackId="a"
                                                        fill={series.color}
                                                        hide={isSeriesHidden(series.name)}
                                                    />
                                                ))}
                                                {profile.bu === 'B2C' && showOtherB2C && (
                                                    <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#CBD5E1" hide={isSeriesHidden('Outros B2C')} />
                                                )}
                                            </>
                                        ) : chartBUs.map((bu) => (
                                            <Bar
                                                key={bu}
                                                dataKey={`propostas_${bu}`}
                                                name={bu}
                                                stackId="a"
                                                fill={BU_ANALYTICS_PROFILES[bu].color}
                                                hide={isSeriesHidden(bu)}
                                            />
                                        ))}
                                    </BarChart>
                                ) : (
                                    <LineChart data={timeChartData} onClick={handleChartClick}>
                                        <CartesianGrid stroke="#e8edf3" vertical={false} />
                                        <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                        <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                        <Legend {...legendProps} />
                                        {chartBUs.map((bu) => (
                                            <Line
                                                key={bu}
                                                {...lineCommonProps}
                                                dataKey={`cartoes_${bu}`}
                                                name={bu}
                                                stroke={BU_ANALYTICS_PROFILES[bu].color}
                                                dot={{ ...lineCommonProps.dot, fill: BU_ANALYTICS_PROFILES[bu].color }}
                                                hide={isSeriesHidden(bu)}
                                            />
                                        ))}
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={chartCardClass}>
                        <div className="mb-2">
                            <ChartHeading
                                title={
                                    profile
                                        ? profile.emissionsTitle
                                        : isConsolidated
                                            ? 'EVOLUÇÃO DE EMISSÕES B2B2C + PLURIX'
                                            : 'CONVERSÃO DO FUNIL POR BU'
                                }
                                helpText={
                                    profile
                                        ? `Cartões emitidos distribuídos por ${profile.breakdownLabel}.`
                                        : isConsolidated
                                            ? 'Cartões emitidos por BU; o total é a soma apenas das BUs compatíveis.'
                                            : 'Conversão recalculada como cartões divididos pela base entregue, sem média de percentuais.'
                                }
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="min-h-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                {profile || isConsolidated ? (
                                    <BarChart data={timeChartData} onClick={handleChartClick} barCategoryGap="30%" maxBarSize={18}>
                                        <CartesianGrid stroke="#e8edf3" vertical={false} />
                                        <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                        <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                        <Legend {...legendProps} />
                                        {profile ? (
                                            <>
                                                {showSerasa && profile.bu === 'B2C' ? (
                                                    <>
                                                        <Bar dataKey="cartoes_crm" name="CRM B2C" stackId="a" fill={profile.color} hide={isSeriesHidden('CRM B2C')} />
                                                        <Bar dataKey="serasa_cartoes" name="Serasa API" stackId="a" fill="#F59E0B" hide={isSeriesHidden('Serasa API')} />
                                                    </>
                                                ) : dimensionSeries.map((series, index) => (
                                                    <Bar
                                                        key={series.name}
                                                        dataKey={`dim_cartoes_${index}`}
                                                        name={series.name}
                                                        stackId="a"
                                                        fill={series.color}
                                                        hide={isSeriesHidden(series.name)}
                                                    />
                                                ))}
                                                {profile.bu === 'B2C' && showOtherB2C && (
                                                    <Bar dataKey="outros_cartoes" name="Outros B2C" stackId="a" fill="#CBD5E1" hide={isSeriesHidden('Outros B2C')} />
                                                )}
                                            </>
                                        ) : chartBUs.map((bu) => (
                                            <Bar
                                                key={bu}
                                                dataKey={`cartoes_${bu}`}
                                                name={bu}
                                                stackId="a"
                                                fill={BU_ANALYTICS_PROFILES[bu].color}
                                                hide={isSeriesHidden(bu)}
                                            />
                                        ))}
                                    </BarChart>
                                ) : (
                                    <LineChart data={timeChartData} onClick={handleChartClick}>
                                        <CartesianGrid stroke="#e8edf3" vertical={false} />
                                        <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                                            width={42}
                                            tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
                                        />
                                        <Tooltip content={chartTooltip} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                        <Legend {...legendProps} />
                                        {chartBUs.map((bu) => (
                                            <Line
                                                key={bu}
                                                {...lineCommonProps}
                                                dataKey={`conversao_${bu}`}
                                                name={`Conversão ${bu}`}
                                                stroke={BU_ANALYTICS_PROFILES[bu].color}
                                                dot={{ ...lineCommonProps.dot, fill: BU_ANALYTICS_PROFILES[bu].color }}
                                                hide={isSeriesHidden(`Conversão ${bu}`)}
                                            />
                                        ))}
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <DailyDetailsModal
                date={selectedDate ? new Date(`${selectedDate}T12:00:00`) : null}
                activities={selectedActivities}
                onClose={() => {
                    setSelectedDate(null);
                    setSelectedDrillBU(null);
                }}
            />
        </div>
    );
};
