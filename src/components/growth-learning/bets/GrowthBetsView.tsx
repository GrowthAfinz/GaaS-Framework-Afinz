import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Filter, ListChecks, Loader2, RefreshCw, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { closeGrowthLearningItem, openGrowthLearningSectionItem, readGrowthLearningItem } from '../growthLearningNavigation';
import { fetchGrowthBet, fetchGrowthBets } from './growthBetService';
import { GrowthBet, GrowthBetStatus } from './growthBet.types';
import { GrowthBetDrawer } from './GrowthBetDrawer';

interface GrowthBetsViewProps { onCountChange?: (count: number) => void }

const STATUS_LABELS: Record<GrowthBetStatus, string> = {
  approved: 'Aprovada', in_progress: 'Em execução', waiting_window: 'Aguardando janela', ready_for_review: 'Pronta para revisão', closed: 'Encerrada', cancelled: 'Cancelada', not_verifiable: 'Não verificável',
};
const FRONT_LABELS = { crm_acquisition: 'CRM Aquisição', paid_media: 'Mídia Paga', b2c_origin: 'Originação B2C' } as const;
const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

function formatDate(value: string) { try { return format(parseISO(value), 'dd MMM yyyy', { locale: ptBR }); } catch { return value; } }

export const GrowthBetsView: React.FC<GrowthBetsViewProps> = ({ onCountChange }) => {
  const [bets, setBets] = useState<GrowthBet[]>([]);
  const [selected, setSelected] = useState<GrowthBet | null>(null);
  const [front, setFront] = useState('all');
  const [status, setStatus] = useState('active');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const rows = await fetchGrowthBets(); setBets(rows); onCountChange?.(rows.length); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as apostas.'); onCountChange?.(0); }
    finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    const syncItem = async () => {
      const itemId = readGrowthLearningItem(window.location.search);
      if (!itemId) { setSelected(null); return; }
      const local = bets.find((bet) => bet.id === itemId);
      if (local) { setSelected(local); return; }
      try { const remote = await fetchGrowthBet(itemId); if (!cancelled) setSelected(remote); } catch { if (!cancelled) setSelected(null); }
    };
    void syncItem(); window.addEventListener('popstate', syncItem);
    return () => { cancelled = true; window.removeEventListener('popstate', syncItem); };
  }, [bets]);

  const filtered = useMemo(() => bets.filter((bet) => {
    if (front !== 'all' && bet.front !== front) return false;
    if (status === 'active' && ['closed', 'cancelled', 'not_verifiable'].includes(bet.status)) return false;
    if (status !== 'all' && status !== 'active' && bet.status !== status) return false;
    const haystack = `${bet.hypothesis} ${bet.action_text} ${bet.metric_name} ${bet.team_scope} ${bet.owner || ''}`.toLocaleLowerCase('pt-BR');
    return haystack.includes(query.trim().toLocaleLowerCase('pt-BR'));
  }), [bets, front, query, status]);

  const openBet = (bet: GrowthBet) => { setSelected(bet); openGrowthLearningSectionItem('bets', bet.id); };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700"><ListChecks size={15} /> Apostas contratadas</div><p className="mt-1 text-sm text-slate-600">{filtered.length} {filtered.length === 1 ? 'decisão operacional' : 'decisões operacionais'} nesta leitura</p></div>
        <div className="flex flex-wrap items-center gap-2"><label className="flex min-w-56 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm"><Search size={14} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 min-w-0 flex-1 text-xs outline-none" placeholder="Buscar hipótese, métrica ou time" /></label><span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400"><Filter size={13} /> Filtros</span><select value={front} onChange={(e) => setFront(e.target.value)} className={selectClass}><option value="all">Todas as frentes</option><option value="crm_acquisition">CRM Aquisição</option><option value="paid_media">Mídia Paga</option><option value="b2c_origin">Originação B2C</option></select><select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}><option value="active">Ativas</option><option value="all">Todos os estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>

      {loading ? <div className="grid min-h-[340px] place-items-center rounded-2xl border border-slate-200 bg-white"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 size={18} className="animate-spin" /> Lendo apostas…</span></div> : error ? <div className="grid min-h-[340px] place-items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-center"><div><AlertCircle size={30} className="mx-auto text-rose-600" /><h3 className="mt-3 font-black text-rose-900">As apostas não puderam ser carregadas</h3><p className="mt-2 text-sm text-rose-800">{error}</p><button type="button" onClick={() => void load()} className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white"><RefreshCw size={14} /> Tentar novamente</button></div></div> : filtered.length === 0 ? <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><ListChecks size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 font-black text-slate-800">Nenhuma aposta nesta leitura</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Aceite uma recomendação elegível na Fila ou ajuste os filtros. Nenhuma aposta é criada automaticamente.</p></div></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-4 py-3">Aposta</th><th className="px-4 py-3">Frente</th><th className="px-4 py-3">Métrica</th><th className="px-4 py-3">Expectativa</th><th className="px-4 py-3">Janela</th><th className="px-4 py-3">Time / owner</th><th className="px-4 py-3">Checklist</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((bet) => <tr key={bet.id} onClick={() => openBet(bet)} className="cursor-pointer text-sm hover:bg-cyan-50/40"><td className="max-w-sm px-4 py-4"><div className="font-bold text-slate-900">{bet.hypothesis}</div><div className="mt-1 truncate text-xs text-slate-500">{bet.action_text}</div></td><td className="px-4 py-4 text-xs font-semibold text-slate-600">{FRONT_LABELS[bet.front]}</td><td className="px-4 py-4"><div className="font-semibold text-slate-800">{bet.metric_name}</div><div className="text-xs text-slate-400">baseline {bet.baseline_value}{bet.expected_unit ? ` ${bet.expected_unit}` : ''}</div></td><td className="px-4 py-4 font-bold text-slate-800">{bet.expected_value}{bet.expected_unit ? ` ${bet.expected_unit}` : ''}</td><td className="px-4 py-4 text-xs text-slate-600">{formatDate(bet.outcome_window_start)}<br />{formatDate(bet.outcome_window_end)}</td><td className="px-4 py-4"><div className="font-semibold text-slate-800">{bet.team_scope}</div><div className="text-xs text-slate-400">{bet.owner || 'Sem owner individual'}</div></td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{bet.checklist_completed}/{bet.checklist_total}</span></td><td className="px-4 py-4"><span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-800">{STATUS_LABELS[bet.status]}</span></td></tr>)}</tbody></table></div></div>}

      {selected && <GrowthBetDrawer bet={selected} onClose={closeGrowthLearningItem} onChanged={() => void load()} />}
    </section>
  );
};
