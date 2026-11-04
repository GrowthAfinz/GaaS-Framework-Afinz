import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import { Activity, AnomalyType, CalendarData } from '../../types/framework';
import { AnomalyEvolutionChart } from './AnomalyEvolutionChart';
import { useAppStore } from '../../store/useAppStore';
import { DailyDetailsModal } from '../jornada/DailyDetailsModal';
import { PerformanceEvolutionChart } from '../jornada/PerformanceEvolutionChart';
import { InsightDeckModal } from '../jornada/InsightDeckModal';

const ANOMALY_FILTERS: { id: AnomalyType; label: string }[] = [
  { id: 'pending', label: 'Pendente' },
  { id: 'no_sent', label: 'Sem envio' },
  { id: 'no_delivered', label: 'Sem entrega' },
  { id: 'no_open', label: 'Sem abertura' },
];

/**
 * As três partes que só existiam em "Jornada & Disparos", agora dentro de Relatórios:
 * evolução de performance (com detalhe do dia), filtros de anomalia e Insight Deck.
 */
export function JourneyHealthSection({ data, selectedBU }: { data: CalendarData; selectedBU?: string }) {
  const filters = useAppStore(state => state.viewSettings.filtrosGlobais);
  const selectedCanais = filters.canais ?? [];
  const selectedSegmentos = filters.segmentos ?? [];
  const selectedParceiros = filters.parceiros ?? [];
  const [mode, setMode] = useState<'performance' | 'anomalies'>('performance');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [anomalyFilters, setAnomalyFilters] = useState<AnomalyType[]>([]);

  const accept = useCallback((activity: Activity) =>
    (!selectedBU || activity.bu === selectedBU)
    && (!selectedCanais.length || selectedCanais.includes(activity.canal))
    && (!selectedSegmentos.length || selectedSegmentos.includes(activity.segmento))
    && (!selectedParceiros.length || selectedParceiros.includes(activity.parceiro)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [selectedBU, selectedCanais.join('|'), selectedSegmentos.join('|'), selectedParceiros.join('|')]);

  const selectedActivities = useMemo(() => {
    if (!selectedDate) return [];
    return (data[format(selectedDate, 'yyyy-MM-dd')] || []).filter(accept);
  }, [data, selectedDate, accept]);

  const toggle = (id: AnomalyType) => setAnomalyFilters(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <section aria-label="Evolução e anomalias" className="space-y-4">
      <DailyDetailsModal date={selectedDate} activities={selectedActivities} anomalyFilters={anomalyFilters} onClose={() => setSelectedDate(null)} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Evolução e anomalias</h2>
          <p className="text-xs text-slate-500">Clique num dia do gráfico para ver os disparos. No modo Anomalias, o gráfico mostra os disparos com problema e os filtros escolhem os tipos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'anomalies' && (
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {ANOMALY_FILTERS.map(filter => (
                <button key={filter.id} type="button" aria-pressed={anomalyFilters.includes(filter.id)} onClick={() => toggle(filter.id)}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${anomalyFilters.includes(filter.id) ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {filter.label}
                </button>
              ))}
              {anomalyFilters.length > 0 && <button type="button" onClick={() => setAnomalyFilters([])} className="border-l border-slate-200 px-2 text-xs text-slate-500">Limpar</button>}
            </div>
          )}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button type="button" aria-pressed={mode === 'performance'} onClick={() => setMode('performance')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${mode === 'performance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><BarChart2 size={14} />Performance</button>
            <button type="button" aria-pressed={mode === 'anomalies'} onClick={() => setMode('anomalies')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${mode === 'anomalies' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><AlertTriangle size={14} />Anomalias</button>
          </div>
          <InsightDeckModal trigger="inline" />
        </div>
      </div>
      {mode === 'anomalies' ? (
        <AnomalyEvolutionChart data={data} filters={anomalyFilters} accept={accept} onDayClick={setSelectedDate} />
      ) : (
      <PerformanceEvolutionChart
        data={data}
        selectedBU={selectedBU}
        selectedCanais={selectedCanais}
        selectedSegmentos={selectedSegmentos}
        selectedParceiros={selectedParceiros}
        onDayClick={dateStr => setSelectedDate(new Date(`${dateStr}T00:00:00`))}
      />
      )}
    </section>
  );
}
