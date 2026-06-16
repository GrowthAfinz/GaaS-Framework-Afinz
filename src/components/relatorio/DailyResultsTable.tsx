import React from 'react';
import { formatVariation } from '../../utils/variationDisplay';
import { calculateMonthlyVariation, MonthlyMetricKey } from '../../utils/monthlyAggregation';
import { DailyTotalRow } from '../../utils/dailyAggregation';

interface DailyResultsTableProps {
  rows: DailyTotalRow[];
  rentabilizacao?: boolean;
  accumulated?: boolean;
}

type DailyTableMetric = {
  key: MonthlyMetricKey | 'taxaEntrega' | 'taxaProposta' | 'taxaAprovacao' | 'taxaFinalizacao';
  label: string;
  invertPositive?: boolean;
  format: (value: number) => string;
};

const acquisitionMetrics: DailyTableMetric[] = [
  { key: 'baseEnviada', label: 'Base Enviada', format: value => value.toLocaleString('pt-BR') },
  { key: 'baseEntregue', label: 'Base Entregue', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaEntrega', label: '% Entrega', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  { key: 'propostas', label: 'Propostas', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaProposta', label: '% Proposta', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  { key: 'aprovados', label: 'Aprovados', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaAprovacao', label: '% Aprovação', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  { key: 'emissoes', label: 'Emissões', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaFinalizacao', label: '% Finalização', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  {
    key: 'custoPorCartao',
    label: 'Custo/Cartão',
    invertPositive: true,
    format: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    key: 'custoTotal',
    label: 'Custo Total',
    invertPositive: true,
    format: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  { key: 'taxaConversaoBase', label: '% Conv da Base', format: value => `${(value * 100).toFixed(4).replace('.', ',')}%` },
];

const engagementMetrics: DailyTableMetric[] = [
  { key: 'baseEnviada', label: 'Base Enviada', format: value => value.toLocaleString('pt-BR') },
  { key: 'baseEntregue', label: 'Base Entregue', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaEntrega', label: '% Entrega', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  { key: 'aberturas', label: 'Aberturas', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaAbertura', label: '% Abertura', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  { key: 'cliques', label: 'Cliques', format: value => value.toLocaleString('pt-BR') },
  { key: 'taxaClique', label: '% Clique', format: value => `${(value * 100).toFixed(2).replace('.', ',')}%` },
  {
    key: 'custoTotal',
    label: 'Custo Total',
    invertPositive: true,
    format: value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
];

export const DailyResultsTable: React.FC<DailyResultsTableProps> = ({ rows, rentabilizacao = false, accumulated = false }) => {
  const metrics = rentabilizacao ? engagementMetrics : acquisitionMetrics;
  const previousByDay = new Map<string, DailyTotalRow>();
  rows.forEach((row, index) => {
    if (index > 0) previousByDay.set(row.dayKey, rows[index - 1]);
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {accumulated ? 'Consolidado diário acumulado' : 'Consolidado diário'}
        </p>
        <h3 className="text-base font-bold text-slate-900">
          {accumulated ? 'Resultados acumulados dia a dia' : 'Resultados dia a dia'}
        </h3>
      </div>
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[1500px] border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-900 text-white">
              <th className="sticky left-0 z-30 bg-slate-900 px-4 py-3 text-left font-semibold">Dia</th>
              {metrics.map(metric => (
                <th key={metric.key} className="bg-slate-900 px-4 py-3 text-right font-semibold whitespace-nowrap">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const previous = previousByDay.get(row.dayKey);
              return (
                <tr key={row.dayKey} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className={`sticky left-0 z-10 px-4 py-3 font-bold text-slate-900 whitespace-nowrap ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                    {row.dayLabel}
                  </td>
                  {metrics.map(metric => {
                    const currentValue = row[metric.key];
                    const previousValue = previous?.[metric.key] ?? 0;
                    const display = formatVariation(
                      calculateMonthlyVariation(currentValue, previousValue),
                      metric.invertPositive,
                    );

                    return (
                      <td key={metric.key} className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-800">
                            {metric.format(currentValue)}
                          </span>
                          {previous && (
                            <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${display.bg} ${display.border} ${display.color}`}>
                              {display.label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
