import React, { useEffect, useRef, useState } from 'react';
import { Scaling, Check } from 'lucide-react';
import { SCALE_STEPS, useUIScale } from '../../context/UIScaleContext';

/**
 * Controle de densidade da interface no header.
 * "Automatico" ajusta a escala pela largura da janela; os presets fixos
 * espelham os passos de zoom do navegador e ficam salvos no navegador.
 */
export const UIScaleControl: React.FC = () => {
    const { preference, scale, setPreference } = useUIScale();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', onEsc);
        };
    }, [isOpen]);

    const percent = Math.round(scale * 100);
    const isCompact = scale < 1;

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className={`flex items-center gap-1.5 p-2 rounded-lg transition-all ${
                    isOpen
                        ? 'text-slate-800 bg-slate-100'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={`Densidade da interface — ${preference === 'auto' ? 'automatica' : 'fixa'} (${percent}%)`}
            >
                <Scaling size={18} />
                {isCompact && (
                    <span className="text-[11px] font-semibold tabular-nums leading-none">{percent}%</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[9999]">
                    <div className="px-3 pt-3 pb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Densidade da interface
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                            Quanto menor, mais conteudo cabe na tela.
                        </p>
                    </div>

                    <div className="pb-1">
                        <button
                            onClick={() => {
                                setPreference('auto');
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                        >
                            <span className="flex-1 text-sm font-medium text-slate-700">
                                Automatico
                                <span className="ml-1.5 text-[11px] font-normal text-slate-400 tabular-nums">
                                    ajusta a tela · {percent}%
                                </span>
                            </span>
                            {preference === 'auto' && <Check size={14} className="text-cyan-600 shrink-0" />}
                        </button>

                        <div className="border-t border-slate-100 mx-3 my-1" />

                        {SCALE_STEPS.map((step) => (
                            <button
                                key={step.value}
                                onClick={() => {
                                    setPreference(step.value);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                            >
                                <span className="w-10 text-sm font-semibold text-slate-700 tabular-nums">
                                    {step.label}
                                </span>
                                <span className="flex-1 text-[11px] text-slate-400">{step.hint}</span>
                                {preference === step.value && (
                                    <Check size={14} className="text-cyan-600 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
