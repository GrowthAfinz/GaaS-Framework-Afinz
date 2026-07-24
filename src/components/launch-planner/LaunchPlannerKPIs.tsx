import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Goal } from '../../types/framework';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useB2CAnalysis } from '../../hooks/useB2CAnalysis';
import { useBU } from '../../contexts/BUContext';
import { Eye, EyeOff, Info } from 'lucide-react';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { useAppStore } from '../../store/useAppStore';
import { ChartTooltip } from '../ui/ChartTooltip';
import { deriveActivityMetrics } from '../../utils/activityMetrics';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({ activities, goals, currentMonth }) => {

    const rentab = useAppStore((state) => state.viewSettings.frente === 'rentabilizacao');
    const allStoreActivities = useAppStore((state) => state.activities);
    const setTab = useAppStore((state) => state.setTab);
    const setReportDeepLink = useAppStore((state) => state.setReportDeepLink);
    const { dailyAnalysis, yearMonthlyAnalysis } = useB2CAnalysis();
    const { isBUSelected, selectedBUs } = useBU();

    const [showSerasa, setShowSerasa] = useState(false);
    const [showOtherB2C, setShowOtherB2C] = useState(true);
    // O trabalho operacional começa no dia a dia; o modo mensal segue disponível
    // para leitura de tendência, mas não é mais o estado inicial.
    const [chartMode, setChartMode] = useState<'monthly' | 'daily'>('daily');
    const isMonthly = chartMode === 'monthly';

    const SEGMENT_COLORS: Record<string, string> = {
        'Abandonados': '#3B82F6',
        'Negados': '#10B981',
        'Base_Proprietaria': '#A855F7',
        'Base Proprietaria': '#A855F7',
        'Aprovados_nao_convertedos': '#F97316',
        'Aprovados não convertidos': '#F97316',
        'Leads_Parceiros': '#EC4899',
        'Leads Parceiros': '#EC4899',
        'Instabilidade': '#14B8A6',
    };

    const DEFAULT_COLORS = ['#2563EB', '#10B981', '#A855F7', '#F97316', '#EC4899', '#14B8A6', '#F59E0B', '#64748B'];

    const activeSegments = useMemo(() => {
        const segments = new Set<string>();
        const targetActivities = isMonthly 
            ? allStoreActivities.filter(a => selectedBUs.some((selectedBU) => selectedBU === a.bu))
            : activities;

        targetActivities.forEach(activity => {
            if (activity.segmento) {
                segments.add(activity.segmento);
            }
        });
        return Array.from(segments);
    }, [activities, allStoreActivities, selectedBUs, isMonthly]);

    // Filtro por clique na legenda: ao clicar num segmento (ou canal), os gráficos de
    // Propostas/Emissões passam a exibir apenas aquela série; as demais somem do gráfico
    // e ficam cinza na legenda. Clicar de novo (ou em outra) limpa/troca a seleção.
    // A chave é o NOME da série, então a seleção vale para os dois gráficos e persiste
    // entre os modos Mensal e Diário.
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

    const validSeriesNames = useMemo(() => {
        const names = new Set<string>();
        if (showSerasa) {
            names.add('CRM B2C');
            names.add('Serasa API');
        } else {
            activeSegments.forEach(s => names.add(s));
        }
        if (showOtherB2C) names.add('Outros B2C');
        return names;
    }, [showSerasa, showOtherB2C, activeSegments]);

    // Se a série selecionada deixar de existir (ex.: alternar Serasa API, mudar de BU),
    // limpa a seleção para não esconder todas as barras e deixar o gráfico vazio.
    useEffect(() => {
        if (selectedSeries && !validSeriesNames.has(selectedSeries)) {
            setSelectedSeries(null);
        }
    }, [selectedSeries, validSeriesNames]);

    const isSeriesHidden = (name: string) => !!selectedSeries && selectedSeries !== name;

    const segmentLegendProps = {
        iconSize: 8,
        wrapperStyle: { fontSize: '10px', paddingTop: '5px' },
        onClick: (o: any) => {
            const name = o?.value ?? o?.payload?.value;
            if (!name) return;
            if (name === 'Outros B2C' && !showOtherB2C) return;
            setSelectedSeries(prev => (prev === name ? null : name));
        },
        formatter: (value: string) => {
            const disabled = value === 'Outros B2C' && !showOtherB2C;
            const dimmed = disabled || (!!selectedSeries && selectedSeries !== value);
            return (
                <span
                    style={{
                        color: dimmed ? '#cbd5e1' : '#475569',
                        opacity: disabled ? 0.45 : dimmed ? 0.6 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontWeight: selectedSeries === value ? 700 : 400,
                    }}
                >
                    {value}
                </span>
            );
        },
    };

    const dailySegmentsMap = useMemo(() => {
        const map = new Map<string, Record<string, { propostas: number, emissoes: number }>>();
        activities.forEach(activity => {
            const date = activity.dataDisparo;
            if (!date || isNaN(date.getTime())) return;
            const dateKey = format(date, 'yyyy-MM-dd');
            const segment = activity.segmento || 'Sem Segmento';

            if (!map.has(dateKey)) {
                map.set(dateKey, {});
            }
            const segments = map.get(dateKey)!;
            if (!segments[segment]) {
                segments[segment] = { propostas: 0, emissoes: 0 };
            }
            segments[segment].propostas += activity.kpis?.propostas || 0;
            segments[segment].emissoes += activity.kpis?.emissoes || activity.kpis?.cartoes || 0;
        });
        return map;
    }, [activities]);

    const dailyCacMap = useMemo(() => {
        const map = new Map<string, { custoTotal: number; cartoes: number }>();
        activities.forEach((activity) => {
            const date = activity.dataDisparo;
            if (!date || isNaN(date.getTime())) return;

            const dateKey = format(date, 'yyyy-MM-dd');
            const current = map.get(dateKey) ?? { custoTotal: 0, cartoes: 0 };
            const metrics = deriveActivityMetrics(activity);
            current.custoTotal += metrics.custoTotal;
            current.cartoes += metrics.cartoes;
            map.set(dateKey, current);
        });
        return map;
    }, [activities]);

    const monthlySegmentsMap = useMemo(() => {
        const map = new Map<string, Record<string, { propostas: number, emissoes: number }>>();
        const targetActivities = allStoreActivities.filter(a => selectedBUs.some((selectedBU) => selectedBU === a.bu));
        targetActivities.forEach(activity => {
            const date = activity.dataDisparo;
            if (!date || isNaN(date.getTime())) return;
            const monthKey = format(date, 'yyyy-MM');
            const segment = activity.segmento || 'Sem Segmento';

            if (!map.has(monthKey)) {
                map.set(monthKey, {});
            }
            const segments = map.get(monthKey)!;
            if (!segments[segment]) {
                segments[segment] = { propostas: 0, emissoes: 0 };
            }
            segments[segment].propostas += activity.kpis?.propostas || 0;
            segments[segment].emissoes += activity.kpis?.emissoes || activity.kpis?.cartoes || 0;
        });
        return map;
    }, [allStoreActivities, selectedBUs]);

    const monthlyCacMap = useMemo(() => {
        const map = new Map<string, { custoTotal: number; cartoes: number }>();
        const targetActivities = allStoreActivities.filter(
            (activity) => selectedBUs.length === 0 || selectedBUs.some((selectedBU) => selectedBU === activity.bu),
        );

        targetActivities.forEach((activity) => {
            const date = activity.dataDisparo;
            if (!date || isNaN(date.getTime())) return;

            const monthKey = format(date, 'yyyy-MM');
            const current = map.get(monthKey) ?? { custoTotal: 0, cartoes: 0 };
            const metrics = deriveActivityMetrics(activity);
            current.custoTotal += metrics.custoTotal;
            current.cartoes += metrics.cartoes;
            map.set(monthKey, current);
        });
        return map;
    }, [allStoreActivities, selectedBUs]);


    const isOnlySeguros = selectedBUs.length === 1 && selectedBUs[0] === 'Seguros';
    const segurosActivities = useMemo(() => activities.filter((activity) => activity.bu === 'Seguros'), [activities]);

    const showCharts = !isOnlySeguros && selectedBUs.includes('B2C') && !isBUSelected('B2B2C') && !isBUSelected('Plurix');

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const payload = data.activePayload[0].payload;
            if (payload.data) {
                setSelectedDate(payload.data);
            }
        }
    };

    const handleDotClick = (props: any) => {
        if (props && props.payload && props.payload.data) {
            setSelectedDate(props.payload.data);
        }
    };

    const openDailyResults = () => {
        setReportDeepLink({ mode: 'daily' });
        setTab('relatorio');
    };

    const selectedActivities = useMemo(() => {
        if (!selectedDate) return [];
        return activities.filter(act => {
            const actDate = act.dataDisparo instanceof Date
                ? format(act.dataDisparo, 'yyyy-MM-dd')
                : typeof act.dataDisparo === 'string' ? (act.dataDisparo as string).split('T')[0] : '';
            return actDate === selectedDate;
        });
    }, [selectedDate, activities]);

    const metrics = useMemo(() => {
        const currentGoal = goals.find(g => g.mes === currentMonth);

        const isOnlyBU = (bu: string) => selectedBUs.length === 1 && selectedBUs[0] === bu;
        // selectedBUs vazio = todas as BUs ativas
        const hasBU = (bu: string) => selectedBUs.length === 0 || selectedBUs.some((selectedBU) => selectedBU === bu);
        // BUs não-Seguros ativas
        const activeCoreB2Us = ['B2C', 'B2B2C', 'Plurix'].filter(bu => hasBU(bu));

        // Cartões B2C: preferimos a originação real (b2c_daily_metrics via dailyAnalysis),
        // mas caímos para as emissões do CRM quando não há dado B2C no período — caso
        // contrário a meta mostra 0 mesmo havendo cartões reais (ex.: mês sem b2c_daily_metrics).
        const b2cFromDaily = dailyAnalysis.reduce((sum, d) => sum + d.emissoes_b2c_total, 0);
        const b2cFromCrm = activities.filter(a => a.bu === 'B2C').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
        const b2cCards = b2cFromDaily > 0 ? b2cFromDaily : b2cFromCrm;

        // ── Seguros isolado ──────────────────────────────────────────────────
        if (isOnlySeguros) {
            const totalCards = segurosActivities.reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.bus?.Seguros?.cartoes || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (Seguros)' };
        }

        // ── B2C sozinho ou nenhuma BU especial filtrada (estado padrão) ─────
        if (isOnlyBU('B2C') || activeCoreB2Us.every(bu => bu === 'B2C')) {
            const totalCards = b2cCards;
            const goalCards  = currentGoal?.b2c_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (B2C)' };
        }

        // ── B2B2C isolado ────────────────────────────────────────────────────
        if (isOnlyBU('B2B2C')) {
            const totalCards = activities.filter(a => a.bu === 'B2B2C').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.b2b2c_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (B2B2C)' };
        }

        // ── Plurix isolado ───────────────────────────────────────────────────
        if (isOnlyBU('Plurix')) {
            const totalCards = activities.filter(a => a.bu === 'Plurix').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const goalCards  = currentGoal?.plurix_meta || 0;
            return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label: 'Meta (Plurix)' };
        }

        // ── Múltiplas BUs — soma proporcional ────────────────────────────────
        let totalCards = 0;
        let goalCards  = 0;
        const labelParts: string[] = [];

        if (hasBU('B2C')) {
            totalCards += b2cCards;
            const g = currentGoal?.b2c_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('B2C');
        }
        if (hasBU('B2B2C')) {
            totalCards += activities.filter(a => a.bu === 'B2B2C').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const g = currentGoal?.b2b2c_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('B2B2C');
        }
        if (hasBU('Plurix')) {
            totalCards += activities.filter(a => a.bu === 'Plurix').reduce((sum, act) => sum + (act.kpis?.cartoes || 0), 0);
            const g = currentGoal?.plurix_meta || 0;
            goalCards += g;
            if (g > 0) labelParts.push('Plurix');
        }

        const label = labelParts.length > 0 ? `Meta (${labelParts.join(' + ')})` : 'Meta combinada';
        return { totalCards, goalCards, goalProgress: goalCards > 0 ? (totalCards / goalCards) * 100 : 0, label };
    }, [goals, currentMonth, dailyAnalysis, selectedBUs, activities, isOnlySeguros, segurosActivities]);

    const cardsPacing = useMemo(() => {
        const [year, month] = currentMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const isOnlyBU = (bu: string) => selectedBUs.length === 1 && selectedBUs[0] === bu;
        const hasBU = (bu: string) => selectedBUs.length === 0 || selectedBUs.some((selectedBU) => selectedBU === bu);

        const activityCardsByDate = new Map<string, Record<string, number>>();
        const observedActivityDates = new Set<string>();

        activities.forEach((activity) => {
            const date = activity.dataDisparo;
            if (!date || isNaN(date.getTime())) return;

            const dateKey = format(date, 'yyyy-MM-dd');
            if (!dateKey.startsWith(monthPrefix)) return;

            const byBU = activityCardsByDate.get(dateKey) ?? {};
            byBU[activity.bu] = (byBU[activity.bu] ?? 0) + (activity.kpis?.cartoes || 0);
            activityCardsByDate.set(dateKey, byBU);

            // Uma atividade com qualquer resultado preenchido confirma que o dia já foi observado,
            // mesmo quando a quantidade de cartões foi zero.
            if (
                (activity.kpis?.cartoes || 0) > 0 ||
                (activity.kpis?.propostas || 0) > 0 ||
                (activity.kpis?.baseEntregue || 0) > 0 ||
                (activity.kpis?.baseEnviada || 0) > 0
            ) {
                observedActivityDates.add(dateKey);
            }
        });

        const b2cFromDaily = dailyAnalysis.reduce((sum, day) => sum + day.emissoes_b2c_total, 0);
        const useB2CDailySource = b2cFromDaily > 0;
        const b2cDailyByDate = new Map(
            dailyAnalysis
                .filter((day) => day.data.startsWith(monthPrefix))
                .map((day) => [day.data, day] as const),
        );

        const selectedActivityBUs = isOnlySeguros
            ? ['Seguros']
            : isOnlyBU('B2C')
                ? ['B2C']
                : isOnlyBU('B2B2C')
                    ? ['B2B2C']
                    : isOnlyBU('Plurix')
                        ? ['Plurix']
                        : ['B2C', 'B2B2C', 'Plurix'].filter(hasBU);

        const dailyCards = Array.from({ length: daysInMonth }, (_, index) => {
            const dayOfMonth = index + 1;
            const dateKey = `${monthPrefix}-${String(dayOfMonth).padStart(2, '0')}`;
            const activityValues = activityCardsByDate.get(dateKey) ?? {};
            const b2cDay = b2cDailyByDate.get(dateKey);

            let cards = 0;
            selectedActivityBUs.forEach((bu) => {
                if (bu === 'B2C' && useB2CDailySource) {
                    cards += b2cDay?.emissoes_b2c_total ?? 0;
                } else {
                    cards += activityValues[bu] ?? 0;
                }
            });

            const hasObservedB2CData = selectedActivityBUs.includes('B2C') && useB2CDailySource && !!b2cDay && (
                b2cDay.emissoes_b2c_total > 0 ||
                b2cDay.propostas_b2c_total > 0
            );
            const hasObservedActivityData = selectedActivityBUs.some((bu) => {
                if (bu === 'B2C' && useB2CDailySource) return false;
                return observedActivityDates.has(dateKey) && activityValues[bu] !== undefined;
            });

            return {
                dateKey,
                displayDate: `${String(dayOfMonth).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
                dayOfMonth,
                cards,
                observed: hasObservedB2CData || hasObservedActivityData,
            };
        });

        const lastObservedIndex = dailyCards.reduce(
            (lastIndex, day, index) => day.observed ? index : lastIndex,
            -1,
        );

        let cumulativeCards = 0;
        const data = dailyCards.map((day, index) => {
            cumulativeCards += day.cards;
            return {
                ...day,
                realizadoAcumulado: index <= lastObservedIndex ? cumulativeCards : null,
                metaAcumulada: metrics.goalCards > 0
                    ? (metrics.goalCards * day.dayOfMonth) / daysInMonth
                    : 0,
            };
        });

        const lastObservedPoint = lastObservedIndex >= 0 ? data[lastObservedIndex] : null;
        const paceDelta = lastObservedPoint?.realizadoAcumulado != null
            ? lastObservedPoint.realizadoAcumulado - lastObservedPoint.metaAcumulada
            : null;

        return { data, lastObservedPoint, paceDelta };
    }, [activities, currentMonth, dailyAnalysis, isOnlySeguros, metrics.goalCards, selectedBUs]);

    // Serasa é subconjunto do Total B2C; "Outros B2C" = Total − CRM − Serasa (residual).
    const withChannels = (d: typeof dailyAnalysis[number]) => ({
        ...d,
        serasa_propostas: showSerasa ? d.propostas_serasa : 0,
        serasa_emissoes: showSerasa ? d.emissoes_serasa : 0,
        outros_propostas: Math.max(0, d.propostas_b2c_total - d.propostas_crm - d.propostas_serasa),
        outros_emissoes: Math.max(0, d.emissoes_b2c_total - d.emissoes_crm - d.emissoes_serasa),
        cac_medio: d.cac_medio
    });

    const comparisonData = useMemo(() => {
        return dailyAnalysis.map(d => {
            const [y, m, day] = d.data.split('-').map(Number);
            const dateObj = new Date(y, m - 1, day);
            const dateKey = d.data;
            const cacTotals = dailyCacMap.get(dateKey);
            // O mesmo cálculo derivado usado nos KPIs e no modal mantém o histórico
            // visível mesmo quando custo/cartões não vierem materializados em dailyAnalysis.
            const cacDoDia = cacTotals && cacTotals.cartoes > 0 && cacTotals.custoTotal > 0
                ? cacTotals.custoTotal / cacTotals.cartoes
                : null;

            const segmentDataObj: Record<string, number> = {};
            const segmentMap = dailySegmentsMap.get(dateKey) || {};
            activeSegments.forEach(segment => {
                const segVals = segmentMap[segment] || { propostas: 0, emissoes: 0 };
                segmentDataObj[`crm_propostas_${segment}`] = segVals.propostas;
                segmentDataObj[`crm_emissoes_${segment}`] = segVals.emissoes;
            });

            return {
                ...withChannels(d),
                ...segmentDataObj,
                cac_medio: cacDoDia,
                displayDate: format(dateObj, 'dd/MM', { locale: ptBR })
            };
        });
    }, [dailyAnalysis, dailyCacMap, dailySegmentsMap, activeSegments, showSerasa]);

    // Série mensal do ano corrente (jan → hoje), para o modo Mensal dos gráficos.
    // Mantém a mesma semântica: custo do mês / cartões do mês, sem carregar valores.
    const monthlyData = useMemo(() => {
        return yearMonthlyAnalysis.map(d => {
            const dateObj = new Date(d.ano, d.mes - 1, 1);
            const monthKey = format(dateObj, 'yyyy-MM');
            const cacTotals = monthlyCacMap.get(monthKey);
            const cacDoMes = cacTotals && cacTotals.cartoes > 0 && cacTotals.custoTotal > 0
                ? cacTotals.custoTotal / cacTotals.cartoes
                : null;

            const segmentDataObj: Record<string, number> = {};
            const segmentMap = monthlySegmentsMap.get(monthKey) || {};
            activeSegments.forEach(segment => {
                const segVals = segmentMap[segment] || { propostas: 0, emissoes: 0 };
                segmentDataObj[`crm_propostas_${segment}`] = segVals.propostas;
                segmentDataObj[`crm_emissoes_${segment}`] = segVals.emissoes;
            });

            return {
                ...withChannels(d),
                ...segmentDataObj,
                cac_medio: cacDoMes,
                displayDate: format(dateObj, 'MMM/yy', { locale: ptBR })
            };
        });
    }, [yearMonthlyAnalysis, monthlyCacMap, monthlySegmentsMap, activeSegments, showSerasa]);

    // Dados efetivos usados pelos 3 gráficos de série temporal (CAC, Propostas, Emissões).
    const timeChartData = isMonthly ? monthlyData : comparisonData;

    // No modo Mensal não faz sentido abrir o modal de detalhes de um único dia.
    const chartClick = isMonthly ? undefined : handleChartClick;
    const dotClick = isMonthly ? undefined : handleDotClick;

    // Toggle Mensal | Diário — segmented control compacto, inspirado em planilhas.
    const ChartModeToggle = () => (
        <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            {([
                { key: 'monthly', label: 'Mensal' },
                { key: 'daily', label: 'Diário' },
            ] as const).map(({ key, label }) => {
                const active = chartMode === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setChartMode(key)}
                        aria-pressed={active}
                        className={`border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold first:border-l-0 transition-colors duration-150 ${
                            active
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );

    // Toggle Serasa API — controle de série com estado explícito.
    const SerasaToggle = () => (
        <button
            type="button"
            aria-pressed={showSerasa}
            onClick={() => setShowSerasa(!showSerasa)}
            className={`px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
                showSerasa
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
        >
            Serasa API
        </button>
    );

    const OtherB2CToggle = () => {
        const toggleOtherB2C = () => {
            const next = !showOtherB2C;
            setShowOtherB2C(next);
            if (!next && selectedSeries === 'Outros B2C') {
                setSelectedSeries(null);
            }
        };

        return (
            <button
                type="button"
                aria-pressed={showOtherB2C}
                onClick={toggleOtherB2C}
                title={showOtherB2C ? 'Ocultar Outros B2C dos gráficos' : 'Exibir Outros B2C nos gráficos'}
                className={`inline-flex items-center gap-1.5 border-l border-slate-200 px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 ${
                    showOtherB2C
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-white text-slate-400 hover:bg-slate-50'
                }`}
            >
                {showOtherB2C ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}
                Outros B2C
            </button>
        );
    };

    const engagementData = useMemo(() => {
        const byDate = new Map<string, { data: string; displayDate: string; aberturas: number; cliques: number; custo: number }>();
        activities.forEach((activity) => {
            const data = format(activity.dataDisparo, 'yyyy-MM-dd');
            const current = byDate.get(data) ?? {
                data,
                displayDate: format(activity.dataDisparo, 'dd/MM', { locale: ptBR }),
                aberturas: 0,
                cliques: 0,
                custo: 0,
            };
            current.aberturas += activity.kpis.aberturas || 0;
            current.cliques += activity.kpis.cliques || 0;
            current.custo += activity.kpis.custoTotal || 0;
            byDate.set(data, current);
        });
        return Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data)).map((item) => ({
            ...item,
            taxaClique: item.aberturas > 0 ? (item.cliques / item.aberturas) * 100 : 0,
        }));
    }, [activities]);

    // Moeda (CAC) é uma taxa — é listada, mas não entra na soma das séries.
    const isCacEntry = (entry: any) => Boolean(entry?.name && String(entry.name).includes('CAC'));

    const chartTooltip = (
        <ChartTooltip
            totalLabel={`Total no ${isMonthly ? 'mês' : 'dia'}`}
            formatValue={(value, entry) =>
                isCacEntry(entry)
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    : value.toLocaleString('pt-BR')
            }
            formatTotal={(total) => total.toLocaleString('pt-BR')}
            isRate={isCacEntry}
        />
    );

    if (rentab) {
        const totalCliques = engagementData.reduce((sum, item) => sum + item.cliques, 0);
        const totalAberturas = engagementData.reduce((sum, item) => sum + item.aberturas, 0);
        const taxaClique = totalAberturas > 0 ? (totalCliques / totalAberturas) * 100 : 0;
        const custoTotal = engagementData.reduce((sum, item) => sum + item.custo, 0);
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="bg-white border border-slate-200 rounded-lg p-4 h-64 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-500">Cliques no período</h3>
                            <p className="mt-1 text-2xl font-bold text-slate-800">{totalCliques.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-slate-400">Taxa de clique: {taxaClique.toFixed(1)}%</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                            {custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                        <BarChart data={engagementData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip content={chartTooltip} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                            <Bar dataKey="cliques" name="Cliques" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 h-64 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-slate-500">Evolução da taxa de clique</h3>
                    <ResponsiveContainer width="100%" height="88%">
                        <LineChart data={engagementData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} unit="%" />
                            <Tooltip
                                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }}
                                content={
                                    <ChartTooltip
                                        formatValue={(value) => `${value.toFixed(1).replace('.', ',')}%`}
                                        isRate={() => true}
                                        showTotal={false}
                                    />
                                }
                            />
                            <Line type="monotone" dataKey="taxaClique" name="% Clique" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <DailyDetailsModal
                    date={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
                    activities={selectedActivities}
                    onClose={() => setSelectedDate(null)}
                />
            </div>
        );
    }

    return (
        <div className="mb-2">
            {showCharts && (
                <div className="flex flex-wrap justify-end items-center gap-2 mb-2">
                    <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        <SerasaToggle />
                        <OtherB2CToggle />
                    </div>
                    <ChartModeToggle />
                </div>
            )}
            <div className={`grid gap-4 ${showCharts ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4">
                <div className="relative flex h-52 flex-col justify-between overflow-hidden rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                    <div className="relative z-10 mb-2 flex items-start justify-between gap-4">
                        <div>
                            <ChartHeading
                                title="ACUMULADO TOTAL CARTÕES B2C VS META"
                                helpText="Realizado acumulado até o último dia observado versus a meta acumulada esperada até o fim do mês"
                                onClick={openDailyResults}
                            />
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-bold text-slate-800">{metrics.totalCards.toLocaleString()}</span>
                                <span className="text-xs text-slate-400">/ {metrics.goalCards.toLocaleString()}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-3 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="h-0.5 w-3 rounded bg-blue-500" />
                                    Realizado
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-0.5 w-3 border-t-2 border-dashed border-emerald-500" />
                                    Meta acumulada
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${metrics.goalProgress >= 100 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>
                                {metrics.goalProgress.toFixed(1)}%
                            </div>
                            {cardsPacing.paceDelta != null && cardsPacing.lastObservedPoint && (
                                <div className={`mt-1 text-[9px] font-medium ${cardsPacing.paceDelta >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {cardsPacing.paceDelta >= 0 ? '+' : ''}
                                    {Math.round(cardsPacing.paceDelta).toLocaleString('pt-BR')} vs ritmo em {cardsPacing.lastObservedPoint.displayDate}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="relative z-10 min-h-0 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cardsPacing.data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
                                <CartesianGrid stroke="#e8edf3" strokeWidth={1} vertical={false} />
                                <XAxis
                                    dataKey="displayDate"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                                    minTickGap={18}
                                    dy={4}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                                    width={44}
                                    domain={[0, 'auto']}
                                    tickFormatter={(value) => Number(value).toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }}
                                    content={
                                        <ChartTooltip
                                            labelPrefix="Dia"
                                            formatValue={(value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                                            showTotal={false}
                                        />
                                    }
                                />
                                <Line
                                    type="linear"
                                    dataKey="metaAcumulada"
                                    name="Meta acumulada"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    strokeDasharray="5 4"
                                    strokeLinecap="square"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#10B981' }}
                                />
                                <Line
                                    type="linear"
                                    dataKey="realizadoAcumulado"
                                    name="Realizado acumulado"
                                    connectNulls={false}
                                    stroke="#3B82F6"
                                    strokeWidth={2.5}
                                    strokeLinecap="square"
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#3B82F6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {showCharts && (
                    <div className="flex h-52 flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                        <div className="mb-2">
                            <ChartHeading
                                title="EVOLUÇÃO DE CAC CRM B2C"
                                helpText={`CAC ${isMonthly ? 'do mês = custo do mês / cartões do mês' : 'do dia = custo do dia / cartões do dia'}. Sem custo ou cartão, o gráfico preserva uma lacuna.`}
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeChartData} onClick={chartClick} margin={{ top: 8, right: 8, left: -6, bottom: 0 }} style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <CartesianGrid stroke="#e8edf3" strokeWidth={1} vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} tickFormatter={(v) => `R$${Number(v).toFixed(0)}`} />
                                    <Tooltip content={chartTooltip} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                    <Line
                                        type="linear"
                                        dataKey="cac_medio"
                                        name={isMonthly ? 'CAC do mês' : 'CAC do dia'}
                                        connectNulls={false}
                                        stroke="#10B981"
                                        strokeWidth={2.25}
                                        strokeLinecap="square"
                                        dot={{ r: 3, strokeWidth: 1.5, stroke: '#fff', fill: '#10B981' }}
                                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#10B981', onClick: dotClick, style: { cursor: isMonthly ? 'default' : 'pointer' } }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>

            {showCharts && (
                <div className="space-y-4">
                    <div className="flex h-52 flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                        <div className="mb-2">
                            <ChartHeading
                                title="EVOLUÇÃO DE PROPOSTAS CRM B2C"
                                helpText="Evolução das propostas dos segmentos acionados por CRM e, quando visível, do residual de outros canais B2C"
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData} onClick={chartClick} barCategoryGap="30%" maxBarSize={18} style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <CartesianGrid stroke="#e8edf3" strokeWidth={1} vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                    <Tooltip content={chartTooltip} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                    <Legend {...segmentLegendProps} />
                                    {showSerasa && <Bar dataKey="propostas_crm" name="CRM B2C" stackId="a" fill="#3B82F6" hide={isSeriesHidden('CRM B2C')} />}
                                    {!showSerasa && activeSegments.map((segment, index) => (
                                        <Bar
                                            key={segment}
                                            dataKey={`crm_propostas_${segment}`}
                                            name={segment}
                                            stackId="a"
                                            fill={SEGMENT_COLORS[segment] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                            hide={isSeriesHidden(segment)}
                                        />
                                    ))}
                                    {showSerasa && <Bar dataKey="serasa_propostas" name="Serasa API" stackId="a" fill="#F59E0B" hide={isSeriesHidden('Serasa API')} />}
                                    <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#cbd5e1" hide={!showOtherB2C || isSeriesHidden('Outros B2C')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex h-52 flex-col rounded-lg border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                        <div className="mb-2">
                            <ChartHeading
                                title="EVOLUÇÃO DE EMISSÕES CRM B2C"
                                helpText="Evolução dos cartões emitidos pelos segmentos acionados por CRM e, quando visível, do residual de outros canais B2C"
                                onClick={openDailyResults}
                            />
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData} onClick={chartClick} barCategoryGap="30%" maxBarSize={18} style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <CartesianGrid stroke="#e8edf3" strokeWidth={1} vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                    <Tooltip content={chartTooltip} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} wrapperStyle={{ pointerEvents: 'none', zIndex: 20 }} />
                                    <Legend {...segmentLegendProps} />
                                    {showSerasa && <Bar dataKey="emissoes_crm" name="CRM B2C" stackId="a" fill="#10B981" hide={isSeriesHidden('CRM B2C')} />}
                                    {!showSerasa && activeSegments.map((segment, index) => (
                                        <Bar
                                            key={segment}
                                            dataKey={`crm_emissoes_${segment}`}
                                            name={segment}
                                            stackId="a"
                                            fill={SEGMENT_COLORS[segment] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                            hide={isSeriesHidden(segment)}
                                        />
                                    ))}
                                    {showSerasa && <Bar dataKey="serasa_emissoes" name="Serasa API" stackId="a" fill="#F59E0B" hide={isSeriesHidden('Serasa API')} />}
                                    <Bar dataKey="outros_emissoes" name="Outros B2C" stackId="a" fill="#cbd5e1" hide={!showOtherB2C || isSeriesHidden('Outros B2C')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <DailyDetailsModal
                date={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
                activities={selectedActivities}
                onClose={() => setSelectedDate(null)}
            />
            </div>
        </div>
    );
};
