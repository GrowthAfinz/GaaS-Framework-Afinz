import React from 'react';
import { formatVariation } from '../../utils/variationDisplay';
import {
  calculateMonthlyVariation,
  MonthlyMetricKey,
  MonthlyTotalRow,
} from '../../utils/monthlyAggregation';

interface MonthlyResultsTableProps {
  rows: MonthlyTotalRow[];
}

const metrics: Array<{
  key: MonthlyMetricKey | 'taxaEntrega' | 'taxaProposta' | 'taxaAprovacao' | 'taxaFinalizacao';
  label: string;
  invertPositive?: boolean;
  format: (value: number) => string;
}> = [
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

export const MonthlyResultsTable: React.FC<MonthlyResultsTableProps> = ({ rows }) => {
  const previousByMonth = new Map<string, MonthlyTotalRow>();
  rows.forEach((row, index) => {
    if (index > 0) previousByMonth.set(row.monthKey, rows[index - 1]);
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Consolidado mensal</p>
        <h3 className="text-base font-bold text-slate-900">Resultados mês a mês</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1500px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="sticky left-0 z-10 bg-slate-900 px-4 py-3 text-left font-semibold">Mês</th>
              {metrics.map(metric => (
                <th key={metric.key} className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const previous = previousByMonth.get(row.monthKey);
              return (
                <tr key={row.monthKey} className={`border-t border-slate-100 ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className={`sticky left-0 z-10 px-4 py-3 font-bold text-slate-900 whitespace-nowrap ${index % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                    {row.monthLabel}
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
