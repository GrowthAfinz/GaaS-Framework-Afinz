import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { wikiTopicForNote } from '../../vault/wikiNavigation';
import {
  daysSince, healthSummary, isGeneratedNote, isOpen, reviewQueue, type FeedbackItem, type ReviewNote, type ReviewRecord,
} from '../../feedback/feedbackModel';
import { configureHydration, createFeedback, feedbackError, hydrationStatus, isFeedbackAdmin, listNoteReviews, listReviewNotes, noteContent, recordNoteReview, type HydrationStatus } from '../../feedback/feedbackService';
import { notifyFeedbackChanged, openFeedback } from '../../feedback/feedbackBus';

const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z')) : 'sem data';
const topicOf = (path: string) => wikiTopicForNote({ relative_path: path, folder: path.split('/').slice(0, -1).join('/'), tags: [] }) || 'Outros';
const noteRoute = (id: string) => `?view=learning&section=vault&item=${encodeURIComponent(id)}`;

function preview(markdown: string): { text: string; snapshots: string[] } {
  const body = markdown.replace(/^---[\s\S]*?\n---\s*\n?/, '');
  const snapshots = body.split('\n').filter(line => line.includes('📊')).map(line => line.replace(/^>\s*/, '').trim()).slice(0, 3);
  const text = body.split('\n').filter(line => !line.includes('📊') && !/^#/.test(line)).join('\n')
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, a, b) => b || a).replace(/\*\*|__|`/g, '').replace(/^>\s?/gm, '')
    .replace(/\n{3,}/g, '\n\n').trim().slice(0, 900);
  return { text, snapshots };
}

const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value)) : 'nunca';

/** Portão de hidratação: as skills só reidratam os números quando a checagem estiver vencida. */
function HydrationCard() {
  const [status, setStatus] = useState<HydrationStatus | null>(null);
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState('7');
  const [stale, setStale] = useState('30');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const [s, a] = await Promise.all([hydrationStatus(), isFeedbackAdmin()]);
    setStatus(s); setAdmin(a);
    if (s) { setDays(String(Math.max(1, Math.round(s.cadence_hours / 24)))); setStale(String(s.stale_after_days)); setEnabled(s.enabled); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (!status) return null;
  const save = async () => {
    try { await configureHydration(Math.max(1, Number(days)) * 24, Math.max(1, Number(stale)), enabled); setEditing(false); setError(''); await load(); }
    catch (e) { setError(feedbackError(e)); }
  };
  const notes = status.last_result?.stale_notes || [];
  return (
    <section aria-label="Hidratação dos números" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Hidratação dos números</h3>
          <p className="mt-1 text-sm text-slate-600">As skills do Loop e de Correções só reidratam snapshots quando a checagem vence. Assim não gastam token atualizando à toa.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${!status.enabled ? 'bg-slate-100 text-slate-600' : status.due ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {!status.enabled ? 'Pausada' : status.due ? 'Checagem vencida' : 'Em dia'}
        </span>
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-slate-500">Última checagem</dt><dd className="font-semibold text-slate-800">{dateTime(status.last_checked_at)}{status.last_checked_by ? ` · ${status.last_checked_by}` : ''}</dd></div>
        <div><dt className="text-xs text-slate-500">Próxima checagem</dt><dd className="font-semibold text-slate-800">{status.next_check_at ? dateTime(status.next_check_at) : 'na próxima rodada da skill'}</dd></div>
        <div><dt className="text-xs text-slate-500">Frequência</dt><dd className="font-semibold text-slate-800">a cada {Math.round(status.cadence_hours / 24) || 1} dia(s)</dd></div>
        <div><dt className="text-xs text-slate-500">Snapshot vencido após</dt><dd className="font-semibold text-slate-800">{status.stale_after_days} dias{status.last_result?.stale_count !== undefined ? ` · ${status.last_result.stale_count} notas vencidas` : ''}</dd></div>
      </dl>
      {notes.length > 0 && <p className="mt-3 text-xs text-slate-600">Mais antigas na última checagem: {notes.slice(0, 5).map(n => `${n.path.split('/').pop()?.replace(/\.md$/, '')} (${n.snapshot})`).join(' · ')}</p>}
      {admin && !editing && <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs font-bold text-cyan-800">Reprogramar</button>}
      {admin && editing && (
        <div className="mt-3 flex flex-wrap items-end gap-2 text-xs">
          <label className="font-semibold text-slate-700">Checar a cada (dias)<input value={days} onChange={e => setDays(e.target.value.replace(/\D/g, ''))} className="mt-1 block w-24 rounded border border-slate-300 p-1.5" /></label>
          <label className="font-semibold text-slate-700">Snapshot vence após (dias)<input value={stale} onChange={e => setStale(e.target.value.replace(/\D/g, ''))} className="mt-1 block w-24 rounded border border-slate-300 p-1.5" /></label>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />Ativa</label>
          <button type="button" onClick={() => void save()} className="rounded bg-teal-700 px-3 py-1.5 font-bold text-white">Salvar</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded border border-slate-300 px-3 py-1.5 font-bold text-slate-700">Cancelar</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}

export function HealthView({ items, onChanged }: { items: FeedbackItem[]; onChanged: () => void }) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [content, setContent] = useState<{ id: string; text: string; snapshots: string[] } | null>(null);
  const [today, setToday] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [n, r] = await Promise.all([listReviewNotes(), listNoteReviews()]);
      setNotes(n); setReviews(r); setError('');
    } catch (e) { setError(feedbackError(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const now = useMemo(() => new Date(), []);
  const summary = useMemo(() => healthSummary(notes, reviews, items, now), [notes, reviews, items, now]);
  const queue = useMemo(() => reviewQueue(notes, reviews), [notes, reviews]);
  const next = queue[0] || null;
  const openByPath = useMemo(() => {
    const map = new Map<string, number>();
    items.filter(i => i.target_type === 'note' && isOpen(i.status) && i.target_id).forEach(i => map.set(i.target_id!, (map.get(i.target_id!) || 0) + 1));
    return map;
  }, [items]);
  const bySubject = useMemo(() => {
    const rows = new Map<string, { stale: number; open: number; total: number }>();
    notes.filter(n => !isGeneratedNote(n.relative_path)).forEach(n => {
      const key = topicOf(n.relative_path);
      const row = rows.get(key) || { stale: 0, open: 0, total: 0 };
      row.total += 1;
      if ((daysSince(n.updated, now) ?? 0) > 120) row.stale += 1;
      row.open += openByPath.get(n.relative_path) || 0;
      rows.set(key, row);
    });
    return [...rows.entries()].sort((a, b) => b[1].stale - a[1].stale || a[0].localeCompare(b[0], 'pt-BR'));
  }, [notes, now, openByPath]);

  useEffect(() => {
    if (!next) { setContent(null); return; }
    let alive = true;
    void noteContent(next.id).then(c => { if (alive) setContent({ id: next.id, ...preview(c.content_markdown) }); }).catch(() => { if (alive) setContent(null); });
    return () => { alive = false; };
  }, [next?.id]);

  const verdict = async (kind: ReviewRecord['verdict']) => {
    if (!next) return;
    setBusy(true); setError('');
    try {
      await recordNoteReview(next.relative_path, kind);
      const target = { surface: 'vault', pageLabel: 'Wiki', locationLabel: `Wiki › ${topicOf(next.relative_path)} › ${next.title}`, targetType: 'note' as const, targetId: next.relative_path, subject: topicOf(next.relative_path) };
      if (kind === 'needs_fix') openFeedback({ ...target, kind: 'knowledge' });
      if (kind === 'archive') {
        await createFeedback({ kind: 'knowledge', item_type: 'arquivar', body: `Sugestão de arquivar a nota "${next.title}", feita no Revisar próxima.`, surface: 'vault', page_label: 'Wiki',
          location_label: target.locationLabel, route: noteRoute(next.id), target_type: 'note', target_id: next.relative_path, subject: target.subject });
        notifyFeedbackChanged();
        onChanged();
      }
      if (kind === 'ok') setToday(t => t + 1);
      await load();
    } catch (e) { setError(feedbackError(e)); } finally { setBusy(false); }
  };

  const pct = summary.total ? Math.round(summary.reviewed / summary.total * 100) : 0;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Quanto da Wiki uma pessoa já conferiu. “Confirmado” no cabeçalho da nota foi, na maioria das vezes, escrito pela própria IA.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Revisadas por pessoa</p>
          <p className="mt-1 text-2xl font-bold">{summary.reviewed} <span className="text-sm font-medium text-slate-500">de {summary.total}</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-cyan-600" style={{ width: `${Math.max(pct, 1)}%` }} /></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Sem revisão editorial há mais de 120 dias</p><p className="mt-1 text-2xl font-bold">{summary.stale}</p><p className="text-xs text-slate-500">fora as notas geradas e o legado</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Geradas por script</p><p className="mt-1 text-2xl font-bold">{summary.generated}</p><p className="text-xs text-slate-500">correção vai para o gerador</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Com correção aberta</p><p className="mt-1 text-2xl font-bold">{summary.withOpenItems}</p><p className="text-xs text-slate-500">notas com selo na Wiki</p></div>
      </div>

      <HydrationCard />

      <div className="flex flex-wrap items-start gap-4">
        <section aria-label="Revisar próxima" className="min-w-0 flex-[999_1_640px] rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900">Revisar próxima</h3>
            <span className="text-xs text-slate-500">Nesta sessão: {today} revisadas · faltam {queue.length} sem revisão da versão atual</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">Uma nota por vez, das mais antigas para as mais novas. Notas geradas e legado ficam de fora.</p>
          {!next ? <p className="mt-4 text-sm text-slate-500">Tudo revisado por enquanto.</p> : (
            <>
              <article className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-cyan-800">Wiki › {topicOf(next.relative_path)}</p>
                  <h4 className="mt-1 text-xl font-bold text-slate-900">{next.title}</h4>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Atualizada em {date(next.updated)}{daysSince(next.updated, now) !== null ? ` · ${daysSince(next.updated, now)} dias` : ''}</span>
                    {next.status && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Diz “{next.status.replace(/"/g, '')}”, sem revisão de pessoa nesta versão</span>}
                    {openByPath.get(next.relative_path) ? <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-800">{openByPath.get(next.relative_path)} correção aberta</span> : null}
                  </div>
                </div>
                <div className="space-y-2 p-4 text-sm leading-6 text-slate-700">
                  {content?.id === next.id ? <p className="max-h-56 overflow-hidden whitespace-pre-wrap">{content.text}</p> : <p className="text-slate-500">Carregando prévia…</p>}
                  {content?.id === next.id && content.snapshots.map(s => <p key={s} className="rounded-lg bg-amber-50 px-3 py-2 text-xs">{s} · ainda vale?</p>)}
                  <a href={noteRoute(next.id)} className="inline-block text-xs font-bold text-cyan-800">Abrir a nota inteira na Wiki</a>
                </div>
              </article>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <button type="button" disabled={busy} onClick={() => void verdict('ok')} className="min-h-12 rounded-xl border border-emerald-200 bg-emerald-50 font-bold text-emerald-800">Está ok</button>
                <button type="button" disabled={busy} onClick={() => void verdict('needs_fix')} className="min-h-12 rounded-xl border border-amber-200 bg-amber-50 font-bold text-amber-800">Precisa correção</button>
                <button type="button" disabled={busy} onClick={() => void verdict('archive')} className="min-h-12 rounded-xl border border-slate-300 bg-white font-bold text-slate-700">Arquivar</button>
                <button type="button" disabled={busy} onClick={() => void verdict('skip')} className="min-h-12 rounded-xl border border-slate-300 bg-white font-bold text-slate-700">Não sei · pular</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">“Precisa correção” abre o formulário já ancorado na nota. “Arquivar” vira uma correção para a IA avaliar. “Está ok” grava revisão por pessoa com data e nome; se a nota mudar, a revisão perde a validade.</p>
            </>
          )}
        </section>
        <aside aria-label="Por assunto" className="flex-[1_1_380px] rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-bold text-slate-900">Por assunto</h3>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 font-semibold">Assunto</th><th className="py-2 font-semibold">Notas</th><th className="py-2 font-semibold">Vencidas</th><th className="py-2 font-semibold">Correções</th></tr></thead>
            <tbody>{bySubject.map(([subject, row]) => <tr key={subject} className="border-t border-slate-100"><td className="py-2">{subject}</td><td>{row.total}</td><td>{row.stale}</td><td>{row.open}</td></tr>)}</tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Vencida = sem revisão editorial (campo atualizado) há mais de 120 dias.</p>
        </aside>
      </div>
    </div>
  );
}
