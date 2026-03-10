import { useState, useMemo, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { CSVUpload } from './components/CSVUpload';
import { InlineFilterBar } from './components/InlineFilterBar';
import { LoginView } from './components/LoginView';
import { SetPasswordView } from './components/SetPasswordView';

import { ResultadosView } from './components/ResultadosView';
import { RelatorioView } from './components/RelatorioView';
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
import { MainLayout } from './components/layout/MainLayout';
import { LaunchPlanner } from './components/launch-planner/LaunchPlanner';
import PaidMediaAfinzApp from './modules/paid-media-afinz/PaidMediaAfinzApp';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/layout/PageTransition';
import './App.css';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [urlHash, setUrlHash] = useState(window.location.hash);
  const [isFilterDropOpen, setIsFilterDropOpen] = useState(false);
  const filterCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openFilterDrop = () => {
    if (filterCloseTimeoutRef.current) {
      clearTimeout(filterCloseTimeoutRef.current);
      filterCloseTimeoutRef.current = null;
    }
    setIsFilterDropOpen(true);
  };

  const scheduleCloseFilterDrop = () => {
    if (filterCloseTimeoutRef.current) {
      clearTimeout(filterCloseTimeoutRef.current);
    }
    filterCloseTimeoutRef.current = setTimeout(() => {
      setIsFilterDropOpen(false);
      filterCloseTimeoutRef.current = null;
    }, 260);
  };

  useEffect(() => {
    const handleHashChange = () => {
      setUrlHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    return () => {
      if (filterCloseTimeoutRef.current) {
        clearTimeout(filterCloseTimeoutRef.current);
      }
    };
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

  const filters = useMemo(() => ({
    ...storeFilters,
    dataInicio: format(startDate, 'yyyy-MM-dd'),
    dataFim: format(endDate, 'yyyy-MM-dd'),
    bu: selectedBUs
  }), [storeFilters, startDate, endDate, selectedBUs]);

  const isFrameworkView = activeTab === 'framework';
  const isMidiaPaga = activeTab === 'midia-paga';
  const shouldRunFilters = !isFrameworkView && !isMidiaPaga;

  const {
    filteredData: advancedFilteredData,
    availableCanais,
    availableJornadas,
    availableSegmentos,
    availableParceiros,
    countByCanal,
    countByJornada,
    countBySegmento,
    countByParceiro,
    totalRemainingDisparos
  } = useAdvancedFilters(
    shouldRunFilters ? data : {},
    filters
  );

  const { filteredData } = useCalendarFilter(advancedFilteredData, filters);

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

  const launchPlannerFilters = useMemo(() => ({
    ...storeFilters,
    bu: selectedBUs,
    canais: [],
    jornadas: [],
    segmentos: [],
    parceiros: [],
    ofertas: [],
    disparado: 'Todos' as const,
    dataInicio: '',
    dataFim: ''
  }), [storeFilters, selectedBUs]);

  const { filteredData: launchPlannerData } = useAdvancedFilters(
    activeTab === 'launch' ? data : {},
    launchPlannerFilters
  );

  const { filteredData: previousFilteredData } = useCalendarFilter(
    shouldRunFilters ? advancedFilteredData : {},
    previousFilters
  );

  const resultados = useResultadosMetrics(filteredData);

  const hasData = Object.keys(data).length > 0;

  if (authLoading) {
    return <div className="h-screen w-full bg-slate-50 text-slate-500 flex items-center justify-center">Carregando...</div>;
  }

  if (!user) return <LoginView />;

  const isRecoveryFlow = urlHash.includes('type=recovery');
  const isInviteFlow = urlHash.includes('type=invite');

  if (user && (isRecoveryFlow || isInviteFlow)) {
    return <SetPasswordView />;
  }

  if (activeTab === 'midia-paga') {
    return <PaidMediaAfinzApp onBack={() => setTab('launch')} />;
  }

  return (
    <MainLayout
      onHeaderMouseEnter={openFilterDrop}
      onContentMouseEnter={scheduleCloseFilterDrop}
    >
      {hasData && (
        <div className="sticky top-0 z-30">
          <div
            className={`
              bg-white border-b border-slate-200 shadow-sm transform-gpu origin-top
              transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${isFilterDropOpen ? 'max-h-44 opacity-100 translate-y-0 overflow-visible' : 'max-h-0 opacity-0 -translate-y-3 overflow-hidden pointer-events-none'}
            `}
            onMouseEnter={openFilterDrop}
            onMouseMove={openFilterDrop}
            onMouseLeave={scheduleCloseFilterDrop}
          >
            <div className="px-6 py-3">
              <InlineFilterBar
                availableCanais={availableCanais}
                availableJornadas={availableJornadas}
                availableSegmentos={availableSegmentos}
                availableParceiros={availableParceiros}
                countByCanal={countByCanal}
                countByJornada={countByJornada}
                countBySegmento={countBySegmento}
                countByParceiro={countByParceiro}
                totalRemainingDisparos={totalRemainingDisparos}
              />
            </div>
          </div>

          <div className="relative h-0">
            <button
              type="button"
              aria-label="Area de ativacao dos filtros"
              className="absolute top-0 left-0 right-0 h-12 bg-transparent cursor-default z-10"
              onMouseEnter={openFilterDrop}
              onMouseLeave={scheduleCloseFilterDrop}
              onFocus={openFilterDrop}
            />
          </div>
        </div>
      )}

      <div className="flex-1 pb-10">
        {loading && !hasData && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Menu size={32} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Verificando dados...</h2>
              <p className="text-slate-500">Carregando informacoes do banco de dados</p>
            </div>
          </div>
        )}

        {!loading && !hasData && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Menu size={32} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo ao GaaS</h2>
              <p className="text-slate-500 mb-8">Faca upload do seu arquivo de dados para comecar a analise.</p>
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
              {activeTab === 'relatorio' && (
                <PageTransition>
                  <RelatorioView
                    data={filteredData}
                    selectedBU={selectedBUs.length === 1 ? selectedBUs[0] : undefined}
                  />
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
              {!['launch', 'resultados', 'jornada', 'diario', 'framework', 'explorador', 'orientador', 'configuracoes', 'originacao-b2c', 'midia-paga', 'relatorio'].includes(activeTab) && (
                <div className="flex items-center justify-center h-full text-slate-500">
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
