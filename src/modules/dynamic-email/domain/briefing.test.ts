import { describe, expect, it } from 'vitest';
import { BRIEFING_COLUMNS, emptyBriefingRow, exportBriefingCsv, parseBriefingCsv, toDateInput, validateRows } from './briefing';

describe('briefing SFMC', () => {
  it('exporta no contrato aceito pelo importador SFMC: vírgula, MM/DD, CRLF e quote mínimo', () => {
    const row = emptyBriefingRow('one');
    Object.assign(row, { DT_INICIO: '2026-08-10T00:00', DT_FIM: '2026-08-31T23:59', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'PLURIX', TP_CAMPANHA: 'Aquisição', SEQUENCIA: 'E-mail 1', COPY_1_PRETO: 'Oi, pessoa\nTudo bem?' });
    const csv = exportBriefingCsv([row]);
    expect(csv.split('\r\n')[0].split(',')).toHaveLength(BRIEFING_COLUMNS.length);
    expect(csv.split('\r\n')[0].split(';')).toHaveLength(1);
    expect(csv).toContain('08/31/2026 23:59:00');
    expect(csv).toContain('"Oi, pessoa<br>Tudo bem?"');
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(parseBriefingCsv(csv).rows).toHaveLength(1);
  });

  it('interpreta datas ambíguas baixadas do SFMC como DD/MM e preserva legado MM/DD inequívoco', () => {
    expect(toDateInput('01/10/2028 23:59:00')).toBe('2028-10-01T23:59');
    expect(toDateInput('12/31/2026 23:59:00')).toBe('2026-12-31T23:59');
  });

  it('bloqueia schema incompleto e chave duplicada', () => {
    const incomplete = parseBriefingCsv('DT_INICIO,DT_FIM\n2026-01-01,2026-01-02');
    expect(incomplete.rows).toHaveLength(0);
    expect(incomplete.errors[0]).toContain('Colunas ausentes');
    const a = emptyBriefingRow('a'); const b = emptyBriefingRow('b');
    for (const row of [a, b]) Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', TP_CAMPANHA: 'T', SEQUENCIA: 'S' });
    expect(validateRows([a, b]).get('a')?.some((issue) => issue.code === 'duplicate-key')).toBe(true);
  });

  it('mantém exatamente as 37 colunas governadas, com MENSAGEM_LIMITE no fim', () => { expect(BRIEFING_COLUMNS).toHaveLength(37); expect(BRIEFING_COLUMNS[BRIEFING_COLUMNS.length - 1]).toBe('MENSAGEM_LIMITE'); });

  it('bloqueia imagem local, base64 ou URL sem HTTPS', () => {
    const row = emptyBriefingRow('image');
    Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', HEADER: 'data:image/png;base64,abc' });
    expect(validateRows([row]).get('image')?.some((issue) => issue.code === 'image-url' && issue.field === 'HEADER')).toBe(true);
    row.HEADER = 'https://image.s11.sfmc-content.com/lib/example.jpg';
    expect(validateRows([row]).get('image')?.some((issue) => issue.code === 'image-url')).toBe(false);
  });

  it('aceita código de header dinâmico com aviso, sem bloquear a exportação', () => {
    const row = emptyBriefingRow('00000000-0000-4000-8000-000000000011');
    Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', HEADER: 'HDR_PECA_V1' });
    const issues = validateRows([row]).get('00000000-0000-4000-8000-000000000011') ?? [];
    expect(issues.some((issue) => issue.code === 'image-url')).toBe(false);
    expect(issues.find((issue) => issue.code === 'header-variant')?.severity).toBe('warning');
    row.HEADER = 'peca seu cartao';
    expect(validateRows([row]).get('00000000-0000-4000-8000-000000000011')?.some((issue) => issue.code === 'image-url')).toBe(true);
  });

  it('faz round-trip do CSV de 37 colunas com aspas, vírgulas, datas e a mensagem de limite', () => {
    const row = emptyBriefingRow('00000000-0000-4000-8000-0000000000a1');
    Object.assign(row, {
      DT_INICIO: '2026-08-17T00:00', DT_FIM: '2028-10-01T23:59', UTM_CAMPANHA: 'PLURIX_CRM_SEMANA1_EMAIL1_AMIGAO', NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'CRM', SEQUENCIA: 'E-mail 1',
      ASSUNTO: 'O "Amigão" tem, sim, um cartão', COPY_2_PRETO: '<b>•   +5%</b>, em carnes',
      MENSAGEM_LIMITE: 'Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.',
    });
    const csv = exportBriefingCsv([row]);
    expect(csv.split('\r\n')[0].split(',')).toHaveLength(37);
    expect(csv.split('\r\n')[0].endsWith(',RODAPE,MENSAGEM_LIMITE')).toBe(true);
    const back = parseBriefingCsv(csv);
    expect(back.errors).toEqual([]);
    const parsed = back.rows[0];
    for (const column of BRIEFING_COLUMNS.filter((c) => !c.startsWith('DT_'))) expect(parsed[column]).toBe(row[column]);
    // Datas: o CSV sai em MM/DD (formato aceito pelo importador do SFMC) e o SFMC devolve
    // o download em DD/MM. O round-trip real é GaaS → SFMC → download → GaaS.
    expect(csv).toContain('08/17/2026 00:00:00');
    expect(csv).toContain('10/01/2028 23:59:00');
    const sfmcDownload = (mmdd: string) => mmdd.replace(/^(\d{2})\/(\d{2})\//, '$2/$1/');
    expect(toDateInput(sfmcDownload(parsed.DT_INICIO))).toBe('2026-08-17T00:00');
    expect(toDateInput(sfmcDownload(parsed.DT_FIM))).toBe('2028-10-01T23:59');
  });

  it('aceita CSV antigo de 36 colunas com MENSAGEM_LIMITE vazio e avisa', () => {
    const row = emptyBriefingRow('00000000-0000-4000-8000-0000000000a2');
    Object.assign(row, { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P', TP_CAMPANHA: 'T', SEQUENCIA: 'S' });
    const legacy = exportBriefingCsv([row]).split('\r\n').map((line) => line.split(',').slice(0, 36).join(',')).join('\r\n');
    const parsed = parseBriefingCsv(legacy);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].MENSAGEM_LIMITE).toBe('');
    expect(parsed.errors.join(' ')).toContain('36 colunas');
  });

  it('a mesma chave do SFMC em réguas diferentes do GaaS vira aviso, não duplicidade', () => {
    const make = (id: `${string}-${string}-${string}-${string}-${string}`, segment: string) => Object.assign(emptyBriefingRow(id), {
      DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'CRM', SEQUENCIA: 'E-mail 1', __meta: { segment },
    });
    const issues = validateRows([make('0-0-0-0-crm', 'CRM'), make('0-0-0-0-crm3', 'CRM 3')]);
    expect(issues.get('0-0-0-0-crm3')?.some((issue) => issue.code === 'duplicate-key')).toBe(false);
    expect(issues.get('0-0-0-0-crm3')?.find((issue) => issue.code === 'shared-sfmc-key')?.message).toContain('CRM');
    const same = validateRows([make('0-0-0-0-a', 'CRM 3'), make('0-0-0-0-b', 'CRM 3')]);
    expect(same.get('0-0-0-0-a')?.some((issue) => issue.code === 'duplicate-key')).toBe(true);
  });

  it('valida a mensagem de limite e sinaliza nome repetido no corpo', () => {
    const row = Object.assign(emptyBriefingRow('00000000-0000-4000-8000-0000000000a3'), { DT_INICIO: '2026-01-01', DT_FIM: '2026-12-31', UTM_CAMPANHA: 'x', NM_PRODUTO_INTERNO: 'P',
      MENSAGEM_LIMITE: 'Oi {{cpf}}, R$ {{limite}}' });
    expect(validateRows([row]).get('00000000-0000-4000-8000-0000000000a3')?.find((issue) => issue.code === 'limit-marker-unknown')?.field).toBe('MENSAGEM_LIMITE');
    row.MENSAGEM_LIMITE = 'Parabéns, {{nome}}! R$ {{limite}}';
    row.COPY_1_PRETO = 'Olá, %%=v(@FirstName)=%%! O cartão chegou.';
    expect(validateRows([row]).get('00000000-0000-4000-8000-0000000000a3')?.some((issue) => issue.code === 'name-repeated')).toBe(true);
    row.COPY_1_PRETO = 'O cartão chegou.';
    expect(validateRows([row]).get('00000000-0000-4000-8000-0000000000a3')?.some((issue) => issue.code === 'name-repeated')).toBe(false);
  });
});
