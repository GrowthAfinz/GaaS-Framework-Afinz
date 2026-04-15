import React, { useMemo, useState } from 'react';
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    ArrowRight,
    BarChart3,
    CalendarClock,
    Flag,
    Gauge,
    Goal,
    Layers3,
    Table2
} from 'lucide-react';
import { format } from 'date-fns';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { useOriginacaoDashboard } from '../hooks/useOriginacaoDashboard';
import { useAppStore } from '../store/useAppStore';
import { Activity } from '../types/framework';

type ChartMode = 'daily' | 'accumulated';

const CHART_COLORS = {
    total: '#2563eb',
    crm: '#14b8a6',
    serasa: '#0f172a',
    target: '#f97316',
    other: '#cbd5e1'
};

const formatInt = (value: number) => value.toLocaleString('pt-BR');
const formatPct = (value: number) => `${value.toFixed(1)}%`;

const formatCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);

const statusStyles = {
    ahead: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    on_track: 'bg-blue-50 text-blue-700 border-blue-200',
    risk: 'bg-amber-50 text-amber-700 border-amber-200'
};

const statusLabels = {
    ahead: 'Acima do ritmo',
    on_track: 'Em linha',
    risk: 'Abaixo do ritmo'
};

const cardBase =
    'rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]';

const MetricTile: React.FC<{
    label: string;
    value: string;
    helper: string;
}> = ({ label, value, helper }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
);

const DetailMetric: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    helper?: string;
}> = ({ icon, label, value, helper }) => (
    <div className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-500">
            {icon}
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span>
        </div>
        <p className="mt-3 font-mono text-2xl font-semibold text-slate-900">{value}</p>
        {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
);

const CompositionLegend: React.FC<{
    label: string;
    value: number;
    color: string;
    share: number;
}> = ({ label, value, color, share }) => (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <div className="text-right">
            <p className="font-mono text-sm font-semibold text-slate-900">{formatInt(value)}</p>
            <p className="text-xs text-slate-500">{formatPct(share)}</p>
        </div>
    </div>
);

export const OriginacaoB2CView: React.FC = () => {
    const { summary, analysisRows, getActivitiesForDate } = useOriginacaoDashboard();
    const { b2cData, setTab } = useAppStore();
    const [chartMode, setChartMode] = useState<ChartMode>('accumulated');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
    const [modalDate, setModalDate] = useState<Date | null>(null);

    const compositionData = useMemo(
        () => [
            { name: 'Serasa API', value: summary.serasaCards, fill: CHART_COLORS.total },
            { name: 'CRM', value: summary.crmCards, fill: CHART_COLORS.crm },
            { name: 'Outros Canais', value: summary.otherCards, fill: CHART_COLORS.other }
        ].filter((entry) => entry.value > 0),
        [summary.crmCards, summary.otherCards, summary.serasaCards]
    );

    const rowsDescending = useMemo(
        () => [...analysisRows].sort((a, b) => b.date.localeCompare(a.date)),
        [analysisRows]
    );

    const chartData = useMemo(
        () =>
            analysisRows.map((row) => ({
                ...row,
                targetDaily:
                    summary.businessDaysInMonth > 0 ? summary.metaCards / summary.businessDaysInMonth : 0
            })),
        [analysisRows, summary.businessDaysInMonth, summary.metaCards]
    );

    const handleInspectDate = (dateKey: string) => {
        const activities = getActivitiesForDate(dateKey);
        const [year, month, day] = dateKey.split('-').map(Number);
        setSelectedActivities(activities);
        setModalDate(new Date(year, month - 1, day));
        setModalOpen(true);
    };

    const handleExport = () => {
        const headers = [
            'Data',
            'Prop. Serasa API',
            'Cartões Serasa API',
            '% Conv. Serasa API',
            '% Share Serasa API',
            'Cartões CRM',
            '% Share CRM',
            'Cartões Total B2C',
            '% Conv. Total',
            'Observações'
        ];

        const rows = rowsDescending.map((row) => [
            row.date,
            row.serasaProposals,
            row.serasaCards,
            row.serasaConversionPct.toFixed(2),
            row.serasaSharePct.toFixed(2),
            row.crmCards,
            row.crmSharePct.toFixed(2),
            row.totalCards,
            row.totalConversion.toFixed(2),
            row.observation || ''
        ]);

        const csv = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `originacao-b2c-${summary.monthKey}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (b2cData.length === 0) {
        return (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10">
                <div className="text-center">
                    <BarChart3 className="mx-auto mb-4 text-slate-300" size={32} />
                    <p className="text-sm font-medium text-slate-700">Nenhum dado B2C disponível.</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Sincronize a base diária para habilitar o monitoramento mensal.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="text-blue-600" size={24} />
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Originação B2C</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                        Monitoramento diário de meta e produção dos canais.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                            Meta mensal de cartões vinda de Configurações
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                            CRM sujeito aos filtros globais
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 capitalize">
                            Referência de meta: {summary.monthLabel}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setTab('configuracoes')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                >
                    Editar meta central
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_390px]">
                <section className={`${cardBase} p-6`}>
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Meta & ritmo
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-950">
                                Acompanhamento mensal de cartões B2C
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Leitura executiva da meta mensal e do pacing de fechamento.
                            </p>
                        </div>
                        <span
                            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[summary.paceStatus]}`}
                        >
                            {statusLabels[summary.paceStatus]}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <MetricTile
                            label="Realizado"
                            value={formatInt(summary.realizedCards)}
                            helper="Cartões acumulados no mês"
                        />
                        <MetricTile
                            label="Meta"
                            value={formatInt(summary.metaCards)}
                            helper="Meta mensal centralizada"
                        />
                        <MetricTile
                            label="Atingimento"
                            value={formatPct(summary.attainmentPct)}
                            helper="Realizado / meta"
                        />
                        <MetricTile
                            label="Projeção"
                            value={formatInt(Math.round(summary.projectionBusinessDays))}
                            helper="Fechamento por dia útil"
                        />
                        <MetricTile
                            label="Gap"
                            value={formatInt(Math.round(summary.gapToMeta))}
                            helper="Meta - realizado"
                        />
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <DetailMetric
                            icon={<CalendarClock size={14} />}
                            label="Dias úteis"
                            value={`${summary.businessDaysElapsed}/${summary.businessDaysInMonth}`}
                            helper={`${summary.remainingBusinessDays} restantes`}
                        />
                        <DetailMetric
                            icon={<Flag size={14} />}
                            label="Esperado até hoje"
                            value={formatInt(Math.round(summary.expectedCardsToDate))}
                            helper="Meta acumulada ideal"
                        />
                        <DetailMetric
                            icon={<Gauge size={14} />}
                            label="Desvio atual"
                            value={`${summary.paceDeltaCards >= 0 ? '+' : ''}${formatInt(Math.round(summary.paceDeltaCards))}`}
                            helper="Realizado - esperado"
                        />
                        <DetailMetric
                            icon={<Goal size={14} />}
                            label="Proj. dia corrido"
                            value={formatInt(Math.round(summary.projectionCalendarDays))}
                            helper={`${summary.calendarDaysElapsed}/${summary.calendarDaysInMonth} dias corridos`}
                        />
                    </div>
                </section>

                <aside className={`${cardBase} p-6`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Composição
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-950">Quem está carregando o resultado</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Participação dos principais vetores sobre o total do mês.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={compositionData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={62}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    cornerRadius={8}
                                    stroke="none"
                                >
                                    {compositionData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [formatInt(value), 'Cartões']}
                                    contentStyle={{
                                        borderRadius: 16,
                                        borderColor: '#e2e8f0',
                                        boxShadow: '0 12px 32px rgba(15,23,42,0.08)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-2 space-y-3">
                        <CompositionLegend
                            label="Serasa API"
                            value={summary.serasaCards}
                            color={CHART_COLORS.total}
                            share={summary.serasaSharePct}
                        />
                        <CompositionLegend
                            label="CRM"
                            value={summary.crmCards}
                            color={CHART_COLORS.crm}
                            share={summary.crmSharePct}
                        />
                        <CompositionLegend
                            label="Outros Canais"
                            value={summary.otherCards}
                            color={CHART_COLORS.other}
                            share={Math.max(0, 100 - summary.serasaSharePct - summary.crmSharePct)}
                        />
                    </div>
                </aside>
            </div>

            <section className={`${cardBase} p-6`}>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Planejamento Serasa API
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            Saúde operacional do canal no mês
                        </h2>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        Propostas do canal permanecem no planejamento para leitura de eficiência.
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DetailMetric
                        icon={<Layers3 size={14} />}
                        label="Prop. Serasa API"
                        value={formatInt(summary.serasaProposals)}
                        helper="Volume acumulado"
                    />
                    <DetailMetric
                        icon={<BarChart3 size={14} />}
                        label="Cartões Serasa API"
                        value={formatInt(summary.serasaCards)}
                        helper="Produção do canal"
                    />
                    <DetailMetric
                        icon={<Gauge size={14} />}
                        label="Conv. canal"
                        value={formatPct(summary.serasaConversionPct)}
                        helper="Cartões / propostas"
                    />
                    <DetailMetric
                        icon={<Goal size={14} />}
                        label="Share Serasa API"
                        value={formatPct(summary.serasaSharePct)}
                        helper="Participação no total B2C"
                    />
                </div>
            </section>

            <section className={`${cardBase} p-6`}>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Operação diária
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            Propostas, cartões e meta acumulada
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Um único gráfico principal para leitura de produção e pacing.
                        </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {(['accumulated', 'daily'] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setChartMode(mode)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    chartMode === mode
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {mode === 'accumulated' ? 'Acumulado' : 'Diário'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5 h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="#64748b"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#64748b"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#94a3b8"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 16,
                                    borderColor: '#e2e8f0',
                                    boxShadow: '0 12px 32px rgba(15,23,42,0.08)'
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name.includes('%')) return [formatPct(value), name];
                                    return [formatInt(Math.round(value)), name];
                                }}
                                labelFormatter={(value) => `Data ${value}`}
                            />
                            <Legend />

                            {chartMode === 'daily' ? (
                                <>
                                    <Bar
                                        yAxisId="left"
                                        dataKey="serasaProposals"
                                        name="Propostas Serasa API"
                                        fill={CHART_COLORS.other}
                                        radius={[8, 8, 0, 0]}
                                        onClick={(state) => handleInspectDate(state.date)}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="serasaCards"
                                        name="Cartões Serasa API"
                                        stroke={CHART_COLORS.total}
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="totalCards"
                                        name="Cartões Total B2C"
                                        stroke={CHART_COLORS.crm}
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                </>
                            ) : (
                                <>
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulativeTargetCards"
                                        name="Meta acumulada ideal"
                                        stroke={CHART_COLORS.target}
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        dot={false}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulativeTotalCards"
                                        name="Total B2C acumulado"
                                        stroke={CHART_COLORS.crm}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulativeSerasaCards"
                                        name="Serasa API acumulado"
                                        stroke={CHART_COLORS.total}
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulativeCrmCards"
                                        name="CRM acumulado"
                                        stroke={CHART_COLORS.serasa}
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                </>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className={`${cardBase} overflow-hidden`}>
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Tabela diária
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            Diário operacional com contexto de canal e observações
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                    >
                        <Table2 size={16} />
                        Exportar diário
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            <tr>
                                {[
                                    'Data',
                                    'Prop. Serasa',
                                    'Cartões Serasa',
                                    'Conv. canal',
                                    'Share Serasa',
                                    'Cartões CRM',
                                    'Share CRM',
                                    'Cartões Total',
                                    'Conv. total',
                                    'Observações'
                                ].map((header) => (
                                    <th key={header} className="whitespace-nowrap border-b border-slate-200 px-4 py-3">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rowsDescending.map((row) => (
                                <tr
                                    key={row.date}
                                    className="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/60"
                                    onClick={() => handleInspectDate(row.date)}
                                >
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                                        {format(new Date(`${row.date}T12:00:00`), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-700">{formatCompact(row.serasaProposals)}</td>
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{formatCompact(row.serasaCards)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatPct(row.serasaConversionPct)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatPct(row.serasaSharePct)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-700">{formatCompact(row.crmCards)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatPct(row.crmSharePct)}</td>
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{formatCompact(row.totalCards)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatPct(row.totalConversion)}</td>
                                    <td className="max-w-[340px] px-4 py-3 text-slate-500">
                                        <span className="line-clamp-2">{row.observation || '—'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {modalOpen && (
                <DailyDetailsModal
                    date={modalDate}
                    activities={selectedActivities}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};
