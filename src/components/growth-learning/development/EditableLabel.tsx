import React, { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface Props {
  value: string;
  label: string;
  canEdit: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
  onSave: (next: string) => Promise<void> | void;
  as?: 'span' | 'h1';
}

/** Rótulo com renomear no lugar: lápis ao passar o mouse, Enter salva, Esc cancela. Muda só o nome, nunca o id. */
export function EditableLabel({ value, label, canEdit, minLength = 2, maxLength = 180, className = '', inputClassName = '', onSave, as = 'span' }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  useEffect(() => { if (editing) input.current?.select(); }, [editing]);

  const commit = async () => {
    const next = draft.trim();
    if (next === value || next.length < minLength) { setEditing(false); setDraft(value); return; }
    setSaving(true);
    try { await onSave(next); setEditing(false); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <input
          ref={input}
          aria-label={label}
          value={draft}
          disabled={saving}
          maxLength={maxLength}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); void commit(); }
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEditing(false); setDraft(value); }
          }}
          onBlur={() => void commit()}
          className={`rounded-md border border-cyan-600 px-2 py-1 outline-none ${inputClassName}`}
        />
        <small className="text-[11px] font-normal text-slate-500">Enter salva · Esc cancela · o nome antigo continua achável na busca</small>
      </span>
    );
  }
  const Tag = as;
  return (
    <span className="group inline-flex items-center gap-1.5">
      <Tag className={className}>{value}</Tag>
      {canEdit && (
        <button type="button" aria-label={`Renomear ${label.toLowerCase()}`} title="Renomear" onClick={() => setEditing(true)}
          className="rounded-md border border-transparent p-1 text-slate-400 opacity-60 hover:border-slate-200 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100">
          <Pencil size={14} />
        </button>
      )}
    </span>
  );
}
