import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FilterState } from '../types/framework';

interface FilterSidebarProps {
  availableCanais?: string[];
  availableJornadas?: string[];
  availableSegmentos?: string[];
  availableParceiros?: string[];
  countByCanal?: { [canal: string]: number };
  countByJornada?: { [jornada: string]: number };
  countBySegmento?: { [segmento: string]: number };
  countByParceiro?: { [parceiro: string]: number };
  onClose?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  availableCanais = [],
  availableJornadas = [],
  availableSegmentos = [],
  availableParceiros = [],
  countByCanal = {},
  countByJornada = {},
  countBySegmento = {},
  countByParceiro = {},
  onClose
}) => {
  const { viewSettings, setGlobalFilters } = useAppStore();
  const filters = viewSettings.filtrosGlobais;

  const [jornadaSearch, setJornadaSearch] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    canal: true,
    jornada: false,
    segmento: false,
    parceiro: false
  });

  const filteredJornadas = availableJornadas.filter(j =>
    j.toLowerCase().includes(jornadaSearch.toLowerCase())
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generic toggle helper for array-based filters
  const toggleItem = (field: keyof FilterState, value: string) => {
    const currentList = filters[field] as string[];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    setGlobalFilters({ [field]: newList });
  };

  // Select All Helpers
  const toggleAll = (field: keyof FilterState, available: string[]) => {
    const currentList = filters[field] as string[];
    const allSelected = available.every(item => currentList.includes(item));

    if (allSelected) {
      const newList = currentList.filter(item => !available.includes(item));
      setGlobalFilters({ [field]: newList });
    } else {
      const toAdd = available.filter(item => !currentList.includes(item));
      setGlobalFilters({ [field]: [...currentList, ...toAdd] });
    }
  };

  const areAllSelected = (field: keyof FilterState, available: string[]) => {
    const currentList = filters[field] as string[];
    return available.length > 0 && available.every(item => currentList.includes(item));
  };

  const clearFilters = () => {
    setGlobalFilters({
      canais: [],
      segmentos: [],
      parceiros: [],
      ofertas: [],
      disparado: 'Todos'
    });
    setJornadaSearch('');
  };

  return (
    <div className="w-full bg-transparent h-full flex flex-col">
      {/* Header matching Sidebar padding */}
      <div className="p-4 flex items-center justify-between shrink-0">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Filtros
        </p>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6">


        {/* Canal Filter */}
        {availableCanais.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('canal')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Canais</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.canal ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.canal && (
              <div className="space-y-2 pl-2">
                <button
                  onClick={() => toggleAll('canais', availableCanais)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('canais', availableCanais)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('canais', availableCanais) ? '✓ Todos' : 'Todos'}
                </button>

                {availableCanais.map(canal => (
                  <label key={canal} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.canais.includes(canal)}
                      onChange={() => toggleItem('canais', canal)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">{canal}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countByCanal[canal] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jornada Filter (NEW) */}
        {availableJornadas && availableJornadas.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('jornada')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Jornadas</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.jornada ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.jornada && (
              <div className="space-y-2 pl-2">
                {/* Search Input */}
                <div className="flex items-center bg-slate-800 rounded px-2 py-1.5 border border-slate-700 mb-2">
                  <Search size={14} className="text-slate-500 mr-2" />
                  <input
                    type="text"
                    placeholder="Buscar jornada..."
                    value={jornadaSearch}
                    onChange={(e) => setJornadaSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder-slate-600"
                  />
                </div>

                {/* Visible Jornadas List (Filtered) */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <button
                    onClick={() => toggleAll('jornadas', filteredJornadas)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('jornadas', filteredJornadas)
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                      }`}
                  >
                    {areAllSelected('jornadas', filteredJornadas)
                      ? (jornadaSearch ? '✓ Todas Visíveis' : '✓ Todas')
                      : (jornadaSearch ? 'Selecionar Visíveis' : 'Todas')}
                  </button>

                  {filteredJornadas.length > 0 ? (
                    filteredJornadas.map(jornada => (
                      <label key={jornada} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                        <input
                          type="checkbox"
                          checked={filters.jornadas.includes(jornada)}
                          onChange={() => toggleItem('jornadas', jornada)}
                          className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="text-slate-300 text-sm truncate" title={jornada}>{jornada}</span>
                        <span className="text-slate-500 text-xs ml-auto shrink-0">({countByJornada?.[jornada] || 0})</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 p-2 italic">Nenhuma jornada encontrada</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Segmento Filter */}
        {availableSegmentos.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('segmento')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Segmentos</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.segmento ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.segmento && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => toggleAll('segmentos', availableSegmentos)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('segmentos', availableSegmentos)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('segmentos', availableSegmentos) ? '✓ Todos' : 'Todos'}
                </button>

                {availableSegmentos.map(segmento => (
                  <label key={segmento} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.segmentos.includes(segmento)}
                      onChange={() => toggleItem('segmentos', segmento)}
                      className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-300 text-sm">{segmento}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countBySegmento[segmento] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parceiro Filter */}
        {availableParceiros.length > 0 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <button
              onClick={() => toggleSection('parceiro')}
              className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded transition"
            >
              <p className="text-sm font-semibold text-slate-400 uppercase">Parceiros</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedSections.parceiro ? 'rotate-180' : ''}`} />
            </button>
            {expandedSections.parceiro && (
              <div className="space-y-2 pl-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => toggleAll('parceiros', availableParceiros)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition ${areAllSelected('parceiros', availableParceiros)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {areAllSelected('parceiros', availableParceiros) ? '✓ Todos' : 'Todos'}
                </button>

                {availableParceiros.map(parceiro => (
                  <label key={parceiro} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-800 rounded transition">
                    <input
                      type="checkbox"
                      checked={filters.parceiros.includes(parceiro)}
                      onChange={() => toggleItem('parceiros', parceiro)}
                      className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-slate-300 text-sm">{parceiro}</span>
                    <span className="text-slate-500 text-xs ml-auto">({countByParceiro[parceiro] || 0})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      <div className="pt-4 border-t border-slate-700 mt-4">
        <button
          onClick={clearFilters}
          className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition text-sm font-semibold border border-slate-600"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
