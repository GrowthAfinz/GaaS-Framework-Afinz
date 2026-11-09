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
    expect(doc).toContain('Até 5.000 mensagens');
    expect(doc).toContain('Até 100.000 SMS');
    expect(doc).toContain('mesma política e probabilidade a SEG-A e SEG-B');
    const parts = splitWikiSections(doc);
    expect(parts.filter(p => p.title).length).toBeGreaterThanOrEqual(20);
    expect(parts.some(p => p.content.includes('Q_VDV_08_POOL') && p.content.includes('```sql'))).toBe(true);
    expect(doc).toContain('LP personalizada da rodada');
    expect(doc.match(/```mermaid/g)).toHaveLength(3);
  });
});
