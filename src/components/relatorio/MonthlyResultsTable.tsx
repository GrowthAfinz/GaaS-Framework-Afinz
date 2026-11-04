import { ReportDataTable } from "./ReportDataTable";
import React from "react";
import { formatVariation } from "../../utils/variationDisplay";
import {
  calculateMonthlyVariation,
  MonthlyMetricKey,
  MonthlyTotalRow,
} from "../../utils/monthlyAggregation";

interface MonthlyResultsTableProps {
  rows: MonthlyTotalRow[];
  rentabilizacao?: boolean;
}

type MonthlyTableMetric = {
  key:
    | MonthlyMetricKey
    | "taxaEntrega"
    | "taxaProposta"
    | "taxaAprovacao"
    | "taxaFinalizacao";
  label: string;
  invertPositive?: boolean;
  format: (value: number) => string;
};

const acquisitionMetrics: MonthlyTableMetric[] = [
  {
    key: "baseEnviada",
    label: "Base Enviada",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "baseEntregue",
    label: "Base Entregue",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaEntrega",
    label: "% Entrega",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "propostas",
    label: "Propostas",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaProposta",
    label: "% Proposta",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "aprovados",
    label: "Aprovados",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaAprovacao",
    label: "% Aprovação",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "emissoes",
    label: "Emissões",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaFinalizacao",
    label: "% Finalização",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "custoPorCartao",
    label: "Custo/Cartão",
    invertPositive: true,
    format: (value) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  },
  {
    key: "custoTotal",
    label: "Custo Total",
    invertPositive: true,
    format: (value) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  },
  {
    key: "taxaConversaoBase",
    label: "% Conv da Base",
    format: (value) => `${(value * 100).toFixed(4).replace(".", ",")}%`,
  },
];

const engagementMetrics: MonthlyTableMetric[] = [
  {
    key: "baseEnviada",
    label: "Base Enviada",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "baseEntregue",
    label: "Base Entregue",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaEntrega",
    label: "% Entrega",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "aberturas",
    label: "Aberturas",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaAbertura",
    label: "% Abertura",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "cliques",
    label: "Cliques",
    format: (value) => value.toLocaleString("pt-BR"),
  },
  {
    key: "taxaClique",
    label: "% Clique",
    format: (value) => `${(value * 100).toFixed(2).replace(".", ",")}%`,
  },
  {
    key: "custoTotal",
    label: "Custo Total",
    invertPositive: true,
    format: (value) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  },
];

export const MonthlyResultsTable: React.FC<MonthlyResultsTableProps> = ({
  rows,
  rentabilizacao = false,
}) => {
  const metrics = rentabilizacao ? engagementMetrics : acquisitionMetrics;
  const previousByMonth = new Map<string, MonthlyTotalRow>();
  rows.forEach((row, index) => {
    if (index > 0) previousByMonth.set(row.monthKey, rows[index - 1]);
  });

  return (
    <ReportDataTable<MonthlyTotalRow>
      title="Resultados mês a mês"
      kicker="Consolidado mensal"
      rows={rows}
      firstLabel="Mês"
      firstValue={(row) => row.monthLabel}
      rowKey={(row) => row.monthKey}
      minWidth={1500}
      columns={metrics.map((metric) => ({
        key: metric.key,
        label: metric.label,
        render: (row) => {
          const previous = previousByMonth.get(row.monthKey);
          const currentValue = row[metric.key];
          const display = formatVariation(
            calculateMonthlyVariation(
              currentValue,
              previous?.[metric.key] ?? 0,
            ),
            metric.invertPositive,
          );
          return (
            <div className="flex items-center justify-end gap-2">
              <span>{metric.format(currentValue)}</span>
              {previous && (
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${display.bg} ${display.border} ${display.color}`}
                >
                  {display.label}
                </span>
              )}
            </div>
          );
        },
      }))}
    />
  );
};
