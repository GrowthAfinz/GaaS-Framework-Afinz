import React, { useMemo } from 'react';
import { CalendarData, PeriodComparison } from '../types/framework';
import { useMoMComparison } from '../hooks/useMoMComparison';
import { formatPercentChange, getPercentChangeColor } from '../utils/momCalculations';

interface SegmentPerformanceWithMoMProps {
  data: CalendarData;
  periodComparison: PeriodComparison;
  segmentKey: 'segmento' | 'canal' | 'parceiro';
  selectedBU?: string;
  selectedCanais?: string[];
  selectedSegmentos?: string[];
  selectedParceiros?: string[];
}

interface SegmentMetrics {
  name: string;
  baseEnviada: number;
  cartoes: number;
  conversao: number;
  conversaoAnterior: number;
  cac: number;
  cacAnterior: number;
}

/**
 * Component to display segment performance with MoM comparison
 * Shows conversão, CAC and other key metrics for each segment
 */
export const SegmentPerformanceWithMoM: React.FC<SegmentPerformanceWithMoMProps> = ({
  data,
  periodComparison,
  segmentKey,
  selectedBU,
  selectedCanais = [],
  selectedSegmentos = [],
  selectedParceiros = []
}) => {
  const comparisonData = useMoMComparison({
    data,
    periodComparison,
    filters: {
      bu: selectedBU,
      canais: selectedCanais,
      segmentos: selectedSegmentos,
      parceiros: selectedParceiros
    }
  });

  const segmentMetrics = useMemo(() => {
    const segments: Record<string, SegmentMetrics> = {};

    comparisonData.forEach(item => {
      // Determine the segment key based on filter
      const getSegmentName = () => {
        // This is a placeholder - in real implementation, you'd need to
        // access the raw activity data to get the segment/canal/parceiro value
        return 'Segment';
      };

      const segmentName = getSegmentName();

      if (!segments[segmentName]) {
        segments[segmentName] = {
          name: segmentName,
          baseEnviada: 0,
          cartoes: 0,
          conversao: 0,
          conversaoAnterior: 0,
          cac: 0,
          cacAnterior: 0
        };
      }

      segments[segmentName].baseEnviada += item.baseEnviada;
      segments[segmentName].cartoes += item.cartoes;

      if (item.previousData) {
        // Calculate metrics
        const currentConversao = item.baseEnviada > 0 ? (item.cartoes / item.baseEnviada) * 100 : 0;
        const previousConversao = item.previousData.baseEnviada > 0
          ? (item.previousData.cartoes / item.previousData.baseEnviada) * 100
          : 0;

        const currentCac = item.cartoes > 0 ? item.custo / item.cartoes : 0;
        const previousCac = item.previousData.cartoes > 0 ? item.previousData.custo / item.previousData.cartoes : 0;

        segments[segmentName].conversao += currentConversao;
        segments[segmentName].conversaoAnterior += previousConversao;
        segments[segmentName].cac += currentCac;
        segments[segmentName].cacAnterior += previousCac;
      }
    });

    return Object.values(segments).map(segment => ({
      ...segment,
      conversao: segment.baseEnviada > 0 ? (segment.cartoes / segment.baseEnviada) * 100 : 0,
      cac: segment.cartoes > 0 ? segment.cartoes / segment.cartoes : 0
    }));
  }, [comparisonData]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        Performance por {segmentKey === 'segmento' ? 'Segmento' : segmentKey === 'canal' ? 'Canal' : 'Parceiro'}
        {periodComparison.isMoMEnabled && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">MoM</span>}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-bold text-slate-900">Nome</th>
              <th className="text-right py-3 px-4 font-bold text-slate-900">Base Enviada</th>
              <th className="text-right py-3 px-4 font-bold text-slate-900">Cartões</th>
              <th className="text-right py-3 px-4 font-bold text-slate-900">Taxa Conv.</th>
              {periodComparison.isMoMEnabled && (
                <>
                  <th className="text-right py-3 px-4 font-bold text-slate-900">Conv. Anterior</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-900">Δ MoM</th>
                </>
              )}
              <th className="text-right py-3 px-4 font-bold text-slate-900">CAC</th>
            </tr>
          </thead>
          <tbody>
            {segmentMetrics.length === 0 ? (
              <tr>
                <td colSpan={periodComparison.isMoMEnabled ? 8 : 6} className="py-8 text-center text-slate-500">
                  Sem dados para o período selecionado
                </td>
              </tr>
            ) : (
              segmentMetrics.map((segment, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{segment.name}</td>
                  <td className="text-right py-3 px-4 text-slate-700">{segment.baseEnviada.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-3 px-4 text-slate-700">{segment.cartoes.toLocaleString('pt-BR')}</td>
                  <td className="text-right py-3 px-4 text-slate-700">{segment.conversao.toFixed(2)}%</td>
                  {periodComparison.isMoMEnabled && (
                    <>
                      <td className="text-right py-3 px-4 text-slate-500">{segment.conversaoAnterior.toFixed(2)}%</td>
                      <td className={`text-center py-3 px-4 font-bold ${getPercentChangeColor(segment.conversao - segment.conversaoAnterior)}`}>
                        {formatPercentChange(segment.conversao - segment.conversaoAnterior)}
                      </td>
                    </>
                  )}
                  <td className="text-right py-3 px-4 text-slate-700">R$ {segment.cac.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
