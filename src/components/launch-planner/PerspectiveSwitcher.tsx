import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { LayoutDashboard, Users, Zap, ChevronRight } from 'lucide-react';

export const PerspectiveSwitcher: React.FC = () => {
    const { viewSettings, setPerspective } = useAppStore();
    const perspective = viewSettings.perspective;

    const modes = [
        { id: 'crm', label: 'Mundo CRM', icon: Users, color: 'text-blue-600' },
        { id: 'total', label: 'Banco Total', icon: LayoutDashboard, color: 'text-emerald-600' },
        { id: 'b2c', label: 'B2C Direto', icon: Zap, color: 'text-orange-600' },
    ];

    const currentIndex = modes.findIndex(m => m.id === perspective);
    const currentMode = modes[currentIndex] || modes[0];

    const cycleMode = () => {
        const nextIndex = (currentIndex + 1) % modes.length;
        setPerspective(modes[nextIndex].id as any);
    };

    return (
        <button
            onClick={cycleMode}
            className="flex items-center gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-all group"
            title="Alternar visão (CRM / Total / B2C)"
        >
            <div className={`w-1.5 h-1.5 rounded-full ${currentMode.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">{currentMode.label}</span>
            <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
    );
};
