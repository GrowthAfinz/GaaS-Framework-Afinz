import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BookMarked, CalendarDays, Check, Circle, Database, History, Loader2, MessageSquarePlus, Plus, ShieldCheck, Target, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  addGrowthBetChecklistItem,
  appendGrowthBetUpdate,
  fetchGrowthBetChecklist,
  fetchGrowthBetLearningApplications,
  fetchGrowthBetUpdates,
  setGrowthBetChecklistItem,
} from './growthBetService';
import { GrowthBet, GrowthBetChecklistItem, GrowthBetStatus, GrowthBetUpdate, GrowthExecutionStatus, GrowthLearningApplication } from './growthBet.types';

interface GrowthBetDrawerProps {
  bet: GrowthBet;
  onClose: () => void;
  onChanged: () => void;
}

const BET_STATUS_LABELS: Record<GrowthBetStatus, string> = {
  approved: 'Aprovada', in_progress: 'Em execução', waiting_window: 'Aguardando janela',
  ready_for_review: 'Pronta para revisão', closed: 'Encerrada', cancelled: 'Cancelada', not_verifiable: 'Não verificável',
};

const EXECUTION_LABELS: Record<GrowthExecutionStatus, string> = {
  not_started: 'Não iniciada', partial: 'Parcial', completed: 'Concluída', cancelled: 'Cancelada', unknown: 'Desconhecida',
};

function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Não informado';
  try { return format(parseISO(value), withTime ? "dd MMM yyyy, HH:mm" : 'dd/MM/yyyy', { locale: ptBR }); } catch { return value; }
}

const Fact: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div><dt className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm text-slate-700">{value === undefined || value === null || value === '' ? 'Não informado' : value}</dd></div>
);

export const GrowthBetDrawer: React.FC<GrowthBetDrawerProps> = ({ bet, onClose, onChanged }) => {
  const [checklist, setChecklist] = useState<GrowthBetChecklistItem[]>([]);
  const [updates, setUpdates] = useState<GrowthBetUpdate[]>([]);
  const [learningApplications, setLearningApplications] = useState<GrowthLearningApplication[]>([]);
  const [newItem, setNewItem] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [updateKind, setUpdateKind] = useState<'comment' | 'execution' | 'status_changed'>('comment');
  const [executionStatus, setExecutionStatus] = useState<GrowthExecutionStatus>('partial');
  const [betStatus, setBetStatus] = useState<GrowthBetStatus>(bet.status);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextChecklist, nextUpdates, nextLearningApplications] = await Promise.all([
        fetchGrowthBetChecklist(bet.id),
        fetchGrowthBetUpdates(bet.id),
        fetchGrowthBetLearningApplications(bet.id),
      ]);
      setChecklist(nextChecklist);
      setUpdates(nextUpdates);
      setLearningApplications(nextLearningApplications);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a operação da aposta.');
    } finally {
      setLoading(false);
    }
  }, [bet.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => { if (keyboardEvent.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, saving]);

  const mutate = async (command: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await command();
      await load();
      onChanged();
    } catch (commandError) {
      setError(commandError instanceof Error ? commandError.message : 'A atualização não pôde ser registrada.');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    void mutate(async () => {
      await addGrowthBetChecklistItem(bet.id, newItem);
      setNewItem('');
    });
  };

  const submitUpdate = () => {
    if (!updateBody.trim()) return;
    void mutate(async () => {
      await appendGrowthBetUpdate({
        betId: bet.id,
        type: updateKind,
        body: updateBody,
        executionStatus: updateKind === 'execution' ? executionStatus : undefined,
        betStatus: updateKind === 'status_changed' ? betStatus : undefined,
      });
      setUpdateBody('');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Detalhes da aposta" className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-700"><Target size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white">{BET_STATUS_LABELS[bet.status]}</span><span className="text-xs font-bold text-slate-500">{bet.team_scope}{bet.owner ? ` · ${bet.owner}` : ''}</span></div><h2 className="mt-2 text-xl font-black leading-snug text-slate-900">{bet.hypothesis}</h2></div></div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
          </div>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
          <section>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Contrato da aposta</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-700"><strong>Ação:</strong> {bet.action_text}</p>{bet.stop_condition && <p className="mt-2 text-sm leading-6 text-amber-900"><strong>Parar/rever se:</strong> {bet.stop_condition}</p>}</div>
            <dl className="mt-3 grid gap-x-5 gap-y-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label="Métrica" value={bet.metric_name} /><Fact label="Baseline" value={`${bet.baseline_value}${bet.expected_unit ? ` ${bet.expected_unit}` : ''}`} /><Fact label="Expectativa" value={`${bet.expected_value}${bet.expected_unit ? ` ${bet.expected_unit}` : ''}`} />
              <Fact label="Direção" value={bet.expected_direction.split('_').join(' ')} /><Fact label="Janela" value={`${formatDate(bet.outcome_window_start)} a ${formatDate(bet.outcome_window_end)}`} /><Fact label="Prazo de execução" value={formatDate(bet.execution_due_at)} />
              <Fact label="Critério de sucesso" value={bet.success_criterion} /><Fact label="View de verificação" value={<code className="text-xs">{bet.verification_view}</code>} /><Fact label="Versão" value={bet.contract_version} />
            </dl>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><Database size={15} /> Evidência congelada</h3>
            <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
              {bet.source_signal && <p><strong>Sinal:</strong> {bet.source_signal}</p>}{bet.source_impact && <p><strong>Impacto:</strong> {bet.source_impact}</p>}{bet.source_probable_cause && <p><strong>Causa provável:</strong> {bet.source_probable_cause}</p>}{bet.source_reading_limit && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"><strong>Limite:</strong> {bet.source_reading_limit}</p>}
              <div className="grid gap-3 pt-2 sm:grid-cols-2"><Fact label="Período" value={`${formatDate(bet.evidence_period_start)} a ${formatDate(bet.evidence_period_end)}`} /><Fact label="Fonte" value={bet.source_view} /><Fact label="Hash" value={<span className="break-all font-mono text-[11px]">{bet.source_hash}</span>} /><Fact label="Sinais mesclados" value={bet.merged_signal_count} /></div>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><BookMarked size={15} /> Memória consultada</h3>
            <div className="mt-3 space-y-3">
              {learningApplications.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Nenhuma memória específica foi aplicável no momento desta aposta.</p> : learningApplications.map((application) => (
                <article key={application.id} className={`rounded-2xl border p-4 ${application.decision === 'reused' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black text-slate-900">{application.source_title}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${application.decision === 'reused' ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white'}`}>{application.decision === 'reused' ? 'Reutilizada' : 'Descartada'}</span></div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{application.statement}</p>
                  <p className="mt-2 text-[11px] text-slate-500">Revisão {application.learning_revision} · score {application.match_score} · {application.match_reasons.map((item) => item.dimension).join(', ')}</p>
                  {application.decision_reason && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-600"><strong>Motivo:</strong> {application.decision_reason}</p>}
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3"><div><h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><Check size={15} /> Checklist</h3><p className="mt-1 text-xs text-slate-400">{checklist.filter((item) => item.status === 'completed').length} de {checklist.length} concluídos</p></div></div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
              {loading ? <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Carregando…</p> : checklist.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhuma etapa registrada.</p> : checklist.map((item) => <button key={item.id} type="button" disabled={saving} onClick={() => void mutate(() => setGrowthBetChecklistItem(item.id, item.status === 'completed' ? 'pending' : 'completed'))} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 disabled:opacity-50">{item.status === 'completed' ? <Check size={17} className="text-emerald-600" /> : <Circle size={17} className="text-slate-300" />}<span className={`text-sm ${item.status === 'completed' ? 'text-slate-400 line-through' : 'font-semibold text-slate-700'}`}>{item.label}</span></button>)}
              <div className="flex gap-2 border-t border-slate-200 bg-slate-50 p-3"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder="Nova etapa operacional" /><button type="button" disabled={saving || !newItem.trim()} onClick={addItem} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Plus size={14} /> Adicionar</button></div>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><MessageSquarePlus size={15} /> Registrar atualização</h3>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-3"><select value={updateKind} onChange={(e) => setUpdateKind(e.target.value as typeof updateKind)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><option value="comment">Comentário</option><option value="execution">Execução</option><option value="status_changed">Estado da aposta</option></select>{updateKind === 'execution' && <select value={executionStatus} onChange={(e) => setExecutionStatus(e.target.value as GrowthExecutionStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">{Object.entries(EXECUTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}{updateKind === 'status_changed' && <select value={betStatus} onChange={(e) => setBetStatus(e.target.value as GrowthBetStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">{Object.entries(BET_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</div>
              <textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500" placeholder={updateKind === 'comment' ? 'Contexto para o time…' : 'O que mudou e por quê?'} />
              <div className="mt-2 flex justify-end"><button type="button" disabled={saving || !updateBody.trim()} onClick={submitUpdate} className="inline-flex items-center gap-2 rounded-xl bg-cyan-800 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{saving && <Loader2 size={14} className="animate-spin" />} Registrar</button></div>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><History size={15} /> Timeline</h3>
            <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">{updates.length === 0 ? <p className="p-4 text-sm text-slate-500">Nenhuma atualização registrada.</p> : updates.map((update) => <div key={update.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-[0.1em] text-cyan-700">{update.update_type.split('_').join(' ')}</span><span className="text-xs text-slate-400">{formatDate(update.created_at, true)}</span></div>{update.body && <p className="mt-2 text-sm leading-6 text-slate-700">{update.body}</p>}{update.execution_status && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{EXECUTION_LABELS[update.execution_status]}</span>}</div>)}</div>
          </section>

          {error && <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}</div>}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6"><span className="inline-flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} /> Crença e evidência originais são imutáveis</span><span className="inline-flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={14} /> Atualizada {formatDate(bet.updated_at, true)}</span></footer>
      </aside>
    </div>
  );
};
