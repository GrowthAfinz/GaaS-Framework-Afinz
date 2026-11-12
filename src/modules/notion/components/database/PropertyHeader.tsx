import React, { useState } from 'react';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import type { DatabaseProperty } from '../../types/notion';
import { useNotionEdit } from './editContext';

/** Cabeçalho de coluna com renomear e excluir (adição GaaS). Colunas que espelham a tarefa ficam travadas. */
export const PropertyHeader: React.FC<{ databaseId: string; property: DatabaseProperty; icon: React.ReactNode }> = ({ databaseId, property, icon }) => {
  const edit = useNotionEdit();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(property.name);
  const lock = edit.lockOf(databaseId, property.id);
  const locked = lock !== null || property.type === 'title';
  const save = () => {
    const n = name.trim();
    if (n && n !== property.name) edit.renameProperty(databaseId, property.id, n);
    setOpen(false);
  };
  return (
    <div className="relative">
      <button onClick={() => { setName(property.name); setOpen(!open); }} className="flex items-center gap-1.5 w-full text-left hover:text-[var(--notion-text)]">
        {icon}
        <span className="truncate">{property.name}</span>
        {locked && <Lock size={10} className="opacity-40 shrink-0" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 w-60 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-2 shadow-lg text-xs font-normal normal-case text-[var(--notion-text)]">
            {locked ? (
              <div className="text-[var(--notion-text-muted)] leading-relaxed">
                {lock === 'synced'
                  ? 'As opções desta coluna vêm de outra tela do GaaS. Crie uma opção nova direto na célula.'
                  : 'Esta coluna espelha um campo da tarefa e não pode ser renomeada nem excluída.'}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <Pencil size={12} className="text-[var(--notion-text-muted)]" />
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
                    className="flex-1 px-2 py-1 rounded border border-[var(--notion-border)] bg-transparent focus:outline-none" />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={save} className="flex-1 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium">Renomear</button>
                  <button
                    onClick={() => { if (window.confirm(`Excluir a propriedade "${property.name}"? Os valores dela somem de todos os itens.`)) { edit.deleteProperty(databaseId, property.id); setOpen(false); } }}
                    className="flex items-center gap-1 px-2 py-1 rounded text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
