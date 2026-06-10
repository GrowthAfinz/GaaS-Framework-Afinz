import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Search,
    Settings2,
    Calendar,
    TrendingUp,
    BarChart3,
    Lightbulb,
    PieChart,
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    FolderOpen,
    GitBranch,
    Tag,
    X,
} from 'lucide-react';
import { AfinzLogo } from '../../modules/paid-media-afinz/components/AfinzLogo';
import { useAppStore } from '../../store/useAppStore';
import { NavDropdown } from './NavDropdown';
import { FrenteSwitcher } from './FrenteSwitcher';
import { BUDropdown } from './BUDropdown';
import { useBU } from '../../contexts/BUContext';
import { useUserRole } from '../../context/UserRoleContext';
import { FullscreenButton } from '../ui/FullscreenButton';
import { useGlobalSearch, GlobalSearchResult, GlobalSearchResultType } from '../../hooks/useGlobalSearch';
import { useExplorerStore, PendingNavigation } from '../../store/explorerStore';

interface GlobalHeaderProps {
    onMouseEnter?: () => void;
}

const TYPE_CONFIG: Record<GlobalSearchResultType, { label: string; icon: React.FC<{ size: number; className?: string }> }> = {
    segmento: { label: 'Segmento', icon: (p) => <FolderOpen {...p} /> },
    jornada: { label: 'Jornada', icon: (p) => <GitBranch {...p} /> },
    activity: { label: 'Disparo', icon: (p) => <Tag {...p} /> },
};

const TYPE_ORDER: GlobalSearchResultType[] = ['segmento', 'jornada', 'activity'];
const GROUP_LABELS: Record<GlobalSearchResultType, string> = {
    segmento: 'Segmentos',
    jornada: 'Jornadas',
    activity: 'Activity Names',
};

const BU_DOT: Record<string, string> = {
    B2C: 'bg-blue-500',
    B2B2C: 'bg-emerald-500',
    Plurix: 'bg-purple-500',
    Seguros: 'bg-orange-500',
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onMouseEnter }) => {
    const { setTab, viewSettings, setFrente } = useAppStore();
    const activeTab = viewSettings.abaAtual;
    const { isBUSelected } = useBU();
    const isSegurosSelected = isBUSelected('Seguros');

    // Seguros = Rentabilização: ao selecionar a BU Seguros, força a frente.
    useEffect(() => {
        if (isSegurosSelected) {
            setFrente('rentabilizacao');
        }
    }, [isSegurosSelected, setFrente]);
    const { canSeeTab } = useUserRole();
    const setPendingNavigation = useExplorerStore((s) => s.setPendingNavigation);

    const [searchInput, setSearchInput] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useGlobalSearch(searchInput);

    // Group results by type in the correct order
    const grouped = TYPE_ORDER.map((type) => ({
        type,
        items: results.filter((r) => r.type === type),
    })).filter((g) => g.items.length > 0);

    const handleSelectResult = useCallback((result: GlobalSearchResult) => {
        const nav: PendingNavigation = {
            label: result.label,
            type: result.type,
            bu: result.bu,
        };
        setPendingNavigation(nav);
        setTab('explorador');
        setSearchInput('');
        setIsSearchOpen(false);
    }, [setPendingNavigation, setTab]);

    const handleClear = useCallback(() => {
        setSearchInput('');
        setIsSearchOpen(false);
        inputRef.current?.blur();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allNavGroups = [
        {
            title: 'Planejamento',
            direct: false,
            items: [
                { id: 'launch', label: 'Launch Planner', icon: Calendar, onClick: () => setTab('launch') },
                { id: 'diario', label: 'Diario de Bordo', icon: BookOpen, onClick: () => setTab('diario') },
            ]
        },
        {
            title: 'Framework',
            direct: true,
            items: [
                { id: 'explorador', label: 'Explorador Avançado', icon: LayoutDashboard, onClick: () => setTab('explorador') },
            ]
        },
        {
            title: 'Análise',
            direct: false,
            items: [
                { id: 'originacao-b2c', label: 'Originação B2C', icon: PieChart, onClick: () => setTab('originacao-b2c') },
                { id: 'relatorio', label: 'Relatórios', icon: ClipboardList, onClick: () => setTab('relatorio') },
                { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp, onClick: () => setTab('jornada') },
                { id: 'orientador', label: 'Orientador', icon: Lightbulb, onClick: () => setTab('orientador') },
            ]
        },
        {
            title: 'Mídia Paga',
            direct: true,
            items: [
                { id: 'midia-paga', label: 'Media Analytics', icon: undefined, onClick: () => setTab('midia-paga') },
            ]
        }
    ];

    const navGroups = allNavGroups.map(group => ({
        ...group,
        items: group.items.filter(item => canSeeTab(item.id))
    })).filter(group => group.items.length > 0);

    const isGroupActive = (items: { id: string }[]) => {
        return items.some(item => item.id === activeTab);
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center px-6 gap-4"
            onMouseEnter={onMouseEnter}
        >
            {/* ── LEFT: Brand ────────────────────────────────────────── */}
            <button
                onClick={() => setTab('launch')}
                className="shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}
                title="Voltar para Launch Planner"
            >
                <AfinzLogo height={28} />
                <div className="flex items-center gap-2">
                    <div className="h-4 w-0.5 rounded-full bg-[#00C6CC]" />
                    <h1
                        className="font-black text-xl text-slate-800 tracking-tight leading-none"
                        style={{ fontFamily: "'Trebuchet MS', Calibri, sans-serif" }}
                    >
                        Growth as a Service
                    </h1>
                </div>
            </button>

            {/* ── CENTER: Navigation ─────────────────────────────────── */}
            <div className="flex-1 flex justify-center">
                <nav
                    className="hidden lg:flex items-center gap-6"
                    style={{ fontFamily: "'Trebuchet MS', Calibri, sans-serif" }}
                >
                    {navGroups.map((group) => {
                        if (group.direct || group.items.length === 1) {
                            const item = group.items[0];
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={group.title}
                                    type="button"
                                    onClick={item.onClick}
                                    className={[
                                        'flex items-center gap-2 py-1.5 text-[15px] tracking-tight border-b-2 transition-colors duration-200',
                                        isActive
                                            ? 'text-cyan-600 font-bold border-cyan-500'
                                            : 'text-slate-600 font-semibold border-transparent hover:text-cyan-600',
                                    ].join(' ')}
                                >
                                    {group.title}
                                </button>
                            );
                        }

                        return (
                            <NavDropdown
                                key={group.title}
                                title={group.title}
                                items={group.items.map(item => ({
                                    ...item,
                                    isActive: activeTab === item.id
                                }))}
                                isActive={isGroupActive(group.items)}
                            />
                        );
                    })}
                </nav>
            </div>

            {/* ── RIGHT: Controls ────────────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-3">
                {/* BU Filter (dropdown compacto) */}
                <BUDropdown />

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Frente Switch (Aquisição | Rentabilização) */}
                <FrenteSwitcher />

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Global Search */}
                <div ref={searchContainerRef} className="relative hidden md:block">
                    <div className={[
                        'flex items-center bg-slate-50 border rounded-full px-4 py-1.5 transition-all',
                        isSearchOpen || searchInput
                            ? 'w-72 bg-white border-cyan-400 shadow-sm'
                            : 'w-52 border-slate-200',
                    ].join(' ')}>
                        <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setIsSearchOpen(true);
                            }}
                            onFocus={() => setIsSearchOpen(true)}
                            placeholder="Buscar segmento, jornada..."
                            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400"
                        />
                        {searchInput && (
                            <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 transition-colors ml-1">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown */}
                    {isSearchOpen && searchInput.trim().length >= 2 && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[9999]">
                            {grouped.length === 0 ? (
                                <div className="px-4 py-4 text-sm text-slate-500 text-center">
                                    Nenhum resultado para "<span className="font-medium text-slate-700">{searchInput}</span>"
                                </div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto py-1">
                                    {grouped.map(({ type, items }) => {
                                        const config = TYPE_CONFIG[type];
                                        const Icon = config.icon;
                                        return (
                                            <div key={type}>
                                                <div className="px-3 pt-2 pb-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {GROUP_LABELS[type]}
                                                    </span>
                                                </div>
                                                {items.map((result) => (
                                                    <button
                                                        key={`${result.type}-${result.label}`}
                                                        onClick={() => handleSelectResult(result)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                                    >
                                                        <Icon size={14} className="text-slate-400 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                                {result.label}
                                                            </p>
                                                            {result.bu && (
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${BU_DOT[result.bu] ?? 'bg-slate-400'}`} />
                                                                    <span className="text-[10px] text-slate-400">{result.bu}</span>
                                                                    {result.segmento && result.type === 'activity' && (
                                                                        <span className="text-[10px] text-slate-400">· {result.segmento}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {result.count !== undefined && (
                                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums shrink-0">
                                                                {result.count}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-slate-100 mx-3 mt-1 pt-2 pb-2">
                                        <button
                                            onClick={() => handleSelectResult({ type: 'segmento', label: searchInput })}
                                            className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-600 transition-colors px-1"
                                        >
                                            <Search size={11} />
                                            <span>Ver tudo para "<span className="font-semibold">{searchInput}</span>" no Framework</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Settings */}
                <button
                    onClick={() => setTab('configuracoes')}
                    className={`p-2 rounded-lg transition-all ${activeTab === 'configuracoes' ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                    title="Configurações"
                >
                    <Settings2 size={18} />
                </button>

                {/* Fullscreen */}
                <FullscreenButton />
            </div>
        </header>
    );
};
