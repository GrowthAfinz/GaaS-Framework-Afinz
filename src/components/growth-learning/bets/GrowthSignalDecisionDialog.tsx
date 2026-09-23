import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, GitMerge, Loader2, Target, X, XCircle } from 'lucide-react';
import { GrowthFeedEvent } from '../feed/growthFeed.types';
import { acceptGrowthSignal, fetchGrowthBets, mergeGrowthSignal, rejectGrowthSignal } from './growthBetService';
import { buildGrowthBetDraft, validateGrowthBetDraft } from './growthBetForm.logic';
import { GrowthBet, GrowthBetDraft } from './growthBet.types';

type DecisionMode = 'accept' | 'merge' | 'reject';

interface GrowthSignalDecisionDialogProps {
  event: GrowthFeedEvent;
  onClose: () => void;
  onCompleted: (result: { kind: DecisionMode; betId?: string }) => void;
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
const labelClass = 'text-xs font-bold text-slate-700';

const FieldError = ({ text }: { text?: string }) => text ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{text}</span> : null;

export const GrowthSignalDecisionDialog: React.FC<GrowthSignalDecisionDialogProps> = ({ event, onClose, onCompleted }) => {
  const [mode, setMode] = useState<DecisionMode>('accept');
  const [draft, setDraft] = useState<GrowthBetDraft>(() => buildGrowthBetDraft(event));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bets, setBets] = useState<GrowthBet[]>([]);
  const [mergeBetId, setMergeBetId] = useState('');
  const [reason, setReason] = useState('');
  const [loadingBets, setLoadingBets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, saving]);

  useEffect(() => {
    if (mode !== 'merge' || bets.length > 0 || loadingBets) return;
    setLoadingBets(true);
    fetchGrowthBets()
      .then((rows) => {
        const compatible = rows.filter((bet) => bet.front === event.front && !['closed', 'cancelled', 'not_verifiable'].includes(bet.status));
        setBets(compatible);
        setMergeBetId(compatible[0]?.id || '');
      })
      .catch((error) => setCommandError(error instanceof Error ? error.message : 'Não foi possível carregar as apostas.'))
      .finally(() => setLoadingBets(false));
  }, [bets.length, event.front, loadingBets, mode]);

  const field = <K extends keyof GrowthBetDraft>(key: K, value: GrowthBetDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const canSubmit = useMemo(() => {
    if (mode === 'reject') return reason.trim().length >= 3;
    if (mode === 'merge') return Boolean(mergeBetId);
    return true;
  }, [mergeBetId, mode, reason]);

  const submit = async () => {
    setCommandError(null);
    if (mode === 'accept') {
      const nextErrors = validateGrowthBetDraft(draft);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    setSaving(true);
    try {
      if (mode === 'accept') {
        const bet = await acceptGrowthSignal({ ...draft, actionCandidateId: event.subject_id });
        onCompleted({ kind: mode, betId: bet.id });
      } else if (mode === 'merge') {
        await mergeGrowthSignal(event.subject_id, mergeBetId, reason);
        onCompleted({ kind: mode, betId: mergeBetId });
      } else {
        await rejectGrowthSignal(event.subject_id, reason);
        onCompleted({ kind: mode });
      }
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : 'A decisão não pôde ser registrada.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="growth-decision-title" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget && !saving) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Decisão sobre o sinal</p>
            <h2 id="growth-decision-title" className="mt-1 text-xl font-black text-slate-950">{event.summary_snapshot.title}</h2>
            <p className="mt-1 text-sm text-slate-500">A evidência original será congelada; o contrato abaixo define como a aposta será verificada.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Fechar"><X size={20} /></button>
        </header>

        <div className="flex gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          {([
            ['accept', Target, 'Assumir aposta'],
            ['merge', GitMerge, 'Mesclar à existente'],
            ['reject', XCircle, 'Rejeitar sinal'],
          ] as const).map(([value, Icon, label]) => (
            <button key={value} type="button" onClick={() => { setMode(value); setCommandError(null); }} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${mode === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {mode === 'accept' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-4">
                <div><h3 className="text-sm font-black text-slate-900">Decisão</h3><p className="text-xs text-slate-500">Hipótese, ação e responsabilidade operacional.</p></div>
                <label className={labelClass}>Time responsável *<input autoFocus value={draft.teamScope} onChange={(e) => field('teamScope', e.target.value)} className={inputClass} placeholder="Ex.: CRM Aquisição" /><FieldError text={errors.teamScope} /></label>
                <label className={labelClass}>Owner individual (opcional)<input value={draft.owner} onChange={(e) => field('owner', e.target.value)} className={inputClass} placeholder="Nome ou papel" /></label>
                <label className={labelClass}>Hipótese *<textarea value={draft.hypothesis} onChange={(e) => field('hypothesis', e.target.value)} rows={3} className={inputClass} /><FieldError text={errors.hypothesis} /></label>
                <label className={labelClass}>Ação *<textarea value={draft.actionText} onChange={(e) => field('actionText', e.target.value)} rows={3} className={inputClass} /><FieldError text={errors.actionText} /></label>
                <label className={labelClass}>Condição de parada (opcional)<textarea value={draft.stopCondition} onChange={(e) => field('stopCondition', e.target.value)} rows={2} className={inputClass} placeholder="Quando interromper ou rever a aposta" /></label>
                <label className={labelClass}>Alternativas conhecidas (uma por linha)<textarea value={draft.knownAlternatives} onChange={(e) => field('knownAlternatives', e.target.value)} rows={2} className={inputClass} /></label>
              </section>

              <section className="space-y-4">
                <div><h3 className="text-sm font-black text-slate-900">Contrato de medição</h3><p className="text-xs text-slate-500">Baseline, expectativa e janela são obrigatórios antes da aprovação.</p></div>
                <label className={labelClass}>Métrica *<input value={draft.metricName} onChange={(e) => field('metricName', e.target.value)} className={inputClass} /><FieldError text={errors.metricName} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Baseline *<input inputMode="decimal" value={draft.baselineValue} onChange={(e) => field('baselineValue', e.target.value.replace(',', '.'))} className={inputClass} placeholder="0" /><FieldError text={errors.baselineValue} /></label>
                  <label className={labelClass}>Expectativa *<input inputMode="decimal" value={draft.expectedValue} onChange={(e) => field('expectedValue', e.target.value.replace(',', '.'))} className={inputClass} placeholder="0" /><FieldError text={errors.expectedValue} /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Direção *<select value={draft.expectedDirection} onChange={(e) => field('expectedDirection', e.target.value as GrowthBetDraft['expectedDirection'])} className={inputClass}><option value="maior_melhor">Maior é melhor</option><option value="menor_melhor">Menor é melhor</option><option value="atingir_meta">Atingir meta</option></select></label>
                  <label className={labelClass}>Unidade<input value={draft.expectedUnit} onChange={(e) => field('expectedUnit', e.target.value)} className={inputClass} placeholder="%, R$, cartões…" /></label>
                </div>
                <label className={labelClass}>Critério de sucesso *<textarea value={draft.successCriterion} onChange={(e) => field('successCriterion', e.target.value)} rows={2} className={inputClass} /><FieldError text={errors.successCriterion} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Início da janela *<input type="date" value={draft.outcomeWindowStart} onChange={(e) => field('outcomeWindowStart', e.target.value)} className={inputClass} /><FieldError text={errors.outcomeWindowStart} /></label>
                  <label className={labelClass}>Fim da janela *<input type="date" value={draft.outcomeWindowEnd} onChange={(e) => field('outcomeWindowEnd', e.target.value)} className={inputClass} /><FieldError text={errors.outcomeWindowEnd} /></label>
                </div>
                <label className={labelClass}>Prazo de execução (opcional)<input type="date" value={draft.executionDueAt} onChange={(e) => field('executionDueAt', e.target.value)} className={inputClass} /></label>
                <label className={labelClass}>View de verificação *<input value={draft.verificationView} onChange={(e) => field('verificationView', e.target.value)} className={`${inputClass} font-mono text-xs`} /><FieldError text={errors.verificationView} /></label>
              </section>
            </div>
          ) : mode === 'merge' ? (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">Use esta decisão quando o sinal reforça uma aposta já contratada. A evidência continua rastreável, sem criar um segundo compromisso.</div>
              {loadingBets ? <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Carregando apostas compatíveis…</p> : bets.length === 0 ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Não há aposta ativa nesta frente. Assuma uma nova aposta ou rejeite o sinal.</p> : <label className={labelClass}>Aposta de destino *<select value={mergeBetId} onChange={(e) => setMergeBetId(e.target.value)} className={inputClass}>{bets.map((bet) => <option key={bet.id} value={bet.id}>{bet.hypothesis} · {bet.team_scope}</option>)}</select></label>}
              <label className={labelClass}>Por que este sinal pertence à aposta?<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className={inputClass} placeholder="Contexto opcional para a timeline" /></label>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">Rejeitar encerra a decisão sobre este sinal, preservando o motivo e a evidência original no histórico.</div>
              <label className={labelClass}>Motivo da rejeição *<textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={5} className={inputClass} placeholder="Explique por que o sinal não deve virar aposta." /></label>
            </div>
          )}

          {commandError && <div className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><AlertCircle size={18} className="mt-0.5 shrink-0" /> {commandError}</div>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <span className="hidden items-center gap-2 text-xs text-slate-500 sm:inline-flex"><CheckCircle2 size={14} /> Uma decisão por sinal, com auditoria.</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40">Cancelar</button>
            <button type="button" onClick={() => void submit()} disabled={saving || !canSubmit} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${mode === 'reject' ? 'bg-rose-700' : 'bg-slate-900'}`}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {mode === 'accept' ? 'Aprovar e criar aposta' : mode === 'merge' ? 'Mesclar sinal' : 'Registrar rejeição'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
