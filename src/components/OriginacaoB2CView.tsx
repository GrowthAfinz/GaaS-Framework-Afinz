import React, { useState, useEffect } from 'react';
import { useB2CAnalysis } from '../hooks/useB2CAnalysis';
import { useAppStore } from '../store/useAppStore';
import { OriginacaoKPIsComparison } from './originacao/OriginacaoKPIsComparison';
import { OriginacaoKPIsPerformance } from './originacao/OriginacaoKPIsPerformance';
import { OriginacaoCharts } from './originacao/OriginacaoCharts';
import { OriginacaoTable } from './originacao/OriginacaoTable';
import { B2CUpload } from './originacao/B2CUpload';
import { ActivityShareCorrelationChart } from './originacao/ActivityShareCorrelationChart';
import { ShareBySegmentChart } from './originacao/ShareBySegmentChart';
import { BarChart3, Loader2 } from 'lucide-react';
import { FunnelOrchestrator } from './originacao/orchestrator/FunnelOrchestrator';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { MediaCorrelationCharts } from './analise/MediaCorrelationCharts';
import { Activity } from '../types/framework';
import { format } from 'date-fns';
import { storageService } from '../services/storageService';
import { useCSVParser } from '../hooks/useCSVParser';

export const OriginacaoB2CView: React.FC = () => {
    const { dailyAnalysis, summary, previousSummary, viewMode, setViewMode, getActivities, segmentStats } = useB2CAnalysis();
    const { alertConfig, b2cData, setB2CData } = useAppStore();
    const { parseB2CCSV } = useCSVParser();
    const [loading, setLoading] = useState(true);
    const [synced, setSynced] = useState(false);

    // Auto-Sync B2C Data
    useEffect(() => {
        const syncB2C = async () => {
            // If already loaded or synced, skip
            if (b2cData.length > 0) {
                setLoading(false);
                return;
            }
            if (synced) return;
            setSynced(true);

            try {
                // Check Cloud
                const files = await storageService.listFiles('b2c');
                if (files && files.length > 0) {
                    setLoading(true);
                    console.log('🔄 B2C Auto-Sync:', files[0].name);

                    const url = await storageService.getDownloadUrl('b2c/' + files[0].name);
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    const file = new File([blob], files[0].name, { type: 'text/csv' });

                    const { data } = await parseB2CCSV(file);
                    if (data && data.length > 0) {
                        setB2CData(data);
                        // Optional: we can expose setB2CFilename if added to store, currently just data.
                    }
                    setLoading(false);
                }
            } catch (e) {
                console.error('B2C Sync failed', e);
                setLoading(false);
            }
        };

        syncB2C();
    }, [b2cData.length, synced, setB2CData, parseB2CCSV]);

    // ... Rest of component

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);

    const handleDayClick = (dateStr: string) => {
        const activities = getActivities(dateStr, 'daily');
        const [y, m, d] = dateStr.split('-').map(Number);

        setModalDate(new Date(y, m - 1, d));
        setSelectedActivities(activities);
        setModalTitle(undefined); // Use default
        setModalOpen(true);
    };

    const handleWeekClick = (weekStartStr: string) => {
        const activities = getActivities(weekStartStr, 'weekly');
        const [y, m, d] = weekStartStr.split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        setModalDate(startDate);
        setSelectedActivities(activities);
        setModalTitle(`📅 Detalhes da Semana: ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedActivities([]);
        setModalDate(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="text-blue-500" />
                        Originação B2C
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Análise de participação CRM na originação total B2C.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Only show upload if no data loaded globally */}
                    {b2cData.length === 0 && <B2CUpload />}
                </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
                <div className="max-w-[1600px] mx-auto">
                    {dailyAnalysis.length > 0 && summary ? (
                        <>

                            {/* ROW 1: Comparison Cards (Left 2/3) + Segment Pie (Right 1/3) */}
                            <div className="flex flex-col xl:flex-row gap-6 mb-8">
                                <div className="xl:w-7/12">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 opacity-90">Comparação B2C vs CRM</h3>
                                    <OriginacaoKPIsComparison summary={summary} previousSummary={previousSummary} />
                                </div>
                                <div className="xl:w-5/12 flex flex-col">
                                    <ShareBySegmentChart
                                        segmentStats={segmentStats}
                                        totalB2CEmissoes={summary.emissoes_b2c_total}
                                    />
                                </div>
                            </div>

                            {/* ROW 2: Performance KPIs */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 opacity-90">Performance</h3>
                                <OriginacaoKPIsPerformance summary={summary} />
                            </div>

                            {/* Funnel Orchestrator - HIDDEN PER USER REQUEST */}
                            {/* <div className="mb-8">
                                <FunnelOrchestrator />
                            </div> */}

                            <OriginacaoCharts
                                data={dailyAnalysis}
                                shareThreshold={alertConfig.share_crm_limiar}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                onPointClick={(date) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    handleDayClick(dateStr);
                                }}
                            />
                            <OriginacaoTable
                                data={dailyAnalysis}
                                onRowClick={handleDayClick}
                            />
                            <div className="mb-6">
                                <ActivityShareCorrelationChart
                                    data={dailyAnalysis}
                                    onBarClick={handleWeekClick}
                                />
                            </div>

                            {/* Media Correlation Analysis - HIDDEN PER USER REQUEST */}
                            {/* <MediaCorrelationCharts /> */}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3 text-slate-500">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <p>Sincronizando dados...</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-500 mb-2">Nenhum dado B2C carregado.</p>
                                    <p className="text-xs text-slate-500">Faça upload do CSV diarizado para começar.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {modalOpen && (
                    <DailyDetailsModal
                        date={modalDate}
                        activities={selectedActivities}
                        onClose={handleCloseModal}
                        titleOverride={modalTitle}
                    />
                )}
            </div>
        </div>
    );
};
