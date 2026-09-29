import { describe, expect, it } from 'vitest';
import { parseVaultFiles, parseVaultMarkdown, rewriteWikilinksForReader } from './vaultParser';

describe('Vault parser contract', () => {
  it('preserves frontmatter, path identity and wikilinks', async () => {
    const note = await parseVaultMarkdown({
      relativePath: '05-Estrategia\\Plano.md',
      lastModified: Date.UTC(2026, 8, 28),
      text: `---
title: Plano Vivo
tags: [growth, mídia]
aliases: [Plano de mídia]
camada: estrategia
status: ativo
---
# Título ignorado

Conecta com [[03-Dimensoes/Segmentos#B2C|segmentos prioritários]].`,
    });

    expect(note.relative_path).toBe('05-Estrategia/Plano.md');
    expect(note.title).toBe('Plano Vivo');
    expect(note.tags).toEqual(['growth', 'mídia']);
    expect(note.aliases).toEqual(['Plano de mídia']);
    expect(note.layer).toBe('estrategia');
    expect(note.links[0]).toMatchObject({
      target_path: '03-Dimensoes/Segmentos',
      fragment: 'B2C',
      display_text: 'segmentos prioritários',
    });
    expect(note.content_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('ignores Obsidian internals and templates', async () => {
    const notes = await parseVaultFiles([
      { relativePath: '.obsidian/config.md', text: '# Config', lastModified: 1 },
      { relativePath: '99-Templates/Nota.md', text: '# Template', lastModified: 1 },
      { relativePath: '01-Governanca/Fonte.md', text: '# Fonte', lastModified: 1 },
      { relativePath: 'asset.json', text: '{}', lastModified: 1 },
    ]);
    expect(notes.map((note) => note.relative_path)).toEqual(['01-Governanca/Fonte.md']);
  });

  it('rewrites wikilinks into reader-safe internal links', () => {
    expect(rewriteWikilinksForReader('---\ntags: [oculta]\n---\nVeja [[Nota#Seção|este conceito]].'))
      .toBe('Veja [este conceito](vault:Nota%23Se%C3%A7%C3%A3o).');
  });
});
