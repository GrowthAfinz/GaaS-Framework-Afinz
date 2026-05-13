import React, { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subDays,
  format,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange, PeriodComparison } from '../types/framework';

interface PeriodSelectorProps {
  onPeriodChange: (periodComparison: PeriodComparison) => void;
  initialDate?: Date;
}

type PresetPeriod = 'this_week' | 'this_month' | 'this_year' | 'last_7' | 'last_14' | 'last_30' | 'custom';

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  onPeriodChange,
  initialDate = new Date()
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetPeriod>('this_month');
  const [isMoMEnabled, setIsMoMEnabled] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(initialDate), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(endOfMonth(initialDate), 'yyyy-MM-dd')
  );
  const [showModal, setShowModal] = useState(false);

  const getDateRangeForPreset = (preset: PresetPeriod, baseDate: Date): DateRange => {
    const today = baseDate;

    switch (preset) {
      case 'this_week':
        return {
          startDate: startOfWeek(today, { weekStartsOn: 0 }),
          endDate: endOfWeek(today, { weekStartsOn: 0 })
        };
      case 'this_month':
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
      case 'this_year':
        return {
          startDate: startOfYear(today),
          endDate: endOfYear(today)
        };
      case 'last_7':
        return {
          startDate: subDays(today, 6),
          endDate: today
        };
      case 'last_14':
        return {
          startDate: subDays(today, 13),
          endDate: today
        };
      case 'last_30':
        return {
          startDate: subDays(today, 29),
          endDate: today
        };
      case 'custom':
        return {
          startDate: parseISO(customStartDate),
          endDate: parseISO(customEndDate)
        };
      default:
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
    }
  };

  const handleApplyPeriod = () => {
    const dateRange = getDateRangeForPreset(selectedPreset, initialDate);

    onPeriodChange({
      current: dateRange,
      isMoMEnabled
    });

    setShowModal(false);
  };

  const presetLabels: Record<PresetPeriod, string> = {
    this_week: 'Esta semana',
    this_month: 'Este mês',
    this_year: 'Este ano',
    last_7: 'Últimos 7 dias',
    last_14: 'Últimos 14 dias',
    last_30: 'Últimos 30 dias',
    custom: 'Personalizado'
  };

  const currentDateRange = getDateRangeForPreset(selectedPreset, initialDate);
  const formattedRange = `${format(currentDateRange.startDate, 'dd/MM/yyyy')} - ${format(currentDateRange.endDate, 'dd/MM/yyyy')}`;

  return (
    <>
      {/* Period Button Trigger */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition"
      >
        <span className="text-sm font-medium">📅 Período: {formattedRange}</span>
        {isMoMEnabled && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            MoM ativo
          </span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Personalizar Período</h2>

            {/* Preset Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Períodos Predefinidos
              </label>
              <div className="space-y-2">
                {(Object.keys(presetLabels) as PresetPeriod[]).map(preset => (
                  <label
                    key={preset}
                    className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition"
                  >
                    <input
                      type="radio"
                      name="preset"
                      value={preset}
                      checked={selectedPreset === preset}
                      onChange={(e) => setSelectedPreset(e.target.value as PresetPeriod)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 text-sm text-slate-900">
                      {presetLabels[preset]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Date Range (visible when custom is selected) */}
            {selectedPreset === 'custom' && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4"
                />

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {/* MoM Comparison Toggle */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isMoMEnabled}
                  onChange={(e) => setIsMoMEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Comparar com o mesmo período no mês anterior
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Compara segmentos e performance de canais vs MoM nos mesmos dias
                  </p>
                </div>
              </label>
            </div>

            {/* Informational Message */}
            {isMoMEnabled && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  ✓ Comparativo MoM ativado. Os gráficos mostrarão dados atuais vs período anterior.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyPeriod}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
