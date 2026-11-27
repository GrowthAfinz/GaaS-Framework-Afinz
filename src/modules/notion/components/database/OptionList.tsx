import React, { useState } from 'react';
import { Check, GripVertical, MoreHorizontal } from 'lucide-react';
import type { DatabaseProperty, NotionColor, SelectOption } from '../../types/notion';
import { useNotionEdit, type OptionCaps } from './editContext';

export const OPTION_COLOR_CLASSES: Record<NotionColor, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  brown: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};
const COLOR_NAMES: [NotionColor, string][] = [
  ['gray', 'Cinza'], ['brown', 'Marrom'], ['orange', 'Laranja'], ['yellow', 'Amarelo'], ['green', 'Verde'],
  ['blue', 'Azul'], ['purple', 'Roxo'], ['pink', 'Rosa'], ['red', 'Vermelho'], ['default', 'Padrão'],
];
const FREE: OptionCaps = { rename: true, color: true, reorder: true, remove: 'excluir', uses: 0 };
const message = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Lista de opções com edição em cima da própria opção (adição GaaS): "⋯" abre renomear, cor e tirar;
 * arrastar muda a ordem. Opção sincronizada grava na tela de origem (Visão Daily, quadro, Bases).
 */
export const OptionList: React.FC<{
  databaseId?: string;
  property: DatabaseProperty;
  options: SelectOption[];
  selected?: string[];
  /** Sem busca ativa: arrastar só faz sentido com a lista inteira na tela. */
  canDrag: boolean;
  onPick?: (name: string) => void;
}> = ({ databaseId, property, options, selected = [], canDrag, onPick }) => {
  const edit = useNotionEdit();
  const lock = databaseId ? edit.lockOf(databaseId, property.id) : null;
  const editable = Boolean(databaseId && edit.editOption) && lock !== 'fixed';
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const all = property.options || [];
  const capsOf = (id: string): OptionCaps => (databaseId && edit.optionCaps ? edit.optionCaps(databaseId, property.id, id) : FREE);

  const drop = async (targetId: string) => {
    const from = dragId; setDragId(null); setOverId(null);
    if (!databaseId || !from || from === targetId) return;
    const index = all.findIndex(o => o.id === targetId);
    if (index < 0) return;
    setErr('');
    try { await edit.editOption?.(databaseId, property.id, from, { index }); } catch (e) { setErr(message(e, 'Não foi possível mudar a ordem.')); }
  };

  return (
    <>
      {options.map(opt => {
        const caps = editable ? capsOf(opt.id) : null;
        const drag = Boolean(caps?.reorder && canDrag);
        const open = openId === opt.id;
        return (
          <div key={opt.id}
            onDragOver={e => { if (dragId) { e.preventDefault(); setOverId(opt.id); } }}
            onDrop={e => { e.preventDefault(); void drop(opt.id); }}
            className={`rounded ${overId === opt.id && dragId !== opt.id ? 'shadow-[inset_0_2px_0_#2383e2]' : ''} ${dragId === opt.id ? 'opacity-40' : ''}`}>
            <div className={`group/opt flex items-center w-full rounded ${open ? 'bg-[var(--notion-hover)]' : 'hover:bg-[var(--notion-hover)]'}`}>
              {editable && (
                <span draggable={drag} onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', opt.id); setDragId(opt.id); }}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  title={drag ? 'Arraste para mudar a ordem' : undefined}
                  className={`pl-1 text-[var(--notion-text-muted)] ${drag ? 'cursor-grab opacity-0 group-hover/opt:opacity-60' : 'opacity-0'}`}>
                  <GripVertical size={12} />
                </span>
              )}
              <button type="button" onClick={() => (onPick ? onPick(opt.name) : setOpenId(open ? null : opt.id))} className="flex-1 flex items-center justify-between px-1.5 py-1 text-left min-w-0">
                <span className={`px-2 py-0.5 rounded truncate ${OPTION_COLOR_CLASSES[opt.color] || OPTION_COLOR_CLASSES.gray}`}>{opt.name}</span>
                {selected.includes(opt.name) && <Check size={12} className="text-blue-500 shrink-0" />}
              </button>
              {editable && (
                <button type="button" onClick={() => { setErr(''); setOpenId(open ? null : opt.id); }}
                  aria-label={`Editar opção ${opt.name}`} title="Renomear, cor, tirar"
                  className={`p-1 mr-1 rounded text-[var(--notion-text-muted)] hover:bg-[var(--notion-border)] hover:text-[var(--notion-text)] ${open ? 'opacity-100' : 'opacity-0 group-hover/opt:opacity-100 focus:opacity-100'}`}>
                  <MoreHorizontal size={13} />
                </button>
              )}
            </div>
            {open && databaseId && caps && (
              <OptionEditor databaseId={databaseId} property={property} option={opt} caps={caps}
                onDone={() => setOpenId(null)} />
            )}
          </div>
        );
      })}
      {err && <div className="px-2 py-1 text-red-500">{err}</div>}
    </>
  );
};

const OptionEditor: React.FC<{ databaseId: string; property: DatabaseProperty; option: SelectOption; caps: OptionCaps; onDone: () => void }> = ({ databaseId, property, option, caps, onDone }) => {
  const edit = useNotionEdit();
  const [name, setName] = useState(option.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (fn: () => void | Promise<void>, fallback: string, close = false) => {
    if (busy) return;
    setBusy(true); setErr('');
    try { await fn(); if (close) onDone(); } catch (e) { setErr(message(e, fallback)); } finally { setBusy(false); }
  };
  const rename = () => {
    const next = name.trim().replace(/\s+/g, ' ');
    if (!caps.rename || next === option.name) return;
    void run(() => edit.editOption?.(databaseId, property.id, option.id, { name: next }), 'Não foi possível renomear.');
  };
  const remove = () => {
    const n = caps.uses;
    const ask = caps.remove === 'arquivar'
      ? `Arquivar "${option.name}"? Some das listas daqui e da Visão Daily.`
      : `Excluir "${option.name}"?${n ? ` ${n} ${n === 1 ? 'item fica' : 'itens ficam'} com o campo vazio.` : ''}`;
    if (!window.confirm(ask)) return;
    void run(() => edit.removeOption(databaseId, property.id, option.id), 'Não foi possível tirar a opção.', true);
  };
  return (
    <div className="mx-1 mb-1 mt-0.5 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-2 shadow-sm" onClick={e => e.stopPropagation()}>
      <input autoFocus={caps.rename} value={name} disabled={!caps.rename || busy} aria-label="Nome da opção"
        onChange={e => setName(e.target.value)} onBlur={rename}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter') { e.preventDefault(); rename(); }
          if (e.key === 'Escape') { setName(option.name); onDone(); }
        }}
        className="w-full rounded border border-[var(--notion-border)] bg-transparent px-2 py-1 text-[var(--notion-text)] focus:outline-none focus:border-blue-400 disabled:opacity-60" />
      {caps.color && (
        <div className="mt-2 grid grid-cols-5 gap-1" role="group" aria-label="Cor">
          {COLOR_NAMES.map(([c, label]) => (
            <button key={c} type="button" title={label} aria-label={label} disabled={busy}
              onClick={() => void run(() => edit.editOption?.(databaseId, property.id, option.id, { color: c }), 'Não foi possível trocar a cor.')}
              className={`h-5 rounded ${OPTION_COLOR_CLASSES[c]} flex items-center justify-center ring-offset-1 ${option.color === c ? 'ring-2 ring-blue-400' : 'hover:ring-1 hover:ring-[var(--notion-border)]'}`}>
              {option.color === c && <Check size={10} />}
            </button>
          ))}
        </div>
      )}
      {caps.remove ? (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--notion-border)] pt-1.5">
          <span className="text-[10px] text-[var(--notion-text-muted)]">{caps.uses ? `Usada em ${caps.uses} ${caps.uses === 1 ? 'item' : 'itens'}` : 'Sem uso'}</span>
          <button type="button" onClick={remove} disabled={busy} className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 disabled:opacity-50">
            {caps.remove === 'arquivar' ? 'Arquivar' : 'Excluir'}
          </button>
        </div>
      ) : caps.removeBlock ? (
        <div className="mt-2 border-t border-[var(--notion-border)] pt-1.5 text-[10px] text-[var(--notion-text-muted)]">{caps.removeBlock}</div>
      ) : null}
      {caps.syncNote && <div className="mt-1 text-[10px] text-[var(--notion-text-muted)]">{caps.syncNote}</div>}
      {busy && <div className="mt-1 text-[10px] text-[var(--notion-text-muted)]">Salvando…</div>}
      {err && <div className="mt-1 text-red-500">{err}</div>}
    </div>
  );
};
