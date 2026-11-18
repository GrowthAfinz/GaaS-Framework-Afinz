import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { DatabaseRow, NotionColor, NotionDatabase, NotionUser } from '../../types/notion';
import { PropertyCell } from './PropertyCell';
import { ColumnControls, ResizeColumn } from './ColumnControls';
import { useColumnLayout } from './columnLayout';
import { CreditDateAlert } from './CreditDateAlert';
import { CHIP_COLORS, PropertyChip } from './viewEngine';

interface BoardViewProps {
  database: NotionDatabase;
  layoutKey?: string;
  creditBases?: boolean;
  projectList?: boolean;
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
  /** Só leitura: sem arrastar e sem criar. */
  readOnly?: boolean;
}

interface Column { key: string; name: string; color: NotionColor; value: string }

export const BoardView: React.FC<BoardViewProps> = ({
  database,
  layoutKey,
  creditBases = false,
  projectList = false,
  filteredRows,
  groupPropId,
  visiblePropIds = [],
  users = [],
  onUpdateRow,
  onAddRow,
  onOpenRowPage,
  hiddenValues = [],
  hideEmpty = false,
  readOnly = false,
}) => {
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const layout = useColumnLayout(layoutKey);
  const [openEmpty, setOpenEmpty] = useState<Record<string, boolean>>({});
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
    if (!draggedRowId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overCol !== key) setOverCol(key);
  };
  const handleDrop = (e: React.DragEvent, col: Column) => {
    e.preventDefault();
    const rowId = draggedRowId;
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

  const widthOf = (key: string) => layout.widths[key] ?? (creditBases ? 224 : 248);
  const titleKey = database.properties.find(prop => prop.type === 'title')?.id ?? 'prop_title';
  const status = database.properties.find(prop => prop.id === 'p_status');
  const deadline = database.properties.find(prop => prop.id === 'p_prazo');
  const priority = database.properties.find(prop => prop.id === 'p_prioridade');
  const completed = status?.options?.find(option => option.id === 'concluida')?.name ?? 'Concluída';

  if (projectList) return (
    <div className="nt-projects">
      {!shown.length && <p className="px-3 py-4 text-sm">Nenhuma tarefa com os filtros atuais.</p>}
      {shown.map(column => {
        const rows = rowsOf(column);
        const done = rows.filter(row => row.properties.p_status === completed).length;
        return <details key={column.key} open>
          <summary><ChevronDown size={15} /><strong>{column.name}</strong>
            <progress max={rows.length || 1} value={done} aria-label={`Progresso de ${column.name}`} />
            <span>{done} de {rows.length} concluídas</span>
          </summary>
          {rows.map(row => <div key={row.id} className="nt-project-row">
            <button type="button" className="nt-cell-value" onClick={() => onOpenRowPage(row.pageId)}>{row.properties[titleKey] || 'Sem título'}</button>
            {[status, deadline, priority].filter((prop): prop is NonNullable<typeof prop> => Boolean(prop)).map(prop =>
              readOnly ? <PropertyChip key={prop.id} prop={prop} value={row.properties[prop.id]} users={users} /> :
                <PropertyCell compact key={prop.id} property={prop} value={row.properties[prop.id]} users={users} databaseId={database.id} rowId={row.id}
                  onChange={value => onUpdateRow(row.id, prop.id, value)} />)}
          </div>)}
        </details>;
      })}
    </div>
  );

  return (
    <div>
    {layoutKey && <ColumnControls columns={shown.map(col => ({ id: col.key, label: col.name, width: widthOf(col.key) }))}
      onResize={layout.resize} onReset={layout.reset} />}
    <div className={`nt-board flex gap-3 overflow-x-auto pb-6 pt-1 ${layoutKey ? 'nt-task-board' : ''}`}>
      {shown.length === 0 && <div className="p-4 text-xs text-[var(--notion-text-muted)]">Nada para mostrar com os filtros atuais.</div>}
      {shown.map((col) => {
        const rowsInCol = rowsOf(col);
        const empty = Boolean(layoutKey && !creditBases && !rowsInCol.length);
        const collapsed = empty && !openEmpty[col.key];

        return (
          <div
            key={col.key}
            style={layoutKey ? { width: widthOf(col.key), flex: `0 0 ${widthOf(col.key)}px` } : undefined}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => handleDrop(e, col)}
            className={`nt-board-column relative ${collapsed ? 'nt-lane-collapsed' : ''} flex flex-col shrink-0 w-72 rounded-xl bg-[var(--notion-hover)]/40 p-2.5 border transition-colors ${overCol === col.key ? 'border-blue-400 bg-blue-500/5' : 'border-[var(--notion-border)]'}`}
          >
            {/* Column Header */}
            <div className="nt-lane-head relative flex items-center justify-between px-1">
              <div className="flex items-center gap-2 min-w-0">
                {layoutKey ? <><span className={`nt-status-dot nt-dot-${col.color}`} /><span className={`${creditBases ? 'break-words' : 'truncate'} text-xs font-semibold`} title={col.name}>{col.name}</span></> :
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold truncate ${CHIP_COLORS[col.color]}`}>{col.name}</span>}
                <span className="text-xs text-[var(--notion-text-muted)] font-medium">{rowsInCol.length}</span>
              </div>
              <div className="flex items-center gap-1 pr-2">
                {empty && <button type="button" className="rounded p-1 hover:bg-[var(--notion-hover)]"
                  aria-label={`Mostrar ou recolher ${col.name}`} aria-expanded={!collapsed}
                  onClick={() => setOpenEmpty(prev => ({ ...prev, [col.key]: !prev[col.key] }))}><ChevronDown size={14} /></button>}
              {!readOnly && (
              <button
                onClick={() => onAddRow({ [groupProp.id]: col.value })}
                className="p-1 hover:bg-[var(--notion-hover)] rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
                title="Novo nesta coluna"
              >
                <Plus size={14} />
              </button>
              )}
              </div>
              {layoutKey && <ResizeColumn label={col.name} width={widthOf(col.key)} onResize={width => layout.resize(col.key, width)} />}
            </div>

            {/* Cards List */}
            <div hidden={collapsed} className="space-y-2 flex-1 min-h-[56px] pt-2">
              {rowsInCol.map((row) => (
                <div key={row.id} className="rounded-md bg-[var(--notion-card)]">
                  <div
                    draggable={!readOnly}
                    onDragStart={(e) => handleDragStart(e, row.id)}
                    onDragEnd={() => { setDraggedRowId(null); setOverCol(null); }}
                    role="button" tabIndex={0}
                    onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpenRowPage(row.pageId); } }}
                    onClick={() => onOpenRowPage(row.pageId)}
                    className={`group relative p-3 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] shadow-xs hover:shadow-md transition-all cursor-pointer select-none ${draggedRowId === row.id ? 'opacity-50' : ''}`}
                  >
                    <div className="text-sm font-medium text-[var(--notion-text)] leading-snug">{row.properties[titleKey] || 'Sem título'}</div>
                    {cardProps.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-2">
                        {cardProps.map(p => <React.Fragment key={p.id}>
                          <PropertyChip prop={p} value={row.properties[p.id]} users={users} />
                          <CreditDateAlert database={database} row={row} propertyId={p.id} />
                        </React.Fragment>)}
                      </div>
                    )}
                  </div>
                  {creditBases && !readOnly && <select
                    aria-label={`Mover ${row.properties[titleKey] || 'pedido'} para outra etapa`}
                    className="mx-2 mb-2 mt-1 max-w-[calc(100%-1rem)] rounded border border-[var(--notion-border)] bg-[var(--notion-card)] px-1 text-xs"
                    value=""
                    onChange={event => onUpdateRow(row.id, groupProp.id, event.target.value)}
                  >
                    <option value="" disabled>Mover para…</option>
                    {columns.filter(target => target.value && target.value !== col.value).map(target => (
                      <option key={target.key} value={target.value}>{target.name}</option>
                    ))}
                  </select>}
                </div>
              ))}
            </div>

            {/* Add Card Button */}
            {!readOnly && !collapsed && <button
              onClick={() => onAddRow({ [groupProp.id]: col.value })}
              className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded hover:bg-[var(--notion-hover)] text-xs text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] transition-colors"
            >
              <Plus size={14} /> Novo
            </button>}
          </div>
        );
      })}
    </div>
    </div>
  );
};
