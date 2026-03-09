import { dataService } from '../../services/dataService';
import { useAppStore } from '../../store/useAppStore';

import React, { useState, useEffect } from 'react';
import { FilterProvider, useFilters } from './context/FilterContext';
import { FileUpload } from './components/FileUpload';
import { FilterBar } from './components/FilterBar';
import { OverviewTab } from './components/Tabs/OverviewTab';
import { MonthlyAnalysisTab } from './components/Tabs/MonthlyAnalysisTab';
import { CampaignDetailsTab } from './components/Tabs/CampaignDetailsTab';
import { BudgetTab } from './components/Tabs/BudgetTab';
import { DailyAnalysisTab } from './components/Tabs/DailyAnalysisTab';
import { AfinzLogo } from './components/AfinzLogo';
import { LayoutDashboard, BarChart2, List, Wallet, UploadCloud, ArrowLeft, Calendar, Loader2 } from 'lucide-react'; // Added Loader2

interface PaidMediaAfinzAppProps {
  onBack?: () => void;
}

const DashboardContent: React.FC<PaidMediaAfinzAppProps> = ({ onBack }) => {
  const { rawData, setRawData } = useFilters();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'campaigns' | 'budget' | 'daily'>('overview');
  const [isSyncing, setIsSyncing] = useState(true);

  // Auto-Sync Effect — reads directly from Supabase table instead of reparsing the Excel from bucket
  useEffect(() => {
    const syncWithCloud = async () => {
      try {
        console.log('📡 Buscando métricas de Mídia Paga do banco...');
        const data = await dataService.fetchPaidMedia();
        if (data && data.length > 0) {
          setRawData(data as any);
          console.log(`✅ ${data.length} linhas carregadas do banco.`);
        } else {
          console.log('ℹ️ Nenhum dado de Mídia Paga encontrado no banco.');
        }
      } catch (e) {
        console.error('Erro ao buscar dados de Mídia Paga:', e);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithCloud();
  }, []);

  if (isSyncing) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 absolute top-0 left-0 z-50">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sincronizando Dados...</h2>
          <p className="text-slate-400 text-sm">Buscando informações salvas na nuvem.</p>
        </div>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 absolute top-0 left-0 z-50">
        <div className="absolute top-4 left-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-200"
          >
            <ArrowLeft size={20} />
            Voltar ao GaaS
          </button>
        </div>
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Dashboard de Mídia Paga
          </h1>
          <p className="text-slate-500 text-lg">
            Importe seus dados do Meta Ads e Google Ads para começar.
          </p>
        </div>
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
          <FileUpload onDataLoaded={setRawData} />
        </div>
        <p className="mt-8 text-slate-400 text-sm">
          Versão 1.0 • Processamento Local e Seguro
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monthly', label: 'Análise Mensal', icon: BarChart2 },
    { id: 'daily', label: 'Análise Diária', icon: Calendar },
    { id: 'campaigns', label: 'Campanhas', icon: List },
    { id: 'budget', label: 'Orçamentos', icon: Wallet },
  ] as const;

  return (
    <div className="min-h-screen w-full bg-[#FFF7ED] text-slate-900 flex flex-col absolute top-0 left-0 z-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-[60] group">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors mr-2"
                title="Voltar ao GaaS"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-4">
              <AfinzLogo height={32} className="text-slate-900" />
              <div className="h-6 w-px bg-slate-300 mx-1"></div>
              <h1 className="font-bold text-lg text-slate-700 tracking-tight">Media Analytics</h1>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-lg border border-orange-100/50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-white text-orange-600 shadow-sm border border-orange-100'
                      : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => setRawData([])}
            className="text-sm font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg"
          >
            <UploadCloud size={16} />
            Novo Arquivo
          </button>
        </div>

        {/* Global Filter Bar */}
        <FilterBar />
      </header >

      {/* Main Content */}
      < main className="flex-1 container mx-auto px-6 py-8 pb-32 max-w-[1600px] animate-fade-in" >

        {/* Render Active Tab */}

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'monthly' && <MonthlyAnalysisTab />}
        {activeTab === 'daily' && <DailyAnalysisTab />}
        {activeTab === 'campaigns' && <CampaignDetailsTab />}
        {activeTab === 'budget' && <BudgetTab />}
      </main >
    </div >
  );
};

export default function PaidMediaAfinzApp({ onBack }: PaidMediaAfinzAppProps) {
  return (
    <FilterProvider>
      <DashboardContent onBack={onBack} />
    </FilterProvider>
  );
}
