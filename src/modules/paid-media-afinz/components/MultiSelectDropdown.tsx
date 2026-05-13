import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrar opções baseado em busca
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus no input de busca quando abre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
    setSearchTerm('');
  };

  const displayLabel = selected.length === 0
    ? placeholder || `${label} (${options.length})`
    : selected.length === options.length
    ? `${label} - Todos (${selected.length})`
    : `${label} (${selected.length})`;

  return (
    <div className="relative min-w-[180px] max-w-xs flex-1" ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || options.length === 0}
        className={`w-full bg-white border text-xs font-medium rounded-md py-1.5 px-2.5 pr-8 focus:ring-1 focus:ring-[#00C6CC] outline-none transition-colors flex items-center gap-2
          ${disabled || options.length === 0
            ? 'border-slate-100 text-slate-400 cursor-not-allowed'
            : 'border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer'
          }
          ${isOpen ? 'border-[#00C6CC] ring-1 ring-[#00C6CC]' : ''}`}
      >
        {icon && <span className="text-slate-500">{icon}</span>}
        <span className="truncate flex-1 text-left">{displayLabel}</span>
      </button>

      {/* Chevron Icon */}
      <ChevronDown
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`}
      />

      {/* Dropdown Panel */}
      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50">
          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded px-2 py-1 pl-7 text-xs focus:ring-1 focus:ring-[#00C6CC] outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="w-4 h-4 rounded border-slate-300 text-[#00C6CC] focus:ring-[#00C6CC]"
                  />
                  <span className="flex-1 text-slate-700">{option}</span>
                </label>
              ))
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="p-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                {selected.length} selecionado(s)
              </span>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
