import { ColumnFormat } from './reportColumnsConfig';

export function fmtN(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function fmtPct(n: number, decimals = 2): string {
  return `${(n * 100).toFixed(decimals).replace('.', ',')}%`;
}

export function fmtPct4(n: number): string {
  return `${(n * 100).toFixed(4).replace('.', ',')}%`;
}

export function fmtBRL(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMetric(value: number, format: ColumnFormat): string {
  switch (format) {
    case 'number':   return fmtN(value);
    case 'percent':  return fmtPct(value);
    case 'percent4': return fmtPct4(value);
    case 'currency': return fmtBRL(value);
    default:         return fmtN(value);
  }
}
