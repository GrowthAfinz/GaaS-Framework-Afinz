import React, { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function InlineTextCell({ label, value, onCommit, onOpen, number }: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  onOpen?: () => void;
  number?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return <div className="nt-inline-cell">
    {draft === null ? <button ref={trigger} type="button" className="nt-cell-value" title={value || undefined} aria-label={`Editar ${label}: ${value || 'vazio'}`}
      onClick={() => { cancelled.current = false; setDraft(value); }}>{value || '—'}</button> :
      <input autoFocus aria-label={label} type={number ? 'number' : 'text'} value={draft} onChange={event => setDraft(event.target.value)}
        onBlur={() => {
          if (!cancelled.current && draft !== value) onCommit(draft);
          setDraft(null);
        }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || (event.key !== 'Enter' && event.key !== 'Escape')) return;
          event.preventDefault();
          cancelled.current = event.key === 'Escape';
          event.currentTarget.blur();
          requestAnimationFrame(() => trigger.current?.focus());
        }} />}
    {onOpen && <button type="button" className="nt-open-task" title="Abrir tarefa" aria-label={`Abrir tarefa: ${value}`} onClick={onOpen}><ArrowUpRight size={14} /></button>}
  </div>;
}
