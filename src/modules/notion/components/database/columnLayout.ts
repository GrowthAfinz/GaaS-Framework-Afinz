import { useEffect, useState } from 'react';

export interface ColumnLayout {
  widths: Record<string, number>;
  order: string[];
}
const empty: ColumnLayout = { widths: {}, order: [] };

function load(key: string | undefined): ColumnLayout {
  if (!key) return empty;
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (value && Array.isArray(value.order) && value.widths) return value;
  } catch { /* preferência local indisponível */ }
  return empty;
}

export const clampWidth = (width: number) => Math.min(680, Math.max(112, width));

export function useColumnLayout(key: string | undefined) {
  const [layout, setLayout] = useState(() => load(key));
  useEffect(() => {
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(layout)); } catch { /* preferência local indisponível */ }
  }, [key, layout]);
  return {
    ...layout,
    resize: (id: string, width: number) => setLayout(prev => ({ ...prev, widths: { ...prev.widths, [id]: clampWidth(width) } })),
    reorder: (order: string[]) => setLayout(prev => ({ ...prev, order })),
    reset: () => setLayout(empty),
  };
}
