import { describe, expect, it } from 'vitest';
import type { VaultNoteSummary } from './vaultTypes';
import { orderStrategies } from './strategy/WikiStrategiesIndex';
import { buildWikiSearchUrl, formatWikiUpdatedOn, groupWikiSearchResults, matchesWikiQuery, sortWikiNotesByRecent, wikiNoteKind, wikiNoteUpdatedOn } from './wikiSearch';

const note = (title: string, relative_path: string, extra: Partial<VaultNoteSummary> = {}): VaultNoteSummary => ({
  id: title, title, relative_path, folder: relative_path.split('/').slice(0, -1).join('/'), tags: [],
  note_type: null, layer: null, status: null, source: null, source_modified_at: null,
  indexed_at: '2026-11-01T00:00:00Z', rank: 0, total_count: 0, ...extra,
});

describe('wiki search', () => {
  it('puts strategies first and subjects and notes together, each newest first', () => {
    const groups = groupWikiSearchResults([
      note('Nota velha', '04-Operacao/Velha.md', { updated_on: '2026-06-10' }),
      note('Assunto novo', '07-Evolucao/Assunto.md', { updated_on: '2026-11-08', tags: ['growth-assunto'] }),
      note('Estratégia velha', '05-Estrategia/Velha.md', { updated_on: '2026-08-01' }),
      note('Estratégia nova', '05-Estrategia/Nova.md', { updated_on: '2026-11-09' }),
    ]);
    expect(groups.map(group => group.label)).toEqual(['Estratégias', 'Assuntos e notas']);
    expect(groups[0].items.map(item => item.title)).toEqual(['Estratégia nova', 'Estratégia velha']);
    expect(groups[1].items.map(item => item.title)).toEqual(['Assunto novo', 'Nota velha']);
  });

  it('uses the curated date, falls back to the file date and sends undated notes last', () => {
    const sorted = sortWikiNotesByRecent([
      note('Sem data', 'a/Sem.md'),
      note('Pelo arquivo', 'a/Arquivo.md', { source_modified_at: '2026-10-01T12:00:00Z' }),
      note('Curada', 'a/Curada.md', { updated_on: '2026-10-05', source_modified_at: '2026-01-01T00:00:00Z' }),
    ]);
    expect(sorted.map(item => item.title)).toEqual(['Curada', 'Pelo arquivo', 'Sem data']);
    expect(wikiNoteUpdatedOn(sorted[1])).toBe('2026-10-01');
  });

  it('breaks date ties by relevance, then title', () => {
    const sorted = sortWikiNotesByRecent([
      note('B', 'a/B.md', { updated_on: '2026-11-01', rank: 0.1 }),
      note('A', 'a/A.md', { updated_on: '2026-11-01', rank: 0.1 }),
      note('C', 'a/C.md', { updated_on: '2026-11-01', rank: 0.9 }),
    ]);
    expect(sorted.map(item => item.title)).toEqual(['C', 'A', 'B']);
  });

  it('classifies by the server kind or by the strategy folder', () => {
    expect(wikiNoteKind({ relative_path: '05-Estrategia/X.md' })).toBe('estrategia');
    expect(wikiNoteKind({ relative_path: '04-Operacao/X.md' })).toBe('nota');
    expect(wikiNoteKind({ relative_path: '04-Operacao/X.md', kind: 'estrategia' })).toBe('estrategia');
  });

  it('formats the date for the list', () => {
    expect(formatWikiUpdatedOn('2026-11-05')).toBe('Atualizada em 05/11/2026');
    expect(formatWikiUpdatedOn(null)).toBe('Sem data de atualização');
  });

  it('builds the Wiki URL from anywhere, dropping the previous Wiki state', () => {
    const fromWiki = new URLSearchParams(buildWikiSearchUrl('?view=learning&section=vault&wiki_view=notes&wiki_q=velho&wiki_topic=strategies&bu=B2C', 'note-1').slice(1));
    expect(fromWiki.get('section')).toBe('vault');
    expect(fromWiki.get('item')).toBe('note-1');
    expect(fromWiki.get('wiki_view')).toBeNull();
    expect(fromWiki.get('wiki_q')).toBeNull();
    expect(fromWiki.get('wiki_topic')).toBeNull();
    const list = new URLSearchParams(buildWikiSearchUrl('?view=launch', null, ' pool visa ').slice(1));
    expect(list.get('view')).toBe('learning');
    expect(list.get('item')).toBeNull();
    expect(list.get('wiki_q')).toBe('pool visa');
    expect(list.get('wiki_browse')).toBe('1');
  });

  it('keeps featured strategies on top and the rest newest first', () => {
    const ordered = orderStrategies([
      note('Velha', '05-Estrategia/Velha.md', { updated_on: '2026-06-01' }),
      note('Seguros', '05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md', { updated_on: '2026-01-01' }),
      note('Nova', '05-Estrategia/Nova.md', { updated_on: '2026-11-09' }),
      note('Fora', '04-Operacao/Fora.md', { updated_on: '2026-11-09' }),
    ], '');
    expect(ordered.map(item => item.title)).toEqual(['Seguros', 'Nova', 'Velha']);
    expect(orderStrategies(ordered, 'segmentacao').map(item => item.title)).toEqual(['Seguros']);
  });

  it('matches word prefixes ignoring accents and case', () => {
    const visa = note('Estratégia Pool de Ofertas Visa', '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md');
    expect(matchesWikiQuery(visa, 'estrategia')).toBe(true);
    expect(matchesWikiQuery(visa, 'ESTRAT vis')).toBe(true);
    expect(matchesWikiQuery(visa, 'seguros')).toBe(false);
    expect(matchesWikiQuery(visa, '')).toBe(true);
  });
});
