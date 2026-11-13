import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { VaultNote } from './vaultTypes';
import { WikiStrategyDocument } from './strategy/WikiStrategyDocument';

const note = (status: string, extra = '') => ({
  id: 'note-1',
  relative_path: '05-Estrategia/Teste.md',
  title: 'Estratégia Teste',
  folder: '05-Estrategia',
  status,
  content_hash: 'h1',
  frontmatter: {},
  tags: [],
  aliases: [],
  links: [],
  content_markdown: `---\ntitle: Estratégia Teste\n---\n# Estratégia Teste\n\nResumo.\n${extra}\n## Contexto\n\nTexto um.\n\n## Escopo\n\nTexto dois.\n`,
}) as unknown as VaultNote;

const never = () => new Promise<never>(() => {});

describe('Wiki strategy reading controls', () => {
  it('opens with every section collapsed and offers to expand them all', () => {
    const html = renderToStaticMarkup(<WikiStrategyDocument note={note('proposto')} loader={never} />);
    expect(html).toContain('Expandir seções');
    expect(html).not.toContain('Recolher seções');
    expect(html).toContain('aria-label="Abrir Contexto"');
    expect(html).toContain('aria-label="Abrir Escopo"');
    expect(html).not.toContain('aria-expanded="true"');
  });

  it('offers a download of the page as Markdown at the top', () => {
    const html = renderToStaticMarkup(<WikiStrategyDocument note={note('proposto')} loader={never} />);
    expect(html).toContain('Baixar .md');
  });

  it('does not repeat the document status next to a badge that already shows it', () => {
    const html = renderToStaticMarkup(<WikiStrategyDocument note={note('proposto')} loader={never} />);
    expect(html).toContain('>proposto</span>');
    expect(html).not.toContain('Estado documental');
  });

  it('keeps the document status visible when the badge shows the operation stage', () => {
    const html = renderToStaticMarkup(<WikiStrategyDocument note={note('proposto', '\n> **Estado da operação:** PREPARAÇÃO, SQLs a validar\n')} loader={never} />);
    expect(html).toContain('Em preparação');
    expect(html).toContain('Estado documental: proposto');
  });
});
