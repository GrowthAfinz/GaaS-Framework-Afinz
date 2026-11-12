/** Motor das visões (adição GaaS ao notion-clone): filtros, ordenação e exibição de propriedades por visão. */
import React from 'react';
import type { DatabaseFilter, DatabaseProperty, DatabaseRow, DatabaseViewConfig, NotionColor, NotionUser } from '../../types/notion';

export const CHIP_COLORS: Record<NotionColor, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  brown: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};
export const EMPTY = '__vazio__';
const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Valor "de exibição" de uma célula, usado em busca, ordenação e filtros de texto. */
export function displayValue(prop: DatabaseProperty | undefined, value: unknown, users: NotionUser[]): string {
  if (value == null || value === '') return '';
  if (prop?.type === 'person') return users.find(u => u.id === value)?.name || '';
  if (prop?.type === 'checkbox') return value ? 'sim' : 'não';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Filtros: mesma propriedade soma (OU), propriedades diferentes cruzam (E). */
export function applyView(rows: DatabaseRow[], view: DatabaseViewConfig, props: DatabaseProperty[], users: NotionUser[], search: string): DatabaseRow[] {
  let out = rows;
  if (search.trim()) {
    const q = norm(search.trim());
    out = out.filter(r => Object.entries(r.properties).some(([k, v]) => norm(displayValue(props.find(p => p.id === k), v, users)).includes(q)));
  }
  const byProp = new Map<string, DatabaseFilter[]>();
  for (const f of view.filters || []) byProp.set(f.propertyId, [...(byProp.get(f.propertyId) || []), f]);
  for (const [pid, fs] of byProp) {
    const prop = props.find(p => p.id === pid);
    out = out.filter(r => fs.some(f => matches(r.properties[pid], f, prop, users)));
  }
  const sort = (view.sorts || [])[0];
  if (sort) {
    const prop = props.find(p => p.id === sort.propertyId);
    const order = prop?.options?.map(o => o.name);
    const dir = sort.direction === 'descending' ? -1 : 1;
    out = [...out].sort((a, b) => {
      const va = a.properties[sort.propertyId], vb = b.properties[sort.propertyId];
      const ea = va == null || va === '', eb = vb == null || vb === '';
      if (ea !== eb) return ea ? 1 : -1;
      if (order && (prop?.type === 'select' || prop?.type === 'status')) return (order.indexOf(String(va)) - order.indexOf(String(vb))) * dir;
      if (prop?.type === 'number') return (Number(va) - Number(vb)) * dir;
      return displayValue(prop, va, users).localeCompare(displayValue(prop, vb, users), 'pt-BR') * dir;
    });
  }
  return out;
}
function matches(value: unknown, f: DatabaseFilter, prop: DatabaseProperty | undefined, users: NotionUser[]): boolean {
  const empty = value == null || value === '' || (Array.isArray(value) && !value.length);
  if (f.operator === 'is_checked') return Boolean(value);
  if (f.operator === 'is_not_checked') return !value;
  if (f.value === EMPTY) return f.operator === 'does_not_equal' ? !empty : empty;
  if (f.operator === 'equals') return Array.isArray(value) ? value.includes(f.value) : String(value ?? '') === f.value;
  if (f.operator === 'does_not_equal') return Array.isArray(value) ? !value.includes(f.value) : String(value ?? '') !== f.value;
  const text = norm(displayValue(prop, value, users));
  if (f.operator === 'contains') return text.includes(norm(f.value));
  if (f.operator === 'does_not_contain') return !text.includes(norm(f.value));
  return true;
}

/** Selo de uma propriedade num card/linha (select, status, pessoa, data, texto). */
export function PropertyChip({ prop, value, users }: { prop: DatabaseProperty; value: unknown; users: NotionUser[] }) {
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return null;
  if (prop.type === 'select' || prop.type === 'status' || prop.type === 'multi_select') {
    const names = Array.isArray(value) ? value : [value];
    return <>{names.map(n => <span key={String(n)} className={`px-1.5 py-0.5 rounded font-medium ${CHIP_COLORS[prop.options?.find(o => o.name === n)?.color || 'default']}`}>{String(n)}</span>)}</>;
  }
  if (prop.type === 'person') {
    const u = users.find(x => x.id === value);
    return u ? <span className="inline-flex items-center gap-1 text-[var(--notion-text-muted)]"><span className="w-4 h-4 rounded-full bg-[var(--notion-active)] grid place-items-center text-[9px] font-bold text-[var(--notion-text)]">{u.name.trim()[0]?.toUpperCase()}</span>{u.name.split(' ')[0]}</span> : null;
  }
  if (prop.type === 'checkbox') return value ? <span className="text-[var(--notion-text-muted)]">✓ {prop.name}</span> : null;
  if (prop.type === 'date') return <span className="text-[var(--notion-text-muted)]">{String(value).split('-').reverse().slice(0, 2).join('/')}</span>;
  return <span className="text-[var(--notion-text-muted)] truncate max-w-full">{displayValue(prop, value, users)}</span>;
}
