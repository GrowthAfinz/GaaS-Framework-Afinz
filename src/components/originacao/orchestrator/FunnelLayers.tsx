import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, TrendingDown, TrendingUp, HelpCircle } from 'lucide-react';
import { Tooltip } from '../../Tooltip'; // Adjust import path if needed

const TooltipWrapper = ({ content, children }: { content: string, children: React.ReactNode }) => (
    <div className="group relative flex items-center gap-1 cursor-help">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white text-slate-900 text-xs rounded border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            {content}
        </div>
    </div>
);

interface FunnelStageProps {
    label: string;
    value: string;
    subValue?: string;
    color: string;
    width: string;
    conversion?: string;
    trend?: 'up' | 'down' | 'neutral';
    description?: string;
}

const FunnelStage: React.FC<FunnelStageProps> = ({ label, value, subValue, color, width, conversion, trend, description }) => {
    return (
        <div className="flex flex-col items-center relative group">
            {/* Stage Bar */}
            <motion.div
                className={`relative h-16 rounded-xl flex items-center justify-between px-6 shadow-lg border border-white/5 backdrop-blur-sm transition-all hover:scale-[1.02] ${color}`}
                style={{ width }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-white font-medium">
                        {label}
                        {description && <TooltipWrapper content={description}><HelpCircle size={12} className="text-white/50" /></TooltipWrapper>}
                    </div>
                    {subValue && <span className="text-xs text-white/60">{subValue}</span>}
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-white">{value}</span>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
                            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>5%</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Conversion Connector */}
            {conversion && (
                <div className="h-8 flex items-center justify-center relative -my-1 z-10">
                    <div className="bg-white text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-300 flex items-center gap-1 shadow-sm">
                        <ArrowDown size={10} />
                        {conversion}
                    </div>
                </div>
            )}
        </div>
    );
};

export const FunnelLayers: React.FC = () => {
    // Mock Data
    return (
        <div className="flex flex-col items-center space-y-1 py-4 w-full max-w-3xl mx-auto">
            <FunnelStage
                label="Impressões"
                value="2.5M"
                subValue="CPM R$ 8,50"
                color="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30"
                width="100%"
                conversion="1.2% CTR"
                description="Total de visualizações dos anúncios."
            />

            <FunnelStage
                label="Cliques (Sessões)"
                value="30K"
                subValue="CPC R$ 0,71"
                color="bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30"
                width="85%"
                conversion="15% Conv."
                description="Usuários que clicaram e acessaram o site."
            />

            <FunnelStage
                label="Propostas Iniciadas"
                value="4.5K"
                subValue="CPA R$ 4,70"
                color="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30"
                width="70%"
                conversion="65% Aprov."
                description="Usuários que iniciaram o preenchimento da proposta."
            />

            <FunnelStage
                label="Aprovados (Completo)"
                value="2.9K"
                subValue="Taxa de Aprovação"
                color="bg-pink-600/20 hover:bg-pink-600/30 border-pink-500/30"
                width="55%"
                conversion="80% Ativ."
                description="Propostas aprovadas pelo sistema de crédito."
            />

            <FunnelStage
                label="Cartões Emitidos"
                value="2.3K"
                subValue="CAC R$ 45,00"
                color="bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30"
                width="40%"
                trend="up"
                description="Cartões efetivamente emitidos e enviados."
            />
        </div>
    );
};
