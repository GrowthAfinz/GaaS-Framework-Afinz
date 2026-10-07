import React, { useMemo, useState } from 'react';
import { Loader2, AlertCircle, Mail, MessageCircle, ArrowDownWideNarrow, Clock } from 'lucide-react';
import { useTemplateCatalog, type CatalogTemplate } from '../../hooks/useTemplateCatalog';
import { AddAssetModal } from './AddAssetModal';
import { TemplateIdChips } from './TemplateIdChips';
import { parseSeqParts, translateTemplateId } from '../../utils/taxonomy';

import { PackageContentLibrary } from './PackageContentLibrary';

type CatalogSort = 'moment' | 'recent' | 'channel' | 'segment';
const segmentOf = (t: CatalogTemplate) => t.segmento_af_sub1 || translateTemplateId(t.template_id).find((part) => part.key === 'segmento')?.value || '—';
const subgroupOf = (t: CatalogTemplate) => {
  const metadata = t.metadata as Record<string, unknown>;
  const resolved=(metadata.resolved_context||{}) as Record<string,unknown>;
  return String(resolved.subgroup ?? metadata.subgrupo ?? metadata.Subgrupos ?? metadata.subgrupos ?? '—');
};
const momentValue = (t: CatalogTemplate) => {
  const moment = parseSeqParts(t.template_id);
  return moment ? (moment.week ?? 999) * 1000 + moment.dispatch : Number.MAX_SAFE_INTEGER;
};

export const TemplateCatalogView: React.FC = () => {
  const { drafts, comAsset, total, filteredTotal, activeFilterLabels, loading, error, refetch } = useTemplateCatalog();
  const [selected, setSelected] = useState<CatalogTemplate | null>(null);
  const [sortBy, setSortBy] = useState<CatalogSort>('moment');
  const [canalSel, setCanalSel] = useState('todos');
  const [segmentoSel, setSegmentoSel] = useState('todos');
  const [subgrupoSel, setSubgrupoSel] = useState('todos');
  const [semanaSel, setSemanaSel] = useState('todos');
  const [disparoSel, setDisparoSel] = useState('todos');

  const allVisible = useMemo(() => [...drafts, ...comAsset], [drafts, comAsset]);
  const options = useMemo(() => ({
    canais: Array.from(new Set(allVisible.map((t) => t.channel))).sort(),
    segmentos: Array.from(new Set(allVisible.map(segmentOf).filter((v) => v !== '—'))).sort(),
    subgrupos: Array.from(new Set(allVisible.map(subgroupOf).filter((v) => v !== '—'))).sort(),
    semanas: Array.from(new Set(allVisible.map((t) => parseSeqParts(t.template_id)?.week).filter((v): v is number => v != null))).sort((a, b) => a - b),
    disparos: Array.from(new Set(allVisible.map((t) => parseSeqParts(t.template_id)?.dispatch).filter((v): v is number => v != null))).sort((a, b) => a - b),
  }), [allVisible]);

  const applyLocal = (items: CatalogTemplate[]) => [...items].filter((t) => {
    const moment = parseSeqParts(t.template_id);
    if (canalSel !== 'todos' && t.channel !== canalSel) return false;
    if (segmentoSel !== 'todos' && segmentOf(t) !== segmentoSel) return false;
    if (subgrupoSel !== 'todos' && subgroupOf(t) !== subgrupoSel) return false;
    if (semanaSel !== 'todos' && String(moment?.week ?? '') !== semanaSel) return false;
    if (disparoSel !== 'todos' && String(moment?.dispatch ?? '') !== disparoSel) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'recent') return b.updated_at.localeCompare(a.updated_at);
    if (sortBy === 'channel') return a.channel.localeCompare(b.channel, 'pt-BR') || momentValue(a) - momentValue(b);
    if (sortBy === 'segment') return segmentOf(a).localeCompare(segmentOf(b), 'pt-BR') || momentValue(a) - momentValue(b);
    return momentValue(a) - momentValue(b);
  });

  const localDrafts = useMemo(() => applyLocal(drafts), [drafts, sortBy, canalSel, segmentoSel, subgrupoSel, semanaSel, disparoSel]);
  const localWithAsset = useMemo(() => applyLocal(comAsset), [comAsset, sortBy, canalSel, segmentoSel, subgrupoSel, semanaSel, disparoSel]);

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400"><Loader2 size={18} className="animate-spin" /> Carregando catálogo...</div>;
  }
  if (error) {
    return <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={16} /> {error}</div>;
  }

  return (
    <div className="space-y-6">
      <PackageContentLibrary templateIds={allVisible.map(t => t.template_id)} />
      {activeFilterLabels.length > 0 && (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Filtros globais aplicados</span>
            <span className="text-xs text-cyan-700/80">{filteredTotal} de {total} templates no recorte</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeFilterLabels.map((label) => (
              <span key={label} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-cyan-700 ring-1 ring-cyan-100">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-[11px] shadow-sm">
        <span className="mr-0.5 font-semibold uppercase tracking-wide text-slate-400">Ordenar</span>
        {([
          ['moment', 'Ordem da régua', ArrowDownWideNarrow],
          ['recent', 'Mais recentes', Clock],
          ['channel', 'Canal', Mail],
          ['segment', 'Segmento', ArrowDownWideNarrow],
        ] as [CatalogSort, string, React.ComponentType<{ size?: number }>][]) .map(([id, label, Icon]) => (
          <button key={id} onClick={() => setSortBy(id)} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold ${sortBy === id ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}><Icon size={12} />{label}</button>
        ))}
        <span className="ml-3 mr-0.5 font-semibold uppercase tracking-wide text-slate-400">Filtrar</span>
        <select value={canalSel} onChange={(e) => setCanalSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Canal: todos</option>{options.canais.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={segmentoSel} onChange={(e) => setSegmentoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Segmento: todos</option>{options.segmentos.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={subgrupoSel} onChange={(e) => setSubgrupoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Subgrupo: todos</option>{options.subgrupos.map((v) => <option key={v}>{v}</option>)}</select>
        <select value={semanaSel} onChange={(e) => setSemanaSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Semana: todas</option>{options.semanas.map((v) => <option key={v} value={v}>Semana {v}</option>)}</select>
        <select value={disparoSel} onChange={(e) => setDisparoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Disparo: todos</option>{options.disparos.map((v) => <option key={v} value={v}>Disparo {v}</option>)}</select>
      </div>

      <section className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr><th className="p-3">Template ID</th><th className="p-3">Canal / contexto</th><th className="p-3">Arquivo cadastrado</th><th className="p-3">Ação</th></tr></thead><tbody>{[...localDrafts,...localWithAsset].map(t=><tr key={t.template_id} className="border-t"><td className="p-3"><p className="break-all font-mono text-xs font-semibold text-slate-900">{t.template_id}</p><TemplateIdChips id={t.template_id}/></td><td className="p-3 text-xs">{t.channel} · {segmentOf(t)}<p className="mt-1 text-slate-500">{subgroupOf(t)} · {t.app||'App não definido'}</p></td><td className="p-3 text-xs">{t.original_path?'Arquivo disponível':'Sem arquivo; consultar texto na biblioteca acima'}</td><td className="p-3"><button className="rounded-lg border px-3 py-2 text-xs text-cyan-800" onClick={()=>setSelected(t)}>{t.original_path?'Gerenciar arquivo':'Adicionar arquivo'}</button></td></tr>)}</tbody></table></section>

      {selected && (
        <AddAssetModal
          template={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); refetch(); }}
        />
      )}
    </div>
  );
};
