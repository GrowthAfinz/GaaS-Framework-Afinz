import React, { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { NotionUser, PageComment } from '../../types/notion';

/** Comentários da página (adição GaaS): ficam na própria página e sincronizam com o resto do espaço. */
export const PageComments: React.FC<{
  comments: PageComment[];
  me: NotionUser;
  onChange: (next: PageComment[]) => void;
  id?: string;
}> = ({ comments, me, onChange, id }) => {
  const [text, setText] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onChange([...comments, { id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), authorId: me.id, authorName: me.name, text: t, createdAt: new Date().toISOString() }]);
    setText('');
  };
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div id={id} className="mb-6 pb-4 border-b border-[var(--notion-border)] scroll-mt-16">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[var(--notion-text-muted)]">
        <MessageSquare size={13} />
        <span>Comentários{comments.length ? ` (${comments.length})` : ''}</span>
      </div>
      {comments.map((c) => (
        <div key={c.id} className="group/c flex gap-2.5 mb-2.5 text-xs">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--notion-hover)] text-[10px] font-semibold">{(c.authorName || '?').slice(0, 1).toUpperCase()}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--notion-text)]">{c.authorName}</span>
              <span className="text-[10px] text-[var(--notion-text-muted)]">{fmt(c.createdAt)}</span>
              {c.authorId === me.id && (
                <button onClick={() => onChange(comments.filter((x) => x.id !== c.id))} className="opacity-0 group-hover/c:opacity-100 text-[var(--notion-text-muted)] hover:text-red-500" title="Apagar comentário">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            <p className="text-[var(--notion-text)] mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          type="text"
          placeholder={`Comentar como ${me.name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs rounded-md bg-[var(--notion-card)] border border-[var(--notion-border)] text-[var(--notion-text)] placeholder-[var(--notion-text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" disabled={!text.trim()} className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-medium rounded-md transition-colors">
          Enviar
        </button>
      </form>
    </div>
  );
};
