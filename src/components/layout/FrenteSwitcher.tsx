import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Frente } from '../../types/framework';

const FRENTES: { id: Frente; label: string; active: string }[] = [
    { id: 'aquisicao', label: 'Aquisição', active: 'bg-white text-blue-600 border-slate-200 shadow-sm' },
    { id: 'rentabilizacao', label: 'Rentabilização', active: 'bg-white text-emerald-600 border-slate-200 shadow-sm' },
];

/**
 * Toggle global de Frente (Aquisição XOR Rentabilização) — compacto e empilhado
 * vertical, sem ícones. Selecionar uma frente desativa a outra.
 */
export const FrenteSwitcher: React.FC = () => {
    const frente = useAppStore((s) => s.viewSettings.frente);
    const setFrente = useAppStore((s) => s.setFrente);

    return (
        <div className="flex flex-col gap-0.5 bg-slate-100 rounded-md p-0.5 border border-slate-200">
            {FRENTES.map((f) => {
                const isActive = frente === f.id;
                return (
                    <button
                        key={f.id}
                        onClick={() => setFrente(f.id)}
                        className={[
                            'px-2 py-0.5 rounded text-[10px] font-semibold leading-tight transition-all border text-left',
                            isActive ? f.active : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white',
                        ].join(' ')}
                        title={`Visualizar frente de ${f.label}`}
                    >
                        {f.label}
                    </button>
                );
            })}
        </div>
    );
};
