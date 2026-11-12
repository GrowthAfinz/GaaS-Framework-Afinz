import React, { useState, useMemo, useEffect } from 'react';
import {
  Table as TableIcon,
  Kanban,
  LayoutGrid,
  List as ListIcon,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  X,
  Columns3,
  Check,
} from 'lucide-react';
import {
  DatabaseProperty,
  DatabaseRow,
  DatabaseViewConfig,
  DatabaseViewType,
  NotionDatabase,
  NotionUser,
  PropertyType,
} from '../../types/notion';
import { TableView } from './TableView';
import { BoardView } from './BoardView';
import { GalleryView } from './GalleryView';
import { ListView } from './ListView';
import { CalendarView } from './CalendarView';
import { CHIP_COLORS, EMPTY, applyView } from './viewEngine';

interface DatabaseViewProps {
  database: NotionDatabase;
  users?: NotionUser[];
  onUpdateRow: (databaseId: string, rowId: string, propertyId: string, value: any) => void;
  onAddRow: (databaseId: string, initialProps?: Record<string, any>) => void;
  onDeleteRow: (databaseId: string, rowId: string) => void;
  onAddProperty: (databaseId: string, name: string, type: PropertyType) => void;
  onSetView: (databaseId: string, viewId: string) => void;
  onAddView: (databaseId: string, name: string, type: DatabaseViewType) => void;
  onOpenRowPage: (pageId: string) => void;
  onUpdateView?: (databaseId: string, viewId: string, partial: Partial<DatabaseViewConfig>) => void;
  onDeleteView?: (databaseId: string, viewId: string) => void;
  onDuplicateRow?: (databaseId: string, rowId: string) => void;
  /** Só leitura: mostra os dados e deixa mexer só em visões, filtros e agrupamento. */
  readOnly?: boolean;
  /** Chips de filtro rápido por uma propriedade (ex.: Frente). A seleção é de cada pessoa e fica no navegador. */
  quickFilter?: QuickFilterConfig;
}
export interface QuickFilterConfig { propertyId: string; hiddenByDefault: string[]; storageKey: string }
const readSel = (k: string): string[] | null => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as string[]) : null; } catch { return null; } };

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  database,
  users = [],
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onAddProperty,
  onSetView,
  onAddView,
  onOpenRowPage,
  onUpdateView,
  onDeleteView,
  onDuplicateRow,
  readOnly = false,
  quickFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [showAddViewMenu, setShowAddViewMenu] = useState(false);
  const [menu, setMenu] = useState<null | 'filter' | 'sort' | 'group' | 'props'>(null);
  const [filterProp, setFilterProp] = useState<string | null>(null);

  const currentView =
    database.views.find((v) => v.id === database.currentViewId) || database.views[0];

  const getViewIcon = (type: DatabaseViewType) => {
    switch (type) {
      case 'table':
        return <TableIcon size={14} />;
      case 'board':
        return <Kanban size={14} />;
      case 'gallery':
        return <LayoutGrid size={14} />;
      case 'list':
        return <ListIcon size={14} />;
      case 'calendar':
        return <CalendarIcon size={14} />;
    }
  };

  // Filtros, ordenação e agrupamento ficam salvos na visão (valem para o time todo).
  const viewRows = useMemo(
    () => applyView(database.rows, currentView, database.properties, users, searchQuery),
    [database.rows, database.properties, currentView, users, searchQuery]
  );
  // Filtro rápido (chips): por padrão tudo ligado, menos o que vem escondido (ex.: GaaS).
  const qfProp = quickFilter ? database.properties.find((p) => p.id === quickFilter.propertyId) : undefined;
  const qfOptions = qfProp?.options?.map((o) => o.name) || [];
  const [qfSel, setQfSel] = useState<string[] | null>(() => (quickFilter ? readSel(quickFilter.storageKey) : null));
  useEffect(() => { if (quickFilter && qfSel) { try { localStorage.setItem(quickFilter.storageKey, JSON.stringify(qfSel)); } catch { /* preferência local */ } } }, [qfSel, quickFilter]);
  const qfSelected = qfSel ?? [...qfOptions.filter((n) => !quickFilter?.hiddenByDefault.includes(n)), EMPTY];
  const qfLockedByView = Boolean(quickFilter && (currentView.filters || []).some((f) => f.propertyId === quickFilter.propertyId));
  const qfActive = Boolean(qfProp) && !qfLockedByView;
  // Valor fora da lista (ex.: frente arquivada) cai em "Sem frente" para a tarefa nunca sumir.
  const qfValue = (r: DatabaseRow) => { const v = String(r.properties[quickFilter?.propertyId || ''] || ''); return v && qfOptions.includes(v) ? v : EMPTY; };
  const filteredRows = useMemo(
    () => (qfActive ? viewRows.filter((r) => qfSelected.includes(qfValue(r))) : viewRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewRows, qfActive, qfSelected.join('|')]
  );
  const qfCount = (name: string) => viewRows.filter((r) => qfValue(r) === name).length;
  const qfToggle = (name: string, only: boolean) =>
    setQfSel(only ? [name] : qfSelected.includes(name) ? qfSelected.filter((n) => n !== name) : [...qfSelected, name]);
  const addRowWithQuick = (props: Record<string, any> = {}) => {
    if (!qfActive || !quickFilter || props[quickFilter.propertyId]) return onAddRow(database.id, props);
    const first = qfSelected.find((n) => n !== EMPTY);
    return onAddRow(database.id, first ? { ...props, [quickFilter.propertyId]: first } : props);
  };
  const patchView = (partial: Partial<DatabaseViewConfig>) => onUpdateView?.(database.id, currentView.id, partial);
  const filterable = database.properties.filter((p) => p.type !== 'title');
  const optionsOf = (pid: string): { value: string; label: string }[] => {
    const prop = database.properties.find((p) => p.id === pid);
    if (!prop) return [];
    if (prop.type === 'person') return [...users.map((u) => ({ value: u.id, label: u.name })), { value: EMPTY, label: 'Vazio' }];
    if (prop.options) return [...prop.options.map((o) => ({ value: o.name, label: o.name })), { value: EMPTY, label: 'Vazio' }];
    return [];
  };
  const filters = currentView.filters || [];
  const hasFilter = (pid: string, value: string) => filters.some((f) => f.propertyId === pid && f.value === value && f.operator === 'equals');
  const toggleFilter = (pid: string, value: string) =>
    patchView({ filters: hasFilter(pid, value) ? filters.filter((f) => !(f.propertyId === pid && f.value === value)) : [...filters, { propertyId: pid, operator: 'equals', value }] });
  const setTextFilter = (pid: string, value: string) =>
    patchView({ filters: [...filters.filter((f) => f.propertyId !== pid), ...(value.trim() ? [{ propertyId: pid, operator: 'contains' as const, value }] : [])] });
  const propName = (pid: string) => database.properties.find((p) => p.id === pid)?.name || pid;
  const sort = (currentView.sorts || [])[0];
  const groupable = database.properties.filter((p) => ['select', 'status', 'person'].includes(p.type));
  const dateProps = database.properties.filter((p) => p.type === 'date');
  const groupPropId = currentView.groupByPropertyId || groupable.find((p) => p.type === 'status')?.id || groupable[0]?.id;
  const datePropId = currentView.datePropertyId || dateProps[0]?.id;
  const visible = currentView.visiblePropertyIds || [];
  const menuBox = 'absolute right-0 top-8 z-50 w-64 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-1 shadow-lg text-xs max-h-80 overflow-y-auto';
  const item = 'flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-[var(--notion-hover)] text-left';
  const toolBtn = (on: boolean) => `flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${on ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'border-[var(--notion-border)] text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]'}`;

  return (
    <div className="my-6 space-y-3">
      {/* Database Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--notion-text)]">
            {database.title}
          </h3>
          {database.description && (
            <p className="text-xs text-[var(--notion-text-muted)] mt-0.5">
              {database.description}
            </p>
          )}
        </div>
      </div>

      {/* View Tabs & Action Bar */}
      <div className="flex items-center justify-between border-b border-[var(--notion-border)] pb-1.5 flex-wrap gap-2">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {database.views.map((view) => renaming === view.id ? (
            <input
              key={view.id}
              autoFocus
              defaultValue={view.name}
              onBlur={(e) => { const n = e.target.value.trim(); if (n && n !== view.name) onUpdateView?.(database.id, view.id, { name: n }); setRenaming(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null); }}
              className="w-32 px-2 py-1 rounded border border-blue-500 bg-transparent text-xs focus:outline-none"
            />
          ) : (
            <div key={view.id} className="group/tab relative flex items-center">
              <button
                onClick={() => onSetView(database.id, view.id)}
                onDoubleClick={() => onUpdateView && setRenaming(view.id)}
                title="Duplo clique para renomear"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  view.id === currentView.id
                    ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
                    : 'text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]'
                }`}
              >
                {getViewIcon(view.type)}
                <span>{view.name}</span>
              </button>
              {onDeleteView && database.views.length > 1 && view.id === currentView.id && (
                <button
                  onClick={() => { if (window.confirm(`Excluir a visão "${view.name}"? Os itens continuam na base.`)) onDeleteView(database.id, view.id); }}
                  className="opacity-0 group-hover/tab:opacity-100 -ml-1 p-0.5 rounded text-[var(--notion-text-muted)] hover:text-red-500"
                  title="Excluir visão"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {/* Add View Dropdown */}
          {!readOnly && <div className="relative">
            <button
              onClick={() => setShowAddViewMenu(!showAddViewMenu)}
              className="p-1 rounded text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
              title="Nova visão"
            >
              <Plus size={14} />
            </button>

            {showAddViewMenu && (
              <div className="absolute left-0 top-7 z-50 w-44 rounded-md border border-[var(--notion-border)] bg-[var(--notion-card)] p-1 shadow-lg text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[var(--notion-text-muted)]">
                  Nova visão
                </div>
                {[
                  { type: 'table' as const, label: 'Tabela' },
                  { type: 'board' as const, label: 'Quadro' },
                  { type: 'gallery' as const, label: 'Galeria' },
                  { type: 'list' as const, label: 'Lista' },
                  { type: 'calendar' as const, label: 'Calendário' },
                ].map((v) => (
                  <button
                    key={v.type}
                    onClick={() => {
                      onAddView(database.id, `${v.label} ${database.views.filter((x) => x.type === v.type).length + 1}`, v.type);
                      setShowAddViewMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-[var(--notion-hover)] text-left"
                  >
                    {getViewIcon(v.type)}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>}
        </div>

        {/* Search, Filter, Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--notion-border)] bg-[var(--notion-hover)]/50 text-xs">
            <Search size={13} className="text-[var(--notion-text-muted)]" />
            <input
              type="text"
              placeholder="Buscar…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 sm:w-36 bg-transparent focus:outline-none text-[var(--notion-text)] placeholder-[var(--notion-text-muted)]"
            />
          </div>

          {/* Filtro */}
          <div className="relative">
            <button onClick={() => { setMenu(menu === 'filter' ? null : 'filter'); setFilterProp(null); }} className={toolBtn(filters.length > 0)}>
              <Filter size={12} /><span>Filtro{filters.length ? ` (${filters.length})` : ''}</span>
            </button>
            {menu === 'filter' && (
              <div className={menuBox}>
                {!filterProp ? filterable.map((p) => (
                  <button key={p.id} className={item} onClick={() => setFilterProp(p.id)}>
                    <span className="flex-1">{p.name}</span>
                    {filters.some((f) => f.propertyId === p.id) && <span className="text-blue-600">{filters.filter((f) => f.propertyId === p.id).length}</span>}
                  </button>
                )) : (
                  <>
                    <button className={`${item} text-[var(--notion-text-muted)]`} onClick={() => setFilterProp(null)}>← {propName(filterProp)}</button>
                    {optionsOf(filterProp).length ? optionsOf(filterProp).map((o) => (
                      <button key={o.value} className={item} onClick={() => toggleFilter(filterProp, o.value)}>
                        <span className={`w-3.5 h-3.5 rounded border grid place-items-center ${hasFilter(filterProp, o.value) ? 'bg-blue-500 border-blue-500 text-white' : 'border-[var(--notion-border)]'}`}>{hasFilter(filterProp, o.value) && <Check size={10} />}</span>
                        <span className="truncate">{o.label}</span>
                      </button>
                    )) : (
                      <div className="p-2">
                        <input autoFocus placeholder="Contém…" defaultValue={filters.find((f) => f.propertyId === filterProp)?.value || ''}
                          onChange={(e) => setTextFilter(filterProp, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[var(--notion-border)] bg-transparent focus:outline-none" />
                      </div>
                    )}
                  </>
                )}
                {filters.length > 0 && <button className={`${item} text-blue-600 border-t border-[var(--notion-border)] mt-1`} onClick={() => patchView({ filters: [] })}>Limpar filtros</button>}
              </div>
            )}
          </div>

          {/* Ordenar */}
          <div className="relative">
            <button onClick={() => setMenu(menu === 'sort' ? null : 'sort')} className={toolBtn(Boolean(sort))}>
              <ArrowUpDown size={12} /><span>{sort ? `${propName(sort.propertyId)} ${sort.direction === 'ascending' ? '↑' : '↓'}` : 'Ordenar'}</span>
            </button>
            {menu === 'sort' && (
              <div className={menuBox}>
                {database.properties.map((p) => {
                  const on = sort?.propertyId === p.id;
                  return (
                    <button key={p.id} className={item} onClick={() => patchView({ sorts: !on ? [{ propertyId: p.id, direction: 'ascending' }] : sort.direction === 'ascending' ? [{ propertyId: p.id, direction: 'descending' }] : [] })}>
                      <span className="flex-1">{p.name}</span>
                      {on && <span className="text-blue-600">{sort.direction === 'ascending' ? 'crescente' : 'decrescente'}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agrupar (quadro) ou Data (calendário) */}
          {(currentView.type === 'board' || currentView.type === 'calendar') && (
            <div className="relative">
              <button onClick={() => setMenu(menu === 'group' ? null : 'group')} className={toolBtn(false)}>
                <Columns3 size={12} /><span>{currentView.type === 'board' ? `Agrupar: ${groupPropId ? propName(groupPropId) : 'nada'}` : `Data: ${datePropId ? propName(datePropId) : 'nenhuma'}`}</span>
              </button>
              {menu === 'group' && (
                <div className={menuBox}>
                  {(currentView.type === 'board' ? groupable : dateProps).map((p) => (
                    <button key={p.id} className={item} onClick={() => { patchView(currentView.type === 'board' ? { groupByPropertyId: p.id } : { datePropertyId: p.id }); setMenu(null); }}>
                      <span className="flex-1">{p.name}</span>{(currentView.type === 'board' ? groupPropId : datePropId) === p.id && <Check size={12} className="text-blue-600" />}
                    </button>
                  ))}
                  {currentView.type === 'board' && (
                    <button className={`${item} border-t border-[var(--notion-border)] mt-1`} onClick={() => patchView({ hideEmptyGroups: !currentView.hideEmptyGroups })}>
                      <span className={`w-3.5 h-3.5 rounded border grid place-items-center ${currentView.hideEmptyGroups ? 'bg-blue-500 border-blue-500 text-white' : 'border-[var(--notion-border)]'}`}>{currentView.hideEmptyGroups && <Check size={10} />}</span>
                      <span>Esconder colunas vazias</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Propriedades visíveis */}
          <div className="relative">
            <button onClick={() => setMenu(menu === 'props' ? null : 'props')} className={toolBtn(false)} title="Propriedades visíveis">
              <MoreHorizontal size={12} />
            </button>
            {menu === 'props' && (
              <div className={menuBox}>
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[var(--notion-text-muted)]">Mostrar nos cards e linhas</div>
                {filterable.map((p) => (
                  <button key={p.id} className={item} onClick={() => patchView({ visiblePropertyIds: visible.includes(p.id) ? visible.filter((x) => x !== p.id) : [...visible, p.id] })}>
                    <span className={`w-3.5 h-3.5 rounded border grid place-items-center ${visible.includes(p.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-[var(--notion-border)]'}`}>{visible.includes(p.id) && <Check size={10} />}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Row Button */}
          {!readOnly && <button
            onClick={() => addRowWithQuick()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-xs"
          >
            <Plus size={14} /> Novo
          </button>}
        </div>
      </div>

      {qfProp && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs" data-quick-filter={qfProp.id}>
          <span className="font-semibold text-[var(--notion-text-muted)] mr-0.5">{qfProp.name}:</span>
          {qfLockedByView ? (
            <span className="text-[var(--notion-text-muted)]">esta visão já filtra por {qfProp.name.toLowerCase()}</span>
          ) : (
            <>
              <button onClick={() => setQfSel([...qfOptions, EMPTY])} className={`px-2 py-0.5 rounded-full border ${qfOptions.every((n) => qfSelected.includes(n)) ? 'bg-slate-800 text-white border-slate-800' : 'border-[var(--notion-border)] text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]'}`}>Todas</button>
              {[...(qfProp.options || []), { id: EMPTY, name: EMPTY, color: 'default' as const }].map((o) => {
                const on = qfSelected.includes(o.name), n = qfCount(o.name);
                if (o.name === EMPTY && !n) return null;
                return (
                  <button key={o.id} onClick={(e) => qfToggle(o.name, e.altKey || e.detail === 2)} title="Clique liga ou desliga. Duplo clique mostra só esta."
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${on ? `${CHIP_COLORS[o.color]} border-transparent` : 'border-dashed border-[var(--notion-border)] text-[var(--notion-text-muted)] opacity-60 hover:opacity-100'}`}>
                    <span className={on ? '' : 'line-through'}>{o.name === EMPTY ? `Sem ${qfProp.name.toLowerCase()}` : o.name}</span>
                    <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {filters.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
              {propName(f.propertyId)}: {f.value === EMPTY ? 'Vazio' : database.properties.find((p) => p.id === f.propertyId)?.type === 'person' ? users.find((u) => u.id === f.value)?.name || f.value : f.value}
              <button onClick={() => patchView({ filters: filters.filter((_, j) => j !== i) })} aria-label="Remover filtro"><X size={11} /></button>
            </span>
          ))}
          <span className="text-[var(--notion-text-muted)]">{filteredRows.length} de {database.rows.length}</span>
        </div>
      )}

      {/* Render Active View */}
      {currentView.type === 'table' && (
        <TableView
          database={database}
          filteredRows={filteredRows}
          users={users}
          onUpdateRow={(rId, pId, val) => onUpdateRow(database.id, rId, pId, val)}
          onAddRow={() => addRowWithQuick()}
          onDeleteRow={(rId) => onDeleteRow(database.id, rId)}
          onDuplicateRow={onDuplicateRow && !readOnly ? (rId) => onDuplicateRow(database.id, rId) : undefined}
          readOnly={readOnly}
          onAddProperty={(name, type) => onAddProperty(database.id, name, type)}
          onOpenRowPage={onOpenRowPage}
        />
      )}

      {currentView.type === 'board' && (
        <BoardView
          database={database}
          filteredRows={filteredRows}
          groupPropId={groupPropId}
          visiblePropIds={visible}
          users={users}
          hiddenValues={qfActive && groupPropId === quickFilter?.propertyId ? [...qfOptions, EMPTY].filter((n) => !qfSelected.includes(n)) : []}
          hideEmpty={Boolean(currentView.hideEmptyGroups)}
          readOnly={readOnly}
          onUpdateRow={(rId, pId, val) => onUpdateRow(database.id, rId, pId, val)}
          onAddRow={(props) => addRowWithQuick(props)}
          onOpenRowPage={onOpenRowPage}
        />
      )}

      {currentView.type === 'gallery' && (
        <GalleryView
          database={database}
          filteredRows={filteredRows}
          onAddRow={() => addRowWithQuick()}
          onOpenRowPage={onOpenRowPage}
        />
      )}

      {currentView.type === 'list' && (
        <ListView
          database={database}
          filteredRows={filteredRows}
          onAddRow={() => addRowWithQuick()}
          onOpenRowPage={onOpenRowPage}
        />
      )}

      {currentView.type === 'calendar' && (
        <CalendarView
          database={database}
          filteredRows={filteredRows}
          datePropId={datePropId}
          readOnly={readOnly}
          onUpdateRow={readOnly ? undefined : (rId, pId, val) => onUpdateRow(database.id, rId, pId, val)}
          onAddRow={(props) => addRowWithQuick(props)}
          onOpenRowPage={onOpenRowPage}
        />
      )}
    </div>
  );
};
