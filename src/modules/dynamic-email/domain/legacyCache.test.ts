import { describe, expect, it } from 'vitest';
import { emptyBriefingRow, validateRows, type BriefingRow } from './briefing';
import { normalizeLegacyRows, withMeta } from './workspace';

// Cópia em cache de antes da 37ª coluna: o objeto não tem MENSAGEM_LIMITE.
const cachedRow = () => {
  const row = withMeta(Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000000b1'), {
    DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'AMIGAO',
  }), { segment: 'CRM' }) as Partial<BriefingRow>;
  delete row.MENSAGEM_LIMITE;
  return JSON.parse(JSON.stringify(row)) as BriefingRow;
};

describe('cache local anterior à coluna MENSAGEM_LIMITE', () => {
  it('a validação não quebra com coluna ausente', () => {
    expect(() => validateRows([cachedRow()])).not.toThrow();
  });

  it('a carga do cache completa as colunas que faltam', () => {
    const [row] = normalizeLegacyRows([cachedRow()]);
    expect(row.MENSAGEM_LIMITE).toBe('');
    expect(row.__meta.segment).toBe('CRM');
  });
});
