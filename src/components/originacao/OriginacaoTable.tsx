import React, { useState, useMemo } from 'react';
import { DailyAnalysis } from '../../types/b2c';
import { ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface OriginacaoTableProps {
    data: DailyAnalysis[];
    onRowClick?: (date: string) => void;
}

type SortKey = keyof DailyAnalysis | 'date_timestamp';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

export const OriginacaoTable: React.FC<OriginacaoTableProps> = ({ data, onRowClick }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'data', direction: 'asc' }); // Default sort by date ASC (Oldest First)

    // Sorting Logic
    const sortedData = useMemo(() => {
        const sorted = [...data];

        sorted.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof DailyAnalysis];
            const bValue = b[sortConfig.key as keyof DailyAnalysis];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [data, sortConfig]);

    // Apply Pagination AND Sorting - Adjusted for larger view
    const itemsPerPage = 25; // User requested bigger table
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page on sort
    };

    const getSortIcon = (name: SortKey) => {
        if (sortConfig.key === name) {
            return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
        }
        return <ArrowUpDown size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    };

    const handleExport = () => {
        // Use sortedData instead of raw data
        const headers = [
            'Data', 'Prop CRM', 'Emiss CRM', 'Prop B2C Total', 'Emiss B2C Total',
            '% Share Prop', '% Share Emiss', '% Conv CRM', '% Conv B2C', 'Perf Index', 'CAC'
        ];

        const rows = sortedData.map(d => [
            d.data,
            d.propostas_crm,
            d.emissoes_crm,
            d.propostas_b2c_total,
            d.emissoes_b2c_total,
            d.share_propostas_crm_percentual.toFixed(2).replace('.', ','),
            d.share_emissoes_crm_percentual.toFixed(2).replace('.', ','),
            d.taxa_conversao_crm.toFixed(2).replace('.', ','),
            d.taxa_conversao_b2c.toFixed(2).replace('.', ','),
            d.performance_index.toFixed(2).replace('.', ','),
            d.cac_medio.toFixed(2).replace(',', '.')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(r => r.join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `originacao_b2c_sorted.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper for easier header code
    const SortableHeader = ({ label, sortKey, align = 'right' }: { label: string, sortKey: SortKey, align?: string }) => (
        <th
            className={`px-4 py-4 cursor-pointer hover:bg-slate-100 transition select-none group border-b border-slate-200 border-r border-slate-300 last:border-r-0 ${align === 'right' ? 'text-right' : 'text-left'}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center gap-2 font-semibold text-slate-700 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                {getSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800">Detalhamento Diário</h3>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-sm text-slate-600 font-medium transition shadow-sm"
                >
                    <Download size={14} /> Exportar ({sortedData.length})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                        <tr>
                            <SortableHeader label="Data" sortKey="data" align="left" />
                            <SortableHeader label="Vol. Entregas" sortKey="entregas_crm" />
                            <SortableHeader label="Custo" sortKey="custo_crm" />
                            <SortableHeader label="Prop CRM" sortKey="propostas_crm" />
                            <SortableHeader label="Emiss CRM" sortKey="emissoes_crm" />
                            <SortableHeader label="Prop B2C" sortKey="propostas_b2c_total" />
                            <SortableHeader label="Emiss B2C" sortKey="emissoes_b2c_total" />
                            <SortableHeader label="% Share" sortKey="share_emissoes_crm_percentual" />
                            <SortableHeader label="% Conv CRM" sortKey="taxa_conversao_crm" />
                            <SortableHeader label="% Conv B2C" sortKey="taxa_conversao_b2c" />
                            <SortableHeader label="CAC" sortKey="cac_medio" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.map((row) => (
                            <tr
                                key={row.data}
                                className={`cursor-pointer hover:bg-blue-50/50 transition ${row.eh_anomalia ? 'bg-red-50' : 'bg-white'}`}
                                onClick={() => onRowClick && onRowClick(row.data)}
                            >
                                <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap border-r border-slate-300 last:border-r-0">
                                    {row.data.split('-').reverse().join('/')}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-300 last:border-r-0">{row.entregas_crm.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-300 last:border-r-0">R$ {row.custo_crm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-300 last:border-r-0">{row.propostas_crm}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800 border-r border-slate-300 last:border-r-0">{row.emissoes_crm}</td>
                                <td className="px-4 py-3 text-right text-slate-500 border-r border-slate-300 last:border-r-0">{row.propostas_b2c_total}</td>
                                <td className="px-4 py-3 text-right text-slate-500 border-r border-slate-300 last:border-r-0">{row.emissoes_b2c_total}</td>
                                <td className="px-4 py-3 text-right border-r border-slate-300 last:border-r-0">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.share_emissoes_crm_percentual < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {row.share_emissoes_crm_percentual.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-600 font-medium border-r border-slate-300 last:border-r-0">
                                    {row.taxa_conversao_crm.toFixed(1)}%
                                </td>
                                <td className="px-4 py-3 text-right text-slate-500 border-r border-slate-300 last:border-r-0">
                                    {row.taxa_conversao_b2c.toFixed(1)}%
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-300 last:border-r-0">R$ {row.cac_medio.toFixed(0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Light Theme */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex justify-center items-center gap-4 bg-slate-50/50">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-600">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500 transition"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};
