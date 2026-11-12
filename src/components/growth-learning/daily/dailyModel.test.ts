import { describe, expect, it } from 'vitest';
import {
  addDays, clusterByProject, crmForDay, emptyDailyFilters, entryVisible, groupEntries, initials, monthGrid, nextWorkday, packWeek,
  prevWorkday, projectMonthStats, recentProjects, toggleIsolate, weekRange,
  type DailyEntry, type DailyPartner, type DailyProject,
} from './dailyModel';

const project = (id: string, frente = 're', partners: string[] = []): DailyProject => ({ id, name: 'Projeto ' + id, frente_key: frente, partner_keys: partners, wiki_note: '', initiative_id: null, merged_into: null, archived: false, revision: 1, created_at: '', updated_at: '' });
let seq = 0;
const entry = (day: string, projectId: string, extra: Partial<DailyEntry> = {}): DailyEntry => ({ id: 'e' + (seq++), day, project_id: projectId, body: 'Passo ' + projectId, tag_keys: [], responsible_id: null, follower_ids: [], position: seq, source: 'app', deleted_at: null, revision: 1, created_at: '2026-11-01T00:00:00Z', updated_at: '', ...extra });

describe('datas', () => {
  it('soma dias, acha semana e dias úteis', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(weekRange('2026-11-11')).toEqual(['2026-11-08', '2026-11-14']);
    expect(nextWorkday('2026-11-13')).toBe('2026-11-16');
    expect(prevWorkday('2026-11-16')).toBe('2026-11-13');
  });
  it('monta a grade do mês em semanas completas', () => {
    const g = monthGrid(2026, 11);
    expect(g[0][0]).toBe('2026-11-01');
    expect(g).toHaveLength(5);
    expect(g.every(w => w.length === 7)).toBe(true);
    expect(g[4][1]).toBe('2026-11-30');
    expect(monthGrid(2026, 10)[0][0]).toBe('2026-09-27');
  });
  it('gera iniciais', () => { expect(initials('Pablo Prado')).toBe('PP'); expect(initials('Ana')).toBe('AN'); expect(initials('  ')).toBe('?'); });
});

describe('empacotamento da semana', () => {
  it('reaproveita a linha quando o projeto anterior terminou', () => {
    const rows = packWeek([[], ['a'], ['a', 'b', 'c'], ['d', 'e', 'f', 'g'], [], ['b'], []]);
    expect(rows.length).toBe(5);
    expect(rows.flat().sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const rowOf = (p: string) => rows.findIndex(r => r.includes(p));
    expect(rowOf('a')).toBe(rowOf('d'));
  });
  it('projeto com dias salteados ocupa a linha inteira do intervalo', () => {
    const rows = packWeek([['x'], [], ['x'], ['y'], [], [], []]);
    expect(rows).toEqual([['x', 'y']]);
    expect(packWeek([['x', 'y'], [], ['x'], [], [], [], []])).toHaveLength(2);
  });
});

describe('filtros e visões', () => {
  const projects = new Map([['p1', project('p1', 're', ['plurix'])], ['p2', project('p2', 'aq', ['dia'])]]);
  const ctx = (over: Partial<Parameters<typeof entryVisible>[1]> = {}) => ({ projects, filters: emptyDailyFilters(), view: 'all' as const, today: '2026-11-11', me: 'u1', ...over });
  it('filtra por frente, parceiro, pessoa, tag e busca', () => {
    const e = entry('2026-11-11', 'p1', { tag_keys: ['ti'], follower_ids: ['u2'], body: 'Validar LP' });
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), frentes: ['aq'] } }))).toBe(false);
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), partners: ['plurix'] } }))).toBe(true);
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), people: ['u2'] } }))).toBe(true);
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), tags: ['urg'] } }))).toBe(false);
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), q: 'projeto P1' } }))).toBe(true);
    expect(entryVisible(e, ctx({ filters: { ...emptyDailyFilters(), q: 'lp' } }))).toBe(true);
  });
  it('visões hoje, semana e que eu acompanho', () => {
    const e = entry('2026-11-09', 'p2', { responsible_id: 'u1' });
    expect(entryVisible(e, ctx({ view: 'today' }))).toBe(false);
    expect(entryVisible(e, ctx({ view: 'today' }), true)).toBe(true);
    expect(entryVisible(e, ctx({ view: 'week' }))).toBe(true);
    expect(entryVisible(e, ctx({ view: 'mine', me: 'u9' }))).toBe(false);
  });
  it('clique isola e shift soma', () => {
    expect(toggleIsolate([], 'a', false)).toEqual(['a']);
    expect(toggleIsolate(['a'], 'a', false)).toEqual([]);
    expect(toggleIsolate(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(toggleIsolate(['a', 'b'], 'b', true)).toEqual(['a']);
  });
});

describe('cartões CRM do dia', () => {
  const partners: DailyPartner[] = [{ key: 'plurix', name: 'Plurix', color: '#000000', crm_key: 'Plurix', position: 1, archived: false, revision: 1 }, { key: 'star', name: 'Star', color: '#000000', crm_key: null, position: 2, archived: false, revision: 1 }];
  const cells = [{ day: 'd', partner: 'Plurix', cards: 10, proposals: 0 }, { day: 'd', partner: 'Serasa', cards: 5, proposals: 0 }];
  it('soma tudo ou só os parceiros com dado CRM', () => {
    expect(crmForDay(cells, partners, [])).toBe(15);
    expect(crmForDay(cells, partners, ['plurix'])).toBe(10);
    expect(crmForDay(cells, partners, ['star'])).toBeNull();
    expect(crmForDay([], partners, [])).toBeNull();
  });
});

describe('agrupamento da lista', () => {
  const projects = new Map([['p1', project('p1', 're')], ['p2', project('p2', 'aq')]]);
  const list = [entry('2026-11-10', 'p1'), entry('2026-11-11', 'p2'), entry('2026-11-11', 'p1'), entry('2026-11-11', 'p2')];
  it('por dia, do mais recente', () => {
    const g = groupEntries(list, 'day', 'desc', projects, ['aq', 're']);
    expect(g.map(x => x.key)).toEqual(['2026-11-11', '2026-11-10']);
    expect(clusterByProject(g[0].entries).map(c => c[0].project_id)).toEqual(['p2', 'p1']);
    expect(groupEntries(list, 'day', 'asc', projects, [])[0].key).toBe('2026-11-10');
  });
  it('por projeto e por frente', () => {
    const g = groupEntries(list, 'project', 'asc', projects, []);
    expect(g.find(x => x.key === 'p1')!.entries.map(e => e.day)).toEqual(['2026-11-10', '2026-11-11']);
    expect(groupEntries(list, 'frente', 'desc', projects, ['aq', 're']).map(x => x.key)).toEqual(['aq', 're']);
  });
  it('sugere projetos dos últimos dias úteis e resume o mês', () => {
    const l = [entry('2026-11-13', 'p1'), entry('2026-11-12', 'p2'), entry('2026-11-08', 'p2')];
    expect(recentProjects(l, '2026-11-16')).toEqual(['p1', 'p2']);
    expect(projectMonthStats(l, '2026-11')[0]).toEqual({ projectId: 'p2', days: 2, last: '2026-11-12' });
  });
});
