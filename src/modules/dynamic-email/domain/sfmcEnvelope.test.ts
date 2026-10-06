import { describe, expect, it } from 'vitest';
import { v11Envelope } from './sfmcEnvelope';
import { PLURIX_V11_TEMPLATE } from '../fixtures/plurixV11Template';

describe('SFMC V11 envelope', () => {
  it('copies initialization before preheader and derives it from current editor source', () => {
    const edited = PLURIX_V11_TEMPLATE.replace('ESTADO_SEQUENCIA_CRM', 'ESTADO_SEQUENCIA_QA');
    const result = v11Envelope(edited)!;
    expect(result.subject).toBe('%%=TreatAsContent(@Assunto)=%%');
    expect(result.preheader).toContain('ESTADO_SEQUENCIA_QA');
    expect(result.preheader).toContain('IF EMPTY(@PLXV11Inicializado) THEN');
    expect(result.preheader.endsWith(']%%%%=TreatAsContent(@PreCabecalho)=%%')).toBe(true);
    expect(result.preheader).not.toContain('<html');
  });
  it('does not suggest V11 initialization for other templates', () => {
    expect(v11Envelope('%%[ SET @Assunto = "outro" ]%%')).toBeNull();
  });
  it('reports missing initialization instead of copying an incomplete preheader', () => {
    expect(v11Envelope('<!-- @PLXV11Inicializado -->')?.error).toBeTruthy();
    expect(v11Envelope('<!-- @PLXV11Inicializado -->')?.preheader).toBe('');
  });
});
