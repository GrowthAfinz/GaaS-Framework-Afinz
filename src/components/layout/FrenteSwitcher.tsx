import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Frente } from '../../types/framework';

const FRENTES: { id: Frente; label: string; activeCls: string }[] = [
    { id: 'aquisicao', label: 'Aquisição', activeCls: 'bg-blue-50 text-blue-700' },
    { id: 'rentabilizacao', label: 'Rentabilização', activeCls: 'bg-emerald-50 text-emerald-700' },
];

/**
 * Toggle global de Frente — segmentado horizontal, alinhado à altura dos demais
 * controles do header. A frente ativa fica preenchida com a cor do contexto.
 */
export const FrenteSwitcher: React.FC = () => {
    const frente = useAppStore((s) => s.viewSettings.frente);
    const setFrente = useAppStore((s) => s.setFrente);

    return (
        <div className="inline-flex items-center h-8 rounded-md border border-slate-300 overflow-hidden">
            {FRENTES.map((f, i) => {
                const isActive = frente === f.id;
                return (
                    <button
                        key={f.id}
                        onClick={() => setFrente(f.id)}
                        className={[
                            'h-full px-3 text-xs font-medium transition-colors',
                            i > 0 ? 'border-l border-slate-200' : '',
                            isActive ? f.activeCls : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
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
