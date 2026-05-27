import React, { useEffect, useRef, useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { DimensionKey, getGroupableDimensionLabel } from './reportColumnsConfig';

interface GroupBySelectorProps {
  value: DimensionKey;
  options: DimensionKey[];
  onChange: (next: DimensionKey) => void;
  label?: string;
}

export const GroupBySelector: React.FC<GroupBySelectorProps> = ({
  value,
  options,
  onChange,
  label = 'Agrupar por',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors font-medium"
        title={`${label}: ${getGroupableDimensionLabel(value)}`}
      >
        <Layers size={13} />
        <span className="text-slate-400">{label}:</span>
        <span className="text-slate-700 font-semibold">{getGroupableDimensionLabel(value)}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-9 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[180px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2 pb-1">{label}</p>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                value === opt ? 'text-cyan-700 font-semibold bg-cyan-50/50' : 'text-slate-600'
              }`}
            >
              {getGroupableDimensionLabel(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
