import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DatabaseRow, NotionColor, NotionDatabase, NotionUser } from '../../types/notion';
import { CHIP_COLORS, PropertyChip } from './viewEngine';

interface BoardViewProps {
  database: NotionDatabase;
  filteredRows: DatabaseRow[];
  /** Propriedade que define as colunas (select, status ou pessoa). Adição GaaS: antes era sempre o primeiro status. */
  groupPropId?: string;
  /** Propriedades mostradas no card, na ordem da visão. */
  visiblePropIds?: string[];
  users?: NotionUser[];
  onUpdateRow: (rowId: string, propertyId: string, value: any) => void;
  onAddRow: (initialProps?: Record<string, any>) => void;
  onOpenRowPage: (pageId: string) => void;
  /** Valores do agrupamento que não viram coluna (ex.: frentes desligadas nos chips). '__vazio__' esconde a coluna "Sem ...". */
  hiddenValues?: string[];
  /** Esconde colunas sem itens. */
  hideEmpty?: boolean;
}

interface Column { key: string; name: string; color: NotionColor; value: string }

export const BoardView: React.FC<BoardViewProps> = ({
  database,
  filteredRows,
  groupPropId,
  visiblePropIds = [],
  users = [],
  onUpdateRow,
  onAddRow,
  onOpenRowPage,
  hiddenValues = [],
  hideEmpty = false,
}) => {
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const groupProp =
    database.properties.find((p) => p.id === groupPropId) ||
    database.properties.find((p) => p.type === 'status') ||
    database.properties.find((p) => p.type === 'select');

  const columns: Column[] = !groupProp
    ? []
    : groupProp.type === 'person'
    ? users.map((u) => ({ key: u.id, name: u.name, color: 'default' as NotionColor, value: u.id }))
    : (groupProp.options || []).map((o) => ({ key: o.id, name: o.name, color: o.color, value: o.name }));
  const known = new Set(columns.map((c) => c.value));
  const hasEmpty = filteredRows.some((r) => !known.has(String(r.properties[groupProp?.id || ''] ?? '')));
  if (groupProp && (hasEmpty || groupProp.type === 'person')) columns.unshift({ key: '__vazio__', name: `Sem ${groupProp.name.toLowerCase()}`, color: 'gray', value: '' });

  const cardProps = visiblePropIds
    .filter((id) => id !== groupProp?.id)
    .map((id) => database.properties.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    setDraggedRowId(rowId);
    e.dataTransfer.setData('text/plain', rowId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overCol !== key) setOverCol(key);
  };
  const handleDrop = (e: React.DragEvent, col: Column) => {
    e.preventDefault();
    const rowId = draggedRowId || e.dataTransfer.getData('text/plain');
    if (rowId && groupProp) onUpdateRow(rowId, groupProp.id, col.value);
    setDraggedRowId(null);
    setOverCol(null);
  };

  if (!groupProp) {
    return <div className="p-4 text-xs text-[var(--notion-text-muted)]">Crie uma propriedade de seleção, status ou pessoa para agrupar o quadro.</div>;
  }

  const rowsOf = (col: Column) =>
    filteredRows.filter((r) => {
      const v = String(r.properties[groupProp.id] ?? '');
      return col.key === '__vazio__' ? !known.has(v) : v === col.value;
    });
  const shown = columns.filter((col) => !hiddenValues.includes(col.key === '__vazio__' ? '__vazio__' : col.value) && (!hideEmpty || rowsOf(col).length > 0));

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
      {shown.length === 0 && <div className="p-4 text-xs text-[var(--notion-text-muted)]">Nada para mostrar com os filtros atuais.</div>}
      {shown.map((col) => {
        const rowsInCol = rowsOf(col);

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => handleDrop(e, col)}
            className={`flex flex-col shrink-0 w-72 rounded-lg bg-[var(--notion-hover)]/40 p-2.5 border transition-colors ${overCol === col.key ? 'border-blue-400 bg-blue-500/5' : 'border-[var(--notion-border)]'}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold truncate ${CHIP_COLORS[col.color]}`}>{col.name}</span>
                <span className="text-xs text-[var(--notion-text-muted)] font-medium">{rowsInCol.length}</span>
              </div>
              <button
                onClick={() => onAddRow({ [groupProp.id]: col.value })}
                className="p-1 hover:bg-[var(--notion-hover)] rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
                title="Novo nesta coluna"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Cards List */}
            <div className="space-y-2 flex-1 min-h-[100px]">
              {rowsInCol.map((row) => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onClick={() => onOpenRowPage(row.pageId)}
                  className={`group relative p-3 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] shadow-xs hover:shadow-md transition-all cursor-pointer select-none ${draggedRowId === row.id ? 'opacity-50' : ''}`}
                >
                  <div className="text-sm font-medium text-[var(--notion-text)] leading-snug">{row.properties.prop_title || 'Sem título'}</div>
                  {cardProps.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-2">
                      {cardProps.map((p) => <PropertyChip key={p.id} prop={p} value={row.properties[p.id]} users={users} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Card Button */}
            <button
              onClick={() => onAddRow({ [groupProp.id]: col.value })}
              className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded hover:bg-[var(--notion-hover)] text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] transition-colors"
            >
              <Plus size={14} /> Novo
            </button>
          </div>
        );
      })}
    </div>
  );
};
