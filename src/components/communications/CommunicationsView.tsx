import React, { useState } from 'react';
import { Mail, LayoutList, BarChart3, type LucideIcon } from 'lucide-react';
import { CadastroCobertura } from './CadastroCobertura';
import { TemplatePerformanceGrid } from './TemplatePerformanceGrid';

type CommunicationsSubTab = 'cadastro' | 'performance';

const SUB_TABS: { id: CommunicationsSubTab; label: string; icon: LucideIcon }[] = [
    { id: 'cadastro', label: 'Cadastro / Cobertura', icon: LayoutList },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
];

export const CommunicationsView: React.FC = () => {
    const [subTab, setSubTab] = useState<CommunicationsSubTab>('cadastro');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight">Comunicações</h2>
                        <p className="text-sm text-slate-500">Templates, previews e cobertura de réguas CRM</p>
                    </div>
                </div>

                {/* Sub-tabs internas */}
                <div className="mt-4 flex items-center gap-1">
                    {SUB_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = subTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSubTab(tab.id)}
                                className={[
                                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                                    isActive
                                        ? 'bg-cyan-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100',
                                ].join(' ')}
                            >
                                <Icon size={15} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
                {subTab === 'cadastro' && <CadastroCobertura />}
                {subTab === 'performance' && <TemplatePerformanceGrid />}
            </div>
        </div>
    );
};
