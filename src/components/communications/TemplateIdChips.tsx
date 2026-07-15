import React from 'react';
import { translateTemplateId } from '../../utils/taxonomy';

interface Props {
  id: string;
  /** Mostra o template_id cru, pequeno e apagado, abaixo dos chips. */
  showId?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  inverse?: boolean;
}

/**
 * Tradução compacta de um template_id: Público/BU · Canal · Campanha · Segmento · Momento.
 * Prioriza a leitura de negócio sobre o id cru (que fica no title/tooltip).
 */
export const TemplateIdChips: React.FC<Props> = ({ id, showId, className, size = 'sm', inverse = false }) => {
  const parts = translateTemplateId(id).flatMap((part) => {
    if (part.key !== 'seq') return [part];
    const weekly = part.value.match(/^Semana (\d+) · Disparo (\d+)$/i);
    if (weekly) return [
      { ...part, key: 'week' as const, label: 'Semana', value: `Semana ${weekly[1]}` },
      { ...part, key: 'dispatch' as const, label: 'Disparo', value: `Disparo ${weekly[2]}` },
    ];
    return [part];
  });
  if (parts.length === 0) {
    return <code className={`font-mono text-xs text-slate-600 ${className ?? ''}`}>{id}</code>;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ''}`} title={id}>
      {parts.map((p) => (
        <span
          key={p.key}
          className={`rounded-md font-semibold ${size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10.5px]'} ${inverse ? 'bg-white/15 text-white ring-1 ring-white/15' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/70'}`}
          title={`${p.label}: ${p.value}`}
        >
          {p.value}
        </span>
      ))}
      {showId && <code className={`ml-0.5 font-mono text-[9.5px] ${inverse ? 'text-white/45' : 'text-slate-300'}`}>{id}</code>}
    </span>
  );
};
