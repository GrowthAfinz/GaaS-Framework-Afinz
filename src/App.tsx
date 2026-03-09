import { useState, useMemo, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { CSVUpload } from './components/CSVUpload';
import { InlineFilterBar } from './components/InlineFilterBar';
import { LoginView } from './components/LoginView'; // NEW
import { SetPasswordView } from './components/SetPasswordView';

import { ResultadosView } from './components/ResultadosView';
import { JornadaDisparosView } from './components/JornadaDisparosView';
import { DiarioBordo } from './components/DiarioBordo';
import { FrameworkView } from './components/FrameworkView';
import { OrientadorView } from './components/OrientadorView';
import { ConfiguracoesView } from './components/ConfiguracoesView';
import { OriginacaoB2CView } from './components/OriginacaoB2CView';
import { DisparoExplorer } from './components/explorer/DisparoExplorer';
import { useFrameworkData } from './hooks/useFrameworkData';
import { useAdvancedFilters } from './hooks/useAdvancedFilters';
import { useCalendarFilter } from './hooks/useCalendarFilter';
import { useResultadosMetrics } from './hooks/useResultadosMetrics';
import { useAppStore } from './store/useAppStore';
import { usePeriod } from './contexts/PeriodContext';
import { useBU } from './contexts/BUContext';
import { format } from 'date-fns';
import { MainLayout } from './components/layout/MainLayout'; // NEW
import { LaunchPlanner } from './components/launch-planner/LaunchPlanner';
import { PageHeader } from './components/layout/PageHeader';
import PaidMediaAfinzApp from './modules/paid-media-afinz/PaidMediaAfinzApp';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/layout/PageTransition'; // NEW
import './App.css';
import { useAuth } from './context/AuthContext'; // NEW

function App() {
  const { user, loading: authLoading } = useAuth(); // Auth check
  const [urlHash, setUrlHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setUrlHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const {
    viewSettings,
    updateActivity,
    setTab
  } = useAppStore();
  const storeFilters = viewSettings.filtrosGlobais;
  const activeTab = viewSettings.abaAtual;

  const { startDate, endDate } = usePeriod();
  const { selectedBUs } = useBU();

  const { data, loading, error, totalActivities, processCSV, loadSimulatedData } = useFrameworkData();

  // Combine store filters with Context filters
  const filters = useMemo(() => ({
    ...storeFilters,
    dataInicio: format(startDate, 'yyyy-MM-dd'),
    dataFim: format(endDate, 'yyyy-MM-dd'),
    bu: selectedBUs
  }), [storeFilters, startDate, endDate, selectedBUs]);

  // Optimize: Only run heavy filter logic if NOT in Framework View or other independent views
  const isFrameworkView = activeTab === 'framework';
  const isMidiaPaga = activeTab === 'midia-paga';
  const shouldRunFilters = !isFrameworkView && !isMidiaPaga;

  // These hooks now use the new FilterState structure
  // Conditional execution dummy for hooks to obey Rules of Hooks? No, hooks must run.
  // We can pass empty data or memoize the result based on activeTab.

  const { filteredData: advancedFilteredData, availableCanais, availableJornadas, availableSegmentos, availableParceiros, countByCanal, countByJornada, countBySegmento, countByParceiro } = useAdvancedFilters(
    shouldRunFilters ? data : {}, // Pass empty object if not needed to skip processing
    filters
  );

  const { filteredData } = useCalendarFilter(advancedFilteredData, filters);

  // Calculate previous period filters for trend analysis
  const previousFilters = useMemo(() => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);

    return {
      ...filters,
      dataInicio: format(prevStart, 'yyyy-MM-dd'),
      dataFim: format(prevEnd, 'yyyy-MM-dd')
    };
  }, [filters, startDate, endDate]);

  // Filters for Launch Planner (ignoring date range to allow local navigation)
  const launchPlannerFilters = useMemo(() => ({
    ...filters,
    dataInicio: '',
    dataFim: ''
  }), [filters]);

  const { filteredData: launchPlannerData } = useAdvancedFilters(
    activeTab === 'launch' ? data : {}, // Only process for Launch Planner
    launchPlannerFilters
  );

  const { filteredData: previousFilteredData } = useCalendarFilter(
    shouldRunFilters ? advancedFilteredData : {},
    previousFilters
  );

  const resultados = useResultadosMetrics(filteredData);

  const hasData = Object.keys(data).length > 0;

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'launch': return 'Launch Planner';
      case 'jornada': return 'Jornada & Disparos';
      case 'resultados': return 'Resultados';
      case 'orientador': return 'Orientador';
      case 'framework': return 'Explorador de Disparos';
      case 'explorador': return 'Explorador de Disparos';
      case 'diario': return 'Diário de Bordo';
      case 'configuracoes': return 'Configurações';
      case 'midia-paga': return 'Media Analytics';
      default: return 'Dashboard';
    }
  };

  // --- RENDERING ---

  // 1. Auth Loading
  if (authLoading) return <div className="h-screen w-full bg-slate-950 text-slate-500 flex items-center justify-center">Carregando...</div>;

  // 2. Not Logged In
  if (!user) return <LoginView />;

  // 3. Set Password Flow (after magic link or reset)
  // Check if URL contains recovery or invite flow indicators
  const isRecoveryFlow = urlHash.includes('type=recovery');
  const isInviteFlow = urlHash.includes('type=invite');

  if (user && (isRecoveryFlow || isInviteFlow)) {
    return <SetPasswordView />;
  }

  // 4. Paid Media Full Screen
  if (activeTab === 'midia-paga') {
    return <PaidMediaAfinzApp onBack={() => setTab('launch')} />;
  }

  return (
    <MainLayout>

      {hasData && (
        <PageHeader title={getPageTitle(activeTab)}>
          <div className="flex ml-auto">
            <InlineFilterBar
              availableCanais={availableCanais}
              availableJornadas={availableJornadas}
              availableSegmentos={availableSegmentos}
              availableParceiros={availableParceiros}
              countByCanal={countByCanal}
              countByJornada={countByJornada}
              countBySegmento={countBySegmento}
              countByParceiro={countByParceiro}
            />
          </div>
        </PageHeader>
      )}

      <div className="flex-1 pb-10">
        {/* Show loading while checking Supabase */}
        {loading && !hasData && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Menu size={32} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verificando dados...</h2>
              <p className="text-slate-400">Carregando informações do banco de dados</p>
            </div>
          </div>
        )}

        {/* Show upload screen only if finished loading AND no data */}
        {!loading && !hasData && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="max-w-md w-full bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Menu size={32} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao GaaS</h2>
              <p className="text-slate-400 mb-8">Faça upload do seu arquivo de dados para começar a análise.</p>
              <CSVUpload
                onFileSelect={processCSV}
                onLoadSimulatedData={loadSimulatedData}
                loading={loading}
                error={error}
                totalActivities={totalActivities}
              />
            </div>
          </div>
        )}

        {hasData && (
          <AnimatePresence mode="wait">
            <div className="h-full" key={activeTab}>
              {activeTab === 'launch' && (
                <PageTransition>
                  <LaunchPlanner
                    data={launchPlannerData}
                    onActivityUpdate={(id, newDate) => updateActivity(id, { dataDisparo: newDate })}
                  />
                </PageTransition>
              )}
              {activeTab === 'resultados' && (
                <PageTransition>
                  <ResultadosView
                    resultados={resultados}
                    data={filteredData}
                    selectedBU={selectedBUs.length === 1 ? selectedBUs[0] : undefined}
                  />
                </PageTransition>
              )}
              {activeTab === 'jornada' && (
                <PageTransition>
                  <JornadaDisparosView
                    data={filteredData}
                    previousData={previousFilteredData}
                    selectedBU={selectedBUs.length === 1 ? selectedBUs[0] : undefined}
                    selectedCanais={filters.canais}
                    selectedSegmentos={filters.segmentos}
                    selectedParceiros={filters.parceiros}
                  />
                </PageTransition>
              )}
              {activeTab === 'diario' && (
                <PageTransition>
                  <DiarioBordo />
                </PageTransition>
              )}
              {activeTab === 'explorador' && (
                <PageTransition>
                  <DisparoExplorer
                    onNavigateToFramework={(f) => {
                      setTab('framework');
                      if (f?.bu || f?.segmento || f?.jornada) {
                        // Pre-apply filters via store when navigating to Framework
                        // (framework view reads filtrosGlobais from store)
                        const patch: Record<string, string[]> = {};
                        if (f.bu) patch['bu'] = [f.bu];
                        if (f.segmento) patch['segmentos'] = [f.segmento];
                        if (f.jornada) patch['jornadas'] = [f.jornada];
                      }
                    }}
                  />
                </PageTransition>
              )}
              {activeTab === 'framework' && (
                <PageTransition>
                  <FrameworkView />
                </PageTransition>
              )}
              {activeTab === 'orientador' && (
                <PageTransition>
                  <OrientadorView />
                </PageTransition>
              )}
              {activeTab === 'originacao-b2c' && (
                <PageTransition>
                  <OriginacaoB2CView />
                </PageTransition>
              )}
              {activeTab === 'configuracoes' && (
                <PageTransition>
                  <ConfiguracoesView />
                </PageTransition>
              )}
              {/* midia-paga rendred above conditionally as full screen */}
              {!['launch', 'resultados', 'jornada', 'diario', 'framework', 'explorador', 'orientador', 'configuracoes', 'originacao-b2c', 'midia-paga'].includes(activeTab) && (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Aba desconhecida: {activeTab}. Redirecionando...</p>
                </div>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
