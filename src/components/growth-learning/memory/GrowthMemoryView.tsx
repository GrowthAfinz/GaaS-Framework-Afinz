import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookMarked, DatabaseZap, History, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { closeGrowthLearningItem, openGrowthLearningItem, readGrowthLearningItem } from '../growthLearningNavigation';
import { GrowthMemoryDrawer } from './GrowthMemoryDrawer';
import { filterGrowthMemory, MEMORY_CLASSIFICATION_LABELS, MEMORY_FRONT_LABELS, MEMORY_SOURCE_LABELS, summarizeGrowthMemory } from './growthMemory.logic';
import { fetchGrowthLearning, fetchGrowthMemory } from './growthMemoryService';
import { GrowthLearning, GrowthMemoryFilters } from './growthMemory.types';

interface GrowthMemoryViewProps { onCountChange?: (count: number) => void; }

const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';

function formatDate(value: string) {
  try { return format(parseISO(value), 'dd MMM yyyy', { locale: ptBR }); } catch { return value; }
}

function scopeLabel(scope: Record<string, unknown>) {
  const values = Object.values(scope).flatMap((value) => Array.isArray(value) ? value : [value]).filter((value) => value !== null && value !== undefined && value !== '');
  return values.slice(0, 2).map(String).join(' · ') || 'Escopo geral';
}

export const GrowthMemoryView: React.FC<GrowthMemoryViewProps> = ({ onCountChange }) => {
  const [learnings, setLearnings] = useState<GrowthLearning[]>([]);
  const [selected, setSelected] = useState<GrowthLearning | null>(null);
  const [filters, setFilters] = useState<GrowthMemoryFilters>({ search: '', source: 'all', front: 'all', classification: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchGrowthMemory();
      setLearnings(data); onCountChange?.(data.length);
    } catch (loadError) {
      console.error('Growth memory could not be loaded', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a memória.');
      onCountChange?.(0);
    } finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    const syncItem = async () => {
      const id = readGrowthLearningItem(window.location.search);
      if (!id) { setSelected(null); return; }
      const local = learnings.find((learning) => learning.id === id);
      if (local) { setSelected(local); return; }
      try { const remote = await fetchGrowthLearning(id); if (!cancelled) setSelected(remote); }
      catch (itemError) { console.error('Growth memory item could not be loaded', itemError); if (!cancelled) setSelected(null); }
    };
    void syncItem(); window.addEventListener('popstate', syncItem);
    return () => { cancelled = true; window.removeEventListener('popstate', syncItem); };
  }, [learnings]);

  const visible = useMemo(() => filterGrowthMemory(learnings, filters), [filters, learnings]);
  const summary = useMemo(() => summarizeGrowthMemory(learnings), [learnings]);

  if (loading) return <div className="grid min-h-[420px] place-items-center rounded-2xl border border-slate-200 bg-white"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 size={18} className="animate-spin" /> Lendo memória versionada…</span></div>;
  if (error) return <div className="grid min-h-[420px] place-items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-center"><div><AlertCircle size={30} className="mx-auto text-rose-600" /><h3 className="mt-3 font-black text-rose-900">A memória não pôde ser carregada</h3><p className="mt-2 text-sm text-rose-800">{error}</p><button type="button" onClick={() => void load()} className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white"><RefreshCw size={14} /> Tentar novamente</button></div></div>;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-4 border border-slate-200 bg-white px-4 py-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-700"><BookMarked size={15} /> Memória reutilizável</div><p className="mt-1 text-xs text-slate-500">{visible.length} de {learnings.length} aprendizados neste recorte</p></div>
        <div className="flex flex-1 flex-col gap-2 xl:max-w-4xl xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar afirmação, escopo, regime ou fonte" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
        </label>
        <select aria-label="Filtrar origem da memória" value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value as GrowthMemoryFilters['source'] }))} className={selectClass}>
          <option value="all">Todas as origens</option><option value="outcome">Validadas pelo loop</option><option value="vault_curated">Curadas do vault</option>
        </select>
        <select aria-label="Filtrar frente da memória" value={filters.front} onChange={(event) => setFilters((current) => ({ ...current, front: event.target.value as GrowthMemoryFilters['front'] }))} className={selectClass}>
          <option value="all">Todas as frentes</option>{Object.entries(MEMORY_FRONT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Filtrar classificação da memória" value={filters.classification} onChange={(event) => setFilters((current) => ({ ...current, classification: event.target.value as GrowthMemoryFilters['classification'] }))} className={selectClass}>
          <option value="all">Todas as classificações</option>{Object.entries(MEMORY_CLASSIFICATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="mr-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Base de conhecimento</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><BookMarked size={13} /> {summary.total} ativas</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><ShieldCheck size={13} /> {summary.validated} validadas pelo loop</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"><DatabaseZap size={13} /> {summary.curated} curadas do vault</span>
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${summary.reviewDue ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-500'}`}><History size={13} /> {summary.reviewDue} revisões vencidas</span>
      </div>

      {visible.length === 0 ? (
        <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center"><div><BookMarked size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 font-black text-slate-800">Nenhuma memória nesse recorte</h3><p className="mt-2 text-sm text-slate-500">Ajuste a busca ou os filtros. O sistema não cria aprendizados fictícios para preencher a tela.</p></div></div>
      ) : (
        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.45fr_.55fr_.7fr_.45fr_.35fr_.45fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 lg:grid">
            <span>Aprendizado</span><span>Origem</span><span>Escopo</span><span>Validade</span><span>Reuso</span><span>Revisão</span>
          </div>
          <div className="divide-y divide-slate-100">
            {visible.map((learning) => (
              <button key={learning.id} type="button" onClick={() => { setSelected(learning); openGrowthLearningItem(learning.id); }} className={`grid w-full gap-3 px-5 py-3 text-left transition-colors hover:bg-cyan-50/50 lg:grid-cols-[1.45fr_.55fr_.7fr_.45fr_.35fr_.45fr] lg:items-center lg:gap-4 ${selected?.id === learning.id ? 'bg-cyan-50/70' : ''}`}>
                <div><div className="text-sm font-black text-slate-900">{learning.source_title}</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{learning.statement}</p><span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-700">{MEMORY_FRONT_LABELS[learning.front]}</span></div>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-black ${learning.source_kind === 'outcome' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>{MEMORY_SOURCE_LABELS[learning.source_kind]}</span>
                <span className="text-xs text-slate-600"><strong className="block text-slate-700">{scopeLabel(learning.scope)}</strong>{learning.regime && <span className="mt-1 block text-[10px] text-slate-400">{learning.regime}</span>}</span>
                <span className="text-xs font-bold text-slate-700">{learning.valid_until ? formatDate(learning.valid_until) : 'Vigente'}</span>
                <span className="text-xs font-bold text-slate-700">{learning.reused_count}×</span>
                <span className={`text-xs font-semibold ${learning.review_due ? 'text-amber-700' : 'text-slate-500'}`}>{formatDate(learning.review_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && <GrowthMemoryDrawer learning={selected} onClose={closeGrowthLearningItem} />}
    </section>
  );
};
