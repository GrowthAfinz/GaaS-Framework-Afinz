import { formatCurrency, formatNumber } from '../../utils/formatters';
import { formatVariation } from '../../utils/variationDisplay';

type AggregatedComparison = {
  cartoesVariation?: number;
  propostasVariation?: number;
  aprovadosVariation?: number;
  cacVariation?: number;
  totalCartoes?: number;
  totalPropostas?: number;
  totalAprovados?: number;
  totalCusto?: number;
  totalEmissoes?: number;
};

interface PeriodComparisonBannerProps {
  comparison: AggregatedComparison | null;
  year: number;
  month: number;
}

const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const getPreviousMonthLabel = (year: number, month: number) => {
  const previousMonth = month === 0 ? 11 : month - 1;
  const previousYear = month === 0 ? year - 1 : year;
  return `${monthNames[previousMonth]}/${String(previousYear).slice(-2)}`;
};

const ComparisonKpiCard = ({
  label,
  value,
  variation,
  previousLabel,
  invertPositive = false,
}: {
  label: string;
  value: string;
  variation: number;
  previousLabel: string;
  invertPositive?: boolean;
}) => {
  const display = formatVariation(variation, invertPositive);

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${display.bg} ${display.border} ${display.color}`}>
          {display.label}
        </span>
        <span className="text-xs text-slate-500">vs {previousLabel}</span>
      </div>
    </div>
  );
};

export const PeriodComparisonBanner: React.FC<PeriodComparisonBannerProps> = ({ comparison, year, month }) => {
  if (!comparison) return null;

  const previousLabel = getPreviousMonthLabel(year, month);
  const currentCAC = comparison.totalEmissoes && comparison.totalEmissoes > 0
    ? (comparison.totalCusto || 0) / comparison.totalEmissoes
    : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Comparativo vs periodo anterior</h2>
          <p className="text-sm text-slate-500">Variacao MoM dos principais KPIs da aba Analise.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ComparisonKpiCard
          label="Cartoes"
          value={formatNumber(comparison.totalCartoes || 0)}
          variation={comparison.cartoesVariation || 0}
          previousLabel={previousLabel}
        />
        <ComparisonKpiCard
          label="Propostas"
          value={formatNumber(comparison.totalPropostas || 0)}
          variation={comparison.propostasVariation || 0}
          previousLabel={previousLabel}
        />
        <ComparisonKpiCard
          label="Aprovados"
          value={formatNumber(comparison.totalAprovados || 0)}
          variation={comparison.aprovadosVariation || 0}
          previousLabel={previousLabel}
        />
        <ComparisonKpiCard
          label="CAC"
          value={formatCurrency(currentCAC)}
          variation={comparison.cacVariation || 0}
          previousLabel={previousLabel}
          invertPositive
        />
      </div>
    </section>
  );
};
