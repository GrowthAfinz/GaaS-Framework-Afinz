import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { SearchResult } from '../../../types/explorer';
import { TreeNodeIcon } from '../tree/TreeNodeIcon';

interface QuickSearchProps {
  query: string;
  results: SearchResult[];
  onChange: (q: string) => void;
  onSelect: (nodeId: string) => void;
  onClear: () => void;
  focusOnMount?: boolean;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  query,
  results,
  onChange,
  onSelect,
  onClear,
  focusOnMount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus();
  }, [focusOnMount]);

  const showResults = query.trim().length > 0;

  return (
    <div className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar jornada, segmento..."
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
          aria-label="Buscar nó na árvore"
        />
        {query && (
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Limpar busca"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {showResults && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500 text-center">Nenhum resultado</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((r) => (
                <li key={r.node.id}>
                  <button
                    onClick={() => {
                      onSelect(r.node.id);
                      onClear();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/60 transition-colors"
                  >
                    <TreeNodeIcon
                      type={r.node.type}
                      label={r.node.label}
                      color={r.node.color}
                      size={12}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.node.label}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {r.path.join(' › ')}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums shrink-0">{r.node.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
