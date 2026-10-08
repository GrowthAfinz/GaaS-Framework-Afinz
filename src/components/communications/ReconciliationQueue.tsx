import {resolveCommunicationVisual} from '../../utils/communicationVisualResolution';
import {CommunicationVisual} from './previews/CommunicationVisual';
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronRight, Link2, Plus, Check, CheckCheck, GitBranch, Sparkles, CalendarClock, AlertTriangle, X, ArrowDownWideNarrow, Repeat, Clock, type LucideIcon } from 'lucide-react';
import type { CatalogEntry, OrphanRow } from '../../hooks/useReconciliation';
import { linkReviewedExecutions, describeError } from '../../services/communicationService';
import { optLabel, type Confidence, type DimId } from '../../utils/taxonomy';
import { TemplateSuggestionModal } from './TemplateSuggestionModal';
import { TemplateIdChips } from './TemplateIdChips';
import { ActivityMomentModal } from './ActivityMomentModal';
import { Segmented } from './ui/commsUi';

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));
const CONF_ORDER: Record<Confidence, number> = { forte: 0, provavel: 1, fraca: 2, novo: 3 };
const CONF_STYLE: Record<Confidence, string> = {
  forte: 'bg-emerald-50 text-emerald-700',
  provavel: 'bg-amber-50 text-amber-700',
  fraca: 'bg-slate-100 text-slate-500',
  novo: 'bg-sky-50 text-sky-700',
};
const CONF_LABEL: Record<Confidence, string> = { forte: 'match forte', provavel: 'provável', fraca: 'fraca', novo: 'sem template' };

interface Props {
  refreshing?: boolean;
  packInbox?: React.ReactNode;
  packCount?: number;
  orphans: OrphanRow[];
  catalog: CatalogEntry[];
  /** Filtro de canal vindo do header de cobertura (label canônico, ex.: 'E-mail'). */
  channelFilter?: string | null;
  onClearChannelFilter?: () => void;
  onCreate: (seed: OrphanRow) => void;
  onChanged: () => void;
}

type SortBy = 'padrao' | 'base' | 'exec' | 'data';
const SORT_OPTIONS: [SortBy, string, LucideIcon][] = [
  ['base', 'Volume de base', ArrowDownWideNarrow],
  ['exec', 'Execuções', Repeat],
  ['data', 'Mais recentes', Clock],
];

export const ReconciliationQueue: React.FC<Props> = ({ refreshing=false, packInbox, packCount=0, orphans, catalog, channelFilter, onClearChannelFilter, onCreate, onChanged }) => {
  const [source,setSource] = useState<'packs'|'executions'>('packs');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'forte' | 'novo'>('todos');
  const [sortBy, setSortBy] = useState<SortBy>('padrao');
  const [canalSel, setCanalSel] = useState('todos');
  const [segmentoSel, setSegmentoSel] = useState('todos');
  const [subgrupoSel, setSubgrupoSel] = useState('todos');
  const [semanaSel, setSemanaSel] = useState('todos');
  const [disparoSel, setDisparoSel] = useState('todos');
  const [pendingLinks,setPendingLinks]=useState<OrphanRow[]>([]);
  const [linkNote,setLinkNote]=useState('');
  useEffect(()=>{setPendingLinks([]);setLinkNote('');setSuggesting(null);setEditingMoment(null);},[orphans,refreshing]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<OrphanRow | null>(null);
  const [editingMoment, setEditingMoment] = useState<OrphanRow | null>(null);

  const scoped = useMemo(
    () => (channelFilter ? orphans.filter((o) => o.canalLabel === channelFilter) : orphans),
    [orphans, channelFilter]
  );

  const canalOptions = useMemo(() => Array.from(new Set(scoped.map((o) => o.canalLabel))).sort(), [scoped]);
  const segmentoOptions = useMemo(
    () => Array.from(new Set(scoped.map((o) => o.segmentoLabel).filter((v) => v !== '—'))).sort(),
    [scoped]
  );
  const subgrupoOptions = useMemo(() => Array.from(new Set(scoped.map((o) => o.subgrupoLabel).filter((v) => v !== '—'))).sort(), [scoped]);
  const semanaOptions = useMemo(() => Array.from(new Set(scoped.map((o) => o.momentSuggestion.week).filter((v): v is number => v != null))).sort((a, b) => a - b), [scoped]);
  const disparoOptions = useMemo(() => Array.from(new Set(scoped.map((o) => o.momentSuggestion.dispatch).filter((v): v is number => v != null))).sort((a, b) => a - b), [scoped]);

  const list = useMemo(() => {
    let l = scoped.filter((o) => {
      if (canalSel !== 'todos' && o.canalLabel !== canalSel) return false;
      if (segmentoSel !== 'todos' && o.segmentoLabel !== segmentoSel) return false;
      if (subgrupoSel !== 'todos' && o.subgrupoLabel !== subgrupoSel) return false;
      if (semanaSel !== 'todos' && String(o.momentSuggestion.week ?? '') !== semanaSel) return false;
      if (disparoSel !== 'todos' && String(o.momentSuggestion.dispatch ?? '') !== disparoSel) return false;
      return true;
    });
    if (filter === 'forte') l = l.filter((o) => o.confidence === 'forte');
    if (filter === 'novo') l = l.filter((o) => o.confidence === 'novo');
    l = [...l].sort((a, b) => {
      if (sortBy === 'base') return b.base - a.base;
      if (sortBy === 'exec') return b.exec - a.exec;
      if (sortBy === 'data') return (b.latestDate ?? '').localeCompare(a.latestDate ?? '');
      return CONF_ORDER[a.confidence] - CONF_ORDER[b.confidence] || b.base - a.base;
    });
    return l;
  }, [scoped, filter, sortBy, canalSel, segmentoSel, subgrupoSel, semanaSel, disparoSel]);

  const strong = useMemo(() => scoped.filter((o) => o.confidence === 'forte'), [scoped]);
  // Divergentes (jornada × coluna) saem do vínculo em massa: exigem revisão individual.
  const bulkStrong = useMemo(
    () => list.filter((o) => o.confidence==='forte' && o.match?.tpl.inCurrentFilter && (!o.parsed.divergencias?.length||o.packEvidence?.source==='pack') && !o.packEvidence?.conflicts.length),
    [list]
  );

  const link = (o:OrphanRow)=>{if(o.match&&!refreshing){setLinkNote('');setPendingLinks([o]);}};
  const linkMany = ()=>{setLinkNote('');if(!refreshing)setPendingLinks(bulkStrong);};
  const confirmLinks=async()=>{
    setBusy('bulk');setError(null);
    try {
      for(const o of pendingLinks)if(o.match&&!refreshing)await linkReviewedExecutions(o,o.match.tpl.id,linkNote);
      setPendingLinks([]);onChanged();
    } catch(err){setError(describeError(err));onChanged();}
    finally{setBusy(null);}
  };

  const filters: [typeof filter, string, number][] = [
    ['todos', 'Todos', scoped.length],
    ['forte', 'Match forte', strong.length],
    ['novo', 'Sem template', scoped.filter((o) => o.confidence === 'novo').length],
  ];

  const sources=packInbox?<div className="mb-4 flex flex-wrap items-center gap-3"><Segmented<'packs'|'executions'> label="Origem das comunicações" value={source} onChange={setSource} options={[{id:'packs',label:'Comunicações dos pacotes SFMC',count:packCount},{id:'executions',label:'Disparos sem template',count:orphans.length}]}/><span className="text-sm text-slate-600">{source==='packs'?'Mensagens lidas dos pacotes, com ID proposto pela análise.':'Disparos do Framework no período que ainda não têm template ligado.'}</span></div>:null;
  if(packInbox&&source==='packs')return <div>{sources}{packInbox}</div>;
  return (
    <div>
      {sources}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map(([id, label, n]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${filter === id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              {label}<span className="text-xs font-bold opacity-70">{n}</span>
            </button>
          ))}
          {channelFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
              Canal: {channelFilter}
              <button onClick={onClearChannelFilter} title="Remover filtro de canal" className="rounded-full p-0.5 text-cyan-500 hover:bg-cyan-100 hover:text-cyan-800">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
        {bulkStrong.length > 0 && (
          <button onClick={linkMany} disabled={!!busy||refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-105 disabled:opacity-60">
            {busy === 'bulk' ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            Vincular {bulkStrong.length} matches fortes
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-0.5 font-semibold uppercase tracking-wide text-slate-600">Ordenar</span>
        {SORT_OPTIONS.map(([id, label, Icon]) => {
          const active = sortBy === id;
          return (
            <button
              key={id}
              onClick={() => setSortBy((s) => (s === id ? 'padrao' : id))}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${active ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
            >
              <Icon size={12} /> {label}
            </button>
          );
        })}
        <span className="ml-3 mr-0.5 font-semibold uppercase tracking-wide text-slate-600">Filtrar</span>
        <select value={canalSel} onChange={(e) => setCanalSel(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:border-slate-300">
          <option value="todos">Canal: todos</option>
          {canalOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={segmentoSel} onChange={(e) => setSegmentoSel(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:border-slate-300">
          <option value="todos">Segmento: todos</option>
          {segmentoOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={subgrupoSel} onChange={(e) => setSubgrupoSel(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:border-slate-300">
          <option value="todos">Subgrupo: todos</option>
          {subgrupoOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={semanaSel} onChange={(e) => setSemanaSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:border-slate-300">
          <option value="todos">Semana: todas</option>
          {semanaOptions.map((week) => <option key={week} value={week}>Semana {week}</option>)}
        </select>
        <select value={disparoSel} onChange={(e) => setDisparoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600 hover:border-slate-300">
          <option value="todos">Disparo: todos</option>
          {disparoOptions.map((dispatch) => <option key={dispatch} value={dispatch}>Disparo {dispatch}</option>)}
        </select>
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {scoped.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          <CheckCheck size={22} /> <div><b>Fila zerada.</b> {channelFilter ? `Nenhum órfão de ${channelFilter} no recorte.` : 'Todos os disparos do recorte estão vinculados a um template.'}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((o) => (
            <OrphanCard key={o.uid} catalog={catalog} o={o} open={expanded === o.uid}
              onToggle={() => setExpanded((e) => e === o.uid ? null : o.uid)}
              onLink={() => link(o)} onCreate={() => {if(!refreshing)onCreate(o);}} onSuggest={() => {if(!refreshing)setSuggesting(o);}}
              onEditMoment={() => {if(!refreshing)setEditingMoment(o);}} busy={refreshing || !!busy} />
          ))}
        </div>
      )}
      {suggesting && (
        <TemplateSuggestionModal
          row={suggesting}
          catalog={catalog}
          currentTemplateId={suggesting.match?.tpl.id ?? null}
          onClose={() => setSuggesting(null)}
          onChanged={onChanged}
        />
      )}
      {pendingLinks.length>0&&<div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" aria-label="Revisar vínculo de execuções" className="w-full max-w-xl rounded-xl bg-white p-5"><h3 className="font-semibold">Vincular execuções revisadas</h3><p className="my-3 text-sm">{pendingLinks.reduce((n,o)=>n+o.executionRecords.length,0)} execuções · {pendingLinks[0].period.start} a {pendingLinks[0].period.end}. Confirme que a peça corresponde ao uso nesse período. Aprovar conteúdo no pack não comprova o envio histórico.</p><div className="max-h-48 overflow-auto text-xs">{pendingLinks.map(o=><p key={o.uid} className="mb-2"><b>{o.match?.tpl.id}</b> · {o.jornada} · {o.canalLabel} · {o.exec} execuções</p>)}</div><label className="mt-3 block text-sm">Evidência da confirmação<input aria-label="Evidência do vínculo" value={linkNote} onChange={e=>setLinkNote(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="Como confirmou a peça e o período?"/></label><div className="mt-4 flex justify-end gap-2"><button disabled={!!busy||refreshing} onClick={()=>setPendingLinks([])} className="rounded border px-3 py-2">Cancelar</button><button disabled={!!busy||linkNote.trim().length<3} onClick={confirmLinks} className="rounded bg-cyan-700 px-3 py-2 text-white disabled:opacity-50">Confirmar vínculos</button></div></div></div>}
      {editingMoment && (
        <ActivityMomentModal
          row={editingMoment}
          onClose={() => setEditingMoment(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
};

const OrphanCard: React.FC<{ catalog:CatalogEntry[]; o: OrphanRow; open: boolean; onToggle: () => void; onLink: () => void; onCreate: () => void; onSuggest: () => void; onEditMoment: () => void; busy: boolean }> = ({ catalog, o, open, onToggle, onLink, onCreate, onSuggest, onEditMoment, busy }) => {
  const m = o.match;
  const displayTemplateId = m ? m.tpl.id : '';
  const canLink = m && !o.momentConflict && o.confidence !== 'fraca' && o.confidence !== 'novo';
  return (
    <div className={`overflow-hidden rounded-xl border bg-white transition-shadow ${open ? 'border-cyan-400 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex cursor-pointer items-center gap-3 px-4 py-3" onClick={onToggle}>
        <ChevronRight size={15} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-90 text-cyan-600' : ''}`} />
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-500">{o.canalLabel}</span>
        <div onClick={e=>e.stopPropagation()}>{o.packEvidence?.proposal&&<CommunicationVisual assetName={o.packEvidence.proposal.message.payload.asset_name} observedId={o.packEvidence.proposal.observed_template_id} content={o.packEvidence.proposal.message.payload.content} template={resolveCommunicationVisual(catalog.map(t=>t.raw),o.canalLabel,o.packEvidence.proposal.observed_template_id,o.packEvidence.proposal.proposed_template_id).template} sourceLabel={resolveCommunicationVisual(catalog.map(t=>t.raw),o.canalLabel,o.packEvidence.proposal.observed_template_id,o.packEvidence.proposal.proposed_template_id).sourceLabel}/>}</div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <code className="block max-w-[420px] truncate font-mono text-xs font-semibold text-slate-800 xl:max-w-[560px]">{o.name}</code>
            <button
              onClick={(e) => { e.stopPropagation(); onEditMoment(); }}
              title="Editar sugestão de semana/disparo deste activity_name"
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm transition-colors ${
                o.momentSuggestion.source === 'manual'
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                  : 'border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50'
              }`}
            >
              <CalendarClock size={11} />
              {o.momentSuggestion.label}
            </button>
            {!!o.parsed.divergencias?.length && (
              <span
                title={`Jornada e colunas divergem; revisar fontes:\n${o.parsed.divergencias.join('\n')}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"
              >
                <AlertTriangle size={11} /> divergência
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-600"><GitBranch size={11} /> {o.jornada}</div>
          {o.packEvidence?.proposal?.message.payload.asset_name&&<p className="mt-1 truncate text-xs text-slate-700" title={o.packEvidence.proposal.message.payload.asset_name}>{o.packEvidence.proposal.message.payload.asset_name}</p>}
          <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-600"><span>{o.segmentoLabel}</span>{/menor/i.test(o.name)&&<span className="rounded bg-violet-50 px-2 text-violet-800">Menor · reuso de Repescagem</span>}{/maior/i.test(o.name)&&<span>· Maior</span>}<span>· {o.subgrupoLabel}</span>{o.packEvidence?.source!=='none'&&<span className="rounded bg-cyan-50 px-2 text-cyan-800">{o.packEvidence?.source==='pack'?'ID no pack':`Reuso histórico · ${o.packEvidence?.reusedJourneys} jornadas`}</span>}</div>
        </div>
        <div className="hidden shrink-0 gap-3.5 text-xs tabular-nums text-slate-500 sm:flex">
          <span><b className="text-slate-800">{fmtK(o.base)}</b> base</span>
          <span><b className="text-slate-800">{o.exec}</b> exec</span>
          <span className="text-slate-600">{o.latestDate?.slice(0, 10)}</span>
        </div>
        <div className="hidden w-[300px] shrink-0 md:block">
          {m ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <TemplateIdChips id={displayTemplateId} className="min-w-0 flex-1" />
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${CONF_STYLE[o.confidence]}`} title={o.packEvidence?.source==='pack'?'Correspondência configurada no pack; confirmar o uso histórico':o.packEvidence?.source==='history'?'Reuso histórico sugerido; exige revisão':`Score de match: ${m.score}/100 (${CONF_LABEL[o.confidence]})`}>
                {o.packEvidence?.source==='pack'?'ID no pack':o.packEvidence?.source==='history'?'Reuso sugerido':o.confidence === 'novo' ? CONF_LABEL[o.confidence] : `${m.score}${o.confidence === 'fraca' ? ' · fraca' : ''}`}
              </span>
              {!m.tpl.hasAsset && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">sem peça</span>}
              {!m.tpl.inCurrentFilter && <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-bold text-cyan-700">fora dos filtros</span>}
            </div>
          ) : o.momentConflict ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700" title="Existem candidatos parecidos, mas nenhum com a semana/disparo curada.">
              <AlertTriangle size={10} /> sem template desse momento
            </span>
          ) : (
            <span className="text-xs italic text-slate-600">nenhum template combina</span>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={onSuggest}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50">
            <Sparkles size={13} /> Sugestões
          </button>
          {canLink ? (
            <button onClick={onLink} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-60">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />} Vincular
            </button>
          ) : o.momentConflict ? (
            <button onClick={onSuggest}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-400">
              <AlertTriangle size={13} /> Revisar
            </button>
          ) : (
            <button onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
              <Plus size={13} /> Criar template
            </button>
          )}
        </div>
      </div>

      {open && o.packEvidence && <div className="border-t bg-slate-50 px-4 py-3 text-xs"><p>IDs candidatos: {o.packEvidence.ids.join(' · ')||'Sem ID governado'}</p>{o.packEvidence.conflicts.map(c=><p key={c} className="mt-1 text-amber-800">{c}</p>)}</div>}
      {open && (
        <div className="grid gap-5 border-t border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Por que essa sugestão</p>
            {m ? (
              <div className="flex flex-wrap gap-1.5">
                {o.reuseSuggestion && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                    (reuso) {o.reuseSuggestion.label}: uso {o.reuseSuggestion.usageSeq} vinculado na peça {o.reuseSuggestion.targetSeq}
                  </span>
                )}
                {!m.tpl.hasAsset && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    Template sem peca: pode vincular agora e subir o asset depois
                  </span>
                )}
                {!m.tpl.inCurrentFilter && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                    Template encontrado no catalogo completo, fora dos filtros atuais
                  </span>
                )}
                {o.packEvidence?.observedIds.map(id=><span key={id} className="rounded bg-slate-100 px-2 py-1 text-xs">ID observado: {id}</span>)}
                {o.packEvidence?.conflicts.map(c=><span key={c} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{c}</span>)}
                {m.reasons.map((r, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${r.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {r.ok ? <Check size={11} /> : null}<span className="opacity-70">{r.label}:</span> {r.val}
                  </span>
                ))}
              </div>
            ) : <span className="text-xs italic text-slate-600">O parser não achou template com canal e segmento compatíveis. Crie um novo a partir deste disparo.</span>}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Anatomia do activity_name</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['Público', 'publico'], ['Canal', 'canal'], ['Campanha', 'campanha'], ['Segmento', 'segmento'], ['Variante', 'variante'], ['Disparo', 'seq']] as [string, string][]).map(([label, key]) => {
                const v = key === 'seq' ? o.parsed.seq : o.parsed[key as DimId];
                const display = key === 'seq' ? (v || '—') : (v ? optLabel(key as DimId, v) : '—');
                return (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    <span className="block text-xs font-bold uppercase text-slate-600">{label}</span>
                    <span className={`mt-0.5 block text-xs font-bold ${v ? 'text-slate-800' : 'italic text-slate-500'}`}>{v ? display : 'n/i'}</span>
                  </div>
                );
              })}
            </div>
            {o.suggestedId && <p className="mt-2 text-xs text-slate-500">ID canônico sugerido: <code className="font-bold text-cyan-700">{o.suggestedId}</code></p>}
            {!!o.parsed.divergencias?.length && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-700"><AlertTriangle size={11} /> Divergência jornada × coluna</p>
                <ul className="mt-1 space-y-0.5">
                  {o.parsed.divergencias.map((d, i) => (
                    <li key={i} className="text-xs text-amber-800">{d}</li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-amber-600">Sugestão corrigida pela jornada. Revise o dado da coluna na origem.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
