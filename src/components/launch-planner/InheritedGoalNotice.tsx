import '../growth-learning/attention/notifications.css';
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
    onVisibilityChange?: (visible: boolean) => void;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const InheritedGoalNotice: React.FC<InheritedGoalNoticeProps> = ({ goal, onVisibilityChange }) => {
    const { user } = useAuth();
    const preferenceKey = inheritedGoalNoticeKey(goal, user?.id ?? null);
    return <ScopedInheritedGoalNotice key={preferenceKey} goal={goal} preferenceKey={preferenceKey} persist={!!user} onVisibilityChange={onVisibilityChange} />;
};

const noticeStorage = (): Storage | null => {
    try { return window.localStorage; } catch { return null; }
};

const ScopedInheritedGoalNotice: React.FC<InheritedGoalNoticeProps & { preferenceKey: string; persist: boolean }> = ({ goal, preferenceKey, persist, onVisibilityChange }) => {
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

    const visible = !!goal.herdada_de && !isGoalNoticeHidden(preference, now);
    useEffect(() => {
        onVisibilityChange?.(visible);
        return () => onVisibilityChange?.(false);
    }, [visible, onVisibilityChange]);
    if (!visible) return null;

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
        <section role="status" aria-live="polite" className="notification-card notification-card--warning">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><History size={14}/>Metas</span>
                    <span>{goal.mes.slice(0, 7)}</span>
                    <span className="notification-state notification-state--warning">Confirmar meta herdada</span>
                </div>
                <button type="button" aria-label="Fechar aviso de meta herdada" title="Fechar aviso para estas metas" disabled={saving} onClick={() => hideNotice({ kind: 'dismissed' })} className="notification-dismiss"><X size={16}/></button>
            </div>
            <h4 className="notification-title">{targetLabel} está usando as metas de {sourceLabel}</h4>
            <p className="notification-summary">Sem meta cadastrada para este mês. Confirme a última meta válida ou ajuste os valores.</p>
            <dl className="notification-goals">
                {values.map(({ label, value, color }) => <div key={label}>
                    <dt><span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }}/> {label}</dt>
                    <dd>{value.toLocaleString('pt-BR')}</dd>
                </div>)}
                <div><dt>CAC máx.</dt><dd>{Number(goal.cac_max ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</dd></div>
            </dl>
            <footer className="notification-actions">
                <button type="button" onClick={handleConfirm} disabled={saving} className="notification-primary">
                    {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}Confirmar metas
                </button>
                <button type="button" onClick={handleAdjust} disabled={saving} className="notification-secondary">Ajustar metas <ArrowRight size={13}/></button>
                <button type="button" onClick={() => hideNotice({ kind: 'snoozed', until: Date.now() + GOAL_NOTICE_SNOOZE_MS })} disabled={saving} className="notification-secondary"><Clock3 size={13}/>Lembrar mais tarde (24h)</button>
                {error && <p role="alert" className="w-full text-xs font-medium text-red-600">{error}</p>}
            </footer>
        </section>
    );
};
