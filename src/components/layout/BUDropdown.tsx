import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, Check } from 'lucide-react';
import { useBU, BU } from '../../contexts/BUContext';

const BU_OPTIONS: { id: BU; label: string; color: string }[] = [
    { id: 'B2C', label: 'B2C', color: 'bg-blue-500' },
    { id: 'B2B2C', label: 'B2B2C', color: 'bg-emerald-500' },
    { id: 'Plurix', label: 'Plurix', color: 'bg-purple-500' },
    { id: 'Seguros', label: 'Seguros', color: 'bg-orange-500' },
];

/**
 * Seletor de BU compacto: um botão único com mini-bolinhas das BUs ativas + contador.
 * Clica e abre um popover com os 4 toggles (multi-seleção) + Todas/Limpar.
 * Reutiliza o contexto useBU (mantém o efeito Seguros→Rentabilização no GlobalHeader).
 */
export const BUDropdown: React.FC = () => {
    const { toggleBU, isBUSelected, selectAll, deselectAll, isBULocked, selectedBUs } = useBU();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedCount = selectedBUs.length;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => !isBULocked && setOpen((v) => !v)}
                disabled={isBULocked}
                className={[
                    'flex items-center gap-2 h-8 px-3 rounded-md border border-slate-300 bg-white transition-colors',
                    isBULocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50',
                ].join(' ')}
                title={isBULocked ? 'BU travada pelo seu perfil' : 'Filtrar por BU'}
            >
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">BU</span>
                {isBULocked && <Lock size={11} className="text-amber-500" />}
                <div className="flex items-center gap-0.5">
                    {BU_OPTIONS.filter((bu) => isBUSelected(bu.id)).map((bu) => (
                        <span key={bu.id} className={`w-1.5 h-1.5 rounded-full ${bu.color}`} />
                    ))}
                    {selectedCount === 0 && <span className="text-[11px] text-slate-400">nenhuma</span>}
                </div>
                <span className="text-xs font-semibold text-slate-600 tabular-nums">{selectedCount}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[9999] py-1">
                    {BU_OPTIONS.map((bu) => {
                        const active = isBUSelected(bu.id);
                        return (
                            <button
                                key={bu.id}
                                onClick={() => toggleBU(bu.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-left"
                            >
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300'}`}>
                                    {active && <Check size={11} className="text-white" />}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full ${bu.color}`} />
                                <span className="text-sm text-slate-700 font-medium">{bu.label}</span>
                            </button>
                        );
                    })}
                    <div className="flex items-center justify-between border-t border-slate-100 mt-1 px-3 pt-1.5">
                        <button onClick={selectAll} className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700">Todas</button>
                        <button onClick={deselectAll} className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">Limpar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
