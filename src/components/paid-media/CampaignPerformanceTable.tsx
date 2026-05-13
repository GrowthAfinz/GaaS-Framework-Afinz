import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

export const CampaignPerformanceTable: React.FC = () => {
    const { paidMediaData } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter & Sort
    const filteredData = React.useMemo(() => {
        let result = [...paidMediaData];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(d =>
                d.campaign.toLowerCase().includes(lower) ||
                d.channel.toLowerCase().includes(lower)
            );
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key as keyof typeof a] || 0;
                const bVal = b[sortConfig.key as keyof typeof b] || 0;

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort: Date desc
            result.sort((a, b) => b.date.getTime() - a.date.getTime());
        }

        return result;
    }, [paidMediaData, searchTerm, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-slate-100 font-bold">Detalhamento de Campanhas</h3>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar campanha..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 w-64 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/80 sticky top-0 z-10 text-xs uppercase font-semibold text-slate-500">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:text-slate-300" onClick={() => handleSort('date')}>Data</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-slate-300" onClick={() => handleSort('channel')}>Canal</th>
                            <th className="px-6 py-3 cursor-pointer hover:text-slate-300" onClick={() => handleSort('campaign')}>Campanha</th>
                            <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('spend')}>Investimento</th>
                            <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('impressions')}>Impr.</th>
                            <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('clicks')}>Cliques</th>
                            <th className="px-6 py-3 text-right cursor-pointer hover:text-slate-300" onClick={() => handleSort('conversions')}>Conv.</th>
                            <th className="px-6 py-3 text-right">CPA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, idx) => {
                                const cpa = row.conversions > 0 ? row.spend / row.conversions : 0;
                                return (
                                    <tr key={`${row.campaign}-${idx}`} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-3">{format(row.date, 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase
                                                ${row.channel === 'meta' ? 'bg-blue-500/10 text-blue-400' :
                                                    row.channel === 'google' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-slate-700 text-slate-300'}`}>
                                                {row.channel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-200">{row.campaign}</td>
                                        <td className="px-6 py-3 text-right text-slate-200">{formatBRL(row.spend)}</td>
                                        <td className="px-6 py-3 text-right">{row.impressions.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right">{row.clicks.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right text-emerald-400 font-medium">{row.conversions.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right">{formatBRL(cpa)}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                    Nenhum dado encontrado para os filtros atuais.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
