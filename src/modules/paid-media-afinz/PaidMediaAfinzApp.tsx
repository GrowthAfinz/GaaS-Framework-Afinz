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
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 absolute top-0 left-0 z-50">
        <div className="flex flex-col items-center">
          <AfinzLogo height={40} className="text-white mb-8 opacity-80" />
          <div className="w-14 h-14 bg-[#00c6cc]/10 rounded-full flex items-center justify-center mb-4 border border-[#00c6cc]/20">
            <Loader2 className="w-7 h-7 text-[#00c6cc] animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Sincronizando Dados...</h2>
          <p className="text-slate-400 text-sm font-light">Buscando informações salvas na nuvem.</p>
        </div>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 absolute top-0 left-0 z-50">
        <div className="absolute top-4 left-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
            Voltar ao GaaS
          </button>
        </div>
        <div className="text-center mb-10 animate-fade-in-up">
          <AfinzLogo height={48} className="text-white mx-auto mb-6" />
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            Media Analytics
          </h1>
          <p className="text-slate-400 font-light">
            Importe seus dados do Meta Ads e Google Ads para começar.
          </p>
        </div>
        <div className="w-full max-w-2xl bg-slate-900 p-8 rounded-2xl border border-slate-800 animate-fade-in">
          <FileUpload onDataLoaded={setRawData} />
        </div>
        <p className="mt-8 text-slate-500 text-xs font-light">
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
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col absolute top-0 left-0 z-50">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-[60] group">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors mr-1"
                title="Voltar ao GaaS"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-4">
              <AfinzLogo height={32} className="text-white" />
              <div className="h-6 w-px bg-slate-700 mx-1" />
              <div className="flex items-center gap-2">
                <div className="h-5 w-0.5 rounded-full bg-[#00c6cc]" />
                <h1 className="font-black text-base text-white tracking-tight">Media Analytics</h1>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
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
                      ? 'bg-slate-700 text-[#00c6cc] border border-[#00c6cc]/30 shadow-sm'
                      : 'text-slate-400 hover:text-[#00c6cc] hover:bg-slate-800'
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
            className="text-sm font-medium text-slate-400 hover:text-[#e74742] flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-[#e74742]/10 rounded-lg"
          >
            <UploadCloud size={16} />
            Novo Arquivo
          </button>
        </div>

        {/* Global Filter Bar */}
        <FilterBar />
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8 pb-32 max-w-[1600px] animate-fade-in">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'monthly' && <MonthlyAnalysisTab />}
        {activeTab === 'daily' && <DailyAnalysisTab />}
        {activeTab === 'campaigns' && <CampaignDetailsTab />}
        {activeTab === 'budget' && <BudgetTab />}
      </main>
    </div>
  );
};

export default function PaidMediaAfinzApp({ onBack }: PaidMediaAfinzAppProps) {
  return (
    <FilterProvider>
      <DashboardContent onBack={onBack} />
    </FilterProvider>
  );
}
