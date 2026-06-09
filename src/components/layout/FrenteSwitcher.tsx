import React from 'react';
import { ShoppingCart, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Frente } from '../../types/framework';

const FRENTES: { id: Frente; label: string; icon: React.FC<{ size: number; className?: string }>; active: string }[] = [
    { id: 'aquisicao', label: 'Aquisição', icon: (p) => <ShoppingCart {...p} />, active: 'bg-white text-blue-600 border-slate-200 shadow-sm' },
    { id: 'rentabilizacao', label: 'Rentabilização', icon: (p) => <TrendingUp {...p} />, active: 'bg-white text-emerald-600 border-slate-200 shadow-sm' },
];

/**
 * Toggle global de Frente (Aquisição XOR Rentabilização) para as abas de análise
 * Launch / Relatórios / Jornada. Selecionar uma frente desativa a outra.
 */
export const FrenteSwitcher: React.FC = () => {
    const frente = useAppStore((s) => s.viewSettings.frente);
    const setFrente = useAppStore((s) => s.setFrente);

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:block">Frente:</span>
            <div className="flex bg-slate-100 rounded-md p-0.5 gap-0.5 border border-slate-200">
                {FRENTES.map((f) => {
                    const Icon = f.icon;
                    const isActive = frente === f.id;
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFrente(f.id)}
                            className={[
                                'px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 border',
                                isActive ? f.active : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white',
                            ].join(' ')}
                            title={`Visualizar frente de ${f.label}`}
                        >
                            <Icon size={12} className={isActive ? '' : 'opacity-60'} />
                            <span>{f.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
