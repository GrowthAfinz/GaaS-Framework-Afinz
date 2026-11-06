import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { splitWikiSections, WikiMarkdownSections } from './WikiMarkdownSections';
import { WikiCodeBlock } from './WikiDiagram';

describe('Wiki strategy documents', () => {
  it('keeps code fences opaque and preserves absolute heading offsets in collapsible sections', () => {
    const parts = splitWikiSections('Intro\n:::details Contrato\n### DE\n```sql\n:::details SQL literal\n```\n::: \nFim');
    expect(parts).toHaveLength(3);
    expect(parts[1].title).toBe('Contrato');
    expect(parts[1].offset).toBe(2);
    expect(parts[1].content).toContain(':::details SQL literal');
    expect(parts[2].content).toBe('Fim');
  });
  it('renders Mermaid as a diagram surface and keeps SQL as code', () => {
    const html = renderToStaticMarkup(<ReactMarkdown components={{ pre: WikiCodeBlock }}>{'```mermaid\nflowchart TD\nA-->B\n```\n\n```sql\nSELECT 1\n```'}</ReactMarkdown>);
    expect(html).toContain('Ampliar fluxo');
    expect(html).toContain('SELECT 1');
    expect(html).not.toContain('flowchart TD</code>');
  });
  it('exposes expand controls without enabling raw HTML from notes', () => {
    const html = renderToStaticMarkup(<WikiMarkdownSections content={':::details DE\n### Campos\n<script>alert(1)</script>\n:::'} render={c => <ReactMarkdown>{c}</ReactMarkdown>} />);
    expect(html).toContain('Expandir tudo');
    expect(html).toContain('data-wiki-section');
    expect(html).not.toContain('<script>');
  });
  it('ships the approved Visa title, current limits, proposals and complete expandable references', () => {
    const doc = readFileSync(new URL('../../../docs/wiki-vault/05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md', import.meta.url), 'utf8');
    expect(doc).toContain('title: Estratégia Pool de Ofertas Visa');
    expect(doc).toContain('3 a 5 dias');
    expect(doc).toContain('4 cards estão em avaliação');
    expect(doc).toContain('`GRUPO_2` não está vigente');
    const parts = splitWikiSections(doc);
    expect(parts.filter(p => p.title)).toHaveLength(20);
    expect(parts.some(p => p.content.includes('Q_VDV_08_VITRINE') && p.content.includes('```sql'))).toBe(true);
    expect(doc).toContain('Contrato vigente da Fábrica: `VERSAO, GRUPO, CELULA, POSICAO, OFERTA_ID, ATIVA`');
    expect(doc.match(/```mermaid/g)).toHaveLength(3);
  });
});
