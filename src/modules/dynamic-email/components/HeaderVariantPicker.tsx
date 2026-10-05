import React from 'react';
import { AlertTriangle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { HEADER_CODE_PATTERN, type HeaderVariant } from '../domain/topoPlurixV10';

interface Props {
  value: string;
  variants: HeaderVariant[];
  notes: string[];
  onChange: (value: string) => void;
  onManage: () => void;
}

/**
 * Escolha do tipo de header no template V10: imagem (link no campo HEADER, como sempre foi)
 * ou uma variação dinâmica cadastrada em "Header e ofertas" (código HDR_... no campo HEADER).
 */
export const HeaderVariantPicker: React.FC<Props> = ({ value, variants, notes, onChange, onManage }) => {
  const trimmed = (value ?? '').trim();
  const isCode = HEADER_CODE_PATTERN.test(trimmed.toUpperCase());
  const active = variants.filter((variant) => variant.status === 'active');
  const current = active.find((variant) => variant.code === trimmed.toUpperCase());
  return (
    <div className="mb-3 rounded-lg border border-cyan-100 bg-cyan-50/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tipo de header (template V10)</span>
        <button type="button" onClick={onManage} className="text-[11px] font-bold text-cyan-800 hover:underline">Gerenciar variações</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { if (isCode) onChange(''); }} className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold ${!isCode ? 'border-cyan-400 bg-white text-cyan-900' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200'}`}><ImageIcon size={13}/>Imagem</button>
        <select
          value={isCode ? trimmed.toUpperCase() : ''}
          onChange={(event) => onChange(event.target.value)}
          className={`h-8 min-w-[220px] rounded-lg border bg-white px-2 text-xs font-bold outline-none focus:border-cyan-400 ${isCode ? 'border-cyan-400 text-cyan-900' : 'border-slate-200 text-slate-600'}`}
        >
          <option value="" disabled>Header dinâmico: escolha a variação</option>
          {active.map((variant) => <option key={variant.code} value={variant.code}>{variant.code} · {variant.title}</option>)}
        </select>
      </div>
      {isCode && current && <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-slate-600"><Sparkles size={12} className="mt-0.5 shrink-0 text-cyan-700"/>O header é montado com o texto “{current.title}” e o logo da rede de quem recebe. Para trocar o texto, crie outra variação: assim dá para comparar resultados.</p>}
      {notes.map((note) => <p key={note} className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-amber-800"><AlertTriangle size={12} className="mt-0.5 shrink-0"/>{note}</p>)}
    </div>
  );
};
