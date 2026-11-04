import { ReportChartPanel } from "./ReportWorkspace";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { ChartTooltip } from "../ui/ChartTooltip";

export const REPORT_SERIES_COLORS = [
  "#2563EB",
  "#10B981",
  "#A855F7",
  "#F97316",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#64748B",
  "#0EA5E9",
  "#84CC16",
];
export function ReportTimeSeriesChart({
  title,
  kicker,
  data,
  xKey,
  series,
  stackable = true,
  formatValue,
  formatAxis,
  controls,
  filters,
  description,
  labelPrefix = "Mês",
}: {
  title: string;
  kicker: string;
  data: Record<string, string | number | null>[];
  xKey: string;
  series: string[];
  stackable?: boolean;
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  controls?: ReactNode;
  filters?: ReactNode;
  description?: ReactNode;
  labelPrefix?: string;
}) {
  return (
    <ReportChartPanel>
      <div className="mb-4 flex flex-col gap-3">
        {controls && (
          <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
            {controls}
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {kicker}
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {filters}
      {data.length ? (
        <div className="h-[340px]" role="img" aria-label={title}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey={xKey}
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  formatAxis
                    ? formatAxis(Number(value))
                    : Number(value).toLocaleString("pt-BR", {
                        notation: "compact",
                      })
                }
              />
              <Tooltip
                cursor={{ fill: "#E2E8F0", opacity: 0.35 }}
                wrapperStyle={{ pointerEvents: "none", zIndex: 20 }}
                content={
                  <ChartTooltip
                    labelPrefix={labelPrefix}
                    totalLabel={`Total no ${labelPrefix.toLowerCase()}`}
                    formatValue={formatValue}
                    showTotal={
                      stackable &&
                      !data.some((row) =>
                        series.some((key) => row[key] === null),
                      )
                    }
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              {series.map((label, i) => (
                <Bar
                  key={label}
                  dataKey={label}
                  stackId={stackable ? "report" : undefined}
                  fill={REPORT_SERIES_COLORS[i % REPORT_SERIES_COLORS.length]}
                  radius={stackable ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  maxBarSize={stackable ? 64 : 34}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-slate-500">
          Nenhum dado disponível para os filtros atuais.
        </p>
      )}
    </ReportChartPanel>
  );
}
