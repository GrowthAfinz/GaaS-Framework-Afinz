import React, { useMemo, useState } from 'react';
import { Activity, Goal } from '../../types/framework';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
import { useB2CAnalysis } from '../../hooks/useB2CAnalysis';
import { useBU } from '../../contexts/BUContext';
import { Info } from 'lucide-react';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { useAppStore } from '../../store/useAppStore';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LaunchPlannerKPIsProps {
    activities: Activity[];
    goals: Goal[];
    currentMonth: string;
}

export const LaunchPlannerKPIs: React.FC<LaunchPlannerKPIsProps> = ({ activities, goals, currentMonth }) => {

    const rentab = useAppStore((state) => state.viewSettings.frente === 'rentabilizacao');
    const allStoreActivities = useAppStore((state) => state.activities);
    const { dailyAnalysis, yearMonthlyAnalysis, ytdDailyAnalysis } = useB2CAnalysis();
    const { isBUSelected, selectedBUs } = useBU();

    const [showSerasa, setShowSerasa] = useState(false);
    // Modo dos gráficos de série temporal (Metas & Resultados): Mensal (padrão) = ano
    // corrente quebrado por mês; Diário = dia a dia do período selecionado.
    const [chartMode, setChartMode] = useState<'monthly' | 'daily'>('monthly');
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
            ? allStoreActivities.filter(a => selectedBUs.includes(a.bu))
            : activities;

        targetActivities.forEach(activity => {
            if (activity.segmento) {
                segments.add(activity.segmento);
            }
        });
        return Array.from(segments);
    }, [activities, allStoreActivities, selectedBUs, isMonthly]);

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

    const monthlySegmentsMap = useMemo(() => {
        const map = new Map<string, Record<string, { propostas: number, emissoes: number }>>();
        const targetActivities = allStoreActivities.filter(a => selectedBUs.includes(a.bu));
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
        const hasBU = (bu: string) => selectedBUs.length === 0 || selectedBUs.includes(bu);
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

    const metaChartData = [
        { name: 'Realizado', value: metrics.totalCards, color: '#3B82F6' },
        { name: metrics.label, value: metrics.goalCards, color: '#10B981' }
    ];

    // Serasa é subconjunto do Total B2C; "Outros B2C" = Total − CRM − Serasa (residual).
    const withChannels = (d: typeof dailyAnalysis[number]) => ({
        ...d,
        serasa_propostas: showSerasa ? d.propostas_serasa : 0,
        serasa_emissoes: showSerasa ? d.emissoes_serasa : 0,
        outros_propostas: Math.max(0, d.propostas_b2c_total - d.propostas_crm - d.propostas_serasa),
        outros_emissoes: Math.max(0, d.emissoes_b2c_total - d.emissoes_crm - d.emissoes_serasa),
        cac_medio: d.cac_medio
    });

    // CAC diário isolado (custo do dia / cartões do dia) é muito volátil — dias sem
    // cartão zeram e dias de baixo volume disparam picos. Usamos o CAC ACUMULADO
    // (custo acumulado / cartões acumulados desde o início do ano): linha suave.
    // Importante: a acumulação usa a série YTD completa (ytdDailyAnalysis), não a
    // janela selecionada — senão o acumulado "reinicia" do zero sempre que o usuário
    // troca o período (ex.: olhar só os últimos 28 dias zerava o acumulado e deixava
    // o gráfico em branco até o período acumular cartões suficientes).
    const cumulativeCacByDate = useMemo(() => {
        const map = new Map<string, number | null>();
        let cumCusto = 0;
        let cumEmis = 0;
        ytdDailyAnalysis.forEach(d => {
            cumCusto += d.custo_crm || 0;
            cumEmis += d.emissoes_crm || 0;
            map.set(d.data, cumEmis > 0 ? cumCusto / cumEmis : null);
        });
        return map;
    }, [ytdDailyAnalysis]);

    const comparisonData = useMemo(() => {
        return dailyAnalysis.map(d => {
            const cacAcumulado = cumulativeCacByDate.get(d.data) ?? null;

            const [y, m, day] = d.data.split('-').map(Number);
            const dateObj = new Date(y, m - 1, day);
            const dateKey = d.data;

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
                cac_medio: cacAcumulado,
                displayDate: format(dateObj, 'dd/MM', { locale: ptBR })
            };
        });
    }, [dailyAnalysis, dailySegmentsMap, activeSegments, showSerasa, cumulativeCacByDate]);

    // Série mensal do ano corrente (jan → hoje), para o modo Mensal dos gráficos.
    // CAC acumulado por mês (custo acumulado desde jan / cartões acumulados desde jan).
    const monthlyData = useMemo(() => {
        let cumCusto = 0;
        let cumEmis = 0;
        return yearMonthlyAnalysis.map(d => {
            cumCusto += d.custo_crm || 0;
            cumEmis += d.emissoes_crm || 0;
            const cacAcumulado = cumEmis > 0 ? cumCusto / cumEmis : null;

            const dateObj = new Date(d.ano, d.mes - 1, 1);
            const monthKey = format(dateObj, 'yyyy-MM');

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
                cac_medio: cacAcumulado,
                displayDate: format(dateObj, 'MMM/yy', { locale: ptBR })
            };
        });
    }, [yearMonthlyAnalysis, monthlySegmentsMap, activeSegments, showSerasa]);

    // Dados efetivos usados pelos 3 gráficos de série temporal (CAC, Propostas, Emissões).
    const timeChartData = isMonthly ? monthlyData : comparisonData;

    // No modo Mensal não faz sentido abrir o modal de detalhes de um único dia.
    const chartClick = isMonthly ? undefined : handleChartClick;
    const dotClick = isMonthly ? undefined : handleDotClick;

    // Toggle Mensal | Diário — segmented control em pill (fica no cabeçalho do CAC).
    const ChartModeToggle = () => (
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/70">
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
                        className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200 ${
                            active
                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );

    // Toggle Serasa API — botão simplificado
    const SerasaToggle = () => (
        <button
            type="button"
            onClick={() => setShowSerasa(!showSerasa)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ring-1 ${
                showSerasa
                    ? 'bg-amber-50 text-amber-700 ring-amber-200/70 hover:bg-amber-100/80 shadow-sm'
                    : 'bg-slate-100 text-slate-500 ring-slate-200/70 hover:bg-slate-200/50'
            }`}
        >
            Serasa API
        </button>
    );

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

    const ChartTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;

        const fmtInt = (v: number) => (v || 0).toLocaleString('pt-BR');
        const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

        // Moeda (CAC) é uma taxa — não entra no total. Segmentos com valor > 0 entram.
        const currencyEntries = payload.filter((e: any) => e?.name && e.name.includes('CAC'));
        const valueEntries = payload.filter((e: any) => e?.name && !e.name.includes('CAC') && (e.value ?? 0) > 0);
        const total = valueEntries.reduce((s: number, e: any) => s + (e.value || 0), 0);
        const showTotal = valueEntries.length > 0;

        const Row = ({ color, name, value, strong }: { color?: string; name: string; value: string; strong?: boolean }) => (
            <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-1.5 min-w-0">
                    {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                    <span className={`truncate ${strong ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{name}</span>
                </span>
                <span className={`tabular-nums shrink-0 ${strong ? 'font-bold text-emerald-600' : 'font-semibold text-slate-800'}`}>{value}</span>
            </div>
        );

        return (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-3 py-2 min-w-[168px] text-[11px]">
                <p className="font-bold text-slate-800 text-xs mb-1.5 pb-1.5 border-b border-slate-100">{label}</p>
                <div className="space-y-1">
                    {currencyEntries.map((e: any, i: number) => (
                        <Row key={`c${i}`} color={e.color} name={e.name} value={fmtBRL(e.value)} />
                    ))}
                    {valueEntries.map((e: any, i: number) => (
                        <Row key={`v${i}`} color={e.color} name={e.name} value={fmtInt(e.value)} />
                    ))}
                </div>
                {showTotal && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                        <Row name={`Total no ${isMonthly ? 'mês' : 'dia'}`} value={fmtInt(total)} strong />
                    </div>
                )}
            </div>
        );
    };

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
                            <Tooltip />
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
                            <Tooltip formatter={(value: number) => `${Number(value).toFixed(1)}%`} />
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
                <div className="flex justify-end items-center gap-3 mb-2">
                    <SerasaToggle />
                    <ChartModeToggle />
                </div>
            )}
            <div className={`grid gap-4 ${showCharts ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between h-48 relative overflow-hidden group shadow-sm">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-500 text-xs font-medium">Cartoes vs Meta</h3>
                                <span title="Visualizacao do realizado contra a meta definida para o periodo">
                                    <Info size={12} className="text-slate-500 cursor-help" />
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-bold text-slate-800">{metrics.totalCards.toLocaleString()}</span>
                                <span className="text-xs text-slate-400">/ {metrics.goalCards.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${metrics.goalProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-700'}`}>
                            {metrics.goalProgress.toFixed(1)}%
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={metaChartData} barSize={12}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#334155', fontSize: '10px' }}
                                    itemStyle={{ color: '#334155' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {metaChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {showCharts && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 h-52 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            Evolução de CAC <span className="text-slate-400 font-medium normal-case">(R$)</span>
                            <span title="CAC acumulado desde o início do ano (custo acumulado / cartões acumulados até a data)"><Info size={10} className="text-slate-400" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeChartData} onClick={chartClick} margin={{ top: 8, right: 8, left: -6, bottom: 0 }} style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <defs>
                                        <linearGradient id="cacGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#eef2f6" vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} tickFormatter={(v) => `R$${Number(v).toFixed(0)}`} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Area type="monotone" dataKey="cac_medio" name="CAC acumulado" connectNulls stroke="#10B981" strokeWidth={2.5} fill="url(#cacGradient)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#10B981', onClick: dotClick, style: { cursor: isMonthly ? 'default' : 'pointer' } }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>

            {showCharts && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 h-52 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            Propostas: CRM vs B2C <span title="Comparativo entre propostas geradas via CRM e outros canais B2C"><Info size={10} className="text-slate-400" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData} onClick={chartClick} barCategoryGap="28%" style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#eef2f6" vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    {showSerasa && <Bar dataKey="propostas_crm" name="CRM B2C" stackId="a" fill="#3B82F6" />}
                                    {!showSerasa && activeSegments.map((segment, index) => (
                                        <Bar
                                            key={segment}
                                            dataKey={`crm_propostas_${segment}`}
                                            name={segment}
                                            stackId="a"
                                            fill={SEGMENT_COLORS[segment] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                        />
                                    ))}
                                    {showSerasa && <Bar dataKey="serasa_propostas" name="Serasa API" stackId="a" fill="#F59E0B" />}
                                    <Bar dataKey="outros_propostas" name="Outros B2C" stackId="a" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 h-48 flex flex-col shadow-sm">
                        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            Emissoes: CRM vs B2C <span title="Comparativo entre cartoes emitidos via CRM e outros canais B2C"><Info size={10} className="text-slate-400" /></span>
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeChartData} onClick={chartClick} barCategoryGap="28%" style={{ cursor: isMonthly ? 'default' : 'pointer' }}>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#eef2f6" vertical={false} />
                                    <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} minTickGap={12} dy={4} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={42} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} wrapperStyle={{ pointerEvents: 'none' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                                    {showSerasa && <Bar dataKey="emissoes_crm" name="CRM B2C" stackId="a" fill="#10B981" />}
                                    {!showSerasa && activeSegments.map((segment, index) => (
                                        <Bar
                                            key={segment}
                                            dataKey={`crm_emissoes_${segment}`}
                                            name={segment}
                                            stackId="a"
                                            fill={SEGMENT_COLORS[segment] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                        />
                                    ))}
                                    {showSerasa && <Bar dataKey="serasa_emissoes" name="Serasa API" stackId="a" fill="#F59E0B" />}
                                    <Bar dataKey="outros_emissoes" name="Outros B2C" stackId="a" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
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
