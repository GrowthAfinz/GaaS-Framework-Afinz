import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCampaignMappings } from '../../hooks/useCampaignMappings';
import { useFilters } from '../../context/FilterContext';

interface CampaignMapperModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CampaignMapperModal: React.FC<CampaignMapperModalProps> = ({ isOpen, onClose }) => {
    const { rawData } = useFilters();
    const { mappings, isLoading, updateMapping } = useCampaignMappings();
    const [searchTerm, setSearchTerm] = useState('');

    // Extract all unique campaigns from the current loaded dataset
    const allCampaigns = useMemo(() => {
        const unique = new Set<string>();
        rawData.forEach(item => unique.add(item.campaign));
        return Array.from(unique).sort();
    }, [rawData]);

    // Filter by search term
    const filteredCampaigns = useMemo(() => {
        if (!searchTerm) return allCampaigns;
        const lowerSearch = searchTerm.toLowerCase();
        return allCampaigns.filter(c => c.toLowerCase().includes(lowerSearch));
    }, [allCampaigns, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Mapeamento de Campanhas (De-Para)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Classifique as campanhas importadas da Meta/Google para os objetivos de negócio correntes.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-white">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar campanha..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/20 focus:border-[#00C6CC] transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
                            <CheckCircle2 size={16} />
                            <span>{mappings.length} Mapeadas</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
                            <AlertCircle size={16} />
                            <span>{allCampaigns.length - mappings.length} Pendentes</span>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-slate-50 relative p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#00C6CC]" />
                            <p>Carregando mapeamentos...</p>
                        </div>
                    ) : filteredCampaigns.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                            <p className="text-slate-500">Nenhuma campanha encontrada.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
                                    <tr>
                                        <th className="px-5 py-3">Nome da Campanha (Original)</th>
                                        <th className="px-5 py-3 w-40">Status</th>
                                        <th className="px-5 py-3 w-48">Objetivo (De-Para)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCampaigns.map(campaignName => {
                                        const mappingEntry = mappings.find(m => m.campaign_name === campaignName);
                                        const isMapped = !!mappingEntry;
                                        
                                        // Default to the mapping value, or empty if pending
                                        const selectValue = isMapped ? mappingEntry.objective : '';

                                        return (
                                            <tr key={campaignName} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-700">
                                                    {campaignName}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {isMapped ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                                            <CheckCircle2 size={12} /> Mapeado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                                                            <AlertCircle size={12} /> Pendente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <select
                                                        value={selectValue}
                                                        onChange={(e) => {
                                                            const val = e.target.value as 'marca' | 'b2c' | 'plurix';
                                                            if (val) {
                                                                updateMapping(campaignName, val);
                                                            }
                                                        }}
                                                        className={`w-full text-sm rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00C6CC]/20 transition-all cursor-pointer hover:bg-slate-50
                                                            ${isMapped ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}
                                                        `}
                                                    >
                                                        <option value="" disabled>Selecionar...</option>
                                                        <option value="marca">Branding (Marca)</option>
                                                        <option value="b2c">Performance (B2C)</option>
                                                        <option value="plurix">Plurix</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    );
};
