import React, { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { toLocalRect } from '../../context/UIScaleContext';
import { anchorStillMatches, buildQuoteAnchor, humanReviewOf, isGeneratedNote, isOpen, statusLabel, STATUS_TONE, type FeedbackItem, type FeedbackTarget, type ReviewRecord } from '../feedback/feedbackModel';
import { listFeedbackForTarget, listNoteReviews, noteHashByPath, toggleVote } from '../feedback/feedbackService';
import { notifyFeedbackChanged, onFeedbackChanged, openFeedback, setFeedbackPageTarget } from '../feedback/feedbackBus';
import { correctionsSearch } from '../growth-learning/corrections/correctionsShared';
import type { VaultNote } from './vaultTypes';

interface Props { note: VaultNote; reader: RefObject<HTMLElement>; topic: string | null }

const when = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value));

function headingBefore(root: HTMLElement, node: Node): string | undefined {
  const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4'));
  let found: string | undefined;
  for (const heading of headings) {
    if (heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) found = heading.textContent?.trim() || found;
  }
  return found;
}

/** Pontos de edição da Wiki: botão, selo, revisão por pessoa, correções da nota e "Corrigir trecho" ao grifar. */
export function WikiFeedbackBar({ note, reader, topic }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [hash, setHash] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number; heading?: string } | null>(null);
  const [readerText, setReaderText] = useState('');

  const target: FeedbackTarget = useMemo(() => ({
    surface: 'vault', pageLabel: 'Wiki', locationLabel: `Wiki › ${topic || 'Nota'} › ${note.title}`,
    targetType: 'note', targetId: note.relative_path, subject: topic || undefined, generated: isGeneratedNote(note.relative_path),
  }), [note.relative_path, note.title, topic]);

  const load = useCallback(async () => {
    try {
      const [rows, r, h] = await Promise.all([listFeedbackForTarget('note', note.relative_path), listNoteReviews(note.relative_path), noteHashByPath(note.relative_path)]);
      setItems(rows); setReviews(r); setHash(h);
    } catch { setItems([]); }
  }, [note.relative_path]);

  useEffect(() => { void load(); return onFeedbackChanged(() => void load()); }, [load]);
  useEffect(() => { setFeedbackPageTarget(target); return () => setFeedbackPageTarget(null); }, [target]);
  useEffect(() => { const id = window.setTimeout(() => setReaderText(reader.current?.innerText || ''), 400); return () => window.clearTimeout(id); }, [note.id, reader]);

  useEffect(() => {
    const root = reader.current;
    if (!root) return;
    const onUp = () => window.setTimeout(() => {
      const sel = window.getSelection();
      const text = sel?.toString().replace(/\s+/g, ' ').trim() || '';
      if (!sel || sel.rangeCount === 0 || text.length < 3 || text.length > 600 || !root.contains(sel.anchorNode)) { setSelection(null); return; }
      const rect = toLocalRect(sel.getRangeAt(0).getBoundingClientRect());
      setSelection({ text, top: Math.max(8, rect.top - 44), left: Math.max(8, rect.left), heading: sel.anchorNode ? headingBefore(root, sel.anchorNode) : undefined });
    }, 0);
    const onDown = (event: MouseEvent) => { if (!(event.target as HTMLElement)?.closest?.('[data-wiki-fix]')) setSelection(null); };
    root.addEventListener('mouseup', onUp);
    document.addEventListener('mousedown', onDown);
    return () => { root.removeEventListener('mouseup', onUp); document.removeEventListener('mousedown', onDown); };
  }, [reader, note.id]);

  const open = items.filter(i => isOpen(i.status));
  const review = hash ? humanReviewOf({ relative_path: note.relative_path, content_hash: hash }, reviews) : null;
  const fixSelection = () => {
    if (!selection) return;
    const anchor = { ...buildQuoteAnchor(reader.current?.innerText || selection.text, selection.text, selection.heading), note_hash: hash || undefined };
    openFeedback({ ...target, kind: 'knowledge', anchor, locationLabel: selection.heading ? `${target.locationLabel} › ${selection.heading}` : target.locationLabel });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => openFeedback({ ...target, kind: 'knowledge' })} className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 font-semibold text-cyan-800 hover:bg-cyan-100"><MessageSquareWarning size={13} />Correção para IA</button>
        {open.length > 0 && <a href={correctionsSearch(note.relative_path)} className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800 hover:underline">{open.length} correç{open.length === 1 ? 'ão aberta' : 'ões abertas'}</a>}
        {review
          ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">Revisada por pessoa em {when(review.reviewed_at)}</span>
          : <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-900">{isGeneratedNote(note.relative_path) ? 'Gerada por script · correção vai para o gerador' : 'Ainda sem revisão de pessoa nesta versão'}</span>}
        <span className="text-slate-500">Grife um trecho para corrigir só ele.</span>
      </div>
      {open.length > 0 && (
        <details className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-amber-900">Correções nesta nota</summary>
          <ul className="mt-2 space-y-2">
            {open.map(item => {
              const orphan = item.anchor?.exact && readerText && !anchorStillMatches(item.anchor, readerText);
              return (
                <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[item.status]}`}>{statusLabel(item)}</span>
                  <p className="mt-1 text-slate-800">{item.body}</p>
                  {item.anchor?.exact && <p className="mt-1 border-l-4 border-amber-400 pl-2 text-xs text-slate-600">“{item.anchor.exact}”{orphan ? ' · o trecho não existe mais nesta versão' : ''}</p>}
                  <button type="button" onClick={() => void toggleVote(item.id).then(() => notifyFeedbackChanged())} className="mt-2 text-xs font-semibold text-cyan-800">+1, também vi isso</button>
                </li>
              );
            })}
          </ul>
          <a href={correctionsSearch(note.relative_path)} className="mt-2 inline-block text-xs font-bold text-cyan-800">Ver na aba Correções e melhorias</a>
        </details>
      )}
      {selection && (
        <div data-wiki-fix className="fixed z-[9980] flex gap-1 rounded-lg bg-slate-900 p-1 shadow-xl" style={{ top: selection.top, left: selection.left }}>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={fixSelection} className="rounded px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700">Corrigir trecho</button>
        </div>
      )}
    </div>
  );
}
