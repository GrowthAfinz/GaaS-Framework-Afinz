import React, { useEffect, useRef, useState } from 'react';
import { Columns3, RotateCcw, X } from 'lucide-react';
import { ColumnDef, ColumnKey } from './reportColumnsConfig';

interface ColumnsCustomizerProps {
  value: ColumnKey[];
  defaults: ColumnKey[];
  available: ColumnDef[];
  onChange: (next: ColumnKey[]) => void;
  label?: string;
  buttonLabel?: string;
  align?: 'left' | 'right';
}

export const ColumnsCustomizer: React.FC<ColumnsCustomizerProps> = ({
  value,
  defaults,
  available,
  onChange,
  label = 'Colunas',
  buttonLabel,
  align = 'right',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visibleSet = new Set(value);

  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  const toggle = (key: ColumnKey) => {
    if (visibleSet.has(key)) {
      onChange(value.filter(k => k !== key));
    } else {
      // Mantém a ordem do catálogo
      const ordered = available
        .filter(def => visibleSet.has(def.key) || def.key === key)
        .map(def => def.key);
      onChange(ordered);
    }
  };

  const metricDefs = available.filter(c => c.type === 'metric');
  const dimensionDefs = available.filter(c => c.type === 'dimension');

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors font-medium"
        title="Personalizar colunas visíveis"
      >
        <Columns3 size={13} />
        {buttonLabel ?? label}
        <span className="ml-1 text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-full">{value.length}</span>
      </button>

      {open && (
        <div
          className={`absolute top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-xl w-72 max-h-[420px] overflow-hidden flex flex-col ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(defaults)}
                className="text-[10px] font-semibold text-slate-400 hover:text-cyan-600 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-50"
                title="Restaurar padrão"
              >
                <RotateCcw size={11} /> Padrão
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto py-1">
            {metricDefs.length > 0 && (
              <div className="px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2 pb-1">Métricas</p>
                {metricDefs.map(def => (
                  <CheckboxItem
                    key={def.key}
                    label={def.label}
                    checked={visibleSet.has(def.key)}
                    highlight={def.highlight}
                    onClick={() => toggle(def.key)}
                  />
                ))}
              </div>
            )}
            {dimensionDefs.length > 0 && (
              <div className="px-1 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-3 pb-1">Dimensões</p>
                {dimensionDefs.map(def => (
                  <CheckboxItem
                    key={def.key}
                    label={def.label}
                    checked={visibleSet.has(def.key)}
                    onClick={() => toggle(def.key)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CheckboxItem: React.FC<{
  label: string;
  checked: boolean;
  highlight?: boolean;
  onClick: () => void;
}> = ({ label, checked, highlight, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-xs hover:bg-slate-50 transition-colors ${checked ? 'text-slate-800' : 'text-slate-500'}`}
  >
    <span className="flex items-center gap-2">
      <span
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-300'
        }`}
      >
        {checked && <span className="text-white text-[9px] leading-none">✓</span>}
      </span>
      <span className="font-medium">{label}</span>
    </span>
    {highlight && (
      <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">
        destaque
      </span>
    )}
  </button>
);
