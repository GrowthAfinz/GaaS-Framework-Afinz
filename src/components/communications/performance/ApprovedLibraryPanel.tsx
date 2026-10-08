import React, { useMemo, useRef, useEffect, useState } from 'react';
import { BarChart3, GitBranch, Layers, Link2, Search, X } from 'lucide-react';
import type { CommunicationTemplate } from '../../../types/communication';
import type { TemplateContentIndex } from '../../../services/templateContentIndex';
import { resolvePreview } from '../../../utils/communicationVisualResolution';
import { APPROVAL_LABEL, FACET_LABEL, type ApprovalState, type LibraryItem } from '../../../utils/contentPerformanceModel';
import { saoPauloDay } from '../../../utils/saoPauloPeriod';
import { TemplateIdChips } from '../TemplateIdChips';
import { MessagePreview } from '../previews/MessagePreview';
import { PreviewThumb } from '../previews/ContentPreview';
import { ChannelPreview } from './ChannelPreview';
import { Pager, TagRow, paginate } from './contentUi';

export type LibrarySort = 'period' | 'id' | 'executions' | 'lastUse';
export const LIBRARY_SORTS: { key: LibrarySort; label: string; note?: string }[] = [
  { key: 'period', label: 'Com execução no período primeiro' },
  { key: 'executions', label: 'Execuções no período', note: 'Peças sem execução ficam ao final, sem posição de ranking.' },
  { key: 'lastUse', label: 'Último uso vinculado', note: 'Peças nunca vinculadas ficam ao final.' },
  { key: 'id', label: 'Template ID (A–Z)' },
];

export function sortLibrary(items: LibraryItem[], sort: LibrarySort, dir: 1 | -1): LibraryItem[] {
  const id = (a: LibraryItem, b: LibraryItem) => a.template.template_id.localeCompare(b.template.template_id);
  return [...items].sort((a, b) => {
    if (sort === 'id') return id(a, b) * (dir === -1 ? -1 : 1);
    if (sort === 'period') return (Number(b.periodExecutions.length > 0) - Number(a.periodExecutions.length > 0)) || id(a, b);
    const av = sort === 'executions' ? (a.periodExecutions.length || null) : a.lastUse ? Date.parse(a.lastUse) : null;
    const bv = sort === 'executions' ? (b.periodExecutions.length || null) : b.lastUse ? Date.parse(b.lastUse) : null;
    if (av == null && bv == null) return id(a, b);
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av - bv) * dir || id(a, b);
  });
}

const STATE_STYLE: Record<ApprovalState, string> = {
  pack_approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200', catalog_active: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
  catalog_paused: 'bg-amber-50 text-amber-800 ring-amber-200', draft: 'bg-slate-100 text-slate-600 ring-slate-200', inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
};
export const StateChip: React.FC<{ state: ApprovalState }> = ({ state }) => <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ring-1 ${STATE_STYLE[state]}`}>{APPROVAL_LABEL[state]}</span>;

const PeriodChip: React.FC<{ item: LibraryItem }> = ({ item }) => item.periodExecutions.length
  ? <span className="inline-flex rounded-md bg-cyan-600 px-1.5 py-0.5 text-[10.5px] font-bold text-white">Com execução no período · {item.periodExecutions.length}</span>
  : <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">Sem execução vinculada neste período</span>;

interface Props {
  items: LibraryItem[];
  total: number;
  view: 'gallery' | 'table';
  catalogRaw: CommunicationTemplate[];
  contents: TemplateContentIndex | null;
  page: number;
  onPage: (p: number) => void;
  onOpenDetail:(id:string)=>void;
  onOpenPerformance: (templateId: string) => void;
  onReviewCompatible: (templateId: string) => void;
}

export const ApprovedLibraryPanel: React.FC<Props> = ({ items, total, view, catalogRaw, contents, page, onPage, onOpenDetail, onOpenPerformance, onReviewCompatible }) => {
  const setDetail=(item:LibraryItem)=>onOpenDetail(item.template.template_id);
  const { rows, pages, page: current } = paginate(items, page);
  const resFor = (i: LibraryItem) => resolvePreview({ channel: i.template.channel, catalog: catalogRaw, contents, templateId: i.template.template_id });

  return (
    <div className="space-y-3">
      {view === 'table' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-2.5 py-2.5">Prévia</th>
                  <th className="px-2.5 py-2.5">Template / peça</th>
                  <th className="px-2.5 py-2.5">Tags (fonte no título)</th>
                  <th className="px-2.5 py-2.5">Estado</th>
                  <th className="px-2.5 py-2.5">No período</th>
                  <th className="px-2.5 py-2.5 text-right">Usos · todo o histórico</th>
                  <th className="px-2.5 py-2.5 text-right">Versões</th>
                  <th className="px-2.5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const res = resFor(i);
                  return (
                    <tr key={i.template.template_id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/60">
                      <td className="px-2.5 py-2.5"><PreviewThumb res={res} w={46} h={58} title={i.template.template_id} assetName={i.assetNames[0]} onOpen={()=>setDetail(i)}/><span className="mt-1 block max-w-[64px] text-[9.5px] leading-tight text-slate-500" title={res.detail}>{res.label}</span></td>
                      <td className="max-w-[280px] px-2.5 py-2.5">
                        <TemplateIdChips id={i.template.template_id} />
                        <code className="mt-0.5 block truncate text-[10px] text-slate-500" title={i.template.template_id}>{i.template.template_id}</code>
                        {i.assetNames[0] && <span className="block truncate text-[10.5px] text-slate-700" title={i.assetNames.join(' · ')}>Peça: {i.assetNames[0]}{i.assetNames.length > 1 ? ` +${i.assetNames.length - 1}` : ''}</span>}
                      </td>
                      <td className="max-w-[300px] px-2.5 py-2.5"><TagRow tags={i.tags} /></td>
                      <td className="px-2.5 py-2.5"><StateChip state={i.state} /></td>
                      <td className="px-2.5 py-2.5"><PeriodChip item={i} />{i.compatibleOrphans.length > 0 && <span className="mt-1 block text-[10.5px] text-amber-800">{i.compatibleOrphans.length} disparo(s) sem template sugerem esta peça</span>}</td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{i.historyUses || '—'}{i.lastUse && <span className="block text-[10px] text-slate-400">último {i.lastUse.split('-').reverse().join('/')}</span>}</td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{i.versions.length || '—'}{i.currentVersion && <span className="block text-[10px] text-slate-400">1 atual</span>}</td>
                      <td className="px-2.5 py-2.5"><button type="button" onClick={() => setDetail(i)} className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-slate-300">Detalhes</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400"><Search size={16} />Nenhuma comunicação neste filtro.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((i) => (
            <article key={i.template.template_id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex justify-center border-b border-slate-100 bg-slate-50 px-4 pt-4"><div role="button" tabIndex={0} onClick={()=>setDetail(i)} onKeyDown={e=>{if(e.key==='Enter')setDetail(i);}}><ChannelPreview res={resFor(i)} width={260} height={210} title={i.template.template_id} assetName={i.assetNames[0]} zoomable={false}/></div></div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <TemplateIdChips id={i.template.template_id} />
                {i.assetNames[0] && <p className="truncate text-[11px] text-slate-700">Peça: {i.assetNames[0]}</p>}
                <div className="flex flex-wrap gap-1"><StateChip state={i.state} /><PeriodChip item={i} /></div>
                <TagRow tags={i.tags} skip={['canal']} max={6} />
                <button type="button" onClick={() => setDetail(i)} className="mt-auto rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Detalhes</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Pager page={current} pages={pages} total={items.length} unit={`template(s)${items.length !== total ? ` (de ${total})` : ''}`} onPage={onPage} />

    </div>
  );
};

export const LibraryDetail: React.FC<{ performance?:React.ReactNode; item: LibraryItem; res: ReturnType<typeof resolvePreview>; onClose: () => void; onOpenPerformance: (id: string) => void; onReviewCompatible: (id: string) => void }> = ({ performance, item, res, onClose, onOpenPerformance, onReviewCompatible }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose();if(e.key==='Tab'){const nodes=ref.current?.querySelectorAll<HTMLElement>('button,select,input,[tabindex="0"]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}} };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key);document.body.style.overflow=overflow; opener?.focus?.(); };
  }, [onClose]);
  const id = item.template.template_id;
  const periodRows = useMemo(() => [...item.periodExecutions].sort((a, b) => (b['Data de Disparo'] ?? '').localeCompare(a['Data de Disparo'] ?? '')), [item]);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Detalhes de ${id}`} onClick={(e) => e.stopPropagation()} className="grid max-h-[92vh] w-full max-w-[1600px] overflow-y-auto md:overflow-hidden rounded-2xl bg-white shadow-2xl outline-none md:grid-cols-[minmax(320px,40%)_1fr]">
        <div className="flex max-h-[40vh] justify-center overflow-auto md:max-h-none border-b border-slate-200 bg-slate-50 p-4 md:border-b-0 md:border-r"><ChannelPreview res={res} width={Math.min(480,typeof window==='undefined'?480:window.innerWidth-64)} height={650} zoomable={false} title={id} assetName={item.assetNames[0]} /></div>
        <div className="overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
            <div className="min-w-0"><TemplateIdChips id={id} size="md" /><code className="mt-1 block truncate text-[10px] text-slate-500">{id}</code></div>
            <button type="button" onClick={onClose} aria-label="Fechar detalhes" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><X size={16} /></button>
          </div>
          <div className="space-y-5 p-5 text-sm">
            <section>
              <div className="flex flex-wrap gap-1.5"><StateChip state={item.state} /><PeriodChip item={item} /></div>
              <p className="mt-2 text-xs text-slate-600">{item.state === 'pack_approved' ? 'Versões de conteúdo aprovadas na revisão do pack. Aprovação não comprova envio.' : item.state === 'catalog_active' ? 'Cadastro com peça no catálogo. Sem versão de pack aprovada; não há aprovação histórica inferida.' : item.state === 'draft' ? 'Rascunho do catálogo (ex.: pré-cadastro da governança). Não é aprovação.' : 'Estado registrado no catálogo.'}</p>
              {item.assetNames.length > 0 && <p className="mt-2 text-xs"><span className="text-slate-500">Nome original da peça (asset_name):</span> {item.assetNames.join(' · ')}</p>}
              {item.observedIds.length > 0 && <p className="mt-1 text-xs"><span className="text-slate-500">ID observado no link (af_sub3):</span> <code>{item.observedIds.join(' · ')}</code></p>}
            </section>
            {performance}
            <section>
              <h4 className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Tags e origem da classificação</h4>
              <ul className="grid gap-1 text-xs sm:grid-cols-2">{item.tags.map((t, k) => <li key={k} className="flex justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1"><span><b className="text-slate-500">{FACET_LABEL[t.key]}:</b> {t.value}</span><span className="text-[10.5px] text-slate-500">{t.source}</span></li>)}</ul>
            </section>
            <section>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500"><BarChart3 size={12} />Uso no período</h4>
              {periodRows.length ? (
                <>
                  <ul className="max-h-40 space-y-1 overflow-auto text-xs">{periodRows.map((r) => <li key={r.id} className="flex justify-between gap-2 rounded border border-slate-100 px-2 py-1"><span className="truncate" title={r['Activity name / Taxonomia']}><GitBranch size={10} className="mr-1 inline" />{r.jornada} · {r['Activity name / Taxonomia']}</span><span className="whitespace-nowrap text-slate-500">{r['Data de Disparo'] ? saoPauloDay(r['Data de Disparo']) : '—'}</span></li>)}</ul>

                </>
              ) : <p className="text-xs text-slate-600">Sem execução vinculada neste período. Sem base, taxas, score ou datas atribuídas.</p>}
              <p className="mt-2 text-xs text-slate-600">Usos vinculados em todo o histórico: <b>{item.historyUses}</b>{item.firstUse && <> · de {item.firstUse.split('-').reverse().join('/')} a {item.lastUse?.split('-').reverse().join('/')}</>}</p>
            </section>
            <section>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500"><Layers size={12} />Versões de conteúdo ({item.versions.length})</h4>
              {item.versions.length ? <div className="space-y-2">{item.versions.map((v) => (
                <div key={v.id} className={`rounded-lg border p-2 ${v.is_current ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200'}`}>
                  <p className="mb-1 text-[10.5px] text-slate-600">{v.is_current ? 'Versão atual escolhida' : 'Versão importada'} · desde {saoPauloDay(v.first_seen_at)} · <code>{v.content_hash.slice(0, 8)}</code></p>
                  {v.payload.body_text ? <MessagePreview content={v.payload} compact /> : <p className="text-[11px] text-slate-500">Versão sem corpo de texto ({v.payload.channel}).</p>}
                </div>
              ))}</div> : <p className="text-xs text-slate-600">Nenhuma versão de pack aprovada para este ID.</p>}
            </section>
            <section>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500"><Link2 size={12} />Disparos sem template compatíveis ({item.compatibleOrphans.length})</h4>
              {item.compatibleOrphans.length ? (
                <>
                  <ul className="space-y-1 text-xs">{item.compatibleOrphans.slice(0, 8).map((o) => <li key={o.uid} className="truncate rounded border border-slate-100 px-2 py-1" title={o.name}>{o.jornada} · {o.canalLabel} · {o.exec} exec.</li>)}</ul>
                  <button type="button" onClick={() => { onClose(); onReviewCompatible(id); }} className="mt-2 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-800">Revisar em “Disparos sem template”</button>
                  <p className="mt-1 text-[10.5px] text-slate-500">Nada é vinculado automaticamente.</p>
                </>
              ) : <p className="text-xs text-slate-600">O motor não sugere esta peça para nenhum disparo sem template do período.</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
