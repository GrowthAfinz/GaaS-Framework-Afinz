import { describe, expect, it } from 'vitest';
import { plural, withUnit } from './ledgerFormat';

describe('ledgerFormat', () => {
  it('concorda a unidade com 1', () => {
    expect(withUnit(1, 'dias')).toBe('1 dia');
    expect(withUnit('9', 'dias')).toBe('9 dias');
    expect(withUnit(1, 'cartões')).toBe('1 cartão');
    expect(withUnit(1, 'reais')).toBe('1 real');
    expect(withUnit(2.5, '%')).toBe('2.5 %');
    expect(withUnit(3, null)).toBe('3');
  });
  it('plural simples', () => {
    expect(plural(1, 'aposta', 'apostas')).toBe('1 aposta');
    expect(plural(0, 'aposta', 'apostas')).toBe('0 apostas');
  });
});

import { attentionSentence, ledgerDate } from './ledgerFormat';
describe('ledgerDate e attentionSentence', () => {
  it('formata data pura sem fuso', () => {
    expect(ledgerDate('2026-09-30')).toBe('30 set 2026');
    expect(ledgerDate(null)).toBe('');
  });
  it('fala de um item direto e de vários no plural', () => {
    expect(attentionSentence(1, ['está sem responsável', 'passou do prazo'], [])).toBe('Ela está sem responsável e passou do prazo.');
    expect(attentionSentence(3, [], ['2 estão sem responsável'])).toBe('Delas, 2 estão sem responsável.');
    expect(attentionSentence(1, [], [])).toBe('');
  });
});
