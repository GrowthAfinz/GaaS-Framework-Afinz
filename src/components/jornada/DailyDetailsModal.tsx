import React from 'react';
import { Activity, AnomalyType } from '../../types/framework';
import { X, Edit2, Check, ExternalLink, ArrowRight, Layers } from 'lucide-react';
import { deriveActivityMetrics, aggregateMetrics } from '../../utils/activityMetrics';
import { useAppStore } from '../../store/useAppStore';
import { useExplorerStore } from '../../store/explorerStore';

interface DailyDetailsModalProps {
    date: Date | null;
    activities: Activity[];
    anomalyFilters?: AnomalyType[];
    onClose: () => void;
    onEdit?: (activity: Activity) => void;
    onConfirmDraft?: (activity: Activity) => void;
    titleOverride?: string;
}

// ── Helpers de formatação ──────────────────────────────────────────────
const fmtInt = (v: number) => Math.round(v).toLocaleString('pt-BR');
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const BU_STYLE: Record<string, { dot: string; chip: string; ring: string }> = {
    B2C: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700', ring: 'border-l-blue-500' },
    B2B2C: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', ring: 'border-l-emerald-500' },
    Plurix: { dot: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700', ring: 'border-l-purple-500' },
    Seguros: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700', ring: 'border-l-orange-500' },
};
const buStyle = (bu: string) => BU_STYLE[bu] ?? { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600', ring: 'border-l-slate-400' };

// ── Etapa do funil ─────────────────────────────────────────────────────
const FunnelStep: React.FC<{ label: string; value: number; rate?: string; accent?: string }> = ({
    label,
    value,
    rate,
    accent = 'text-slate-900',
}) => (
    <div className="flex flex-col items-center min-w-[58px]">
        <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${accent}`}>{fmtInt(value)}</span>
        {rate !== undefined && <span className="text-[9px] text-slate-400 tabular-nums">{rate}</span>}
    </div>
);

const FunnelArrow: React.FC = () => (
    <ArrowRight size={12} className="text-slate-300 shrink-0 mt-2" />
);

// ── Chip de dimensão ───────────────────────────────────────────────────
const DimChip: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    const v = value === undefined || value === null || value === '' ? null : String(value);
    if (!v || ['n/a', 'n/a / padrão', '-', '--', 'sem'].includes(v.toLowerCase())) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
            <span className="text-slate-400">{label}:</span>
            <span className="font-medium text-slate-700">{v}</span>
        </span>
    );
};

export const DailyDetailsModal: React.FC<DailyDetailsModalProps> = ({
    date,
    activities,
    anomalyFilters = [],
    onClose,
    onEdit,
    onConfirmDraft,
    titleOverride,
}) => {
    const setTab = useAppStore((s) => s.setTab);
    const setPendingNavigation = useExplorerStore((s) => s.setPendingNavigation);

    if (!date && !titleOverride) return null;

    // Filtro por anomalias (mantém comportamento original)
    const filteredActivities = activities.filter((activity) => {
        if (anomalyFilters.length === 0) return true;

        const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
        const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');

        const rawDisparado = String(activity.raw['Disparado?'] || '').toLowerCase().trim();
        const isDisparado = ['sim', 's', 'yes', 'y', 'enviado', 'ok', 'true', '1'].includes(rawDisparado);

        const isNoSent = isDisparado && (activity.kpis.baseEnviada || 0) === 0;
        const isNoDelivered = isDisparado && (activity.kpis.baseEntregue || 0) === 0;
        const isNoOpen = isDisparado && (activity.kpis.taxaAbertura || 0) === 0;

        if (anomalyFilters.includes('pending') && isPending) return true;
        if (anomalyFilters.includes('no_sent') && isNoSent) return true;
        if (anomalyFilters.includes('no_delivered') && isNoDelivered) return true;
        if (anomalyFilters.includes('no_open') && isNoOpen) return true;

        return false;
    });

    const summary = aggregateMetrics(filteredActivities);

    const openInFramework = (activity: Activity) => {
        setPendingNavigation({ type: 'activity', label: activity.id, bu: activity.bu });
        setTab('explorador');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 shrink-0 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Layers size={18} className="text-cyan-600" />
                            {titleOverride ? titleOverride : `Detalhes do Dia · ${date?.toLocaleDateString('pt-BR')}`}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {filteredActivities.length} disparo{filteredActivities.length !== 1 ? 's' : ''}
                            {anomalyFilters.length > 0 && ' (filtrado)'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Resumo do dia ──────────────────────────────────── */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-slate-200 border-b border-slate-200 shrink-0">
                    {[
                        { label: 'Enviado', value: fmtInt(summary.baseEnviada) },
                        { label: 'Entregue', value: fmtInt(summary.baseEntregue) },
                        { label: 'Cartões', value: fmtInt(summary.cartoes), accent: 'text-cyan-700' },
                        { label: 'Conversão', value: fmtPct(summary.taxaConversao), accent: 'text-emerald-600' },
                        { label: 'Custo Total', value: fmtBRL(summary.custoTotal) },
                        { label: 'CAC médio', value: fmtBRL(summary.cac) },
                    ].map((kpi) => (
                        <div key={kpi.label} className="bg-white px-3 py-2.5 text-center">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{kpi.label}</div>
                            <div className={`text-sm font-bold tabular-nums ${kpi.accent ?? 'text-slate-900'}`}>{kpi.value}</div>
                        </div>
                    ))}
                </div>

                {/* ── Lista de disparos ──────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredActivities.map((activity) => {
                        const m = deriveActivityMetrics(activity);
                        const style = buStyle(activity.bu);

                        const rawCartoes = String(activity.raw['Cartões Gerados'] || '').toLowerCase().trim();
                        const isPending = rawCartoes.includes('aguardando') || rawCartoes.includes('confirmar');
                        const activityStatus = activity.raw['status'] || activity.raw['Status'] || 'Realizado';
                        const isDraft = activityStatus === 'Rascunho';

                        return (
                            <div
                                key={activity.id}
                                className={`bg-white border border-slate-200 border-l-4 ${style.ring} rounded-xl p-4 transition hover:shadow-md`}
                            >
                                {/* Linha 1: título + dimensões + ações */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <button
                                            onClick={() => openInFramework(activity)}
                                            className="group flex items-center gap-1.5 text-left"
                                            title="Abrir no Framework"
                                        >
                                            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                                                {activity.id}
                                            </h3>
                                            <ExternalLink size={13} className="text-slate-300 group-hover:text-cyan-600 shrink-0 transition-colors" />
                                        </button>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${style.chip}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {activity.bu}
                                            </span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{activity.canal}</span>
                                            <DimChip label="Jornada" value={activity.jornada} />
                                            <DimChip label="Segmento" value={activity.segmento} />
                                            <DimChip label="Safra" value={activity.raw['Safra']} />
                                            <DimChip label="Ordem" value={activity.ordemDisparo} />
                                            {isPending && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">Pendente</span>}
                                            {isDraft && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">Rascunho</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {isDraft && onConfirmDraft && (
                                            <button
                                                onClick={() => onConfirmDraft(activity)}
                                                className="p-1.5 hover:bg-green-50 rounded-lg transition text-green-600 border border-green-300"
                                                title="Confirmar disparo"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(activity)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-cyan-600 border border-slate-200"
                                                title="Editar disparo"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Linha 2: funil completo */}
                                <div className="flex items-start justify-between gap-1 bg-slate-50/70 rounded-lg px-3 py-2.5 overflow-x-auto">
                                    <FunnelStep label="Enviado" value={m.baseEnviada} />
                                    <FunnelArrow />
                                    <FunnelStep label="Entregue" value={m.baseEntregue} rate={fmtPct(m.taxaEntrega)} />
                                    <FunnelArrow />
                                    <FunnelStep label="Aberturas" value={m.aberturas} rate={fmtPct(m.taxaAbertura)} />
                                    <FunnelArrow />
                                    <FunnelStep label="Cliques" value={m.cliques} rate={fmtPct(m.taxaClique)} />
                                    <FunnelArrow />
                                    <FunnelStep label="Propostas" value={m.propostas} rate={fmtPct(m.taxaProposta)} />
                                    <FunnelArrow />
                                    <FunnelStep label="Aprovados" value={m.aprovados} rate={fmtPct(m.taxaAprovacao)} />
                                    <FunnelArrow />
                                    <FunnelStep label="Cartões" value={m.cartoes} rate={fmtPct(m.taxaFinalizacao)} accent="text-cyan-700" />
                                </div>

                                {/* Linha 3: resultado financeiro + dimensões de oferta */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                    <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-1.5 bg-emerald-50 rounded-lg">
                                            <span className="text-[9px] uppercase text-emerald-600 font-semibold block">Conversão</span>
                                            <span className="text-xs font-bold text-emerald-700 tabular-nums">{fmtPct(m.taxaConversao)}</span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg">
                                            <span className="text-[9px] uppercase text-slate-500 font-semibold block">Custo Total</span>
                                            <span className="text-xs font-bold text-slate-800 tabular-nums">{fmtBRL(m.custoTotal)}</span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg">
                                            <span className="text-[9px] uppercase text-slate-500 font-semibold block">CAC</span>
                                            <span className="text-xs font-bold text-slate-800 tabular-nums">{fmtBRL(m.cac)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                        <DimChip label="Oferta" value={activity.oferta} />
                                        <DimChip label="Promo" value={activity.promocional} />
                                        <DimChip label="Produto" value={activity.raw['Produto']} />
                                        <DimChip label="Parceiro" value={activity.parceiro} />
                                        <DimChip label="Perfil" value={activity.raw['Perfil de Crédito']} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredActivities.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-sm">Nenhum disparo encontrado para este dia.</div>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                <div className="p-4 border-t border-slate-200 flex justify-end shrink-0 bg-white rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
