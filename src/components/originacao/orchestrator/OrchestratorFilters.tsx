import React, { useState } from 'react';
import { Filter, Calendar, Users, Target } from 'lucide-react';

export const OrchestratorFilters: React.FC = () => {
    // Local state for demo purposes, should eventually sync with a context or store.
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [selectedChannel, setSelectedChannel] = useState('all');

    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
            {/* Period Filter */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <Calendar size={14} className="text-slate-400" />
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent text-sm text-slate-900 focus:outline-none border-none p-0 cursor-pointer"
                >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="custom">Personalizado</option>
                </select>
            </div>

            {/* Channel Filter */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <Target size={14} className="text-slate-400" />
                <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="bg-transparent text-sm text-slate-900 focus:outline-none border-none p-0 cursor-pointer"
                >
                    <option value="all">Todos os Canais</option>
                    <option value="meta">Meta Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="tiktok">TikTok Ads</option>
                </select>
            </div>

            {/* Segmentation Filter (Mock) */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 opacity-50 cursor-not-allowed" title="Em breve">
                <Users size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">Todos os Segmentos</span>
            </div>

            <div className="ml-auto text-xs text-slate-500">
                Mostrando dados consolidados para o período selecionado.
            </div>
        </div>
    );
};
