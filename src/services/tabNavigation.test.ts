import { describe, expect, it } from 'vitest';
import { DEFAULT_TAB, buildTabSearch, readTabFromSearch, resolveLearningTab } from './tabNavigation';

describe('tabNavigation', () => {
  it('lê a aba do ?view=', () => {
    expect(readTabFromSearch('?view=jornada')).toBe('jornada');
    expect(readTabFromSearch('?view=comunicacoes-fluxo')).toBe('comunicacoes-fluxo');
    expect(readTabFromSearch('?view=relatorio-seguros')).toBe('relatorio-seguros');
    expect(buildTabSearch('relatorio-seguros')).toBe('?view=relatorio-seguros');
    expect(readTabFromSearch('?view=relatorio')).toBe('relatorio');
    expect(readTabFromSearch('?view=launch')).toBe('launch');
  });

  it('mantém o ?view=learning do Loop de Memória', () => {
    expect(readTabFromSearch('?view=learning&section=vault&item=abc')).toBe('aprendizado-growth');
    expect(readTabFromSearch('?view=learning')).toBe('aprendizado-growth');
    expect(buildTabSearch('aprendizado-growth')).toBe('?view=learning');
  });

  it('cai na Operação (Visão Daily) sem view ou com view desconhecida', () => {
    expect(DEFAULT_TAB).toBe('operacao');
    expect(readTabFromSearch('')).toBe('operacao');
    expect(readTabFromSearch('?view=nao-existe')).toBe('operacao');
    expect(readTabFromSearch('?section=vault')).toBe('operacao');
  });

  it('Operação fica com a URL limpa e as outras abas com ?view=', () => {
    expect(buildTabSearch('operacao')).toBe('');
    expect(buildTabSearch('launch')).toBe('?view=launch');
    expect(buildTabSearch('relatorio')).toBe('?view=relatorio');
  });

  it('manda o Diário de Bordo, que saiu do app, para a Operação', () => {
    expect(readTabFromSearch('?view=diario')).toBe('operacao');
    expect(resolveLearningTab('diario', '')).toBe('operacao');
  });

  it('deixa a seção decidir entre Operação e Loop de Memória', () => {
    expect(readTabFromSearch('?view=learning&section=daily')).toBe('operacao');
    expect(readTabFromSearch('?view=learning&section=feed&item=x')).toBe('operacao');
    expect(readTabFromSearch('?view=operacao&section=structure')).toBe('operacao');
    expect(readTabFromSearch('?view=operacao&section=bets')).toBe('aprendizado-growth');
    expect(resolveLearningTab('aprendizado-growth', '?view=learning&section=investigations')).toBe('operacao');
    expect(resolveLearningTab('aprendizado-growth', '?view=launch')).toBe('aprendizado-growth');
    expect(resolveLearningTab('launch', '?view=learning&section=daily')).toBe('launch');
  });
});
