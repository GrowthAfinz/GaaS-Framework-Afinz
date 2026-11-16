import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Type,
  Hash,
  Tag,
  CheckSquare,
  Calendar,
  Globe,
  User as UserIcon,
  HelpCircle,
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
import { GripVertical, Pin } from 'lucide-react';
import { PropertyCell } from './PropertyCell';
import { PropertyHeader } from './PropertyHeader';
import { PropertyChip } from './viewEngine';

interface TableViewProps {
  database: NotionDatabase;
  layoutKey?: string;
  visiblePropertyIds?: string[];
  filteredRows: DatabaseRow[];
  users?: NotionUser[];
  onUpdateRow: (rowId: string, propertyId: string, value: any) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  readOnly?: boolean;
  onAddProperty: (name: string, type: PropertyType) => void;
  onOpenRowPage: (pageId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  database,
  layoutKey,
  visiblePropertyIds,
  filteredRows,
  users = [],
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onDuplicateRow,
  readOnly = false,
  onAddProperty,
  onOpenRowPage,
}) => {
  const [showAddProp, setShowAddProp] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyType>('text');

  const layout = useColumnLayout(layoutKey);
  const movable = database.properties.filter(prop => !layoutKey || prop.type === 'title' || !visiblePropertyIds?.length || visiblePropertyIds.includes(prop.id));
  const title = movable.find(prop => prop.type === 'title');
  const columns = layoutKey ? [
    ...movable.filter(prop => prop === title),
    ...layout.order.flatMap(id => movable.filter(prop => prop.id === id && prop !== title)),
    ...movable.filter(prop => prop !== title && !layout.order.includes(prop.id)),
  ] : movable;
  const widthOf = (id: string) => layout.widths[id] ?? (id === title?.id ? 340 : 164);
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

  const getPropIcon = (type: PropertyType) => {
    switch (type) {
      case 'title':
      case 'text':
        return <Type size={14} className="text-[var(--notion-text-muted)]" />;
      case 'person':
        return <UserIcon size={14} className="text-blue-500" />;
      case 'number':
        return <Hash size={14} className="text-[var(--notion-text-muted)]" />;
      case 'select':
      case 'status':
      case 'multi_select':
        return <Tag size={14} className="text-[var(--notion-text-muted)]" />;
      case 'checkbox':
        return <CheckSquare size={14} className="text-[var(--notion-text-muted)]" />;
      case 'date':
        return <Calendar size={14} className="text-[var(--notion-text-muted)]" />;
      case 'url':
        return <Globe size={14} className="text-[var(--notion-text-muted)]" />;
      default:
        return <HelpCircle size={14} className="text-[var(--notion-text-muted)]" />;
    }
  };

  return (
    <div>
    {layoutKey && <ColumnControls columns={columns.map(prop => ({
      id: prop.id, label: prop.name, width: widthOf(prop.id), fixed: prop === title,
    }))} onResize={layout.resize} onMove={move} onReset={layout.reset} />}
    <div className={`w-full overflow-x-auto border border-[var(--notion-border)] rounded-md bg-[var(--notion-card)] shadow-xs ${layoutKey ? 'nt-task-grid' : ''}`}>
      <table className={`text-left text-xs ${layoutKey ? 'table-fixed border-separate border-spacing-0' : 'min-w-full divide-y divide-[var(--notion-border)] border-collapse'}`}
        style={layoutKey ? { width: columns.reduce((sum, prop) => sum + widthOf(prop.id), readOnly ? 0 : 88) } : undefined}>
        {/* Header Row */}
        <thead>
          <tr className="divide-x divide-[var(--notion-border)] bg-[var(--notion-hover)]/60 text-[var(--notion-text-muted)] font-medium">
            {columns.map((prop) => (
              <th key={prop.id} className={layoutKey ? `nt-grid-header relative px-3 py-2 ${prop === title ? 'nt-pinned' : ''}` : 'px-3 py-2 min-w-[150px] whitespace-nowrap'}
                style={layoutKey ? { width: widthOf(prop.id) } : undefined}
                onDragOver={layoutKey && prop !== title ? event => { if (event.dataTransfer.types.includes('application/x-gaas-column')) event.preventDefault(); } : undefined}
                onDrop={layoutKey ? event => { const id = event.dataTransfer.getData('application/x-gaas-column'); if (id) { event.preventDefault(); move(id, prop.id); } } : undefined}>
                <div className="flex min-w-0 items-center gap-1">
                  {layoutKey && (prop === title ? <Pin size={12} /> : <span draggable className="nt-column-grip" title="Arraste para mover"
                    onDragStart={event => { event.dataTransfer.setData('application/x-gaas-column', prop.id); event.dataTransfer.effectAllowed = 'move'; }}><GripVertical size={14} /></span>)}
                  <PropertyHeader databaseId={database.id} property={prop} icon={getPropIcon(prop.type)} />
                </div>
                {layoutKey && <ResizeColumn label={prop.name} width={widthOf(prop.id)} onResize={width => layout.resize(prop.id, width)} />}
              </th>
            ))}
            {/* Add Property Column */}
            {!readOnly && <th className="w-10 px-2 py-2 text-center">
              <div className="relative">
                <button
                  onClick={() => setShowAddProp(!showAddProp)}
                  className="p-1 hover:bg-[var(--notion-hover)] rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
                  title="Nova propriedade"
                >
                  <Plus size={14} />
                </button>

                {showAddProp && (
                  <form
                    onSubmit={handleAddPropSubmit}
                    className="absolute right-0 top-7 z-50 w-52 p-3 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] shadow-xl text-left"
                  >
                    <div className="text-xs font-semibold text-[var(--notion-text-muted)] mb-2">
                      Nova propriedade
                    </div>
                    <input
                      type="text"
                      placeholder="Nome da propriedade"
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      className="w-full px-2 py-1 mb-2 text-xs rounded border border-[var(--notion-border)] bg-[var(--notion-hover)] text-[var(--notion-text)] focus:outline-none"
                      autoFocus
                    />
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value as PropertyType)}
                      className="w-full px-2 py-1 mb-3 text-xs rounded border border-[var(--notion-border)] bg-[var(--notion-hover)] text-[var(--notion-text)] focus:outline-none"
                    >
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
                    <button
                      type="submit"
                      className="w-full py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded transition-colors"
                    >
                      Criar propriedade
                    </button>
                  </form>
                )}
              </div>
            </th>}
            {!readOnly && <th className="w-8" />}
          </tr>
        </thead>

        {/* Rows */}
        <tbody className="divide-y divide-[var(--notion-border)]">
          {filteredRows.map((row) => (
            <tr
              key={row.id}
              className="group divide-x divide-[var(--notion-border)] hover:bg-[var(--notion-hover)]/30 transition-colors"
            >
              {columns.map((prop) => (
                <td key={prop.id} className={layoutKey ? `px-3 py-1.5 ${prop === title ? 'nt-pinned' : ''}` : 'px-3 py-1.5 min-w-[150px]'}>
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
                </td>
              ))}
              {!readOnly && <td className="w-10" />}
              {/* Row Actions */}
              {!readOnly && <td className="w-8 text-center p-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {onDuplicateRow && (
                  <button onClick={() => onDuplicateRow(row.id)} className="p-1 rounded text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]" title="Duplicar">
                    <Copy size={13} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteRow(row.id)}
                  className="p-1 rounded text-red-500 hover:bg-red-500/10"
                  title="Remover linha"
                >
                  <Trash2 size={13} />
                </button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Table Footer: Add Row & Stats */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--notion-hover)]/30 border-t border-[var(--notion-border)] text-xs text-[var(--notion-text-muted)]">
        {readOnly ? <span /> : <button
          onClick={onAddRow}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] font-medium transition-colors"
        >
          <Plus size={14} /> Novo
        </button>}
        <div>
          <span>{filteredRows.length} {filteredRows.length === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>
    </div>
    </div>
  );
};
