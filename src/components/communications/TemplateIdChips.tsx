import React from 'react';
import { translateTemplateId,segmentoKeyFromTemplateId } from '../../utils/taxonomy';
import { BU_COLORS, buOf } from './ui/commsUi';

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
  const parts: { key: string; label: string; value: string }[] = translateTemplateId(id).flatMap((part): { key: string; label: string; value: string }[] => {
    if (part.key !== 'seq') return [part];
    if(segmentoKeyFromTemplateId(id)==='negados'||/DispD\d+/i.test(id))return [{...part,value:part.value.replace(/^Dia /,'Disparo ')}];
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
      {parts.map((p) => {
        const bu = p.key === 'publico' && !inverse ? buOf(p.value) : null;
        const tone = inverse ? 'bg-white/15 text-white ring-1 ring-white/15' : bu ? `${BU_COLORS[bu].bg} ${BU_COLORS[bu].text} ring-1 ${BU_COLORS[bu].ring}` : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
        return (
          <span
            key={p.key}
            className={`inline-flex items-center gap-1 rounded-md font-semibold ${size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-1.5 py-0.5 text-xs'} ${tone}`}
            title={`${p.label}: ${p.value}`}
          >
            {bu && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: BU_COLORS[bu].hex }} />}
            <span className="sr-only">{p.label}:</span>{p.value}
          </span>
        );
      })}
      {showId && <code className={`ml-0.5 font-mono text-xs ${inverse ? 'text-white/45' : 'text-slate-600'}`}>{id}</code>}
    </span>
  );
};
