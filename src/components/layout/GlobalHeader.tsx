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
import { AfinzLogo } from '../../modules/paid-media-afinz/components/AfinzLogo';
import { useAppStore } from '../../store/useAppStore';
import { NavDropdown } from './NavDropdown';
import { useBU, BU } from '../../contexts/BUContext';
import { useUserRole } from '../../context/UserRoleContext';

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
            items: [
                { id: 'launch', label: 'Launch Planner', icon: Calendar, onClick: () => setTab('launch') },
                { id: 'diario', label: 'Diario de Bordo', icon: BookOpen, onClick: () => setTab('diario') },
            ]
        },
        {
            title: 'Analise',
            items: [
                { id: 'jornada', label: 'Jornada & Disparos', icon: TrendingUp, onClick: () => setTab('jornada') },
                { id: 'resultados', label: 'Resultados', icon: BarChart3, onClick: () => setTab('resultados') },
                { id: 'orientador', label: 'Orientador', icon: Lightbulb, onClick: () => setTab('orientador') },
                { id: 'originacao-b2c', label: 'Originacao B2C', icon: PieChart, onClick: () => setTab('originacao-b2c') },
            ]
        },
        {
            title: 'Framework',
            items: [
                { id: 'framework', label: 'Explorador de Disparos', icon: LayoutDashboard, onClick: () => setTab('framework') },
                { id: 'explorador', label: 'Explorador Avancado', icon: LayoutDashboard, onClick: () => setTab('explorador') },
            ]
        },
        {
            title: 'Midia Paga',
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
    ];

    const isGroupActive = (items: { id: string }[]) => {
        return items.some(item => item.id === activeTab);
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm"
            onMouseEnter={onMouseEnter}
        >
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3 shrink-0" style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}>
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
                </div>

                <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
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

            <div className="flex items-center justify-end gap-4 flex-1 max-w-2xl">
                <div className="flex items-center gap-2 px-2 border-r border-slate-200 mr-2">
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
                                className={`
                                    px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1
                                    ${isBULocked ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${isBUSelected(bu.id)
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                                    }
                                `}
                                title={isBULocked ? `BU locked to ${bu.label}` : `Filtrar por ${bu.label}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${bu.color} ${isBUSelected(bu.id) ? 'opacity-100' : 'opacity-40'}`} />
                                <span>{bu.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 w-64 transition-all focus-within:w-80 focus-within:bg-white focus-within:border-cyan-400">
                    <Search size={16} className="text-slate-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder-slate-400"
                    />
                </div>

                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

                <button
                    onClick={() => setTab('configuracoes')}
                    className={`p-2 rounded-full transition relative ${activeTab === 'configuracoes' ? 'text-slate-800 bg-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    title="Configuracoes"
                >
                    <Settings size={20} />
                </button>

                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition group">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center ring-2 ring-cyan-100 group-hover:ring-cyan-200 transition-all">
                        <User size={16} className="text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};
