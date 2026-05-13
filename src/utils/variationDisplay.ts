export function formatVariation(value: number, invertPositive = false) {
  const normalizedValue = Number.isFinite(value) ? value : 0;

  if (normalizedValue === 0) {
    return {
      label: '0.0%',
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      isPositive: false,
      isNeutral: true,
    };
  }

  const isPositive = invertPositive ? normalizedValue < 0 : normalizedValue > 0;
  const symbol = normalizedValue > 0 ? '+' : '-';

  return {
    label: `${symbol}${Math.abs(normalizedValue).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`,
    color: isPositive ? 'text-emerald-700' : 'text-red-700',
    bg: isPositive ? 'bg-emerald-50' : 'bg-red-50',
    border: isPositive ? 'border-emerald-200' : 'border-red-200',
    isPositive,
    isNeutral: false,
  };
}
