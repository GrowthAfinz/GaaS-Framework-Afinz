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
    Lock
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NavDropdown } from './NavDropdown';
import { useBU, BU } from '../../contexts/BUContext';
import { useUserRole } from '../../context/UserRoleContext';

export const GlobalHeader: React.FC = () => {
    const { setTab, viewSettings } = useAppStore();
    const activeTab = viewSettings.abaAtual;
    const { toggleBU, isBUSelected, isBULocked } = useBU();
    const { canSeeTab } = useUserRole();

    const allNavGroups = [
        {
            title: 'Planejamento',
            items: [
                { id: 'launch', label: 'Launch Planner', icon: Calendar, onClick: () => setTab('launch') },
                { id: 'diario', label: 'Diário de Bordo', icon: BookOpen, onClick: () => setTab('diario') },
            ]
        },
        {
            title: 'Análise',
            items: [
                { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp, onClick: () => setTab('jornada') },
                { id: 'resultados', label: 'Resultados', icon: BarChart3, onClick: () => setTab('resultados') },
                { id: 'orientador', label: 'Orientador', icon: Lightbulb, onClick: () => setTab('orientador') },
                { id: 'originacao-b2c', label: 'Originação B2C', icon: PieChart, onClick: () => setTab('originacao-b2c') },
            ]
        },
        {
            // Separado (sem emoji/icon)
            title: 'Mídia Paga',
            items: [
                { id: 'midia-paga', label: 'Media Analytics', icon: undefined, onClick: () => setTab('midia-paga') },
            ]
        },
        {
            title: 'Framework',
            items: [
                { id: 'framework', label: 'Explorador de Disparos', icon: LayoutDashboard, onClick: () => setTab('framework') },
            ]
        }
    ];

    // Filter tabs based on user role
    const navGroups = allNavGroups.map(group => ({
        ...group,
        items: group.items.filter(item => canSeeTab(item.id))
    })).filter(group => group.items.length > 0);

    const buOptions: { id: BU; label: string; color: string }[] = [
        { id: 'B2C', label: 'B2C', color: 'bg-blue-500' },
        { id: 'B2B2C', label: 'B2B2C', color: 'bg-emerald-500' },
        { id: 'Plurix', label: 'Plurix', color: 'bg-purple-500' },
    ];

    const isGroupActive = (items: { id: string }[]) => {
        return items.some(item => item.id === activeTab);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shadow-sm">

            {/* Left: Logo */}
            <div className="flex items-center gap-8">
                <div className="flex flex-col items-center justify-center gap-0 shrink-0">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-widest leading-none">
                        GaaS
                    </h1>
                    <span className="text-[10px] font-bold text-white tracking-wider uppercase leading-tight opacity-90">
                        AFINZ
                    </span>
                </div>

                {/* Navigation - Center Top */}
                <nav className="hidden lg:flex items-center gap-1 h-16">
                    {navGroups.map((group) => (
                        <NavDropdown
                            key={group.title}
                            title={group.title}
                            items={group.items.map(item => ({
                                ...item,
                                isActive: activeTab === item.id
                            }))}
                            isActive={isGroupActive(group.items)}
                        />
                    ))}
                </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-4 flex-1 max-w-2xl">

                {/* BU Selector */}
                <div className="flex items-center gap-2 px-2 border-r border-white/10 mr-2">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:block">BU:</span>
                        {isBULocked && <Lock size={12} className="text-amber-500" title="BU locked by your role" />}
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                        {buOptions.map((bu) => (
                            <button
                                key={bu.id}
                                onClick={() => toggleBU(bu.id)}
                                disabled={isBULocked}
                                className={`
                                    px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
                                    ${isBULocked ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${isBUSelected(bu.id)
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }
                                `}
                                title={isBULocked ? `BU locked to ${bu.label}` : `Filtrar por ${bu.label}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${bu.color} ${isBUSelected(bu.id) ? 'opacity-100 shadow-[0_0_4px_currentColor]' : 'opacity-40'}`} />
                                <span className={!isBUSelected(bu.id) ? 'hidden xl:inline' : ''}>{bu.label}</span>
                            </button>
                        ))}
                    </div>
                </div>



                {/* Search */}
                <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-64 transition-all focus-within:w-80 focus-within:bg-white/10 focus-within:border-blue-500/50">
                    <Search size={16} className="text-slate-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm text-slate-300 w-full placeholder-slate-600"
                    />
                </div>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <button
                    onClick={() => setTab('configuracoes')}
                    className={`p-2 rounded-full transition relative ${activeTab === 'configuracoes' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    title="Configurações"
                >
                    <Settings size={20} />
                </button>

                <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-all">
                        <User size={16} className="text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};
