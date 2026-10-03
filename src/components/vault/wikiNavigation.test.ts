import { describe, expect, it } from 'vitest';
import { prepareWikiMarkdown, resolveWikiTarget, wikiHeadingId, WIKI_TOPICS } from './wikiNavigation';
import { VaultNoteSummary } from './vaultTypes';

const notes = [
  { id: 'a', relative_path: '01-Conceitos/Segmentos.md', title: 'Segmentos' },
  { id: 'b', relative_path: '03-Dimensoes/Segmentos.md', title: 'Segmentos' },
  { id: 'c', relative_path: '04-Operacao/Servico-Emails-Dinamicos.md', title: 'E-mails dinâmicos' },
] as VaultNoteSummary[];

describe('Wiki navigation contracts', () => {
  it('opens Results as a canonical Wiki topic without confusing the older screen note', () => {
    const topic=WIKI_TOPICS.find(topic=>topic.title==='Resultados')!;
    const catalog=[{id:'screen',relative_path:'04-Operacao/Resultados.md'},{id:'topic',relative_path:'07-Evolucao/Resultados-Evolucao-e-Retrospectivas.md'}] as VaultNoteSummary[];
    expect(resolveWikiTarget(catalog,topic.target).map(note=>note.id)).toEqual(['topic']);
  });
  it('prefers an exact path, then a sibling; exposes ambiguous filenames', () => {
    expect(resolveWikiTarget(notes, '03-Dimensoes/Segmentos')[0].id).toBe('b');
    expect(resolveWikiTarget(notes, 'Segmentos', '01-Conceitos/Inicio.md')[0].id).toBe('a');
    expect(resolveWikiTarget(notes, 'Segmentos')).toHaveLength(2);
    expect(resolveWikiTarget(notes, '99/Segmentos')).toEqual([]);
    expect(resolveWikiTarget(notes, '../03-Dimensoes/Segmentos.md', '01-Conceitos/Inicio.md')[0].id).toBe('b');
    expect(resolveWikiTarget(notes, 'Servico-Emails-Dinamicos')[0].id).toBe('c');
  });

  it('removes only the leading title and gives repeated headings unique anchors', () => {
    const result = prepareWikiMarkdown('# Título\n\n## Operação\nConteúdo\n## Operação\n```md\n## Exemplo de código\n```\n');
    expect(result.content).not.toContain('# Título');
    expect(result.content).toContain('Conteúdo');
    expect(result.headings.map(item => item.id)).toEqual(['operacao', 'operacao-1']);
    expect(result.headings[0].line).toBe(2);
    expect(wikiHeadingId('Elegibilidade e restrições')).toBe('elegibilidade-e-restricoes');
  });
});
