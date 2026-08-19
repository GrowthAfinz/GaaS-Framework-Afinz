import { describe, expect, it } from 'vitest';
import { BRIEFING_COLUMNS, emptyBriefingRow, exportBriefingCsv, parseBriefingCsv, validateRows } from './briefing';

describe('briefing SFMC', () => {
  it('exporta com ponto e vírgula, data SFMC e sem newline cru', () => {
    const row = emptyBriefingRow('one');
    Object.assign(row, { DT_INICIO: '2026-08-10T00:00', DT_FIM: '2026-08-31T23:59', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'PLURIX', TP_CAMPANHA: 'Aquisição', SEQUENCIA: 'E-mail 1', COPY_1_PRETO: 'Oi, pessoa\nTudo bem?' });
    const csv = exportBriefingCsv([row]);
    expect(csv.split('\r\n')[0].split(';')).toHaveLength(BRIEFING_COLUMNS.length);
    expect(csv.split('\r\n')[0].split(',')).toHaveLength(1);
    expect(csv).toContain('08/31/2026 23:59:00');
    expect(csv).toContain('Oi, pessoa<br>Tudo bem?');
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(parseBriefingCsv(csv).rows).toHaveLength(1);
  });

  it('bloqueia schema incompleto e chave duplicada', () => {
    const incomplete = parseBriefingCsv('DT_INICIO,DT_FIM\n2026-01-01,2026-01-02');
    expect(incomplete.rows).toHaveLength(0);
    expect(incomplete.errors[0]).toContain('Colunas ausentes');
    const a = emptyBriefingRow('a'); const b = emptyBriefingRow('b');
    for (const row of [a, b]) Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', TP_CAMPANHA: 'T', SEQUENCIA: 'S' });
    expect(validateRows([a, b]).get('a')?.some((issue) => issue.code === 'duplicate-key')).toBe(true);
  });

  it('mantém exatamente as 36 colunas governadas', () => expect(BRIEFING_COLUMNS).toHaveLength(36));

  it('bloqueia imagem local, base64 ou URL sem HTTPS', () => {
    const row = emptyBriefingRow('image');
    Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', HEADER: 'data:image/png;base64,abc' });
    expect(validateRows([row]).get('image')?.some((issue) => issue.code === 'image-url' && issue.field === 'HEADER')).toBe(true);
    row.HEADER = 'https://image.s11.sfmc-content.com/lib/example.jpg';
    expect(validateRows([row]).get('image')?.some((issue) => issue.code === 'image-url')).toBe(false);
  });
});
