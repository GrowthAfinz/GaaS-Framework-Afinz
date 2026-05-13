import React, { useMemo, useState } from 'react';
import { BarChart2, AlertTriangle } from 'lucide-react';
import { CalendarData, AnomalyType } from '../types/framework';
import { JornadaChart } from './JornadaChart';
import { DailyDetailsModal } from './jornada/DailyDetailsModal';
import { PerformanceEvolutionChart } from './jornada/PerformanceEvolutionChart';
import { Tooltip } from './Tooltip';
import { format } from 'date-fns';

interface JornadaDisparosViewProps {
  data: CalendarData;
  previousData?: CalendarData;
  selectedBU?: string;
  selectedCanais?: string[];
  selectedSegmentos?: string[];
  selectedParceiros?: string[];
}

export const JornadaDisparosView: React.FC<JornadaDisparosViewProps> = ({
  data,
  // previousData,
  selectedBU,
  selectedCanais = [],
  selectedSegmentos = [],
  selectedParceiros = [],
}) => {
  const [chartMode, setChartMode] = useState<'performance' | 'anomalies'>('performance');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAnomalyFilters, setSelectedAnomalyFilters] = useState<AnomalyType[]>([]);

  const toggleAnomalyFilter = (filter: AnomalyType) => {
    setSelectedAnomalyFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter],
    );
  };

  const selectedActivities = useMemo(() => {
    if (!selectedDate) return [];

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const activities = data[dateKey] || [];

    return activities.filter((activity) => {
      if (selectedBU && activity.bu !== selectedBU) return false;
      if (selectedCanais.length > 0 && !selectedCanais.includes(activity.canal)) return false;
      if (selectedSegmentos.length > 0 && !selectedSegmentos.includes(activity.segmento)) return false;
      if (selectedParceiros.length > 0 && !selectedParceiros.includes(activity.parceiro)) return false;
      return true;
    });
  }, [data, selectedDate, selectedBU, selectedCanais, selectedSegmentos, selectedParceiros]);

  return (
    <div className="p-6 space-y-6">
      <DailyDetailsModal
        date={selectedDate}
        activities={selectedActivities}
        anomalyFilters={selectedAnomalyFilters}
        onClose={() => setSelectedDate(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            Jornada & Disparos
            <Tooltip content="Visão geral do funil de conversão, do disparo até emissão, com identificação automática de gargalos e anomalias." />
          </h1>
          <p className="text-sm text-slate-500">Análise profunda de conversão e identificação de gargalos</p>
          <p className="text-xs text-slate-500 mt-1">
            Total Activities: {Object.values(data).reduce((acc, curr) => acc + curr.length, 0)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {chartMode === 'anomalies' && (
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 gap-1">
                {[
                  { id: 'pending', label: 'Pendente' },
                  { id: 'no_sent', label: 'Sem Envio' },
                  { id: 'no_delivered', label: 'Sem Entrega' },
                  { id: 'no_open', label: 'Sem Abertura' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => toggleAnomalyFilter(filter.id as AnomalyType)}
                    className={`px-3 py-1 text-xs font-medium rounded transition ${selectedAnomalyFilters.includes(filter.id as AnomalyType)
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
                {selectedAnomalyFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedAnomalyFilters([])}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 border-l border-slate-200 ml-1 pl-2"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <Tooltip content="Filtre as anomalias por tipo para focar em problemas específicos." />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setChartMode('performance')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${chartMode === 'performance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
              >
                <BarChart2 size={16} />
                Performance
              </button>
              <button
                onClick={() => setChartMode('anomalies')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${chartMode === 'anomalies'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
              >
                <AlertTriangle size={16} />
                Anomalias
              </button>
            </div>
            <Tooltip content="Alterne entre visão de performance e investigação de anomalias." side="left" />
          </div>
        </div>
      </div>

      <JornadaChart
        data={data}
        mode={chartMode}
        anomalyFilters={selectedAnomalyFilters}
        onPointClick={setSelectedDate}
      />

      <PerformanceEvolutionChart
        data={data}
        selectedBU={selectedBU}
        selectedCanais={selectedCanais}
        selectedSegmentos={selectedSegmentos}
        selectedParceiros={selectedParceiros}
        onDayClick={(dateStr) => {
          const date = new Date(`${dateStr}T00:00:00`);
          setSelectedDate(date);
        }}
      />

      {/* <BottleneckAnalysis
        data={selectedActivities.length > 0 ? { [selectedDate?.toISOString().split('T')[0] || '']: selectedActivities } : data}
        previousData={previousData}
        selectedBU={selectedBU}
        selectedCanais={selectedCanais}
        selectedSegmentos={selectedSegmentos}
        selectedParceiros={selectedParceiros}
      /> */}
    </div>
  );
};

