import { dataService } from '../../services/dataService';
import { useAppStore } from '../../store/useAppStore';
import { useUserRole } from '../../context/UserRoleContext';

import React, { useState, useEffect } from 'react';
import { FilterProvider, useFilters } from './context/FilterContext';
import { FileUpload } from './components/FileUpload';
import { FilterBar } from './components/FilterBar';
import { OverviewTab } from './components/Tabs/OverviewTab';
import { MonthlyAnalysisTab } from './components/Tabs/MonthlyAnalysisTab';
import { CampaignDetailsTab } from './components/Tabs/CampaignDetailsTab';
import { BudgetTab } from './components/Tabs/BudgetTab';
import { DailyAnalysisTab } from './components/Tabs/DailyAnalysisTab';
import { CampaignMapperModal } from './components/Modals/CampaignMapperModal';
import { AfinzLogo } from './components/AfinzLogo';
import { LayoutDashboard, BarChart2, List, Wallet, UploadCloud, ArrowLeft, Calendar, Loader2, Settings2 } from 'lucide-react';

interface PaidMediaAfinzAppProps {
  onBack?: () => void;
}

const DashboardContent: React.FC<PaidMediaAfinzAppProps> = ({ onBack }) => {
  const { rawData, setRawData } = useFilters();
  const { isPlurixAnalyst } = useUserRole();
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'campaigns' | 'budget' | 'daily'>('overview');
  const [isSyncing, setIsSyncing] = useState(true);
  const [isFilterHovered, setIsFilterHovered] = useState(false);
  const [isMapperOpen, setIsMapperOpen] = useState(false);

  // Auto-Sync — reads directly from Supabase table
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

  // ── Loading Screen (light) ──────────────────────────────────────────────
  if (isSyncing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <AfinzLogo height={40} className="mb-8" />
          <div className="w-14 h-14 bg-[#00C6CC]/10 rounded-full flex items-center justify-center mb-4 border border-[#00C6CC]/30">
            <Loader2 className="w-7 h-7 text-[#00C6CC] animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sincronizando Dados...</h2>
          <p className="text-slate-400 text-sm">Buscando informações salvas na nuvem.</p>
        </div>
      </div>
    );
  }

  // ── No Data / Upload Screen (light) ────────────────────────────────────
  if (rawData.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
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
          <AfinzLogo height={48} className="mx-auto mb-6" />
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
            Media Analytics
          </h1>
          <p className="text-slate-500 font-light">
            Importe seus dados do Meta Ads e Google Ads para começar.
          </p>
        </div>
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
          <FileUpload onDataLoaded={setRawData} />
        </div>
        <p className="mt-8 text-slate-400 text-xs font-light">
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
    // ── Dashboard (light) ──────────────────────────────────────────────
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col overflow-hidden" style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}>
      {/* Header */}
      <header
        className="bg-white border-b border-slate-200 sticky top-0 z-[60] shadow-sm transition-all duration-300"
        onMouseEnter={() => setIsFilterHovered(true)}
      >
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors mr-1"
                title="Voltar ao GaaS"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <AfinzLogo height={28} />
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 rounded-full bg-[#00C6CC]" />
                <h1 className="font-black text-xl text-slate-800 tracking-tight">Media Analytics</h1>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-white text-[#00C6CC] shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }
                  `}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMapperOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
              title="Mapeamento de Campanhas"
            >
              <Settings2 size={18} />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
              onClick={() => setRawData([])}
              className="text-sm font-medium text-slate-500 hover:text-red-500 flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg"
            >
              <UploadCloud size={16} />
              Novo Arquivo
            </button>
          </div>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto relative"
        onMouseEnter={() => setIsFilterHovered(false)}
      >
        {/* Animated Filter Bar — only shows when hovering the header or when explicitly needed */}
        <div
          className={`
                sticky top-0 z-50 bg-white shadow-lg border-b border-slate-200 overflow-hidden transform-gpu origin-top
                transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                ${isFilterHovered ? 'max-h-40 translate-y-0 opacity-100' : 'max-h-0 -translate-y-3 opacity-0 pointer-events-none'}
            `}
          onMouseEnter={() => setIsFilterHovered(true)}
          onMouseLeave={() => setIsFilterHovered(false)}
        >
          <FilterBar />
        </div>

        <div className="container mx-auto px-6 py-8 pb-32 max-w-[1600px] animate-fade-in">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'monthly' && <MonthlyAnalysisTab />}
          {activeTab === 'daily' && <DailyAnalysisTab />}
          {activeTab === 'campaigns' && <CampaignDetailsTab />}
          {activeTab === 'budget' && <BudgetTab />}
        </div>
      </main>

      <CampaignMapperModal 
        isOpen={isMapperOpen} 
        onClose={() => setIsMapperOpen(false)} 
      />
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
