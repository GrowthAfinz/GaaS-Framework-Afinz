import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Calendar,
  Hash,
  Type,
  Tag,
  CheckSquare,
  User as UserIcon,
  Plus,
  X,
} from 'lucide-react';
import { useNotionEdit } from './editContext';
import { DatabaseProperty, NotionColor, NotionUser } from '../../types/notion';

interface PropertyCellProps {
  property: DatabaseProperty;
  value: any;
  users?: NotionUser[];
  onChange: (newValue: any) => void;
  onOpenPage?: () => void;
  /** Base e linha da célula: permitem criar opção nova (adição GaaS). */
  databaseId?: string;
  rowId?: string;
}

const COLOR_CLASSES: Record<NotionColor, string> = {
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

export const PropertyCell: React.FC<PropertyCellProps> = ({
  property,
  value,
  users = [],
  onChange,
  onOpenPage,
  databaseId,
  rowId,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  switch (property.type) {
    case 'title':
      return (
        <div className="flex items-center gap-1.5 w-full">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Vazio"
            className="w-full bg-transparent text-sm font-medium focus:outline-none text-[var(--notion-text)]"
          />
          {onOpenPage && (
            <button
              onClick={onOpenPage}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-xs text-[var(--notion-text-muted)] hover:text-blue-500 rounded"
              title="Abrir como página"
            >
              Abrir
            </button>
          )}
        </div>
      );

    case 'person': {
      const assignedUser = users.find((u) => u.id === value);

      return (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 max-w-full px-1.5 py-0.5 rounded text-xs hover:bg-[var(--notion-hover)] transition-colors"
          >
            {assignedUser ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">{assignedUser.avatar || '👤'}</span>
                <span className="truncate text-xs text-[var(--notion-text)] font-medium">
                  {assignedUser.name}
                </span>
              </div>
            ) : (
              <span className="text-[var(--notion-text-muted)]/50 text-xs">Sem responsável</span>
            )}
            <ChevronDown size={11} className="text-[var(--notion-text-muted)] shrink-0 ml-auto" />
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-7 z-50 w-52 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-1 shadow-xl">
              <div className="text-[10px] uppercase font-semibold text-[var(--notion-text-muted)] px-2 py-1">
                Responsável
              </div>
              <button
                onClick={() => {
                  onChange('');
                  setShowDropdown(false);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)]"
              >
                <span>Sem responsável</span>
              </button>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onChange(u.id);
                    setShowDropdown(false);
                  }}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-[var(--notion-hover)] text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{u.avatar || '👤'}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[var(--notion-text)] font-medium">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-[var(--notion-text-muted)] truncate">
                        {u.role}
                      </div>
                    </div>
                  </div>
                  {value === u.id && <Check size={12} className="text-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'checkbox':
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--notion-border)] text-blue-500 focus:ring-0 cursor-pointer"
          />
        </div>
      );

    case 'status':
    case 'select':
    case 'multi_select': {
      const options = property.options || [];
      const multi = property.type === 'multi_select';
      const selectedNames: string[] = multi ? (Array.isArray(value) ? value : []) : value ? [String(value)] : [];
      return (
        <div className="relative flex flex-wrap items-center gap-1">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex flex-wrap items-center gap-1 max-w-full px-1 py-0.5 rounded text-xs transition-colors hover:bg-[var(--notion-hover)]"
          >
            {selectedNames.length ? selectedNames.map((name) => {
              const opt = options.find((o) => o.name === name);
              return (
                <span key={name} className={`px-2 py-0.5 rounded-md font-medium truncate max-w-[180px] ${COLOR_CLASSES[opt?.color || 'gray']}`}>{name}</span>
              );
            }) : <span className="text-[var(--notion-text-muted)]/50">Vazio</span>}
            <ChevronDown size={11} className="text-[var(--notion-text-muted)] shrink-0" />
          </button>
          {showDropdown && (
            <OptionsMenu
              property={property}
              databaseId={databaseId}
              rowId={rowId}
              selected={selectedNames}
              multi={multi}
              onPick={(name) => {
                if (multi) onChange(selectedNames.includes(name) ? selectedNames.filter((n) => n !== name) : [...selectedNames, name]);
                else { onChange(name); setShowDropdown(false); }
              }}
              onClear={() => { onChange(multi ? [] : ''); setShowDropdown(false); }}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>
      );
    }

    case 'date':
      return (
        <div className="flex items-center gap-1 text-xs">
          <Calendar size={13} className="text-[var(--notion-text-muted)] shrink-0" />
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-xs text-[var(--notion-text)] focus:outline-none cursor-pointer"
          />
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          placeholder="0"
          className="w-full bg-transparent text-sm focus:outline-none text-[var(--notion-text)] font-mono"
        />
      );

    case 'url':
      return (
        <div className="flex items-center gap-1 w-full">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://"
            className="w-full bg-transparent text-xs text-blue-500 hover:underline focus:outline-none truncate"
          />
          {value && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--notion-text-muted)] hover:text-blue-500"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Vazio"
          className="w-full bg-transparent text-sm focus:outline-none text-[var(--notion-text)]"
        />
      );
  }
};

/** Lista de opções com busca, criação ("Criar ...") e remoção, conforme a regra da propriedade. */
const OptionsMenu: React.FC<{
  property: DatabaseProperty;
  databaseId?: string;
  rowId?: string;
  selected: string[];
  multi: boolean;
  onPick: (name: string) => void;
  onClear: () => void;
  onClose: () => void;
}> = ({ property, databaseId, rowId, selected, multi, onPick, onClear, onClose }) => {
  const edit = useNotionEdit();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const lock = databaseId ? edit.lockOf(databaseId, property.id) : null;
  const options = property.options || [];
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = options.filter((o) => norm(o.name).includes(norm(q.trim())));
  const exact = options.some((o) => norm(o.name) === norm(q.trim()));
  const canCreate = Boolean(databaseId) && lock !== 'fixed' && q.trim().length > 0 && !exact;
  const create = async () => {
    if (!databaseId || !canCreate || busy) return;
    setBusy(true); setErr('');
    try {
      const name = await edit.createOption(databaseId, property.id, q.trim(), rowId);
      if (name) { onPick(name); setQ(''); }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Não foi possível criar.');
    } finally { setBusy(false); }
  };
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-7 z-50 w-60 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-1 shadow-lg text-xs">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (shown.length === 1 && !canCreate) onPick(shown[0].name); else void create(); }
            if (e.key === 'Escape') onClose();
          }}
          placeholder={lock === 'fixed' ? 'Buscar…' : 'Buscar ou criar…'}
          className="w-full px-2 py-1 mb-1 rounded border border-[var(--notion-border)] bg-transparent focus:outline-none text-[var(--notion-text)]"
        />
        <div className="max-h-60 overflow-y-auto">
          {shown.map((opt) => (
            <div key={opt.id} className="group/opt flex items-center justify-between w-full rounded hover:bg-[var(--notion-hover)]">
              <button onClick={() => onPick(opt.name)} className="flex-1 flex items-center justify-between px-2 py-1 text-left min-w-0">
                <span className={`px-2 py-0.5 rounded truncate ${COLOR_CLASSES[opt.color]}`}>{opt.name}</span>
                {selected.includes(opt.name) && <Check size={12} className="text-blue-500 shrink-0" />}
              </button>
              {lock === null && databaseId && (
                <button
                  onClick={() => { if (window.confirm(`Remover a opção "${opt.name}"? Os itens que usam ela ficam vazios.`)) edit.removeOption(databaseId, property.id, opt.id); }}
                  className="opacity-0 group-hover/opt:opacity-100 p-1 mr-1 rounded text-[var(--notion-text-muted)] hover:text-red-500"
                  title="Remover opção"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          {canCreate && (
            <button onClick={() => void create()} disabled={busy} className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded hover:bg-[var(--notion-hover)] text-left disabled:opacity-50">
              <Plus size={12} />
              <span>{busy ? 'Criando…' : <>Criar <b>{q.trim()}</b></>}</span>
            </button>
          )}
          {!shown.length && !canCreate && <div className="px-2 py-1.5 text-[var(--notion-text-muted)]">{lock === 'fixed' ? 'Lista fixa: não aceita opção nova.' : 'Nenhuma opção.'}</div>}
          {lock === 'synced' && canCreate && <div className="px-2 pb-1 text-[10px] text-[var(--notion-text-muted)]">{SYNCED_HINT[property.id] || 'A opção nova também aparece nas outras telas do GaaS.'}</div>}
          {err && <div className="px-2 py-1 text-red-500">{err}</div>}
        </div>
        {selected.length > 0 && lock !== 'fixed' && (
          <button onClick={onClear} className="w-full mt-1 px-2 py-1 rounded text-left text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] border-t border-[var(--notion-border)]">
            {multi ? 'Limpar todas' : 'Limpar'}
          </button>
        )}
      </div>
    </>
  );
};
const SYNCED_HINT: Record<string, string> = {
  p_frente: 'Cria a frente também na Visão Daily.',
  p_projeto: 'Cria o projeto também na Visão Daily, na frente desta tarefa.',
  p_iniciativa: 'Cria a iniciativa também na aba de iniciativas.',
};
