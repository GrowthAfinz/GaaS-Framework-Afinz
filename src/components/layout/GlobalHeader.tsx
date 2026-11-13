import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
    CalendarCheck,
    ClipboardList,
    FolderOpen,
    GitBranch,
    Funnel,
    Tag,
    Mail,
    LayoutGrid,
    ShieldCheck,
    BrainCircuit,
    X,
    FileText,
    Compass,
    LoaderCircle,
} from 'lucide-react';
import { AfinzLogo } from '../../modules/paid-media-afinz/components/AfinzLogo';
import { useAppStore } from '../../store/useAppStore';
import { FEATURES } from '../../config/features';
import { NavDropdown } from './NavDropdown';
import { FrenteSwitcher } from './FrenteSwitcher';
import { BUDropdown } from './BUDropdown';
import { useUserRole } from '../../context/UserRoleContext';
import { FullscreenButton } from '../ui/FullscreenButton';
import { useGlobalSearch, GlobalSearchResult, GlobalSearchResultType } from '../../hooks/useGlobalSearch';
import { useExplorerStore, PendingNavigation } from '../../store/explorerStore';
import { buildGrowthLearningSearch, openGrowthLearningSection } from '../growth-learning/growthLearningNavigation';
import { useWikiSearch } from '../vault/useWikiSearch';
import { buildWikiSearchUrl, formatWikiUpdatedOn, wikiNoteUpdatedOn } from '../vault/wikiSearch';
import { onTabLinkClick, tabHref, TabId } from '../../services/tabNavigation';

interface HeaderNavItem {
    id: TabId;
    label: string;
    icon?: React.ElementType;
    onClick: () => void;
}

interface GlobalHeaderProps {
    onMouseEnter?: () => void;
    isFilterDropOpen?: boolean;
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

interface HeaderSearchEntry {
    key: string;
    section: string;
    title: string;
    icon: React.FC<{ size: number; className?: string }>;
    detail?: React.ReactNode;
    badge?: number;
    onSelect: () => void;
}

const StrategyIcon: React.FC<{ size: number; className?: string }> = (p) => <Compass {...p} />;
const NoteIcon: React.FC<{ size: number; className?: string }> = (p) => <FileText {...p} />;

const BU_DOT: Record<string, string> = {
    B2C: 'bg-blue-500',
    B2B2C: 'bg-emerald-500',
    Plurix: 'bg-purple-500',
    Seguros: 'bg-orange-500',
};

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onMouseEnter, isFilterDropOpen }) => {
    const { setTab, viewSettings } = useAppStore();
    const activeTab = viewSettings.abaAtual;
    const { canSeeTab } = useUserRole();
    const setPendingNavigation = useExplorerStore((s) => s.setPendingNavigation);

    const navigateToTab = useCallback((tab: TabId) => {
        setTab(tab);
    }, [setTab]);

    const [searchInput, setSearchInput] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useGlobalSearch(searchInput);
    const canSeeWiki = canSeeTab('aprendizado-growth');
    const wikiSearch = useWikiSearch(searchInput, { limit: 12, enabled: canSeeWiki && isSearchOpen });
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleSelectResult = useCallback((result: GlobalSearchResult) => {
        const nav: PendingNavigation = {
            label: result.label,
            type: result.type,
            bu: result.bu,
        };
        setPendingNavigation(nav);
        navigateToTab('explorador');
        setSearchInput('');
        setIsSearchOpen(false);
    }, [navigateToTab, setPendingNavigation]);

    const openWiki = useCallback((noteId: string | null, query = '') => {
        window.history.pushState({}, '', window.location.pathname + buildWikiSearchUrl(window.location.search, noteId, query));
        window.dispatchEvent(new PopStateEvent('popstate'));
        navigateToTab('aprendizado-growth');
        setSearchInput('');
        setIsSearchOpen(false);
    }, [navigateToTab]);

    // One flat list in display order, so the arrow keys walk the same order the eye reads:
    // strategies first, then the operation (segments, journeys, dispatches), then subjects and notes.
    const entries = useMemo<HeaderSearchEntry[]>(() => {
        const wikiEntries = (kind: 'estrategia' | 'nota', max: number) => {
            const group = wikiSearch.groups.find(item => item.kind === kind);
            if (!group) return [];
            return group.items.slice(0, max).map<HeaderSearchEntry>(note => ({
                key: `wiki-${note.id}`,
                section: group.label,
                title: note.title,
                icon: kind === 'estrategia' ? StrategyIcon : NoteIcon,
                detail: <span className="text-[10px] text-slate-400">{formatWikiUpdatedOn(wikiNoteUpdatedOn(note))}</span>,
                onSelect: () => openWiki(note.id),
            }));
        };
        const operation = TYPE_ORDER.flatMap(type => results.filter(result => result.type === type).map<HeaderSearchEntry>(result => ({
            key: `${result.type}-${result.label}`,
            section: GROUP_LABELS[type],
            title: result.label,
            icon: TYPE_CONFIG[type].icon,
            badge: result.count,
            detail: result.bu ? (
                <span className="flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${BU_DOT[result.bu] ?? 'bg-slate-400'}`} />
                    <span className="text-[10px] text-slate-400">{result.bu}</span>
                    {result.segmento && result.type === 'activity' && <span className="text-[10px] text-slate-400">· {result.segmento}</span>}
                </span>
            ) : undefined,
            onSelect: () => handleSelectResult(result),
        })));
        return [...wikiEntries('estrategia', 4), ...operation, ...wikiEntries('nota', 5)];
    }, [wikiSearch.groups, results, openWiki, handleSelectResult]);

    useEffect(() => { setActiveIndex(-1); }, [searchInput]);

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') { setIsSearchOpen(false); inputRef.current?.blur(); return; }
        if (!entries.length) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); setIsSearchOpen(true); setActiveIndex(index => (index + 1) % entries.length); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => (index <= 0 ? entries.length - 1 : index - 1)); }
        else if (event.key === 'Enter' && searchInput.trim().length >= 2) { event.preventDefault(); entries[Math.max(activeIndex, 0)]?.onSelect(); }
    }, [entries, activeIndex, searchInput]);

    // "/" focuses the global search from anywhere that is not a text field (Ctrl+K stays with the Wiki bar).
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
            event.preventDefault();
            inputRef.current?.focus();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

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

    const allNavGroups: { title: string; direct: boolean; items: HeaderNavItem[] }[] = [
        {
            title: 'Planejamento',
            direct: false,
            items: [
                { id: 'operacao', label: 'Operação', icon: CalendarCheck, onClick: () => { openGrowthLearningSection('daily'); navigateToTab('operacao'); } },
                { id: 'launch', label: 'Launch Planner', icon: Calendar, onClick: () => navigateToTab('launch') },
            ]
        },
        {
            title: 'Framework',
            direct: false,
            items: [
                { id: 'aprendizado-growth', label: 'Loop de Memória', icon: undefined, onClick: () => { openGrowthLearningSection('vault'); navigateToTab('aprendizado-growth'); } },
                { id: 'explorador', label: 'Jornada e Aquisição', icon: undefined, onClick: () => navigateToTab('explorador') },
            ]
        },
        {
            title: 'Análise',
            direct: false,
            items: [
                { id: 'originacao-b2c', label: 'Originação B2C', icon: PieChart, onClick: () => navigateToTab('originacao-b2c') },
                { id: 'funil-aquisicao', label: 'Funil de Aquisição', icon: Funnel, onClick: () => navigateToTab('funil-aquisicao') },
                { id: 'relatorio', label: viewSettings.frente === 'rentabilizacao' ? 'Relatórios | Rentabilização' : 'Relatórios | Aquisição', icon: ClipboardList, onClick: () => navigateToTab('relatorio') },
                { id: 'relatorio-seguros', label: 'Relatórios | Seguros', icon: ShieldCheck, onClick: () => navigateToTab('relatorio-seguros') },
                ...(FEATURES.jornadaDisparosTab ? [{ id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp, onClick: () => navigateToTab('jornada') } as HeaderNavItem] : []),
                { id: 'orientador', label: 'Orientador', icon: Lightbulb, onClick: () => navigateToTab('orientador') },
            ]
        },
        {
            title: 'Comunicações',
            direct: false,
            items: [
                { id: 'comunicacoes-cadastro', label: 'Cadastro e Templates', icon: LayoutGrid, onClick: () => navigateToTab('comunicacoes-cadastro') },
                { id: 'comunicacoes-fluxo', label: 'Fluxo de Jornada', icon: GitBranch, onClick: () => navigateToTab('comunicacoes-fluxo') },
                { id: 'comunicacoes-performance', label: 'Performance do Conteúdo', icon: BarChart3, onClick: () => navigateToTab('comunicacoes-performance') },
                { id: 'comunicacoes-email-dinamico', label: 'Fábrica de E-mails', icon: Mail, onClick: () => navigateToTab('comunicacoes-email-dinamico') },
                { id: 'comunicacoes-appsflyer-auditoria', label: 'Auditoria AppsFlyer', icon: ShieldCheck, onClick: () => navigateToTab('comunicacoes-appsflyer-auditoria') },
            ]
        },
        {
            title: 'Mídia Paga',
            direct: true,
            items: [
                { id: 'midia-paga', label: 'Media Analytics', icon: undefined, onClick: () => navigateToTab('midia-paga') },
            ]
        }
    ];

    const navGroups = allNavGroups.map(group => ({
        ...group,
        items: group.items
            .filter(item => canSeeTab(item.id))
            .map(item => ({
                ...item,
                // Loop abre na Wiki e Operação na Visão Daily, então o link aponta pra seção também.
                href: item.id === 'aprendizado-growth'
                    ? tabHref(item.id, buildGrowthLearningSearch('vault', ''))
                    : item.id === 'operacao'
                        ? tabHref(item.id, buildGrowthLearningSearch('daily', ''))
                        : tabHref(item.id),
            }))
    })).filter(group => group.items.length > 0);

    const isGroupActive = (items: { id: string }[]) => {
        return items.some(item => item.id === activeTab);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 h-16 bg-afinz-ice/95 backdrop-blur-md flex items-center px-6 gap-4 transition-all duration-300 ${
                isFilterDropOpen
                    ? 'border-b border-transparent shadow-none'
                    : 'border-b border-transparent shadow-none'
            }`}
            onMouseEnter={onMouseEnter}
        >
            {/* ── LEFT: Brand ────────────────────────────────────────── */}
            <a
                href={tabHref('operacao', buildGrowthLearningSearch('daily', ''))}
                onClick={onTabLinkClick(() => { openGrowthLearningSection('daily'); navigateToTab('operacao'); })}
                className="shrink-0 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}
                title="Voltar para a Visão Daily"
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
            </a>

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
                                <a
                                    key={group.title}
                                    href={item.href}
                                    onClick={onTabLinkClick(item.onClick)}
                                    className={[
                                        'flex items-center gap-2 py-1.5 text-[15px] tracking-tight border-b-2 transition-colors duration-200',
                                        isActive
                                            ? 'text-cyan-600 font-bold border-cyan-500'
                                            : 'text-slate-600 font-semibold border-transparent hover:text-cyan-600',
                                    ].join(' ')}
                                >
                                    {group.title}
                                </a>
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
                {activeTab !== 'relatorio-seguros' && <BUDropdown />}

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Frente Switch (Aquisição | Rentabilização) */}
                {activeTab !== 'relatorio-seguros' && <FrenteSwitcher />}

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
                            onKeyDown={handleSearchKeyDown}
                            placeholder={canSeeWiki ? 'Buscar segmento, jornada, nota...' : 'Buscar segmento, jornada...'}
                            title="Atalho: tecla /"
                            aria-label="Busca global"
                            role="combobox"
                            aria-expanded={isSearchOpen && searchInput.trim().length >= 2}
                            aria-controls="global-search-results"
                            aria-activedescendant={activeIndex >= 0 && entries[activeIndex] ? `global-search-${activeIndex}` : undefined}
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
                        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[9999]">
                            {entries.length === 0 ? (
                                <div className="px-4 py-4 text-sm text-slate-500 text-center">
                                    {wikiSearch.loading ? (
                                        <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" />Buscando...</span>
                                    ) : (
                                        <>Nenhum resultado para "<span className="font-medium text-slate-700">{searchInput}</span>"</>
                                    )}
                                </div>
                            ) : (
                                <div id="global-search-results" role="listbox" aria-label="Resultados da busca" className="max-h-[28rem] overflow-y-auto py-1">
                                    {entries.map((entry, index) => {
                                        const Icon = entry.icon;
                                        const startsSection = index === 0 || entries[index - 1].section !== entry.section;
                                        return (
                                            <React.Fragment key={entry.key}>
                                                {startsSection && (
                                                    <div className="px-3 pt-2 pb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {entry.section}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    id={`global-search-${index}`}
                                                    role="option"
                                                    aria-selected={index === activeIndex}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    onClick={entry.onSelect}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${index === activeIndex ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <Icon size={14} className="text-slate-400 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate">{entry.title}</p>
                                                        {entry.detail && <div className="mt-0.5">{entry.detail}</div>}
                                                    </div>
                                                    {entry.badge !== undefined && (
                                                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums shrink-0">
                                                            {entry.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                                    {wikiSearch.loading && (
                                        <p className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-1.5"><LoaderCircle size={11} className="animate-spin" />Buscando na Wiki...</p>
                                    )}
                                </div>
                            )}
                            <div className="border-t border-slate-100 px-3 py-2 space-y-1.5">
                                {canSeeWiki && (
                                    <button
                                        onClick={() => openWiki(null, searchInput)}
                                        className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-600 transition-colors px-1"
                                    >
                                        <BookOpen size={11} />
                                        <span>Ver tudo para "<span className="font-semibold">{searchInput}</span>" na Wiki{wikiSearch.total ? ` (${wikiSearch.total})` : ''}</span>
                                    </button>
                                )}
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

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Settings */}
                <a
                    href={tabHref('configuracoes')}
                    onClick={onTabLinkClick(() => navigateToTab('configuracoes'))}
                    className={`p-2 rounded-lg transition-all ${activeTab === 'configuracoes' ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                    title="Configurações"
                >
                    <Settings2 size={18} />
                </a>

                {/* Fullscreen */}
                <FullscreenButton />
            </div>
        </header>
    );
};
