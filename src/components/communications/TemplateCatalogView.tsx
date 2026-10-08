import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle, Search, SlidersHorizontal, FileImage, FileText, CircleDashed } from 'lucide-react';
import { useTemplateCatalog, type CatalogTemplate } from '../../hooks/useTemplateCatalog';
import { AddAssetModal } from './AddAssetModal';
import { TemplateIdChips } from './TemplateIdChips';
import { parseSeqParts, translateTemplateId } from '../../utils/taxonomy';
import { readContents } from '../../services/sfmcPackageService';
import { PackageContentLibrary } from './PackageContentLibrary';
import { DimTag, HowItWorks, Segmented, controlClass } from './ui/commsUi';

type CatalogSort = 'moment' | 'recent' | 'channel' | 'segment';
type ContentFilter = 'all' | 'none' | 'text' | 'file';
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
const label = 'flex flex-col gap-1 text-xs font-semibold text-slate-600';

export const TemplateCatalogView: React.FC = () => {
  const { drafts, comAsset, total, filteredTotal, activeFilterLabels, loading, error, refetch } = useTemplateCatalog();
  const [selected, setSelected] = useState<CatalogTemplate | null>(null);
  const [sortBy, setSortBy] = useState<CatalogSort>('moment');
  const [query, setQuery] = useState('');
  const [contentSel, setContentSel] = useState<ContentFilter>('all');
  const [canalSel, setCanalSel] = useState('todos');
  const [segmentoSel, setSegmentoSel] = useState('todos');
  const [subgrupoSel, setSubgrupoSel] = useState('todos');
  const [semanaSel, setSemanaSel] = useState('todos');
  const [disparoSel, setDisparoSel] = useState('todos');
  const [showMore, setShowMore] = useState(false);
  const [withText, setWithText] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const load = () => readContents().then((rows) => { if (active) setWithText(new Set(rows.map((r) => r.template_id))); }).catch(() => { if (active) setWithText(new Set()); });
    load(); window.addEventListener('sfmc-package-changed', load);
    return () => { active = false; window.removeEventListener('sfmc-package-changed', load); };
  }, []);

  const allVisible = useMemo(() => [...drafts, ...comAsset], [drafts, comAsset]);
  const options = useMemo(() => ({
    canais: Array.from(new Set(allVisible.map((t) => t.channel))).sort(),
    segmentos: Array.from(new Set(allVisible.map(segmentOf).filter((v) => v !== '—'))).sort(),
    subgrupos: Array.from(new Set(allVisible.map(subgroupOf).filter((v) => v !== '—'))).sort(),
    semanas: Array.from(new Set(allVisible.map((t) => parseSeqParts(t.template_id)?.week).filter((v): v is number => v != null))).sort((a, b) => a - b),
    disparos: Array.from(new Set(allVisible.map((t) => parseSeqParts(t.template_id)?.dispatch).filter((v): v is number => v != null))).sort((a, b) => a - b),
  }), [allVisible]);

  const contentOf = (t: CatalogTemplate): Exclude<ContentFilter, 'all'> => t.original_path ? 'file' : withText.has(t.template_id) ? 'text' : 'none';

  const rows = useMemo(() => allVisible.filter((t) => {
    const moment = parseSeqParts(t.template_id);
    if (query && !`${t.template_id} ${t.title ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (contentSel !== 'all' && contentOf(t) !== contentSel) return false;
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
  }), [allVisible, query, contentSel, canalSel, segmentoSel, subgrupoSel, semanaSel, disparoSel, sortBy, withText]);

  const count = (c: ContentFilter) => c === 'all' ? allVisible.length : allVisible.filter((t) => contentOf(t) === c).length;
  const activeMore = [subgrupoSel, semanaSel, disparoSel].filter((v) => v !== 'todos').length;

  if (loading) {
    return <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Carregando templates…</div>;
  }
  if (error) {
    return <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle size={16} aria-hidden="true" /> {error}</div>;
  }

  return (
    <div className="space-y-4">
      <HowItWorks steps={[
        { title: 'Catálogo', text: 'Cada template é uma peça identificada pelo Template ID, o mesmo código do af_sub3 no link do disparo.' },
        { title: 'Texto do SFMC', text: 'Quando a fila envia uma comunicação, o texto do pacote vira uma prévia de WhatsApp ou SMS, mesmo sem print.' },
        { title: 'Arquivo', text: 'O print ou HTML continua sendo a peça oficial. Suba o arquivo nos templates que ainda não têm.' },
      ]} />

      {activeFilterLabels.length > 0 && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
          <p className="text-sm text-cyan-950"><span className="font-semibold">Filtros globais aplicados:</span> {filteredTotal} de {total} templates</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeFilterLabels.map((l) => <span key={l} className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-cyan-900 ring-1 ring-cyan-200">{l}</span>)}
          </div>
        </div>
      )}

      <Segmented<ContentFilter> label="Situação do conteúdo" value={contentSel} onChange={setContentSel} options={[
        { id: 'all', label: 'Todos', count: count('all') },
        { id: 'none', label: 'Sem peça e sem texto', count: count('none') },
        { id: 'text', label: 'Com texto do SFMC', count: count('text') },
        { id: 'file', label: 'Com arquivo', count: count('file') },
      ]} />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label className={label + ' min-w-56 flex-1'}>Buscar
          <span className="relative"><Search size={14} aria-hidden="true" className="absolute left-3 top-3 text-slate-500" />
            <input className={controlClass + ' w-full pl-9'} placeholder="Template ID ou nome do template Meta" value={query} onChange={(e) => setQuery(e.target.value)} /></span>
        </label>
        <label className={label}>Canal<select className={controlClass} value={canalSel} onChange={(e) => setCanalSel(e.target.value)}><option value="todos">Todos</option>{options.canais.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className={label}>Segmento<select className={controlClass} value={segmentoSel} onChange={(e) => setSegmentoSel(e.target.value)}><option value="todos">Todos</option>{options.segmentos.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className={label}>Ordenar por<select className={controlClass} value={sortBy} onChange={(e) => setSortBy(e.target.value as CatalogSort)}><option value="moment">Ordem da régua</option><option value="recent">Mais recentes</option><option value="channel">Canal</option><option value="segment">Segmento</option></select></label>
        <button type="button" aria-expanded={showMore} onClick={() => setShowMore(!showMore)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><SlidersHorizontal size={15} aria-hidden="true" />Mais filtros{activeMore > 0 && <span className="rounded-full bg-cyan-700 px-1.5 text-xs text-white">{activeMore}</span>}</button>
        {showMore && <div className="flex w-full flex-wrap items-end gap-3 border-t border-slate-200 pt-3">
          <label className={label}>Subgrupo<select className={controlClass} value={subgrupoSel} onChange={(e) => setSubgrupoSel(e.target.value)}><option value="todos">Todos</option>{options.subgrupos.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label className={label}>Semana<select className={controlClass} value={semanaSel} onChange={(e) => setSemanaSel(e.target.value)}><option value="todos">Todas</option>{options.semanas.map((v) => <option key={v} value={v}>Semana {v}</option>)}</select></label>
          <label className={label}>Disparo<select className={controlClass} value={disparoSel} onChange={(e) => setDisparoSel(e.target.value)}><option value="todos">Todos</option>{options.disparos.map((v) => <option key={v} value={v}>Disparo {v}</option>)}</select></label>
        </div>}
      </div>

      <p className="text-sm text-slate-600" aria-live="polite">{rows.length} {rows.length === 1 ? 'template' : 'templates'} neste filtro.</p>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white" aria-label="Templates">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="p-3">Template</th><th className="p-3">Canal e público</th><th className="p-3">Conteúdo</th><th className="p-3"><span className="sr-only">Ação</span></th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const c = contentOf(t);
              return (
                <tr key={t.template_id} className="border-t border-slate-200 align-top">
                  <td className="p-3"><TemplateIdChips id={t.template_id} />{t.title && t.title !== t.template_id && <p className="mt-1 text-xs text-slate-600">Meta: {t.title}</p>}<p className="mt-1 break-all font-mono text-xs text-slate-700">{t.template_id}</p></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1"><DimTag kind="channel" value={t.channel} />{segmentOf(t) !== '—' && <DimTag kind="segment" value={segmentOf(t)} />}{subgroupOf(t) !== '—' && <DimTag kind="subgroup" value={subgroupOf(t)} />}</div><p className="mt-1 text-xs text-slate-600">{t.app || 'App não definido'}</p></td>
                  <td className="p-3">
                    {c === 'file' && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200"><FileImage size={13} aria-hidden="true" />Arquivo cadastrado</span>}
                    {c === 'text' && <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-900 ring-1 ring-cyan-200"><FileText size={13} aria-hidden="true" />Texto do SFMC</span>}
                    {c === 'none' && <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300"><CircleDashed size={13} aria-hidden="true" />Sem peça e sem texto</span>}
                    {c === 'file' && withText.has(t.template_id) && <p className="mt-1 text-xs text-slate-600">Também tem texto do SFMC</p>}
                  </td>
                  <td className="p-3 text-right"><button className="rounded-lg border border-cyan-300 px-3 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50" onClick={() => setSelected(t)}>{t.original_path ? 'Gerenciar arquivo' : 'Adicionar arquivo'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-sm text-slate-600">Nenhum template neste filtro. Limpe a busca ou escolha outra situação.</p>}
      </section>

      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-base font-semibold text-slate-900">Textos importados do SFMC e versões</summary>
        <div className="mt-3"><PackageContentLibrary templateIds={allVisible.map((t) => t.template_id)} /></div>
      </details>

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
