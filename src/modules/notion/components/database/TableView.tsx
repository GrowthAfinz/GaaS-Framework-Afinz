import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Hash,
  Tag,
  CheckSquare,
  Calendar,
  Globe,
  User as UserIcon,
  HelpCircle,
  GripVertical,
  Pin,
  X,
} from 'lucide-react';
import {
  DatabaseProperty,
  DatabaseRow,
  NotionDatabase,
  NotionUser,
  PropertyType,
} from '../../types/notion';
import { useColumnLayout } from './columnLayout';
import { ColumnControls, ResizeColumn } from './ColumnControls';
import { InlineTextCell } from './InlineTextCell';
import { PropertyCell } from './PropertyCell';
import { PropertyHeader } from './PropertyHeader';
import { PropertyChip } from './viewEngine';
import { DatabasePopup } from './DatabasePopup';
import { CreditDateAlert } from './CreditDateAlert';
import { isCreditBases } from '../../gaas/creditBases';

interface TableViewProps {
  database: NotionDatabase;
  layoutKey?: string;
  visiblePropertyIds?: string[];
  filteredRows: DatabaseRow[];
  users?: NotionUser[];
  onUpdateRow: (rowId: string, propertyId: string, value: any) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  /** Exclui várias linhas com uma confirmação só (seleção). Sem isto, exclui uma a uma. */
  onDeleteRows?: (rowIds: string[]) => void;
  onDuplicateRow?: (rowId: string) => void;
  /** Nova ordem manual das linhas (arrastar). Ausente quando a visão está ordenada por uma coluna. */
  onReorderRows?: (rowIds: string[]) => void;
  readOnly?: boolean;
  onAddProperty: (name: string, type: PropertyType) => void;
  onOpenRowPage: (pageId: string) => void;
}

const LEAD = 44; // coluna da alça de arrastar e da caixa de seleção

export const TableView: React.FC<TableViewProps> = ({
  database,
  layoutKey,
  visiblePropertyIds,
  filteredRows,
  users = [],
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onDeleteRows,
  onDuplicateRow,
  onReorderRows,
  readOnly = false,
  onAddProperty,
  onOpenRowPage,
}) => {
  const [showAddProp, setShowAddProp] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyType>('text');
  const [selected, setSelected] = useState<string[]>([]);
  const [dragRow, setDragRow] = useState<string | null>(null);
  const [overRow, setOverRow] = useState<{ id: string; after: boolean } | null>(null);

  // A seleção só guarda linhas que continuam na tela (filtro, exclusão).
  useEffect(() => { setSelected(sel => sel.filter(id => filteredRows.some(r => r.id === id))); }, [filteredRows]);

  const layout = useColumnLayout(layoutKey);
  const movable = database.properties.filter(prop => !layoutKey || prop.type === 'title' || !visiblePropertyIds || visiblePropertyIds.includes(prop.id));
  const title = movable.find(prop => prop.type === 'title');
  const columns = layoutKey ? [
    ...movable.filter(prop => prop === title),
    ...layout.order.flatMap(id => movable.filter(prop => prop.id === id && prop !== title)),
    ...movable.filter(prop => prop !== title && !layout.order.includes(prop.id)),
  ] : movable;
  const widthOf = (id: string) => layout.widths[id] ?? (id === title?.id ? (isCreditBases(database.id) ? 210 : 340) : id === 'prop_status' ? 205 : 164);
  const lead = readOnly ? 0 : LEAD;
  const move = (id: string, target: string) => {
    if (id === title?.id || target === title?.id || id === target) return;
    const order = columns.map(prop => prop.id);
    const targetIndex = order.indexOf(target);
    if (targetIndex < 0 || !order.includes(id)) return;
    order.splice(order.indexOf(id), 1);
    order.splice(targetIndex, 0, id);
    layout.reorder(order);
  };

  const handleAddPropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPropName.trim()) {
      onAddProperty(newPropName.trim(), newPropType);
      setNewPropName('');
      setShowAddProp(false);
    }
  };

  /** Ícone só onde ajuda a reconhecer o tipo; coluna de texto fica só com o nome. */
  const getPropIcon = (type: PropertyType): React.ReactNode => {
    const cls = 'text-[var(--notion-text-muted)] opacity-70 shrink-0';
    switch (type) {
      case 'title':
      case 'text':
        return null;
      case 'person':
        return <UserIcon size={13} className={cls} />;
      case 'number':
        return <Hash size={13} className={cls} />;
      case 'select':
      case 'status':
      case 'multi_select':
        return <Tag size={13} className={cls} />;
      case 'checkbox':
        return <CheckSquare size={13} className={cls} />;
      case 'date':
        return <Calendar size={13} className={cls} />;
      case 'url':
        return <Globe size={13} className={cls} />;
      default:
        return <HelpCircle size={13} className={cls} />;
    }
  };

  const allOn = filteredRows.length > 0 && selected.length === filteredRows.length;
  const toggle = (id: string) => setSelected(sel => (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]));
  const duplicateSelected = () => { if (!onDuplicateRow) return; selected.forEach(id => onDuplicateRow(id)); setSelected([]); };
  const deleteSelected = () => {
    if (onDeleteRows) onDeleteRows(selected);
    else selected.forEach(id => onDeleteRow(id));
    setSelected([]);
  };
  const dropOn = (targetId: string, after: boolean) => {
    const from = dragRow; setDragRow(null); setOverRow(null);
    if (!from || from === targetId || !onReorderRows) return;
    const ids = filteredRows.map(r => r.id).filter(id => id !== from);
    const at = ids.indexOf(targetId);
    ids.splice(after ? at + 1 : at, 0, from);
    onReorderRows(ids);
  };

  const headCls = 'nt-th relative px-3 py-2 text-left text-[12px] font-semibold text-[var(--notion-text-muted)]';

  return (
    <div>
    {layoutKey && <ColumnControls columns={columns.map(prop => ({
      id: prop.id, label: prop.name, width: widthOf(prop.id), fixed: prop === title,
    }))} label={isCreditBases(database.id) ? 'Largura e ordem' : undefined} onResize={layout.resize} onMove={move} onReset={layout.reset} />}

    {/* Barra da seleção: aparece quando há linhas marcadas */}
    {!readOnly && selected.length > 0 && (
      <div role="toolbar" aria-label="Ações das linhas selecionadas" className="mb-2 flex flex-wrap items-center gap-2 border border-[var(--notion-border)] bg-[var(--notion-card)] px-3 py-1.5 text-xs">
        <b className="text-[var(--notion-text)]">{selected.length} {selected.length === 1 ? 'selecionada' : 'selecionadas'}</b>
        {onDuplicateRow && <button onClick={duplicateSelected} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"><Copy size={13} />Duplicar</button>}
        <button onClick={deleteSelected} className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-500/10"><Trash2 size={13} />Excluir</button>
        <button onClick={() => setSelected([])} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]"><X size={13} />Limpar seleção</button>
      </div>
    )}

    <div className={`nt-table-frame overflow-x-auto border border-[var(--notion-border)] bg-[var(--notion-card)] ${layoutKey ? 'nt-task-grid w-fit max-w-full' : 'w-full'}`}>
      <table className={`text-left text-xs ${layoutKey ? 'table-fixed border-separate border-spacing-0' : 'min-w-full border-collapse'}`}
        style={layoutKey ? { width: columns.reduce((sum, prop) => sum + widthOf(prop.id), lead) } : undefined}>
        <thead>
          <tr className="nt-thead bg-[var(--notion-sidebar-bg)]">
            {!readOnly && <th className={`${headCls} nt-lead`} style={{ width: LEAD }}>
              <input type="checkbox" aria-label="Selecionar todas as linhas" checked={allOn} onChange={() => setSelected(allOn ? [] : filteredRows.map(r => r.id))}
                className={`nt-check ${selected.length ? 'on' : ''}`} />
            </th>}
            {columns.map((prop, i) => (
              <th key={prop.id} className={`${headCls} group/th ${layoutKey && prop === title ? 'nt-pinned' : ''} ${layoutKey ? '' : 'min-w-[150px] whitespace-nowrap'}`}
                style={layoutKey ? { width: widthOf(prop.id) } : undefined}
                onDragOver={layoutKey && prop !== title ? event => { if (event.dataTransfer.types.includes('application/x-gaas-column')) event.preventDefault(); } : undefined}
                onDrop={layoutKey ? event => { const id = event.dataTransfer.getData('application/x-gaas-column'); if (id) { event.preventDefault(); move(id, prop.id); } } : undefined}>
                <div className="flex min-w-0 items-center gap-1">
                  {layoutKey && (prop === title ? <Pin size={11} className="shrink-0 opacity-40" /> : <span draggable className="nt-column-grip absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/th:opacity-100" title="Arraste para mover a coluna"
                    onDragStart={event => { event.dataTransfer.setData('application/x-gaas-column', prop.id); event.dataTransfer.effectAllowed = 'move'; }}><GripVertical size={13} /></span>)}
                  <PropertyHeader databaseId={database.id} property={prop} icon={getPropIcon(prop.type)} />
                </div>
                {layoutKey && <ResizeColumn label={prop.name} width={widthOf(prop.id)} onResize={width => layout.resize(prop.id, width)} />}
                {/* Nova coluna: botão discreto na borda da última coluna, sem coluna vazia no fim */}
                {!readOnly && i === columns.length - 1 && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <button
                      onClick={() => setShowAddProp(!showAddProp)}
                      className="rounded p-1 text-[var(--notion-text-muted)] opacity-0 hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] focus:opacity-100 group-hover/th:opacity-100"
                      title="Nova coluna"
                      aria-label="Nova coluna"
                    >
                      <Plus size={13} />
                    </button>
                    {showAddProp && (
                      <DatabasePopup title="Nova coluna" onClose={() => setShowAddProp(false)}>
                      <form onSubmit={handleAddPropSubmit}>
                        <input type="text" aria-label="Nome da coluna" placeholder="Nome da coluna" value={newPropName}
                          onChange={(e) => setNewPropName(e.target.value)}
                          className="w-full px-2 py-1 mb-2 text-xs rounded border border-[var(--notion-border)] bg-[var(--notion-hover)] text-[var(--notion-text)] focus:outline-none" autoFocus />
                        <select aria-label="Tipo da coluna" value={newPropType} onChange={(e) => setNewPropType(e.target.value as PropertyType)}
                          className="w-full px-2 py-1 mb-3 text-xs rounded border border-[var(--notion-border)] bg-[var(--notion-hover)] text-[var(--notion-text)] focus:outline-none">
                          <option value="text">Texto</option>
                          <option value="person">Pessoa</option>
                          <option value="number">Número</option>
                          <option value="select">Seleção</option>
                          <option value="multi_select">Seleção múltipla</option>
                          <option value="status">Status</option>
                          <option value="date">Data</option>
                          <option value="checkbox">Caixa de seleção</option>
                          <option value="url">Link</option>
                        </select>
                        <button type="submit" className="w-full py-1 text-xs bg-cyan-700 hover:bg-cyan-800 text-white font-medium rounded transition-colors">Criar coluna</button>
                      </form>
                      </DatabasePopup>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isCreditBases(database.id) && filteredRows.length === 0 && (
            <tr><td className="p-4 text-[var(--notion-text-muted)]" colSpan={columns.length + (readOnly ? 0 : 1)}>
              {database.rows.length ? 'Nenhum pedido corresponde aos filtros.' : 'Nenhum pedido cadastrado.'}
            </td></tr>
          )}
          {filteredRows.map((row) => {
            const on = selected.includes(row.id);
            const drop = overRow?.id === row.id ? (overRow.after ? 'nt-drop-after' : 'nt-drop-before') : '';
            return (
            <tr
              key={row.id}
              className={`group nt-tr transition-colors ${on ? 'nt-tr-on' : ''} ${dragRow === row.id ? 'opacity-40' : ''} ${drop}`}
              onDragOver={onReorderRows && dragRow ? event => {
                event.preventDefault();
                const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
                const after = event.clientY > box.top + box.height / 2;
                if (overRow?.id !== row.id || overRow.after !== after) setOverRow({ id: row.id, after });
              } : undefined}
              onDrop={onReorderRows && dragRow ? event => { event.preventDefault(); dropOn(row.id, Boolean(overRow?.after)); } : undefined}
            >
              {!readOnly && <td className="nt-td nt-lead px-1.5">
                <div className="flex items-center gap-0.5">
                  {onReorderRows
                    ? <span draggable className="nt-row-grip" title="Arraste para mudar a ordem" aria-label="Arrastar linha"
                        onDragStart={event => { setDragRow(row.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', row.id); }}
                        onDragEnd={() => { setDragRow(null); setOverRow(null); }}><GripVertical size={13} /></span>
                    : <span className="w-[13px]" />}
                  <input type="checkbox" aria-label={`Selecionar ${String(row.properties[title?.id || ''] || 'linha')}`} checked={on} onChange={() => toggle(row.id)}
                    className={`nt-check ${on || selected.length ? 'on' : ''}`} />
                </div>
              </td>}
              {columns.map((prop) => (
                <td key={prop.id} data-task-cell={layoutKey ? true : undefined} className={`nt-td ${layoutKey ? `px-3 py-1.5 ${prop === title ? 'nt-pinned' : ''}` : 'px-3 py-1.5 min-w-[150px]'}`}>
                  {readOnly ? (
                    prop.type === 'title'
                      ? <button onClick={() => onOpenRowPage(row.pageId)} className="text-left text-sm font-medium text-[var(--notion-text)] hover:underline">{String(row.properties[prop.id] || 'Sem título')}</button>
                      : <div className="flex flex-wrap gap-1 text-[11px]"><PropertyChip prop={prop} value={row.properties[prop.id]} users={users} /></div>
                  ) : layoutKey && ['title', 'text', 'number', 'email', 'phone'].includes(prop.type) ? (
                    <InlineTextCell label={prop.name} value={String(row.properties[prop.id] ?? '')}
                      number={prop.type === 'number'}
                      onCommit={value => onUpdateRow(row.id, prop.id, prop.type === 'number' && value !== '' ? Number(value) : value)}
                      onOpen={prop.type === 'title' ? () => onOpenRowPage(row.pageId) : undefined} />
                  ) : <PropertyCell
                    property={prop}
                    value={row.properties[prop.id]}
                    users={users}
                    compact={Boolean(layoutKey)}
                    databaseId={database.id}
                    rowId={row.id}
                    onChange={(val) => onUpdateRow(row.id, prop.id, val)}
                    onOpenPage={prop.type === 'title' ? () => onOpenRowPage(row.pageId) : undefined}
                    />}
                  <CreditDateAlert database={database} row={row} propertyId={prop.id} />
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>

      {/* Rodapé: novo item e contagem */}
      <div className="sticky left-0 flex items-center justify-between gap-6 px-3 py-1.5 border-t border-[var(--notion-border)] text-xs text-[var(--notion-text-muted)]">
        {readOnly ? <span /> : <button
          onClick={onAddRow}
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] font-medium transition-colors"
        >
          <Plus size={14} /> Novo
        </button>}
        <span className="tabular-nums">{filteredRows.length} {filteredRows.length === 1 ? 'item' : 'itens'}</span>
      </div>
    </div>
    </div>
  );
};
