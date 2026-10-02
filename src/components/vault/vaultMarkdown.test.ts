import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { describe, expect, it } from 'vitest';
import { rewriteWikilinksForReader } from './vaultParser';
import { vaultUrlTransform } from './vaultMarkdown';

describe('Vault Markdown URL handling', () => {
  it('preserves the internal wikilink href through the actual Markdown renderer', () => {
    const markdown = rewriteWikilinksForReader('[[05-Estrategia/Briefing-e-Regua-de-Aquisicao#Operação|Próximo passo]]');
    const html = renderToStaticMarkup(createElement(ReactMarkdown, {
      urlTransform: vaultUrlTransform,
      children: markdown,
    }));
    expect(html).toContain('href="vault:05-Estrategia%2FBriefing-e-Regua-de-Aquisicao%23Opera%C3%A7%C3%A3o"');
    expect(html).toContain('Próximo passo</a>');
  });

  it('keeps external HTTPS links and filters unsafe links and image sources', () => {
    const html = renderToStaticMarkup(createElement(ReactMarkdown, {
      urlTransform: vaultUrlTransform,
      children: '[Fonte](https://afinz.com.br/) [Unsafe](javascript:alert%281%29) ![Image](vault:Nota)',
    }));
    expect(html).toContain('href="https://afinz.com.br/"');
    expect(html).toContain('href="">Unsafe</a>');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('src="vault:');
  });
});
