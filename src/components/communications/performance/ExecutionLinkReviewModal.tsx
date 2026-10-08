import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, GitBranch, Link2, Loader2, Search, X } from 'lucide-react';
import type { CatalogEntry, OrphanRow } from '../../../hooks/useReconciliation';
import type { CommunicationTemplate } from '../../../types/communication';
import type { TemplateContentIndex } from '../../../services/templateContentIndex';
import { describeError, linkReviewedExecutions } from '../../../services/communicationService';
import { resolvePreview } from '../../../utils/communicationVisualResolution';
import { APPROVAL_LABEL, approvalState, executionMetrics, executionMomentLabel, momentsDiffer, templateMomentLabel } from '../../../utils/contentPerformanceModel';
import { applyBatchLinks, batchEligibility, candidateTemplateIds, type BatchOutcome } from '../../../utils/executionLinkEligibility';
import { saoPauloDay } from '../../../utils/saoPauloPeriod';
import { canalToId } from '../../../utils/taxonomy';
import { rankTemplate } from '../TemplateSuggestionModal';
import { TemplateIdChips } from '../TemplateIdChips';
import { PreviewThumb } from '../previews/ContentPreview';

/** Diálogo acessível: foco inicial, Escape (quando livre) e devolução do foco ao gatilho. */
function useDialog(onClose: () => void, locked: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(locked); lockedRef.current = locked;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lockedRef.current && !document.querySelector('[aria-label^="Prévia"][role="dialog"]')) onClose(); };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key); opener?.focus?.(); };
  }, [onClose]);
  return ref;
}

const short = (id: string) => id.slice(0, 8);

interface ReviewProps {
  row: OrphanRow;
  catalog: CatalogEntry[];
  catalogRaw: CommunicationTemplate[];
  contents: TemplateContentIndex | null;
  onClose: () => void;
  onLinked: () => void;
}

/**
 * Revisão de vínculo de UM grupo de execuções sem template. Mostra IDs, jornada, canal, período,
 * template escolhido e evidências; permite trocar o template; exige confirmação concreta.
 * Aplica pelo RPC link_communication_executions (somente os IDs revisados, snapshot contra concorrência).
 * Não escolhe nem altera versão atual de conteúdo.
 */
export const ExecutionLinkReviewModal: React.FC<ReviewProps> = ({ row, catalog, catalogRaw, contents, onClose, onLinked }) => {
  const candidates = useMemo(() => candidateTemplateIds(row), [row]);
  const [chosen, setChosen] = useState<string | null>(candidates.length === 1 ? candidates[0] : null);
  const [query, setQuery] = useState('');
  const [evidence, setEvidence] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useDialog(onClose, busy);

  useEffect(() => { setChecked(false); }, [chosen]);
  const sameChannel = useMemo(() => catalog.filter((t) => canalToId(t.channel) === canalToId(row.canalLabel)), [catalog, row.canalLabel]);
  const others = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sameChannel.filter((t) => !candidates.includes(t.id) && (t.id.toLowerCase().includes(q) || (t.raw.title ?? '').toLowerCase().includes(q)))
      .map((t) => rankTemplate(row.parsed, t, null, row.reuseSuggestion)).sort((a, b) => b.score - a.score || a.tpl.id.localeCompare(b.tpl.id)).slice(0, 12);
  }, [query, sameChannel, candidates, row]);

  const metrics = executionMetrics(row.executionRecords);
  const chosenTpl = chosen ? catalog.find((t) => t.id === chosen) : undefined;
  const channelOk = !!chosenTpl && canalToId(chosenTpl.channel) === canalToId(row.canalLabel);
  const packContent = row.packEvidence?.proposal?.message.payload.content ?? null;
  const assetName = row.packEvidence?.proposal?.message.payload.asset_name ?? null;
  const packRes = packContent ? resolvePreview({ channel: row.canalLabel, catalog: catalogRaw, contents, packContent, templateId: row.packEvidence?.observedIds[0] ?? null }) : null;
  const chosenRes = chosen ? resolvePreview({ channel: row.canalLabel, catalog: catalogRaw, contents, candidateId: chosen }) : null;
  const pieceMoment = templateMomentLabel(chosen, row.segmentoLabel);
  const execMoment = executionMomentLabel(row.momentSuggestion);
  const differ = momentsDiffer(row.momentSuggestion, chosen);
  const state = chosenTpl ? approvalState(chosenTpl.raw, contents?.get(chosenTpl.id) ?? []) : null;
  const canApply = !!chosen && channelOk && checked && evidence.trim().length >= 3 && !busy;

  const apply = async () => {
    if (!canApply || !chosen) return;
    setBusy(true); setError(null);
    try {
      await linkReviewedExecutions(row, chosen, evidence.trim());
      onLinked();
      onClose();
    } catch (err) { setError(describeError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-3" onClick={() => { if (!busy) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="link-review-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Revisar vínculo</p>
            <h3 id="link-review-title" className="mt-0.5 truncate font-mono text-sm font-bold text-slate-900" title={row.name}>{row.name}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1"><GitBranch size={12} />{row.jornada}</span>
              <span className="rounded bg-slate-100 px-1.5 font-semibold">{row.canalLabel}</span>
              <span>Período: <b>{row.period.start}</b> a <b>{row.period.end}</b> (São Paulo)</span>
              <span>{metrics.executions} execução(ões) · momento do disparo: <b>{execMoment}</b></span>
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar revisão" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><X size={16} /></button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_1.1fr]">
          <section className="border-b border-slate-100 p-5 md:border-b-0 md:border-r" aria-label="Execuções revisadas">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Execuções que serão vinculadas</h4>
            <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-2 py-1.5">ID</th><th className="px-2 py-1.5">Data</th><th className="px-2 py-1.5">Segmento · subgrupo</th><th className="px-2 py-1.5 text-right">Base</th></tr></thead>
                <tbody>{row.executionRecords.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100"><td className="px-2 py-1.5 font-mono" title={r.id}>{short(r.id)}</td><td className="px-2 py-1.5">{r['Data de Disparo'] ? saoPauloDay(r['Data de Disparo']) : '—'}</td><td className="px-2 py-1.5">{r.Segmento ?? '—'} · {r.Subgrupos ?? '—'}</td><td className="px-2 py-1.5 text-right tabular-nums">{r['Base Total'] == null || r['Base Total'] === '' ? '—' : Number(r['Base Total']).toLocaleString('pt-BR')}</td></tr>
                ))}</tbody>
              </table>
            </div>
            {packRes && (
              <div className="mt-4">
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Configurado no pack para este uso</h4>
                <div className="flex items-start gap-3"><PreviewThumb res={packRes} w={72} h={88} title={row.name} assetName={assetName} showBadge />
                  <div className="min-w-0 text-xs text-slate-600">{assetName && <p className="font-semibold text-slate-800">{assetName}</p>}{row.packEvidence?.observedIds.length ? <p>ID no link (af_sub3): <code>{row.packEvidence.observedIds.join(' · ')}</code></p> : <p>Sem af_sub3 no link.</p>}</div></div>
              </div>
            )}
            <div className="mt-4">
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Evidências do motor</h4>
              <ul className="space-y-1 text-xs">
                {row.match?.reasons.map((r, i) => <li key={i} className="flex gap-1.5 text-slate-700">{r.ok ? <Check size={12} className="mt-0.5 shrink-0 text-emerald-600" /> : <span className="w-3" />}<span><span className="text-slate-500">{r.label}:</span> {r.val}</span></li>)}
                {row.packEvidence?.conflicts.map((c) => <li key={c} className="flex gap-1.5 text-amber-800"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{c}</li>)}
                {row.parsed.divergencias?.map((d) => <li key={d} className="flex gap-1.5 text-amber-800"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{d}</li>)}
                {!row.match && <li className="text-slate-500">O motor não encontrou template compatível; escolha manualmente.</li>}
              </ul>
            </div>
          </section>

          <section className="p-5" aria-label="Template a vincular">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Template</h4>
            <div className="space-y-1.5" role="radiogroup" aria-label="Templates candidatos">
              {candidates.length === 0 && <p className="text-xs text-slate-500">Sem candidato do motor.</p>}
              {[...candidates, ...(chosen && !candidates.includes(chosen) ? [chosen] : [])].map((id) => (
                <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${chosen === id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="link-template" checked={chosen === id} onChange={() => setChosen(id)} />
                  <TemplateIdChips id={id} />
                  <span className="ml-auto text-[10.5px] text-slate-500">{row.packEvidence?.ids.includes(id) ? (row.packEvidence.source === 'pack' ? 'ID no pack' : 'Reuso histórico') : candidates.includes(id) ? 'Sugestão do motor' : 'Escolha manual'}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"><Search size={14} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Escolher outro template de ${row.canalLabel}…`} aria-label="Buscar outro template" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></div>
            {others.length > 0 && <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200">{others.map((o) => (
              <button key={o.tpl.id} type="button" onClick={() => { setChosen(o.tpl.id); setQuery(''); }} className="flex w-full items-center gap-2 border-t border-slate-100 px-2.5 py-1.5 text-left text-xs first:border-t-0 hover:bg-cyan-50">
                <code className="font-semibold">{o.tpl.id}</code><span className="ml-auto truncate text-[10.5px] text-slate-500">{o.warnings[0] ?? o.positives[0] ?? ''}</span>
              </button>))}</div>}

            {chosen && chosenRes && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <PreviewThumb res={chosenRes} w={72} h={88} title={chosen} showBadge />
                  <dl className="grid min-w-0 flex-1 grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-xs">
                    <dt className="text-slate-500">Estado</dt><dd className="text-slate-800">{state ? APPROVAL_LABEL[state] : 'Não cadastrado no catálogo'}</dd>
                    <dt className="text-slate-500">Canal</dt><dd className={channelOk ? 'text-slate-800' : 'font-semibold text-rose-700'}>{chosenTpl?.channel ?? '—'}{!channelOk && ' · diverge da execução'}</dd>
                    <dt className="text-slate-500">Momento da peça</dt><dd className="text-slate-800">{pieceMoment ?? 'Não declarado no ID'}</dd>
                    <dt className="text-slate-500">Momento do disparo</dt><dd className="text-slate-800">{execMoment}</dd>
                  </dl>
                </div>
                {differ && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">Momentos diferentes: pode ser reuso intencional da peça. Confirme antes de vincular.</p>}
                <p className="mt-2 text-[11px] text-slate-500">A prévia mostra a peça atual/candidata e não certifica a versão enviada. O vínculo não muda a versão atual do conteúdo.</p>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3">
              <label className="flex items-start gap-2 text-xs text-slate-800"><input type="checkbox" checked={checked} disabled={!chosen || !channelOk} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
                <span>Confirmo que <b>{chosen ?? 'o template escolhido'}</b> corresponde a estas <b>{metrics.executions}</b> execuções de <b>{row.jornada}</b> ({row.canalLabel}) entre {row.period.start} e {row.period.end}.</span></label>
              <input aria-label="Evidência do vínculo" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Evidência: como confirmou a peça e o período?" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm" />
              <p className="mt-1 text-[10.5px] text-slate-500">Só estes IDs são alterados. Execuções já vinculadas ou modificadas desde a leitura fazem o banco recusar o vínculo.</p>
            </div>
            {error && <p role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Cancelar</button>
          <button type="button" onClick={apply} disabled={!canApply} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}Vincular {metrics.executions} execução(ões)
          </button>
        </div>
      </div>
    </div>
  );
};

interface BatchProps {
  groups: OrphanRow[];
  catalog: CatalogEntry[];
  onClose: () => void;
  onApplied: () => void;
}

/** Lote: só grupos elegíveis e visíveis. Um RPC por grupo; falhas parciais listadas explicitamente. */
export const BatchLinkModal: React.FC<BatchProps> = ({ groups, catalog, onClose, onApplied }) => {
  const [evidence, setEvidence] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<BatchOutcome[] | null>(null);
  const ref = useDialog(onClose, busy);
  const eligible = useMemo(() => groups.filter((g) => batchEligibility(g, catalog).eligible), [groups, catalog]);
  const executions = eligible.reduce((n, g) => n + g.executionRecords.length, 0);
  const apply = async () => {
    if (!checked || evidence.trim().length < 3 || busy || !eligible.length) return;
    setBusy(true);
    try { setOutcomes(await applyBatchLinks(eligible, evidence.trim(), linkReviewedExecutions, describeError)); }
    finally { setBusy(false); onApplied(); }
  };
  const ok = outcomes?.filter((o) => o.ok) ?? [];
  const failed = outcomes?.filter((o) => !o.ok) ?? [];
  const byUid = new Map(groups.map((g) => [g.uid, g]));
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-3" onClick={() => { if (!busy) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="batch-link-title" onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="batch-link-title" className="text-base font-bold text-slate-900">Vincular em lote</h3>
            <p className="mt-0.5 text-xs text-slate-600"><b>{eligible.length}</b> grupo(s) · <b>{executions}</b> execução(ões). Um vínculo por grupo; somente os IDs listados.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar lote" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><X size={16} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
          <table className="min-w-full text-xs">
            <thead className="text-left text-[10px] font-bold uppercase text-slate-500"><tr><th className="py-1.5">Template</th><th className="py-1.5">Jornada · canal</th><th className="py-1.5 text-right">Exec.</th><th className="py-1.5 text-right">Resultado</th></tr></thead>
            <tbody>{(outcomes ? outcomes.map((o) => byUid.get(o.uid)!).filter(Boolean) : eligible).map((g) => {
              const out = outcomes?.find((o) => o.uid === g.uid);
              return (
                <tr key={g.uid} className="border-t border-slate-100 align-top">
                  <td className="py-1.5 pr-2"><code className="font-semibold">{g.match?.tpl.id}</code><div className="max-w-[260px] truncate text-[10.5px] text-slate-500" title={g.name}>{g.name}</div></td>
                  <td className="py-1.5 pr-2 text-slate-600">{g.jornada} · {g.canalLabel}</td>
                  <td className="py-1.5 text-right tabular-nums">{g.executionRecords.length}</td>
                  <td className="py-1.5 text-right">{!out ? <span className="text-slate-400">pendente</span> : out.ok ? <span className="font-semibold text-emerald-700">{out.linked} vinculada(s)</span> : <span className="font-semibold text-rose-700" title={out.error}>falhou</span>}</td>
                </tr>
              );
            })}</tbody>
          </table>
          {outcomes && (
            <div role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs ${failed.length ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {ok.length} de {outcomes.length} grupo(s) vinculados ({ok.reduce((n, o) => n + o.linked, 0)} execuções).
              {failed.length > 0 && <ul className="mt-1 list-disc pl-4">{failed.map((f) => <li key={f.uid}><code>{f.templateId || '—'}</code>: {f.error}</li>)}</ul>}
              {failed.length > 0 && <p className="mt-1">Os grupos com falha continuam em "Disparos sem template" para revisão individual.</p>}
            </div>
          )}
        </div>
        {!outcomes ? (
          <div className="border-t border-slate-200 px-5 py-3">
            <label className="flex items-start gap-2 text-xs text-slate-800"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />Confirmo que revisei os {eligible.length} grupos e que cada peça corresponde às execuções listadas no período.</label>
            <input aria-label="Evidência do lote" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Evidência: como confirmou as peças e o período?" className="mt-2 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" onClick={apply} disabled={!checked || evidence.trim().length < 3 || busy || !eligible.length} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}Vincular {eligible.length} grupo(s)</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end border-t border-slate-200 px-5 py-3"><button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Fechar</button></div>
        )}
      </div>
    </div>
  );
};
