import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCheck, GitBranch, Link2, Search } from 'lucide-react';
import type { CatalogEntry, OrphanRow } from '../../../hooks/useReconciliation';
import type { CommunicationTemplate } from '../../../types/communication';
import type { TemplateContentIndex } from '../../../services/templateContentIndex';
import { resolvePreview, type PreviewResolution } from '../../../utils/communicationVisualResolution';
import { executionMetrics, executionMomentLabel, facetsFromRecords, templateMomentLabel, type ExecutionMetrics, type ScopeFacets } from '../../../utils/contentPerformanceModel';
import { batchEligibility, effectiveBatchSelection } from '../../../utils/executionLinkEligibility';
import { TemplateIdChips } from '../TemplateIdChips';
import { PreviewThumb } from '../previews/ContentPreview';
import { ChannelPreview } from './ChannelPreview';
import { BatchLinkModal, ExecutionLinkReviewModal } from './ExecutionLinkReviewModal';
import { Covered, Pager, TagRow, paginate, tagsFromFacets } from './contentUi';

export type UnlinkedSort = 'priority' | 'base' | 'executions' | 'recent' | 'moment';
export const UNLINKED_SORTS: { key: UnlinkedSort; label: string }[] = [
  { key: 'priority', label: 'Prioridade (sugestão)' },
  { key: 'base', label: 'Maior base' },
  { key: 'executions', label: 'Mais execuções' },
  { key: 'recent', label: 'Mais recentes' },
  { key: 'moment', label: 'Momento do disparo' },
];

/** Linha derivada (memo) de um grupo de execuções sem template. */
export interface UnlinkedItem {
  row: OrphanRow;
  metrics: ExecutionMetrics;
  facets: ScopeFacets;
  pieceMoment: string | null;
  execMoment: string;
  searchText: string;
}

const CONF_ORDER: Record<string, number> = { forte: 0, provavel: 1, fraca: 2, novo: 3 };
const CONF_LABEL: Record<string, string> = { forte: 'Sugestão forte', provavel: 'Provável', fraca: 'Fraca', novo: 'Sem sugestão' };
const CONF_STYLE: Record<string, string> = { forte: 'bg-emerald-50 text-emerald-700', provavel: 'bg-amber-50 text-amber-700', fraca: 'bg-slate-100 text-slate-600', novo: 'bg-sky-50 text-sky-700' };

export function toUnlinkedItem(row: OrphanRow): UnlinkedItem {
  const pieceMoment = templateMomentLabel(row.match?.tpl.id, row.segmentoLabel);
  const execMoment = executionMomentLabel(row.momentSuggestion);
  const facets = facetsFromRecords(row.executionRecords, [execMoment]);
  const asset = row.packEvidence?.proposal?.message.payload.asset_name ?? '';
  return {
    row, metrics: executionMetrics(row.executionRecords), facets, pieceMoment, execMoment,
    searchText: [row.name, row.jornada, asset, row.match?.tpl.id, ...(row.packEvidence?.ids ?? []), ...(row.packEvidence?.observedIds ?? [])].filter(Boolean).join(' '),
  };
}

export function sortUnlinked(items: UnlinkedItem[], sort: UnlinkedSort, dir: 1 | -1): UnlinkedItem[] {
  const val = (i: UnlinkedItem): number | null => {
    if (sort === 'base') return i.metrics.base.value;
    if (sort === 'executions') return i.metrics.executions;
    if (sort === 'recent') return i.metrics.latest ? Date.parse(`${i.metrics.latest}T00:00:00Z`) : null;
    if (sort === 'moment') return i.row.momentSuggestion.dispatch == null ? null : (i.row.momentSuggestion.week ?? 0) * 1000 + i.row.momentSuggestion.dispatch;
    return null;
  };
  return [...items].sort((a, b) => {
    if (sort === 'priority') return (CONF_ORDER[a.row.confidence] - CONF_ORDER[b.row.confidence]) * (dir === -1 ? 1 : -1) || (b.metrics.base.value ?? -1) - (a.metrics.base.value ?? -1);
    const av = val(a), bv = val(b);
    if (av == null && bv == null) return a.row.name.localeCompare(b.row.name);
    if (av == null) return 1; // ausência sempre ao final, nos dois sentidos
    if (bv == null) return -1;
    return (av - bv) * dir || a.row.name.localeCompare(b.row.name);
  });
}

interface Props {
  items: UnlinkedItem[];
  total: number;
  view: 'gallery' | 'table';
  catalog: CatalogEntry[];
  catalogRaw: CommunicationTemplate[];
  contents: TemplateContentIndex | null;
  page: number;
  onPage: (p: number) => void;
  onChanged: () => void;
  busy: boolean;
}

function previewFor(row: OrphanRow, catalogRaw: CommunicationTemplate[], contents: TemplateContentIndex | null): PreviewResolution {
  // Peça deste uso (pack) primeiro; depois o ID observado no link; por fim o candidato do motor, rotulado.
  return resolvePreview({
    channel: row.canalLabel, catalog: catalogRaw, contents,
    packContent: row.packEvidence?.proposal?.message.payload.content ?? null,
    templateId: row.packEvidence?.observedIds.length === 1 ? row.packEvidence.observedIds[0] : null,
    candidateId: row.match?.tpl.id ?? null,
  });
}

export const UnlinkedExecutionsPanel: React.FC<Props> = ({ items, total, view, catalog, catalogRaw, contents, page, onPage, onChanged, busy }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState<OrphanRow | null>(null);
  const [batch, setBatch] = useState<OrphanRow[] | null>(null);

  // Filtros/atualização mudam o conjunto visível: a seleção nunca sobrevive fora dele.
  useEffect(() => { setSelected((cur) => { const keep = new Set(items.map((i) => i.row.uid)); const next = new Set([...cur].filter((u) => keep.has(u))); return next.size === cur.size ? cur : next; }); }, [items]);

  const visibleRows = useMemo(() => items.map((i) => i.row), [items]);
  const eligibleVisible = useMemo(() => visibleRows.filter((o) => batchEligibility(o, catalog).eligible), [visibleRows, catalog]);
  const effective = useMemo(() => effectiveBatchSelection(visibleRows, selected, catalog), [visibleRows, selected, catalog]);
  const { rows, pages, page: current } = paginate(items, page);
  const toggle = (uid: string) => setSelected((cur) => { const n = new Set(cur); if (n.has(uid)) n.delete(uid); else n.add(uid); return n; });
  const eligibleExec = eligibleVisible.reduce((n, o) => n + o.executionRecords.length, 0);

  if (total === 0) return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"><CheckCheck size={20} /><span><b>Nenhuma execução sem template</b> no período e nos filtros globais.</span></div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm" aria-label="Vínculo em lote">
        <span className="font-semibold text-slate-700">Lote</span>
        <span className="text-slate-500">Elegíveis nos filtros: <b className="text-slate-800">{eligibleVisible.length}</b> grupo(s) · <b className="text-slate-800">{eligibleExec}</b> execução(ões)</span>
        <button type="button" disabled={!eligibleVisible.length || busy} onClick={() => setSelected(new Set(eligibleVisible.map((o) => o.uid)))} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Selecionar elegíveis</button>
        {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg px-2 py-1.5 font-semibold text-slate-500 hover:text-slate-800">Limpar</button>}
        <button type="button" disabled={!effective.groups.length || busy} onClick={() => setBatch(effective.groups)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white shadow-sm hover:brightness-105 disabled:opacity-40">
          <CheckCheck size={14} />Vincular selecionados ({effective.groups.length} grupo(s) · {effective.executions} exec.)
        </button>
        <p className="basis-full text-[10.5px] text-slate-500">Só entram grupos com candidato único, contexto completo e sem conflitos. Demais: “Revisar vínculo”, um por vez.</p>
      </div>

      {view === 'table' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-8 px-2.5 py-2.5"><span className="sr-only">Selecionar</span></th>
                  <th className="px-2.5 py-2.5">Prévia candidata</th>
                  <th className="px-2.5 py-2.5">Execuções (contexto)</th>
                  <th className="px-2.5 py-2.5">Momento</th>
                  <th className="px-2.5 py-2.5 text-right">Base</th>
                  <th className="px-2.5 py-2.5 text-right">Exec.</th>
                  <th className="px-2.5 py-2.5 text-right">Abert.</th>
                  <th className="px-2.5 py-2.5 text-right">Cliques</th>
                  <th className="px-2.5 py-2.5 text-right">Cartões</th>
                  <th className="px-2.5 py-2.5">Sugestão do motor</th>
                  <th className="px-2.5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const o = i.row;
                  const elig = batchEligibility(o, catalog);
                  const res = previewFor(o, catalogRaw, contents);
                  const conflicts = [...(o.packEvidence?.conflicts ?? []), ...(o.parsed.divergencias ?? [])];
                  return (
                    <tr key={o.uid} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/60">
                      <td className="px-2.5 py-2.5">
                        <input type="checkbox" aria-label={`Selecionar ${o.name} para lote`} checked={selected.has(o.uid)} disabled={!elig.eligible || busy} onChange={() => toggle(o.uid)} title={elig.eligible ? 'Elegível para lote' : elig.reasons.join(' ')} />
                      </td>
                      <td className="px-2.5 py-2.5"><PreviewThumb res={res} w={46} h={58} title={o.match?.tpl.id ?? o.name} assetName={o.packEvidence?.proposal?.message.payload.asset_name} /><span className="mt-1 block max-w-[64px] text-[9.5px] leading-tight text-slate-500" title={res.detail}>{res.label}</span></td>
                      <td className="max-w-[360px] px-2.5 py-2.5">
                        <TagRow tags={tagsFromFacets(i.facets, 'Activities')} skip={['momento']} />
                        <code className="mt-1 block truncate font-mono text-[10.5px] text-slate-700" title={o.name}>{o.name}</code>
                        <span className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-slate-500"><GitBranch size={10} />{o.jornada}</span>
                        {o.packEvidence?.proposal?.message.payload.asset_name && <span className="block truncate text-[10.5px] text-slate-600" title="Nome da peça no pack (asset_name)">Peça: {o.packEvidence.proposal.message.payload.asset_name}</span>}
                      </td>
                      <td className="px-2.5 py-2.5 text-[11px]">
                        <span className="block font-semibold text-slate-800" title="Momento da execução (curadoria, Activity Name)">Disparo: {i.execMoment}</span>
                        <span className="block text-slate-500" title="Momento declarado no ID da peça sugerida">Peça: {i.pieceMoment ?? '—'}</span>
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums"><Covered v={i.metrics.base} k /></td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums text-slate-700">{i.metrics.executions}<span className="block text-[10px] text-slate-400">{i.metrics.latest?.slice(5).split('-').reverse().join('/')}</span></td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums"><Covered v={i.metrics.aberturas} k /></td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums"><Covered v={i.metrics.cliques} /></td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums text-cyan-700"><Covered v={i.metrics.cartoes} strong /></td>
                      <td className="max-w-[230px] px-2.5 py-2.5">
                        {o.match ? <TemplateIdChips id={o.match.tpl.id} /> : <span className="text-[11px] italic text-slate-500">Nenhum template combina</span>}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${CONF_STYLE[o.confidence]}`}>{o.packEvidence?.source === 'pack' ? 'ID no pack' : o.packEvidence?.source === 'history' ? 'Reuso histórico' : CONF_LABEL[o.confidence]}</span>
                          {conflicts.length > 0 && <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800" title={conflicts.join('\n')}><AlertTriangle size={10} />{conflicts.length} conflito(s)</span>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10.5px] text-slate-500" title={o.match?.reasons.map((r) => `${r.label}: ${r.val}`).join('\n')}>{(o.packEvidence?.source !== 'none' ? o.packEvidence?.reasons[0] : undefined) ?? o.match?.reasons.filter((r) => r.ok).map((r) => r.label).join(' · ') ?? ''}</p>
                      </td>
                      <td className="px-2.5 py-2.5"><button type="button" disabled={busy} onClick={() => setReviewing(o)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-cyan-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-cyan-800 disabled:opacity-50"><Link2 size={12} />Revisar vínculo</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400"><Search size={16} />Nenhum grupo neste filtro.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((i) => {
            const o = i.row;
            const res = previewFor(o, catalogRaw, contents);
            return (
              <article key={o.uid} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex justify-center border-b border-slate-100 bg-slate-50 px-4 pt-4"><ChannelPreview res={res} width={260} height={210} title={o.match?.tpl.id ?? o.name} assetName={o.packEvidence?.proposal?.message.payload.asset_name} /></div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <TagRow tags={tagsFromFacets(i.facets, 'Activities')} skip={['momento']} max={6} />
                  <code className="truncate font-mono text-[10.5px] text-slate-700" title={o.name}>{o.name}</code>
                  <p className="text-[11px] text-slate-600">Disparo: <b>{i.execMoment}</b> · Peça: {i.pieceMoment ?? '—'}</p>
                  <p className="text-[11px] text-slate-600"><Covered v={i.metrics.base} k /> base · {i.metrics.executions} exec. · <Covered v={i.metrics.cartoes} /> cartões</p>
                  <div className="flex items-center gap-1.5">{o.match ? <TemplateIdChips id={o.match.tpl.id} /> : <span className="text-[11px] italic text-slate-500">Sem sugestão</span>}</div>
                  <button type="button" disabled={busy} onClick={() => setReviewing(o)} className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50"><Link2 size={13} />Revisar vínculo</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Pager page={current} pages={pages} total={items.length} unit={`grupo(s) de execuções${items.length !== total ? ` (de ${total})` : ''}`} onPage={onPage} />

      {reviewing && <ExecutionLinkReviewModal row={reviewing} catalog={catalog} catalogRaw={catalogRaw} contents={contents} onClose={() => setReviewing(null)} onLinked={onChanged} />}
      {batch && <BatchLinkModal groups={batch} catalog={catalog} onClose={() => { setBatch(null); setSelected(new Set()); }} onApplied={onChanged} />}
    </div>
  );
};
