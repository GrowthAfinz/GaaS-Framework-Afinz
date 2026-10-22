import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Clock3, History, Loader2, X } from 'lucide-react';
import { Goal } from '../../types/framework';
import { useAppStore } from '../../store/useAppStore';
import { formatMonthKey } from '../../utils/goalCarryForward';
import { BU_ANALYTICS_PROFILES } from './buAnalyticsProfiles';
import { useAuth } from '../../context/AuthContext';
import {
    GOAL_NOTICE_SNOOZE_MS, inheritedGoalNoticeKey, isGoalNoticeHidden,
    readGoalNoticePreference, saveGoalNoticePreference, type GoalNoticePreference,
} from '../../utils/inheritedGoalNoticePreference';

interface InheritedGoalNoticeProps {
    goal: Goal;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const InheritedGoalNotice: React.FC<InheritedGoalNoticeProps> = ({ goal }) => {
    const { user } = useAuth();
    const preferenceKey = inheritedGoalNoticeKey(goal, user?.id ?? null);
    return <ScopedInheritedGoalNotice key={preferenceKey} goal={goal} preferenceKey={preferenceKey} persist={!!user} />;
};

const noticeStorage = (): Storage | null => {
    try { return window.localStorage; } catch { return null; }
};

const ScopedInheritedGoalNotice: React.FC<InheritedGoalNoticeProps & { preferenceKey: string; persist: boolean }> = ({ goal, preferenceKey, persist }) => {
    const goals = useAppStore((state) => state.goals);
    const setGoals = useAppStore((state) => state.setGoals);
    const setTab = useAppStore((state) => state.setTab);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preference, setPreference] = useState<GoalNoticePreference | null>(() =>
        readGoalNoticePreference(persist ? noticeStorage() : null, preferenceKey));
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        const refresh = () => {
            setNow(Date.now());
            if (persist) setPreference(readGoalNoticePreference(noticeStorage(), preferenceKey));
        };
        const storageChanged = (event: StorageEvent) => {
            if (event.key === preferenceKey || event.key === null) refresh();
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', storageChanged);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', storageChanged);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [persist, preferenceKey]);

    useEffect(() => {
        if (preference?.kind !== 'snoozed') return;
        const remaining = preference.until - Date.now();
        if (remaining <= 0) return;
        const timer = window.setTimeout(() => setNow(Date.now()), Math.min(remaining, GOAL_NOTICE_SNOOZE_MS));
        return () => window.clearTimeout(timer);
    }, [preference, now]);

    const hideNotice = (next: GoalNoticePreference) => {
        saveGoalNoticePreference(persist ? noticeStorage() : null, preferenceKey, next);
        setPreference(next);
        setNow(Date.now());
    };

    if (!goal.herdada_de || isGoalNoticeHidden(preference, now)) return null;

    const targetLabel = capitalize(formatMonthKey(goal.mes));
    const sourceLabel = formatMonthKey(goal.herdada_de);
    const values = [
        { label: 'B2C', value: Number(goal.b2c_meta ?? 0), color: BU_ANALYTICS_PROFILES.B2C.color },
        { label: 'B2B2C', value: Number(goal.b2b2c_meta ?? 0), color: BU_ANALYTICS_PROFILES.B2B2C.color },
        { label: 'Plurix', value: Number(goal.plurix_meta ?? 0), color: BU_ANALYTICS_PROFILES.Plurix.color },
    ];

    const handleConfirm = async () => {
        setSaving(true);
        setError(null);
        const confirmed: Goal = { ...goal, herdada_de: null };
        try {
            const { dataService } = await import('../../services/dataService');
            await dataService.upsertGoal({
                mes: confirmed.mes,
                cartoes_meta: confirmed.cartoes_meta ?? 0,
                b2c_meta: confirmed.b2c_meta ?? 0,
                b2b2c_meta: confirmed.b2b2c_meta ?? 0,
                plurix_meta: confirmed.plurix_meta ?? 0,
                cac_max: confirmed.cac_max ?? 0,
                herdada_de: null,
            });
            setGoals([...goals.filter((entry) => entry.mes !== goal.mes), confirmed]);
        } catch (confirmError) {
            console.error('Erro ao confirmar meta herdada:', confirmError);
            setError('Não foi possível confirmar agora. Tente de novo.');
        } finally {
            setSaving(false);
        }
    };

    const handleAdjust = () => {
        try {
            sessionStorage.setItem('gaas.configuracoes.tab', 'goals');
        } catch {
            // Sem sessionStorage a aba de Configurações abre na visão padrão.
        }
        setTab('configuracoes');
    };

    return (
        <section
            role="status"
            aria-live="polite"
            className="relative overflow-hidden rounded-lg border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
        >
            <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <button
                type="button"
                aria-label="Fechar aviso de meta herdada"
                title="Fechar aviso para estas metas"
                disabled={saving}
                onClick={() => hideNotice({ kind: 'dismissed' })}
                className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 hover:bg-amber-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-60"
            >
                <X size={15} aria-hidden="true" />
            </button>

            <div className="flex items-start gap-3 pl-1 pr-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-50">
                    <History size={15} />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                        Meta herdada automaticamente
                    </p>
                    <h4 className="mt-0.5 text-sm font-semibold leading-snug text-slate-800">
                        {targetLabel} está usando as metas de {sourceLabel}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Ninguém cadastrou meta para este mês, então o planner repetiu a última meta válida.
                        Confirme se vale para este mês ou ajuste os números.
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {values.map(({ label, value, color }) => (
                            <div key={label} className="rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-1.5">
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                                    {label}
                                </dt>
                                <dd className="font-mono text-sm font-semibold tabular-nums text-slate-800">
                                    {value.toLocaleString('pt-BR')}
                                </dd>
                            </div>
                        ))}
                        <div className="rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-1.5">
                            <dt className="text-[10px] font-semibold text-slate-500">CAC máx.</dt>
                            <dd className="font-mono text-sm font-semibold tabular-nums text-slate-800">
                                {Number(goal.cac_max ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Confirmar metas
                        </button>
                        <button
                            type="button"
                            onClick={() => hideNotice({ kind: 'snoozed', until: Date.now() + GOAL_NOTICE_SNOOZE_MS })}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-amber-50 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-60"
                        >
                            <Clock3 size={12} aria-hidden="true" />
                            Lembrar mais tarde <span className="font-normal text-slate-400">(24h)</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAdjust}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
                        >
                            Ajustar em Configurações
                            <ArrowRight size={12} />
                        </button>
                        {error && <span className="text-[11px] font-medium text-red-600">{error}</span>}
                    </div>
                </div>
            </div>
        </section>
    );
};
