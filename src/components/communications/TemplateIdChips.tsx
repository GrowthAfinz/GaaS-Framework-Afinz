import React from 'react';
import { translateTemplateId } from '../../utils/taxonomy';

interface Props {
  id: string;
  /** Mostra o template_id cru, pequeno e apagado, abaixo dos chips. */
  showId?: boolean;
  className?: string;
}

/**
 * Tradução compacta de um template_id: Público/BU · Canal · Campanha · Segmento · Momento.
 * Prioriza a leitura de negócio sobre o id cru (que fica no title/tooltip).
 */
export const TemplateIdChips: React.FC<Props> = ({ id, showId, className }) => {
  const parts = translateTemplateId(id);
  if (parts.length === 0) {
    return <code className={`font-mono text-xs text-slate-600 ${className ?? ''}`}>{id}</code>;
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ''}`} title={id}>
      {parts.map((p) => (
        <span
          key={p.key}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600"
          title={`${p.label}: ${p.value}`}
        >
          {p.value}
        </span>
      ))}
      {showId && <code className="ml-0.5 font-mono text-[9.5px] text-slate-300">{id}</code>}
    </span>
  );
};
