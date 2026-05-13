import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { CalendarData, Activity } from '../types/framework';

interface ResultsTableProps {
    data: CalendarData;
}

interface CombinationRow {
    id: string;
    canal: string;
    oferta: string;
    segmento: string;
    envios: number;
    pedidos: number;
    aprovacoes: number;
    cartoes: number;
    custo: number;
    cac: number;
    conversao: number;
}

type SortField = 'canal' | 'oferta' | 'segmento' | 'envios' | 'pedidos' | 'aprovacoes' | 'cartoes' | 'custo' | 'cac' | 'conversao';
type SortDirection = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
    const [sortField, setSortField] = useState<SortField>('cartoes');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const combinations = useMemo(() => {
        const groups: { [key: string]: CombinationRow } = {};

        Object.values(data).flat().forEach((activity: Activity) => {
            const key = `${activity.canal}-${activity.oferta || 'Padrao'}-${activity.segmento}`;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    canal: activity.canal,
                    oferta: activity.oferta || 'Padrao',
                    segmento: activity.segmento,
                    envios: 0,
                    pedidos: 0,
                    aprovacoes: 0,
                    cartoes: 0,
                    custo: 0,
                    cac: 0,
                    conversao: 0
                };
            }

            const group = groups[key];
            const kpis = activity.kpis;

            group.envios += kpis.baseEnviada || 0;
            group.pedidos += kpis.propostas || 0;
            group.aprovacoes += kpis.aprovados || 0;
            group.cartoes += kpis.cartoes || 0;
            group.custo += kpis.custoTotal || 0;
        });

        // Calculate calculated metrics (CAC, Conversion)
        return Object.values(groups).map(group => ({
            ...group,
            cac: group.cartoes > 0 ? group.custo / group.cartoes : 0,
            conversao: group.envios > 0 ? (group.cartoes / group.envios) * 100 : 0
        }));
    }, [data]);

    const sortedAndFilteredData = useMemo(() => {
        let result = combinations;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(row =>
                row.canal.toLowerCase().includes(term) ||
                row.oferta.toLowerCase().includes(term) ||
                row.segmento.toLowerCase().includes(term)
            );
        }

        return result.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });
    }, [combinations, sortField, sortDirection, searchTerm]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-600" />;
        return sortDirection === 'asc'
            ? <ArrowUp size={14} className="text-blue-400" />
            : <ArrowDown size={14} className="text-blue-400" />;
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('pt-BR').format(val);

    const formatPercent = (val: number) =>
        val.toFixed(2) + '%';

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-slate-100">Tabela de Combinações</h2>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar canal, oferta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900/50 text-slate-400 font-medium">
                        <tr>
                            <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('canal')}>
                                <div className="flex items-center gap-2">Canal <SortIcon field="canal" /></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('oferta')}>
                                <div className="flex items-center gap-2">Oferta <SortIcon field="oferta" /></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('segmento')}>
                                <div className="flex items-center gap-2">Segmento <SortIcon field="segmento" /></div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('envios')}>
                                <div className="flex items-center justify-end gap-2">Envios <SortIcon field="envios" /></div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('cartoes')}>
                                <div className="flex items-center justify-end gap-2">Cartões <SortIcon field="cartoes" /></div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('conversao')}>
                                <div className="flex items-center justify-end gap-2">Conv. <SortIcon field="conversao" /></div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('cac')}>
                                <div className="flex items-center justify-end gap-2">CAC <SortIcon field="cac" /></div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('custo')}>
                                <div className="flex items-center justify-end gap-2">Custo <SortIcon field="custo" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {sortedAndFilteredData.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-700/30 transition">
                                <td className="px-4 py-3 font-medium text-slate-200">{row.canal}</td>
                                <td className="px-4 py-3 text-slate-300">{row.oferta}</td>
                                <td className="px-4 py-3 text-slate-300">{row.segmento}</td>
                                <td className="px-4 py-3 text-right text-slate-400">{formatNumber(row.envios)}</td>
                                <td className="px-4 py-3 text-right font-bold text-blue-400">{formatNumber(row.cartoes)}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{formatPercent(row.conversao)}</td>
                                <td className={`px-4 py-3 text-right font-medium ${row.cac > 50 ? 'text-red-400' : 'text-slate-200'}`}>
                                    {formatCurrency(row.cac)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(row.custo)}</td>
                            </tr>
                        ))}
                        {sortedAndFilteredData.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                    Nenhuma combinação encontrada
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
