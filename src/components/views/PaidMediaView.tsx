import React, { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BudgetCard } from '../paid-media/BudgetCard';
import { ChannelComparisonChart } from '../paid-media/ChannelComparisonChart';
import { CampaignPerformanceTable } from '../paid-media/CampaignPerformanceTable';
import { Upload } from 'lucide-react';
import { parsePaidMediaExcel } from '../../utils/adDataParser';

export const PaidMediaView: React.FC = () => {
    const { paidMediaData, setPaidMediaData, setBudgets } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const { metrics, budgets } = await parsePaidMediaExcel(file);
            setPaidMediaData(metrics);
            setBudgets(budgets);
            alert(`Processado com sucesso! ${metrics.length} linhas de métricas e ${budgets.length} budgets.`);
        } catch (error) {
            console.error(error);
            alert('Erro ao processar arquivo. Verifique o console ou o formato.');
        }
    };

    const hasData = paidMediaData.length > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full shadow-2xl">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload size={32} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Upload de Dados de Mídia</h2>
                    <p className="text-slate-400 mb-8 text-sm">
                        Faça upload do Excel contendo as abas de "Dados Diários" e "Metas" para visualizar o dashboard financeiro.
                    </p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
                    >
                        Selecionar Arquivo Excel
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        hidden
                        accept=".xlsx,.xls,.osv"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Top Row: KPIs & Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <BudgetCard />
                </div>
                <div className="lg:col-span-2">
                    <ChannelComparisonChart />
                </div>
            </div>

            {/* Bottom Row: Granular Data */}
            <div className="h-[500px]">
                <CampaignPerformanceTable />
            </div>

            {/* Debug/Action Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-slate-500 hover:text-slate-300 underline"
                >
                    Atualizar Base de Dados (Upload)
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden />
            </div>
        </div>
    );
};
