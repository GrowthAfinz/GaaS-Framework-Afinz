import React from 'react';
import { X, FileText } from 'lucide-react';
import { FrameworkRow } from '../../types/framework';

// ─── Config ───────────────────────────────────────────────────────────────────

export const BU_CONFIG: Record<string, { dot: string; text: string; folder: string; bg: string; border: string }> = {
    'B2C':   { dot: 'bg-blue-400',    text: 'text-blue-600',    folder: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-l-2 border-blue-400' },
    'B2B2C': { dot: 'bg-emerald-400', text: 'text-emerald-600', folder: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-l-2 border-emerald-400' },
    'Plurix': { dot: 'bg-purple-400',  text: 'text-purple-600',  folder: 'text-purple-500',  bg: 'bg-purple-50',  border: 'border-l-2 border-purple-400' },
};

export const CANAL_EMOJI: Record<string, string> = {
    'E-mail':    '✉',
    'SMS':       '💬',
    'WhatsApp':  '📱',
    'Push':      '🔔',
};

export const METRIC_SECTIONS = [
    {
        id: 'campanha', emoji: '📦', label: 'Campanha',
        keys: ['BU', 'Jornada', 'Segmento', 'Canal', 'Etapa de aquisição', 'Perfil de Crédito', 'Produto', 'Oferta', 'Promocional', 'SIGLA', 'Oferta 2', 'Promocional 2', 'Ordem de disparo', 'Data de Disparo'],
    },
    {
        id: 'base', emoji: '📊', label: 'Base & Alcance',
        keys: ['Base Total', 'Base Acionável', '% Otimização de base'],
    },
    {
        id: 'custos', emoji: '💰', label: 'Custos',
        keys: ['Custo Unitário Oferta', 'Custo Total da Oferta', 'Custo unitário do canal', 'Custo total canal', 'Custo Total Campanha', 'CAC'],
    },
    {
        id: 'performance', emoji: '📈', label: 'Performance',
        keys: ['Taxa de Entrega', 'Taxa de Abertura', 'Taxa de Clique', 'Taxa de Proposta', 'Taxa de Aprovação', 'Taxa de Finalização', 'Taxa de Conversão'],
    },
    {
        id: 'resultados', emoji: '🎯', label: 'Resultados',
        keys: ['Cartões Gerados', 'Aprovados', 'Propostas'],
    },
];

export const KNOWN_KEYS = new Set(
    METRIC_SECTIONS.flatMap(s => s.keys).concat(['Activity name / Taxonomia', '_origIdx'])
);

// ─── DetailPanel ──────────────────────────────────────────────────────────────

export interface DetailPanelProps {
    row: (FrameworkRow & { _origIdx: number }) | null;
    allColumns: string[];
    onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ row, allColumns, onClose }) => {
    const extraKeys = allColumns.filter(c => c !== '_origIdx' && !KNOWN_KEYS.has(c));

    const renderValue = (val: unknown) => {
        const s = String(val ?? '');
        if (!s || s === 'N/A' || s === 'undefined') return <span className="text-slate-300">—</span>;
        return <span className="text-slate-800 font-semibold text-xs">{s}</span>;
    };

    if (!row) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 px-4">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs text-center">Clique em uma linha para ver os detalhes</p>
            </div>
        );
    }

    const taxonomia = String((row as Record<string, unknown>)['Activity name / Taxonomia'] ?? '—');
    const bu = String((row as Record<string, unknown>)['BU'] ?? '');
    const canal = String((row as Record<string, unknown>)['Canal'] ?? '');
    const dataDisparo = String((row as Record<string, unknown>)['Data de Disparo'] ?? '');
    const buCfg = BU_CONFIG[bu] || BU_CONFIG['B2C'];

    return (
        <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {bu && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${buCfg.bg} ${buCfg.text}`}>{bu}</span>}
                            {canal && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{CANAL_EMOJI[canal] ?? ''} {canal}</span>}
                            {dataDisparo && <span className="text-[10px] text-slate-400 ml-auto">{dataDisparo}</span>}
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 leading-snug font-mono break-all">{taxonomia}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors shrink-0">
                        <X size={13} />
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Linha #{((row as Record<string, unknown>)._origIdx as number ?? 0) + 1}</p>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                {METRIC_SECTIONS.map(section => {
                    const entries = section.keys.map(k => ({ key: k, val: (row as Record<string, unknown>)[k] }));
                    const hasValues = entries.some(e => {
                        const s = String(e.val ?? '');
                        return s && s !== 'N/A' && s !== 'undefined' && s !== '';
                    });
                    if (!hasValues) return null;
                    return (
                        <div key={section.id}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-sm leading-none">{section.emoji}</span>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.label}</h3>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {entries.map(({ key, val }) => (
                                    <div key={key} className="bg-slate-50 border border-slate-100 rounded-md p-2 hover:border-slate-200 transition-colors">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate" title={key}>{key}</p>
                                        <div>{renderValue(val)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {extraKeys.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm">🔧</span>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outros</h3>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {extraKeys.map(col => (
                                <div key={col} className="bg-slate-50 border border-slate-100 rounded-md p-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate" title={col}>{col}</p>
                                    <div>{renderValue((row as Record<string, unknown>)[col])}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
