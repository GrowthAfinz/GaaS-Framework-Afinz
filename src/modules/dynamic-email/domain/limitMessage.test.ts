import { describe, expect, it } from 'vitest';
import { formatLimitValue, limitInputState, normalizeLimitInput, renderLimitMessage, validateLimitMessage, LIMIT_MESSAGE_MAX } from './limitMessage';

const E1 = 'Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.';
const E2 = 'Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo.';

describe('faixa de limite com texto do briefing', () => {
  it('troca nome e limite formatado em moeda brasileira', () => {
    expect(renderLimitMessage(E1, 'Vania', '3500')).toBe('Parabéns, Vania! Você tem R$ 3.500,00 de limite pré-aprovado no cartão +amigo.');
    expect(renderLimitMessage(E2, 'Vania', '1500.5')).toBe('Boa notícia, Vania: você tem R$ 1.500,50 de limite pré-aprovado para pedir seu cartão +amigo.');
  });

  it('nome vazio vira "cliente", sem vírgula solta', () => {
    expect(renderLimitMessage(E1, '  ', '3500')).toBe('Parabéns, cliente! Você tem R$ 3.500,00 de limite pré-aprovado no cartão +amigo.');
  });

  it.each([['', 'ausente'], ['0', 'zero'], ['0.00', 'zero'], ['R$ 3.500', 'inválido'], ['3.500,00', 'inválido'], ['abc', 'inválido']])('limite %s (%s) não mostra faixa', (limit) => {
    expect(renderLimitMessage(E1, 'Vania', limit)).toBe('');
  });

  it('mensagem vazia não recebe texto fixo', () => {
    expect(renderLimitMessage('', 'Vania', '3500')).toBe('');
    expect(renderLimitMessage('   ', 'Vania', '3500')).toBe('');
  });

  it('marcador desconhecido some com a faixa em vez de vazar', () => {
    expect(renderLimitMessage('Olá {{cpf}}, R$ {{limite}}', 'Vania', '3500')).toBe('');
  });

  it('classifica a entrada de teste conforme o contrato numérico', () => {
    expect(limitInputState('')).toBe('absent');
    expect(limitInputState('0')).toBe('zero');
    expect(limitInputState('3500')).toBe('positive');
    expect(limitInputState('R$ 3.500')).toBe('invalid');
    expect(formatLimitValue('3500')).toBe('3.500,00');
  });

  it('normaliza o que a pessoa digita na prévia', () => {
    expect(normalizeLimitInput('R$ 3.500')).toBe('3500');
    expect(normalizeLimitInput('3.500,50')).toBe('3500.50');
    expect(normalizeLimitInput('1500,5')).toBe('1500.5');
    expect(normalizeLimitInput('1500.50')).toBe('1500.50');
    expect(normalizeLimitInput('')).toBe('');
  });
});

describe('validação da mensagem', () => {
  const codes = (text: string) => validateLimitMessage(text).map((issue) => `${issue.severity}:${issue.code}`);

  it('aceita os exemplos aprovados sem erro', () => {
    expect(codes(E1)).toEqual([]);
    expect(codes(E2)).toEqual([]);
    expect(codes('')).toEqual([]);
  });

  it('rejeita marcador desconhecido ou fora do padrão', () => {
    expect(codes('Olá {{cpf}} R$ {{limite}}')).toContain('error:limit-marker-unknown');
    expect(codes('Olá {{Nome}} R$ {{limite}}')).toContain('error:limit-marker-unknown');
    expect(codes('Olá {{ nome }} R$ {{limite}}')).toContain('error:limit-marker-unknown');
  });

  it('rejeita chave sem par, AMPscript e HTML fora da lista', () => {
    expect(codes('Olá {{nome R$ {{limite}}')).toContain('error:limit-marker-broken');
    expect(codes('Olá %%=v(@FirstName)=%% R$ {{limite}}')).toContain('error:limit-ampscript');
    expect(codes('<a href="x">R$ {{limite}}</a>')).toContain('error:limit-html');
    expect(codes('<b>R$ {{limite}}</b><br>')).toEqual([]);
  });

  it('limita o tamanho ao da coluna da DE', () => {
    expect(codes(`R$ {{limite}} ${'a'.repeat(LIMIT_MESSAGE_MAX)}`)).toContain('error:limit-length');
  });

  it('avisa quando falta o valor ou há promessa de aprovação', () => {
    expect(codes('Parabéns, {{nome}}!')).toContain('warning:limit-without-value');
    expect(codes('R$ {{limite}} com aprovação garantida')).toContain('warning:limit-promise');
  });
});
