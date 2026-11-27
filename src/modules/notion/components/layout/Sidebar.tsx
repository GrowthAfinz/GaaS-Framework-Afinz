import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Settings,
  Trash2,
  Copy,
  Star,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  Users,
  Sparkles,
  Upload,
  Home,
  MessageSquare,
  Calendar,
  Clock,
  Lock,
} from 'lucide-react';
import { NotionPage, NotionUser, NotionWorkspace } from '../../types/notion';

interface SidebarProps {
  workspace: NotionWorkspace;
  activePageId: string;
  users?: NotionUser[];
  activeUserId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectPage: (pageId: string) => void;
  onCreatePage: (parentId?: string | null) => void;
  onArchivePage: (pageId: string) => void;
  onDuplicatePage?: (pageId: string) => void;
  onToggleFavorite: (pageId: string) => void;
  onSetActiveUser?: (userId: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onImportMarkdown: (markdownText: string) => void;
  onOpenTrash: () => void;
  /** Seções fixas do GaaS, iguais para o time (ex.: Frentes). "top" vem antes de Páginas, "bottom" depois. */
  sections?: { title: string; pageIds: string[]; placement: 'top' | 'bottom'; defaultExpanded?: boolean }[];
  /** Seção com itens que não são páginas do espaço (ex.: Páginas IA, que vêm das tabelas dos agentes). Fica por último, recolhida. */
  virtualSection?: { title: string; items: { id: string; icon: string; title: string; count?: number; indent?: boolean }[]; activeId: string | null; onSelect: (id: string) => void };
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspace,
  activePageId,
  users = [],
  activeUserId,
  isCollapsed,
  onToggleCollapse,
  onSelectPage,
  onCreatePage,
  onArchivePage,
  onDuplicatePage,
  onToggleFavorite,
  onSetActiveUser,
  onOpenSearch,
  onOpenSettings,
  onOpenTemplates,
  onImportMarkdown,
  onOpenTrash,
  sections = [],
  virtualSection,
}) => {
  const fixedIds = new Set(sections.flatMap((s) => s.pageIds));
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const mdInputRef = React.useRef<HTMLInputElement>(null);

  const activeUser = users.find((u) => u.id === activeUserId) || users[0];

  const toggleExpand = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const getChildPages = (parentId: string) => {
    return Object.values(workspace.pages).filter(
      (p) => p.parentId === parentId && !p.isArchived
    );
  };

  const renderPageItem = (page: NotionPage, depth: number = 0) => {
    const children = getChildPages(page.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedPages[page.id];
    const isActive = page.id === activePageId;

    return (
      <div key={page.id} className="select-none">
        <div
          onClick={() => onSelectPage(page.id)}
          style={{ paddingLeft: `${Math.max(8, depth * 12 + 8)}px` }}
          className={`group flex items-center justify-between pr-2 py-1 my-0.5 rounded-md cursor-pointer transition-colors text-xs ${
            isActive
              ? 'bg-[var(--notion-hover)] text-[var(--notion-text)] font-semibold'
              : 'text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => toggleExpand(page.id, e)}
                className="p-0.5 rounded hover:bg-[var(--notion-active)] text-[var(--notion-text-muted)]"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform duration-100 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-2.5" />
            )}

            {page.icon && <span className="shrink-0 text-xs" aria-hidden="true">{page.icon}</span>}
            <span className="truncate">{page.title || 'Sem título'}</span>
          </div>

          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreatePage(page.id);
                setExpandedPages((prev) => ({ ...prev, [page.id]: true }));
              }}
              className="p-0.5 rounded hover:bg-[var(--notion-active)] text-[var(--notion-text-muted)]"
              title="Nova subpágina"
            >
              <Plus size={12} />
            </button>
            {onDuplicatePage && (
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                className="p-0.5 rounded hover:bg-[var(--notion-active)] text-[var(--notion-text-muted)]"
                title="Duplicar"
              >
                <Copy size={12} />
              </button>
            )}
            {!fixedIds.has(page.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchivePage(page.id);
                }}
                className="p-0.5 rounded hover:bg-red-500/10 text-red-400"
                title="Mover para a lixeira"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderPageItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const favoritePages = workspace.favoritePageIds
    .map((id) => workspace.pages[id])
    .filter((p) => p && !p.isArchived);

  const rootPages = workspace.rootPageIds
    .filter((id) => !fixedIds.has(id))
    .map((id) => workspace.pages[id])
    .filter((p) => p && !p.isArchived);

  const renderSection = (title: string, pages: NotionPage[], defaultExpanded: boolean, action?: React.ReactNode) => {
    const expanded = expandedSections[title] ?? defaultExpanded;
    return (
      <div key={title}>
        <div className="flex items-center gap-1 px-1 pb-1">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpandedSections(prev => ({ ...prev, [title]: !(prev[title] ?? defaultExpanded) }))}
            className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {title}
          </button>
          {action}
        </div>
        {expanded && pages.map(page => renderPageItem(page, 0))}
      </div>
    );
  };

  const renderFixedSection = (section: NonNullable<SidebarProps['sections']>[number]) => {
    const pages = section.pageIds.map(id => workspace.pages[id]).filter(page => page && !page.isArchived);
    return pages.length ? renderSection(section.title, pages, section.defaultExpanded ?? false) : null;
  };

  const renderVirtualSection = (vs: NonNullable<SidebarProps['virtualSection']>) => {
    const expanded = expandedSections[vs.title] ?? false;
    return (
      <div key={vs.title}>
        <div className="flex items-center gap-1 px-1 pb-1">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpandedSections(prev => ({ ...prev, [vs.title]: !(prev[vs.title] ?? false) }))}
            className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {vs.title}
          </button>
        </div>
        {expanded && vs.items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => vs.onSelect(item.id)}
            aria-current={vs.activeId === item.id ? 'page' : undefined}
            style={{ paddingLeft: item.indent ? 26 : 8 }}
            className={`flex w-full items-center gap-1.5 pr-2 py-1 my-0.5 rounded-md text-left text-xs transition-colors ${
              vs.activeId === item.id
                ? 'bg-[var(--notion-hover)] text-[var(--notion-text)] font-semibold'
                : 'text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)]'
            }`}
          >
            {!item.indent && <span className="w-2.5" />}
            <span className="shrink-0 text-xs" aria-hidden="true">{item.icon}</span>
            <span className="truncate">{item.title}</span>
            {item.count != null && <span className="ml-auto pl-1 text-[11px] tabular-nums text-[var(--notion-text-muted)]">{item.count}</span>}
          </button>
        ))}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-2 top-2 z-40">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center h-8 w-8 rounded-md bg-[var(--notion-card)] border border-[var(--notion-border)] shadow-md text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
          title="Abrir barra lateral"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="nt-sidebar-expanded relative flex flex-col h-full w-60 shrink-0 bg-[var(--notion-sidebar-bg)] border-r border-[var(--notion-border)] select-none">
      <div className="flex items-center gap-1.5 border-b border-[var(--notion-border)] p-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between min-w-0 flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-hover)]/40 hover:bg-[var(--notion-hover)] text-xs text-[var(--notion-text-muted)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search size={13} />
            <span>Buscar</span>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[var(--notion-card)] border border-[var(--notion-border)]">
            Ctrl+K
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded p-1 text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
          title="Recolher barra lateral"
          aria-label="Recolher barra lateral"
        >
          <ChevronsLeft size={15} />
        </button>
      </div>

      {/* 2. Quick Icons Row (Home, Chat, Calendar, Templates) */}
      <div className="px-2 py-1.5 space-y-0.5 text-xs">
        <button
          onClick={() => onSelectPage(rootPages[0]?.id || '')}
          className="flex items-center gap-2.5 w-full px-2 py-1 rounded-md text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] transition-colors font-medium"
        >
          <Home size={14} />
          <span>Início</span>
        </button>

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-2.5 w-full px-2 py-1 rounded-md text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] transition-colors font-medium"
        >
          <Sparkles size={14} aria-hidden="true" />
          <span>Modelos</span>
        </button>

        <button
          onClick={() => mdInputRef.current?.click()}
          className="flex items-center gap-2.5 w-full px-2 py-1 rounded-md text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)] hover:text-[var(--notion-text)] transition-colors font-medium"
        >
          <Upload size={14} />
          <span>Importar (.md)</span>
        </button>
        <input
          ref={mdInputRef}
          type="file"
          accept=".md,.txt,.markdown"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const text = event.target?.result as string;
                if (text) onImportMarkdown(text);
              };
              reader.readAsText(file);
            }
          }}
          className="hidden"
        />
      </div>

      <div className="h-px bg-[var(--notion-border)] mx-2 my-1" />

      <div className="flex-1 space-y-2 overflow-y-auto px-1 py-1">
        {renderSection('Favoritos', favoritePages, true)}
        {sections.filter(section => section.placement === 'top').map(renderFixedSection)}
        {renderSection('Páginas', rootPages, false, (
          <button
            type="button"
            onClick={() => {
              onCreatePage(null);
              setExpandedSections(prev => ({ ...prev, Páginas: true }));
            }}
            className="mr-1 rounded p-1 text-[var(--notion-text)] hover:bg-[var(--notion-hover)]"
            title="Nova página"
            aria-label="Nova página"
          >
            <Plus size={13} />
          </button>
        ))}
        {sections.filter(section => section.placement === 'bottom').map(renderFixedSection)}
        {/* Páginas IA fica por último e começa recolhida (pedido de 27/11/2026). */}
        {virtualSection && renderVirtualSection(virtualSection)}
      </div>

      {/* 4. Bottom Footer: Active User & Settings */}
      <div className="p-2 border-t border-[var(--notion-border)] relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 flex-1 min-w-0 p-1 rounded-md hover:bg-[var(--notion-hover)] text-left transition-colors"
          >
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--notion-card)] border border-[var(--notion-border)] text-xs shrink-0 shadow-xs">
              {activeUser?.avatar || '👤'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[var(--notion-text)] truncate">
                {activeUser?.name || 'Perfil'}
              </div>
            </div>
            <ChevronDown size={12} className="text-[var(--notion-text-muted)] shrink-0" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
            title="Ajustes"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={onOpenTrash}
            className="p-1.5 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] relative"
            title="Lixeira"
          >
            <Trash2 size={14} />
            {workspace.trashPageIds.length > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* User Switcher Dropdown */}
        {showUserMenu && (
          <div className="absolute left-2 bottom-12 z-50 w-56 rounded-lg border border-[var(--notion-border)] bg-[var(--notion-card)] p-1.5 shadow-2xl backdrop-blur-md">
            <div className="px-2 py-1 text-[10px] font-semibold text-[var(--notion-text-muted)] uppercase tracking-wider">
              Switch Member Profile
            </div>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  if (onSetActiveUser) onSetActiveUser(u.id);
                  setShowUserMenu(false);
                }}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-xs transition-colors ${
                  u.id === activeUserId
                    ? 'bg-blue-500/10 text-blue-500 font-semibold'
                    : 'text-[var(--notion-text)] hover:bg-[var(--notion-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{u.avatar || '👤'}</span>
                  <span className="truncate">{u.name}</span>
                </div>
                {u.id === activeUserId && <UserCheck size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
