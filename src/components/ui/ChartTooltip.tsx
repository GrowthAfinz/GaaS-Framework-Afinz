import React from 'react';

interface ChartTooltipProps {
  /** Injetados pelo Recharts via <Tooltip content={...} /> */
  active?: boolean;
  payload?: any[];
  label?: string;
  /** Prefixo do cabeçalho — "Mês" vira "Mês: jul de 26" */
  labelPrefix?: string;
  /** Rótulo da linha de total (ex: "Total no mês") */
  totalLabel?: string;
  /** Formata o valor de cada série empilhada */
  formatValue: (value: number, entry: any) => string;
  /** Formata a soma das séries; default: reusa formatValue */
  formatTotal?: (total: number) => string;
  /**
   * Séries que são taxa/razão (CAC, % conversão) — listadas normalmente, mas
   * fora da soma, e exibidas mesmo quando zeradas.
   */
  isRate?: (entry: any) => boolean;
  /** Some com a linha de total (métricas não empilháveis ou multi-métrica) */
  showTotal?: boolean;
}

const Row: React.FC<{ color?: string; name: string; value: string; strong?: boolean }> = ({ color, name, value, strong }) => (
  <div className="flex items-center justify-between gap-5">
    <span className="flex items-center gap-1.5 min-w-0">
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      <span className={`truncate ${strong ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{name}</span>
    </span>
    <span className={`tabular-nums shrink-0 ${strong ? 'font-bold text-emerald-600' : 'font-semibold text-slate-800'}`}>{value}</span>
  </div>
);

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  labelPrefix,
  totalLabel = 'Total',
  formatValue,
  formatTotal,
  isRate,
  showTotal = true,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const rateEntries = isRate ? payload.filter(entry => isRate(entry)) : [];
  const valueEntries = payload.filter(
    entry => !(isRate?.(entry) ?? false) && Number(entry?.value ?? 0) > 0,
  );

  if (rateEntries.length === 0 && valueEntries.length === 0) return null;

  const total = valueEntries.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
  const renderTotal = showTotal && valueEntries.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 min-w-[168px] text-[11px]">
      <p className="font-bold text-slate-800 text-xs mb-1.5 pb-1.5 border-b border-slate-100">
        {labelPrefix ? `${labelPrefix}: ${label}` : label}
      </p>
      <div className="space-y-1">
        {rateEntries.map((entry, index) => (
          <Row key={`rate-${index}`} color={entry.color} name={entry.name} value={formatValue(Number(entry.value) || 0, entry)} />
        ))}
        {valueEntries.map((entry, index) => (
          <Row key={`value-${index}`} color={entry.color} name={entry.name} value={formatValue(Number(entry.value) || 0, entry)} />
        ))}
      </div>
      {renderTotal && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-200">
          <Row name={totalLabel} value={(formatTotal ?? ((v: number) => formatValue(v, valueEntries[0])))(total)} strong />
        </div>
      )}
    </div>
  );
};
