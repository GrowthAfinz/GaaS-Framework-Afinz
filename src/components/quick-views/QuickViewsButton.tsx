import React from 'react';
import { ChevronDown, ChevronRight, Crosshair, Search, RotateCcw } from 'lucide-react';
import { FilterState } from '../../types/framework';
import { QuickViewBUNode, EMPTY_DIMENSION } from '../../hooks/useQuickViewTree';
import { formatSegmentText } from '../relatorio/segmentLabels';
import { useBU, BU } from '../../contexts/BUContext';

interface QuickViewsButtonProps {
    tree: QuickViewBUNode[];
    onApply: (patch: Partial<FilterState>) => void;
    onOpenChange?: (isOpen: boolean) => void;
}

const BU_DOT: Record<string, string> = {
    B2C: 'bg-blue-500',
    B2B2C: 'bg-emerald-500',
    Plurix: 'bg-purple-500',
    Seguros: 'bg-orange-500'
};

/**
 * Rótulo de dimensão residual. O valor bruto continua sendo o que vai ao filtro —
 * isto é só leitura humana (ver nota sobre "N/A" ambíguo em `useQuickViewTree`).
 */
const dimensionLabel = (value: string, kind: 'parceiro' | 'segmento') => {
    if (value === EMPTY_DIMENSION) return kind === 'parceiro' ? 'Sem parceiro' : 'Sem segmento';
    if (value.toUpperCase() === 'N/A') return 'Não mapeado (N/A)';
    return kind === 'segmento' ? formatSegmentText(value) : value;
};

const matches = (value: string, query: string) => value.toLowerCase().includes(query);

/**
 * Visões Rápidas: árvore BU > Parceiro > Segmento com aplicação em 1 clique.
 *
 * Duas regras de produto que este componente implementa e que não são óbvias no código:
 *  1. Aplicar é SUBSTITUIÇÃO, não acúmulo — canais/jornadas/subgrupos/ofertas são
 *     limpos junto, para que a visão seja sempre um estado previsível.
 *  2. O período NÃO é tocado — é dimensão ortogonal, controlada pelo PeriodSelector.
 */
export const QuickViewsButton: React.FC<QuickViewsButtonProps> = ({ tree, onApply, onOpenChange }) => {
    const { selectedBUs, setSelectedBUs, isBULocked } = useBU();

    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    // Perfis com BU travada não podem navegar para fora do seu escopo.
    const visibleTree = React.useMemo(() => {
        if (!isBULocked) return tree;
        return tree.filter(node => selectedBUs.includes(node.value as BU));
    }, [tree, isBULocked, selectedBUs]);

    const query = searchTerm.trim().toLowerCase();

    // Na busca, mantém o galho inteiro quando qualquer nível casa e força a expansão —
    // buscar "bem barato" precisa revelar os segmentos dele sem clique extra.
    const filteredTree = React.useMemo(() => {
        if (!query) return visibleTree;

        return visibleTree
            .map(bu => {
                const buHit = matches(bu.value, query);
                const parceiros = bu.parceiros
                    .map(parceiro => {
                        const parceiroHit = matches(dimensionLabel(parceiro.value, 'parceiro'), query);
                        const segmentos = parceiro.segmentos.filter(seg =>
                            buHit || parceiroHit || matches(dimensionLabel(seg.value, 'segmento'), query)
                        );
                        if (!buHit && !parceiroHit && segmentos.length === 0) return null;
                        return { ...parceiro, segmentos };
                    })
                    .filter(Boolean) as QuickViewBUNode['parceiros'];

                if (!buHit && parceiros.length === 0) return null;
                return { ...bu, parceiros };
            })
            .filter(Boolean) as QuickViewBUNode[];
    }, [visibleTree, query]);

    const isExpanded = (key: string) => (query ? true : expanded.has(key));

    const toggleExpand = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    React.useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    React.useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    /**
     * A visão vive em DOIS estados distintos: a BU no BUContext (localStorage) e
     * parceiro/segmento nos filtros globais do store. Aplicar precisa escrever nos dois.
     */
    const applyView = (bu: string, parceiro?: string, segmento?: string) => {
        if (!isBULocked) {
            setSelectedBUs([bu as BU]);
        }

        onApply({
            parceiros: parceiro !== undefined ? [parceiro] : [],
            segmentos: segmento !== undefined ? [segmento] : [],
            // Substituição, não acúmulo — sem isto um canal esquecido devolve tela vazia.
            canais: [],
            jornadas: [],
            subgrupos: [],
            ofertas: [],
            disparado: 'Todos'
        });

        setIsOpen(false);
        setSearchTerm('');
    };

    const resetView = () => {
        if (!isBULocked) {
            setSelectedBUs(tree.map(node => node.value as BU));
        }
        onApply({
            parceiros: [],
            segmentos: [],
            canais: [],
            jornadas: [],
            subgrupos: [],
            ofertas: [],
            disparado: 'Todos'
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    if (tree.length === 0) return null;

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => {
                    setIsOpen(prev => !prev);
                    if (isOpen) setSearchTerm('');
                }}
                title="Visões rápidas: BU › Parceiro › Segmento"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all border shadow-sm select-none ${
                    isOpen
                        ? 'bg-white border-afinz-teal text-cyan-700 shadow-md ring-1 ring-cyan-500/10'
                        : 'bg-white border-cyan-100 hover:border-cyan-200 text-slate-600'
                }`}
            >
                <Crosshair size={15} className={isOpen ? 'text-cyan-600' : 'text-slate-450'} />
                <span className="text-xs font-semibold tracking-tight">Visões</span>
                <ChevronDown
                    size={13}
                    className={`transition-transform duration-250 ${isOpen ? 'rotate-180 opacity-100 text-cyan-600' : 'opacity-40'}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 pt-2 z-50 w-[360px]">
                    <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] p-2 relative overflow-hidden ring-1 ring-slate-900/5">
                        <div className="flex items-center justify-between px-3 py-2 mb-1.5 border-b border-slate-100 bg-slate-50/50 -mx-2 -mt-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                Visões rápidas
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                BU › Parceiro › Segmento
                            </span>
                        </div>

                        <div className="px-1 pb-1.5">
                            <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50 transition-all">
                                <Search size={12} className="text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Buscar parceiro ou segmento..."
                                    className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto custom-scrollbar py-1 border-b border-slate-100">
                            {filteredTree.length === 0 && (
                                <div className="px-2 py-4 text-center text-xs text-slate-400 italic">
                                    Nenhum resultado para "{searchTerm}".
                                </div>
                            )}

                            {filteredTree.map(bu => {
                                const buKey = `bu:${bu.value}`;
                                const buOpen = isExpanded(buKey);

                                return (
                                    <div key={buKey}>
                                        <div className="flex items-center gap-1 rounded-lg hover:bg-slate-50/80 group/row">
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(buKey)}
                                                className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                                                aria-label={buOpen ? 'Recolher' : 'Expandir'}
                                            >
                                                {buOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyView(bu.value)}
                                                className="flex items-center gap-2 flex-1 min-w-0 py-1.5 pr-2 text-left"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BU_DOT[bu.value] ?? 'bg-slate-300'}`} />
                                                <span className="text-xs font-bold text-slate-700 truncate flex-1">{bu.value}</span>
                                                <span className="text-[10px] font-bold text-slate-450 tabular-nums bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                                                    {bu.count}
                                                </span>
                                            </button>
                                        </div>

                                        {buOpen && bu.parceiros.map(parceiro => {
                                            const parceiroKey = `${buKey}|p:${parceiro.value}`;
                                            const parceiroOpen = isExpanded(parceiroKey);

                                            return (
                                                <div key={parceiroKey}>
                                                    <div className="flex items-center gap-1 rounded-lg hover:bg-slate-50/80 pl-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(parceiroKey)}
                                                            className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                                                            aria-label={parceiroOpen ? 'Recolher' : 'Expandir'}
                                                        >
                                                            {parceiroOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => applyView(bu.value, parceiro.value)}
                                                            className="flex items-center gap-2 flex-1 min-w-0 py-1.5 pr-2 text-left"
                                                        >
                                                            <span
                                                                title={dimensionLabel(parceiro.value, 'parceiro')}
                                                                className="text-xs font-semibold text-slate-605 truncate flex-1"
                                                            >
                                                                {dimensionLabel(parceiro.value, 'parceiro')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-450 tabular-nums bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                                                                {parceiro.count}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {parceiroOpen && parceiro.segmentos.map(segmento => (
                                                        <button
                                                            key={`${parceiroKey}|s:${segmento.value}`}
                                                            type="button"
                                                            onClick={() => applyView(bu.value, parceiro.value, segmento.value)}
                                                            className="w-full flex items-center gap-2 py-1.5 pl-[3.25rem] pr-2 rounded-lg hover:bg-cyan-50/50 text-left transition-colors group/seg"
                                                        >
                                                            <span
                                                                title={dimensionLabel(segmento.value, 'segmento')}
                                                                className="text-xs text-slate-500 truncate flex-1 group-hover/seg:text-cyan-700 transition-colors"
                                                            >
                                                                {dimensionLabel(segmento.value, 'segmento')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-450 tabular-nums bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                                                                {segmento.count}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between gap-1.5 px-2 pt-2 pb-1 bg-slate-50/50 rounded-b-xl -mx-2 -mb-2 border-t border-slate-100 mt-2">
                            <span className="text-[9px] text-slate-400 font-medium pl-1">
                                Aplica na hora · não altera o período
                            </span>
                            <button
                                type="button"
                                onClick={resetView}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-white text-[10px] font-bold text-slate-500 hover:text-slate-600 transition"
                            >
                                <RotateCcw size={10} />
                                Ver tudo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
