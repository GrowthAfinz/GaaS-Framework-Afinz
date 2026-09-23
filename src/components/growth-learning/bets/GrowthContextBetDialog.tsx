import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookMarked, CheckCircle2, Loader2, MapPin, Target, X } from 'lucide-react';
import { GrowthBetSourceContext } from '../growthLearningNavigation';
import { createContextualGrowthBet, fetchApplicableGrowthLearningsForContext } from './growthBetService';
import { buildContextualGrowthBetDraft, validateGrowthBetDraft } from './growthBetForm.logic';
import { GrowthBetDraft, GrowthLearningDecisionInput, GrowthLearningSuggestion } from './growthBet.types';

interface GrowthContextBetDialogProps {
  context: GrowthBetSourceContext;
  onClose: () => void;
  onCompleted: (betId: string) => void;
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
const labelClass = 'text-xs font-bold text-slate-700';
const surfaceLabels = {
  reports_overview: 'Relatórios · Overview',
  reports_daily: 'Relatórios · Diário',
  reports_monthly: 'Relatórios · Mensal',
  acquisition_funnel: 'Funil de Aquisição',
} as const;

const FieldError = ({ text }: { text?: string }) => text
  ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{text}</span>
  : null;

export const GrowthContextBetDialog: React.FC<GrowthContextBetDialogProps> = ({ context, onClose, onCompleted }) => {
  const [draft, setDraft] = useState<GrowthBetDraft>(() => buildContextualGrowthBetDraft(context));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [learningSuggestions, setLearningSuggestions] = useState<GrowthLearningSuggestion[]>([]);
  const [learningDecisions, setLearningDecisions] = useState<Record<string, GrowthLearningDecisionInput>>({});
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, saving]);

  useEffect(() => {
    let cancelled = false;
    setLearningDecisions({});
    setMemoryError(false);
    setLoadingMemory(true);
    const timer = window.setTimeout(() => {
      fetchApplicableGrowthLearningsForContext(context, draft.metricName)
        .then((rows) => { if (!cancelled) setLearningSuggestions(rows); })
        .catch((error) => {
          if (!cancelled) {
            setMemoryError(true);
            setCommandError(error instanceof Error ? error.message : 'Não foi possível consultar a memória.');
          }
        })
        .finally(() => { if (!cancelled) setLoadingMemory(false); });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [context, draft.metricName]);

  const field = <K extends keyof GrowthBetDraft>(key: K, value: GrowthBetDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const canSubmit = useMemo(() => {
    if (loadingMemory || memoryError) return false;
    return learningSuggestions
      .filter((learning) => ['reusable', 'needs_review'].includes(learning.eligibility))
      .every((learning) => {
        const decision = learningDecisions[learning.learning_id];
        return decision?.decision === 'reused'
          || (decision?.decision === 'discarded' && (decision.reason?.trim().length || 0) >= 3);
      });
  }, [learningDecisions, learningSuggestions, loadingMemory, memoryError]);

  const decideLearning = (learningId: string, decision: GrowthLearningDecisionInput['decision']) => {
    setLearningDecisions((current) => ({
      ...current,
      [learningId]: {
        learningId,
        decision,
        reason: decision === 'discarded' ? current[learningId]?.reason || '' : undefined,
      },
    }));
  };

  const submit = async () => {
    const nextErrors = validateGrowthBetDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    setCommandError(null);
    try {
      const bet = await createContextualGrowthBet({
        ...draft,
        sourceContext: context,
        learningDecisions: Object.values(learningDecisions),
      });
      onCompleted(bet.id);
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : 'A aposta contextual não pôde ser registrada.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="growth-context-bet-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700"><Target size={14} /> Nova aposta contextual</p>
            <h2 id="growth-context-bet-title" className="mt-1 text-xl font-black text-slate-950">{context.title}</h2>
            <p className="mt-1 text-sm text-slate-500">A leitura atual será congelada como origem; a hipótese e a meta continuam sendo decisões humanas.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Fechar"><X size={20} /></button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-600 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><MapPin size={12} className="text-cyan-700" /> {surfaceLabels[context.sourceSurface]}</span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{context.periodStart} → {context.periodEnd}</span>
          {context.entityKey && <span className="rounded-full bg-white px-3 py-1.5 font-mono shadow-sm">{context.entityKey}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <div><h3 className="text-sm font-black text-slate-900">Decisão</h3><p className="text-xs text-slate-500">Hipótese, ação e responsabilidade operacional.</p></div>
              <label className={labelClass}>Time responsável *<input autoFocus value={draft.teamScope} onChange={(event) => field('teamScope', event.target.value)} className={inputClass} /><FieldError text={errors.teamScope} /></label>
              <label className={labelClass}>Owner individual (opcional)<input value={draft.owner} onChange={(event) => field('owner', event.target.value)} className={inputClass} placeholder="Nome ou papel" /></label>
              <label className={labelClass}>Hipótese *<textarea value={draft.hypothesis} onChange={(event) => field('hypothesis', event.target.value)} rows={3} className={inputClass} placeholder="Se fizermos X, esperamos Y porque…" /><FieldError text={errors.hypothesis} /></label>
              <label className={labelClass}>Ação *<textarea value={draft.actionText} onChange={(event) => field('actionText', event.target.value)} rows={3} className={inputClass} placeholder="O que será executado" /><FieldError text={errors.actionText} /></label>
              <label className={labelClass}>Condição de parada (opcional)<textarea value={draft.stopCondition} onChange={(event) => field('stopCondition', event.target.value)} rows={2} className={inputClass} /></label>
              <label className={labelClass}>Alternativas conhecidas (uma por linha)<textarea value={draft.knownAlternatives} onChange={(event) => field('knownAlternatives', event.target.value)} rows={2} className={inputClass} /></label>
            </section>

            <section className="space-y-4">
              <div><h3 className="text-sm font-black text-slate-900">Contrato de medição</h3><p className="text-xs text-slate-500">Baseline, expectativa e janela são obrigatórios antes da aprovação.</p></div>
              <label className={labelClass}>Métrica *<input value={draft.metricName} onChange={(event) => field('metricName', event.target.value)} className={inputClass} placeholder="Ex.: taxa de finalização" /><FieldError text={errors.metricName} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Baseline *<input inputMode="decimal" value={draft.baselineValue} onChange={(event) => field('baselineValue', event.target.value.replace(',', '.'))} className={inputClass} placeholder="0" /><FieldError text={errors.baselineValue} /></label>
                <label className={labelClass}>Expectativa *<input inputMode="decimal" value={draft.expectedValue} onChange={(event) => field('expectedValue', event.target.value.replace(',', '.'))} className={inputClass} placeholder="0" /><FieldError text={errors.expectedValue} /></label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Direção *<select value={draft.expectedDirection} onChange={(event) => field('expectedDirection', event.target.value as GrowthBetDraft['expectedDirection'])} className={inputClass}><option value="maior_melhor">Maior é melhor</option><option value="menor_melhor">Menor é melhor</option><option value="atingir_meta">Atingir meta</option></select></label>
                <label className={labelClass}>Unidade<input value={draft.expectedUnit} onChange={(event) => field('expectedUnit', event.target.value)} className={inputClass} placeholder="%, R$, cartões…" /></label>
              </div>
              <label className={labelClass}>Critério de sucesso *<textarea value={draft.successCriterion} onChange={(event) => field('successCriterion', event.target.value)} rows={2} className={inputClass} /><FieldError text={errors.successCriterion} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Início da janela *<input type="date" value={draft.outcomeWindowStart} onChange={(event) => field('outcomeWindowStart', event.target.value)} className={inputClass} /><FieldError text={errors.outcomeWindowStart} /></label>
                <label className={labelClass}>Fim da janela *<input type="date" value={draft.outcomeWindowEnd} onChange={(event) => field('outcomeWindowEnd', event.target.value)} className={inputClass} /><FieldError text={errors.outcomeWindowEnd} /></label>
              </div>
              <label className={labelClass}>Prazo de execução (opcional)<input type="date" value={draft.executionDueAt} onChange={(event) => field('executionDueAt', event.target.value)} className={inputClass} /></label>
              <label className={labelClass}>View de verificação *<input value={draft.verificationView} onChange={(event) => field('verificationView', event.target.value)} className={`${inputClass} font-mono text-xs`} /><FieldError text={errors.verificationView} /></label>
            </section>

            <section className="space-y-3 lg:col-span-2">
              <div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><BookMarked size={16} className="text-violet-700" /> Memória aplicável</h3><p className="mt-1 text-xs text-slate-500">A métrica e o contexto atual alimentam o mesmo matcher determinístico usado pela Fila.</p></div>
              {loadingMemory ? <p className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Comparando contexto e memória…</p>
                : learningSuggestions.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Nenhuma memória possui coincidência específica suficiente. Mesma frente, sozinha, não conta como similaridade.</p>
                  : <div className="space-y-3">{learningSuggestions.map((learning) => {
                    const eligible = ['reusable', 'needs_review'].includes(learning.eligibility);
                    const decision = learningDecisions[learning.learning_id];
                    return <article key={learning.learning_id} className={`rounded-2xl border p-4 ${eligible ? 'border-violet-200 bg-violet-50/50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-900">{learning.source_title}</span><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">v{learning.learning_revision} · score {learning.match_score}</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${eligible ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'}`}>{learning.eligibility.split('_').join(' ')}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{learning.statement}</p><p className="mt-2 text-[11px] text-slate-500">Match: {learning.match_reasons.map((item) => `${item.dimension}=${item.value}`).join(' · ')} · origem {learning.source_kind === 'outcome' ? 'outcome' : 'vault curado'}</p></div>{eligible && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => decideLearning(learning.learning_id, 'reused')} className={`rounded-xl px-3 py-2 text-xs font-bold ${decision?.decision === 'reused' ? 'bg-emerald-700 text-white' : 'border border-emerald-200 bg-white text-emerald-700'}`}>Reutilizar</button><button type="button" onClick={() => decideLearning(learning.learning_id, 'discarded')} className={`rounded-xl px-3 py-2 text-xs font-bold ${decision?.decision === 'discarded' ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Descartar</button></div>}</div>
                      {decision?.decision === 'discarded' && <label className="mt-3 block text-xs font-bold text-slate-700">Por que não se aplica? *<input value={decision.reason || ''} onChange={(event) => setLearningDecisions((current) => ({ ...current, [learning.learning_id]: { learningId: learning.learning_id, decision: 'discarded', reason: event.target.value } }))} className={inputClass} /></label>}
                      {!eligible && <p className="mt-3 text-xs font-semibold text-amber-800">A memória aparece como alerta, mas seu estado impede reutilização.</p>}
                    </article>;
                  })}</div>}
            </section>
          </div>
          {commandError && <div className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><AlertCircle size={18} className="mt-0.5 shrink-0" /> {commandError}</div>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <span className="hidden items-center gap-2 text-xs text-slate-500 sm:inline-flex"><CheckCircle2 size={14} /> Cancelar não grava rascunho.</span>
          <div className="ml-auto flex gap-2"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40">Cancelar</button><button type="button" onClick={() => void submit()} disabled={saving || !canSubmit} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving && <Loader2 size={14} className="animate-spin" />} Aprovar e criar aposta</button></div>
        </footer>
      </div>
    </div>
  );
};
