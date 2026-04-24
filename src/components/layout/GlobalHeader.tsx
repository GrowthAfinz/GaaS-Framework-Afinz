import React from 'react';
import {
    User,
    Search,
    Settings,
    Calendar,
    TrendingUp,
    BarChart3,
    Lightbulb,
    PieChart,
    LayoutDashboard,
    BookOpen,
    Lock,
    ClipboardList
} from 'lucide-react';
import { AfinzLogo } from '../../modules/paid-media-afinz/components/AfinzLogo';
import { useAppStore } from '../../store/useAppStore';
import { NavDropdown } from './NavDropdown';
import { useBU, BU } from '../../contexts/BUContext';
import { useUserRole } from '../../context/UserRoleContext';
import { FullscreenButton } from '../ui/FullscreenButton';

interface GlobalHeaderProps {
    onMouseEnter?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onMouseEnter }) => {
    const { setTab, viewSettings } = useAppStore();
    const activeTab = viewSettings.abaAtual;
    const { toggleBU, isBUSelected, isBULocked } = useBU();
    const { canSeeTab } = useUserRole();

    const allNavGroups = [
        {
            title: 'Planejamento',
            direct: false,
            items: [
                { id: 'launch', label: 'Launch Planner', icon: Calendar, onClick: () => setTab('launch') },
                { id: 'diario', label: 'Diario de Bordo', icon: BookOpen, onClick: () => setTab('diario') },
            ]
        },
        // Framework: clique direto — sem sub-menu
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

    const buOptions: { id: BU; label: string; color: string }[] = [
        { id: 'B2C', label: 'B2C', color: 'bg-blue-500' },
        { id: 'B2B2C', label: 'B2B2C', color: 'bg-emerald-500' },
        { id: 'Plurix', label: 'Plurix', color: 'bg-purple-500' },
        { id: 'Seguros', label: 'Seguros', color: 'bg-orange-500' },
    ];

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
                <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {navGroups.map((group) => {
                        // Grupos com clique direto (sem dropdown)
                        if (group.direct || group.items.length === 1) {
                            const item = group.items[0];
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={group.title}
                                    type="button"
                                    onClick={item.onClick}
                                    className={[
                                        'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/60',
                                    ].join(' ')}
                                >
                                    {group.title}
                                </button>
                            );
                        }

                        // Grupos com múltiplos itens → dropdown
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
                {/* BU Filter */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:block">BU:</span>
                        {isBULocked && <Lock size={12} className="text-amber-500" title="BU locked by your role" />}
                    </div>
                    <div className="flex bg-slate-100 rounded-md p-0.5 gap-0.5 border border-slate-200">
                        {buOptions.map((bu) => (
                            <button
                                key={bu.id}
                                onClick={() => toggleBU(bu.id)}
                                disabled={isBULocked}
                                className={[
                                    'px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1',
                                    isBULocked ? 'opacity-50 cursor-not-allowed' : '',
                                    isBUSelected(bu.id)
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white',
                                ].join(' ')}
                                title={isBULocked ? `BU locked to ${bu.label}` : `Filtrar por ${bu.label}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${bu.color} ${isBUSelected(bu.id) ? 'opacity-100' : 'opacity-40'}`} />
                                <span>{bu.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Search */}
                <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 w-52 transition-all focus-within:w-72 focus-within:bg-white focus-within:border-cyan-400">
                    <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400"
                    />
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200" />

                {/* Settings */}
                <button
                    onClick={() => setTab('configuracoes')}
                    className={`p-2 rounded-lg transition-all ${activeTab === 'configuracoes' ? 'text-slate-800 bg-slate-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                    title="Configurações"
                >
                    <Settings size={18} />
                </button>

                {/* Fullscreen */}
                <FullscreenButton />

                {/* Avatar */}
                <div className="flex items-center cursor-pointer hover:bg-slate-100 p-1 rounded-lg transition-all group">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center ring-2 ring-cyan-100 group-hover:ring-cyan-200 transition-all">
                        <User size={15} className="text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};
