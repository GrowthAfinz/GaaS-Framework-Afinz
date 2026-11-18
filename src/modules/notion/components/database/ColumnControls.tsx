import React, { useRef } from 'react';
import { Columns3 } from 'lucide-react';
import { clampWidth } from './columnLayout';

export function ResizeColumn({ label, width, onResize }: { label: string; width: number; onResize: (width: number) => void }) {
  const drag = useRef<{ x: number; width: number }>();
  return <button
    type="button"
    className="nt-column-resize"
    aria-label={`Redimensionar ${label}`}
    title="Arraste ou use ← e → para ajustar a largura"
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, width };
    }}
    onPointerMove={event => {
      if (drag.current) onResize(drag.current.width + event.clientX - drag.current.x);
    }}
    onLostPointerCapture={() => { drag.current = undefined; }}
    onKeyDown={event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      onResize(width + (event.key === 'ArrowLeft' ? -16 : 16));
    }}
  />;
}

interface Column {
  id: string;
  label: string;
  width: number;
  fixed?: boolean;
}

export function ColumnControls({ columns, onResize, onMove, onReset, label = 'Colunas' }: {
  columns: Column[];
  label?: string;
  onResize: (id: string, width: number) => void;
  onMove?: (id: string, target: string) => void;
  onReset: () => void;
}) {
  return <details className="nt-column-menu">
    <summary><Columns3 size={14} /> {label}</summary>
    <div className="nt-column-panel">
      {columns.map((column, index) => <div key={column.id} className="nt-column-setting">
        <label>
          <span title={column.label}>{column.label}</span>
          <input aria-label={`Largura de ${column.label} em pixels`} key={column.width} type="number" min={112} max={680} step={8} defaultValue={column.width}
            onBlur={event => {
              const width = event.currentTarget.valueAsNumber;
              if (Number.isFinite(width)) onResize(column.id, width);
              event.currentTarget.value = String(Number.isFinite(width) ? clampWidth(width) : column.width);
            }}
            onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        </label>
        {onMove && <>
          <button type="button" aria-label={`Mover ${column.label} à esquerda`} disabled={column.fixed || !columns[index - 1] || columns[index - 1].fixed} onClick={() => onMove(column.id, columns[index - 1].id)}>←</button>
          <button type="button" aria-label={`Mover ${column.label} à direita`} disabled={column.fixed || !columns[index + 1]} onClick={() => onMove(column.id, columns[index + 1].id)}>→</button>
        </>}
      </div>)}
      <button type="button" className="nt-column-reset" onClick={onReset}>Restaurar padrão</button>
    </div>
  </details>;
}
