import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { DatabaseProperty } from '../../types/notion';
import { useNotionEdit } from './editContext';
import { OptionList } from './OptionList';

/** Opções no menu do cabeçalho: a mesma lista editável da célula (⋯ renomeia, troca a cor, tira; arrastar muda a ordem). */
export function OptionSettings({ databaseId, property }: { databaseId: string; property: DatabaseProperty }) {
  const edit = useNotionEdit();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lock = edit.lockOf(databaseId, property.id);
  if (!edit.editOption) return null;
  const options = property.options ?? [];
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    if (options.some(item => item.name.toLowerCase() === next.toLowerCase())) { setError('Já existe uma opção com esse nome.'); return; }
    setError(''); setSaving(true);
    try { await edit.createOption(databaseId, property.id, next); setName(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível criar.'); }
    finally { setSaving(false); }
  };
  return (
    <div className="mt-2 border-t border-[var(--notion-border)] pt-2">
      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--notion-text-muted)]">{property.type === 'status' ? 'Etapas' : 'Opções'}</div>
      <div className="max-h-64 overflow-y-auto">
        <OptionList databaseId={databaseId} property={property} options={options} canDrag />
        {!options.length && <div className="px-2 py-1 text-[var(--notion-text-muted)]">Nenhuma opção ainda.</div>}
      </div>
      {lock !== 'fixed' && (
        <form onSubmit={add} className="mt-1 flex items-center gap-1 px-1">
          <Plus size={12} className="text-[var(--notion-text-muted)]" />
          <input className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-1 focus:border-[var(--notion-border)] focus:outline-none" aria-label="Nova opção" placeholder="Nova opção"
            value={name} disabled={saving} onChange={event => setName(event.target.value)} onKeyDown={event => event.stopPropagation()} />
        </form>
      )}
      {error && <p role="alert" className="px-1 text-red-600">{error}</p>}
    </div>
  );
}
