import { describe, expect, it } from 'vitest';
import { buildTabSearch, readTabFromSearch } from './tabNavigation';

describe('tabNavigation', () => {
  it('lê a aba do ?view=', () => {
    expect(readTabFromSearch('?view=jornada')).toBe('jornada');
    expect(readTabFromSearch('?view=comunicacoes-fluxo')).toBe('comunicacoes-fluxo');
  });

  it('mantém o ?view=learning do Loop de Memória', () => {
    expect(readTabFromSearch('?view=learning&section=vault&item=abc')).toBe('aprendizado-growth');
    expect(buildTabSearch('aprendizado-growth')).toBe('?view=learning');
  });

  it('cai no Launch sem view ou com view desconhecida', () => {
    expect(readTabFromSearch('')).toBe('launch');
    expect(readTabFromSearch('?view=nao-existe')).toBe('launch');
    expect(readTabFromSearch('?section=vault')).toBe('launch');
  });

  it('Launch fica com a URL limpa e as outras abas com ?view=', () => {
    expect(buildTabSearch('launch')).toBe('');
    expect(buildTabSearch('relatorio')).toBe('?view=relatorio');
  });
});
