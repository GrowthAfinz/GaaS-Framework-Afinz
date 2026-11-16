import type { Block, NotionDatabase, NotionPage, NotionUser, NotionWorkspace } from '../types/notion';
import { displayValue } from '../components/database/viewEngine';
import { GAAS_FRONT, TASKS_DB } from '../gaas/tasksAdapter';

export function taskPageScope(database: NotionDatabase, page?: NotionPage) {
  const fronts = database.properties.find(property => property.id === 'p_frente')?.options ?? [];
  const pageFronts = page?.taskFronts;
  const scope = fronts.filter(front => pageFronts ? pageFronts.includes(front.id) : front.id !== GAAS_FRONT).map(front => front.name);
  const known = new Set(fronts.map(front => front.name));
  const rows = database.rows.filter(row => {
    const front = String(row.properties.p_frente || '');
    return front && known.has(front) ? scope.includes(front) : !pageFronts;
  });
  return { scope, rows };
}

function blockMarkdown(block: Block): string {
  const { content, type, url, caption } = block;
  switch (type) {
    case 'heading_1': return `## ${content}`;
    case 'heading_2': return `### ${content}`;
    case 'heading_3': return `#### ${content}`;
    case 'to_do': return `- [${block.checked ? 'x' : ' '}] ${content}`;
    case 'bulleted_list_item': return `- ${content}`;
    case 'numbered_list_item': return `1. ${content}`;
    case 'divider': return '---';
    case 'quote':
    case 'callout': return content.split('\n').map(line => `> ${line}`).join('\n');
    case 'image': return url ? `![${caption || 'Imagem'}](<${url}>)` : content;
    case 'bookmark': return url ? `[${caption || url}](<${url}>)` : content;
    case 'math': return ['$$', content, '$$'].join('\n');
    case 'code': {
      const fence = '~'.repeat(Math.max(3, ...(content.match(/~+/g) ?? []).map(run => run.length + 1)));
      return [fence + (block.language || ''), content, fence].join('\n');
    }
    case 'table': {
      const rows = block.tableData ?? [];
      const columns = Math.max(0, ...rows.map(row => row.length));
      if (!columns) return '';
      const line = (row: string[]) => '| ' + Array.from({ length: columns }, (_, index) =>
        (row[index] ?? '').replace(/\|/g, '&#124;').replace(/\r?\n/g, '<br>')).join(' | ') + ' |';
      return [
        line(block.hasHeaderRow ? rows[0] : []),
        line(Array(columns).fill('---')),
        ...(block.hasHeaderRow ? rows.slice(1) : rows).map(line),
      ].join('\n');
    }
    default: return content;
  }
}

export function pageMarkdown(page: NotionPage, workspace: NotionWorkspace, users: NotionUser[]): string {
  const renderDatabase = (databaseId: string) => {
    const database = workspace.databases[databaseId];
    if (!database) return '';
    const rows = databaseId === TASKS_DB ? taskPageScope(database, page).rows : database.rows;
    const properties = database.properties.filter(property => property.type !== 'title');
    const titleId = database.properties.find(property => property.type === 'title')?.id;
    const tasks = rows.map(row => {
      const task = workspace.pages[row.pageId];
      const title = (titleId && row.properties[titleId]) || task?.title || 'Sem título';
      const fields = properties.flatMap(property => {
        const value = displayValue(property, row.properties[property.id], users);
        return value ? [`- **${property.name}**: ${value.replace(/\r?\n/g, ' ')}`] : [];
      });
      const notes = serializeBlocks(task?.blockIds ?? [], false);
      return [`### ${title}`, fields.join('\n'), notes].filter(Boolean).join('\n\n');
    });
    return [database.title && `## ${database.title}`, database.description, ...tasks].filter(Boolean).join('\n\n');
  };
  const serializeBlocks = (ids: string[], includeDatabases: boolean, ancestors = new Set<string>()): string => ids.flatMap(id => {
    const block = workspace.blocks[id];
    if (!block || ancestors.has(id)) return [];
    const body = block.type === 'database_view'
      ? includeDatabases && block.databaseId ? renderDatabase(block.databaseId) : ''
      : blockMarkdown(block);
    const children = serializeBlocks(block.childrenIds ?? [], includeDatabases, new Set([...ancestors, id]));
    return [body, children].filter(Boolean);
  }).join('\n\n');
  return [
    `# ${page.title || 'Sem título'}`,
    page.databaseId && renderDatabase(page.databaseId),
    serializeBlocks(page.blockIds, true),
  ].filter(Boolean).join('\n\n') + '\n';
}

export function downloadPageMarkdown(page: NotionPage, workspace: NotionWorkspace, users: NotionUser[]) {
  const blob = new Blob([pageMarkdown(page, workspace, users)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = page.title.replace(/[<>:"/\\|?*]/g, '-').trim() || 'pagina';
  link.href = url;
  link.download = `${name}.md`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
