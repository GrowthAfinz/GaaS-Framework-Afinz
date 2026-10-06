import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expandImportPayload, importSourceFor, planImport, validateImportPayload, type ImportPayload } from './xlsxImport';

const field = (value: string, source = 'Briefing Fábrica!F10') => ({ value, origin: 'xlsx' as const, source });
const governed = (value: string) => ({ value, origin: 'governed' as const, source: 'dynamic_email_briefings 28de81ba v6' });

const base = (): ImportPayload => ({
  contract: 'fabrica-xlsx-import/1',
  status: 'draft',
  source: { file: 'Regua.xlsx', sheet: 'TOPO CRM 3', readAt: '2026-10-06T20:00:00-03:00', reader: 'claude-opus-5-5' },
  ruler: { name: 'TOPO DE FUNIL (CRM) 3', partner: 'Plurix', segment: 'CRM 3', tpCampanha: 'CRM', businessClassification: 'CRM', product: '+amigo', templateSlotId: 'builtin-plurix-v12' },
  touches: ['E-mail 1', 'E-mail 2'].map((sequence, index) => ({
    sequence,
    weekKey: 'Semana 1',
    shared: {
      DT_INICIO: governed('2026-08-17T00:00'), DT_FIM: governed('2028-10-01T23:59'),
      ASSUNTO: field(index ? 'Assunto E2' : 'Assunto E1'),
      COPY_1_PRETO: field('O cartão +amigo já está disponível.'),
      LINK_CTA_1: governed('https://mais-amigo.onelink.me/YU3C/t6v9cyos'),
      NOTA_LEGAL: governed('Consulte termos e condições.'),
      MENSAGEM_LIMITE: field(index ? 'Boa notícia, {{nome}}: R$ {{limite}}.' : 'Parabéns, {{nome}}! R$ {{limite}}.'),
    },
    variants: ['AMIGAO', 'BOA', 'AVENIDA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO'].map((network) => ({
      network, fields: { UTM_CAMPANHA: governed(`PLURIX_CRM_SEMANA1_EMAIL${index + 1}_${network.replace(' ', '_')}`) },
    })),
  })),
  pendencies: [{ severity: 'review', scope: 'E-mail 1', field: 'NOTA_LEGAL', message: 'Jurídico revisar nota com pré-aprovação.' }],
});

describe('contrato de importação XLSX → GaaS', () => {
  it('expande dois toques nas seis redes, com chave estável e origem por campo', () => {
    const { rows, problems } = validateImportPayload(base());
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([]);
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((row) => row.importKey)).size).toBe(12);
    const e1Boa = rows.find((row) => row.importKey === 'CRM 3|E-mail 1|BOA')!;
    expect(e1Boa.row.TP_CAMPANHA).toBe('CRM');
    expect(e1Boa.row.NM_PRODUTO_INTERNO).toBe('BOA');
    expect(e1Boa.provenance.UTM_CAMPANHA?.origin).toBe('governed');
    expect(e1Boa.provenance.MENSAGEM_LIMITE?.source).toBe('Briefing Fábrica!F10');
    const e2Boa = rows.find((row) => row.importKey === 'CRM 3|E-mail 2|BOA')!;
    expect(e2Boa.row.MENSAGEM_LIMITE).not.toBe(e1Boa.row.MENSAGEM_LIMITE);
  });

  it('só aceita rascunho e exige justificativa para campo inferido', () => {
    expect(validateImportPayload({ ...base(), status: 'ready' }).problems[0].severity).toBe('error');
    const inferred = base();
    inferred.touches[0].shared.CARTAO_NM_COMERCIAL = { value: '+amigo', origin: 'inferred', source: 'regra' };
    expect(validateImportPayload(inferred).problems.some((problem) => problem.message.includes('justificativa'))).toBe(true);
  });

  it('não inventa valor: ausência declarada vira pendência, ausência silenciosa é erro', () => {
    const declared = base();
    declared.touches[0].shared.LINK_CTA_1 = { value: '', origin: 'missing', source: 'sem link governado' };
    expect(validateImportPayload(declared).problems.filter((problem) => problem.where.endsWith('LINK_CTA_1')).every((problem) => problem.severity === 'warning')).toBe(true);
    const silent = base();
    silent.touches[0].shared.LINK_CTA_1 = field('');
    expect(validateImportPayload(silent).problems.some((problem) => problem.where.endsWith('LINK_CTA_1') && problem.severity === 'error')).toBe(true);
  });

  it('rejeita marcador desconhecido na mensagem de limite', () => {
    const payload = base();
    payload.touches[1].shared.MENSAGEM_LIMITE = field('Oi {{cpf}}, R$ {{limite}}');
    expect(validateImportPayload(payload).problems.some((problem) => problem.severity === 'error' && problem.where.includes('MENSAGEM_LIMITE'))).toBe(true);
  });

  it('reimportar a mesma planilha não duplica nem altera nada', () => {
    const payload = base();
    const rows = expandImportPayload(payload);
    const existing = rows.map((item, index) => ({ id: `id-${index}`, version: 3, row: { ...item.row, __id: `id-${index}` }, importSource: importSourceFor(payload, item, '2026-10-06') }));
    const plan = planImport(expandImportPayload(payload), existing);
    expect(plan.every((item) => item.action === 'unchanged')).toBe(true);
    expect(plan.filter((item) => item.action === 'create')).toHaveLength(0);
  });

  it('preserva edição feita no GaaS e aplica o que só mudou na planilha', () => {
    const payload = base();
    const first = expandImportPayload(payload);
    const existing = first.map((item, index) => ({ id: `id-${index}`, version: 3, row: { ...item.row, __id: `id-${index}` }, importSource: importSourceFor(payload, item, '2026-10-06') }));
    existing[0].row.ASSUNTO = 'Assunto ajustado no GaaS';
    const next = base();
    next.touches[0].shared.COPY_1_PRETO = field('Texto novo da planilha.');
    const plan = planImport(expandImportPayload(next), existing);
    const target = plan.find((item) => item.existingId === 'id-0')!;
    expect(target.action).toBe('update');
    expect(target.next.ASSUNTO).toBe('Assunto ajustado no GaaS');
    expect(target.next.COPY_1_PRETO).toBe('Texto novo da planilha.');
    expect(target.diffs.find((diff) => diff.column === 'ASSUNTO')?.decision).toBe('keep-gaas');
  });

  it('quando planilha e GaaS mudaram o mesmo campo, mantém o GaaS e marca conflito', () => {
    const payload = base();
    const first = expandImportPayload(payload);
    const existing = first.map((item, index) => ({ id: `id-${index}`, version: 3, row: { ...item.row, __id: `id-${index}` }, importSource: importSourceFor(payload, item, '2026-10-06') }));
    existing[0].row.ASSUNTO = 'Versão do GaaS';
    const next = base();
    next.touches[0].shared.ASSUNTO = field('Versão da planilha');
    const target = planImport(expandImportPayload(next), existing).find((item) => item.existingId === 'id-0')!;
    expect(target.diffs.find((diff) => diff.column === 'ASSUNTO')?.decision).toBe('conflict');
    expect(target.next.ASSUNTO).toBe('Versão do GaaS');
    const forced = planImport(expandImportPayload(next), existing, { resolveConflictsWith: 'sheet' }).find((item) => item.existingId === 'id-0')!;
    expect(forced.next.ASSUNTO).toBe('Versão da planilha');
  });

  it('o exemplo publicado do payload TOPO DE FUNIL (CRM) 3 é válido', () => {
    const example = JSON.parse(readFileSync(join(__dirname, '../../../../docs/email-factory/examples/topo-crm3-import-payload.json'), 'utf-8'));
    const { rows, problems } = validateImportPayload(example);
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([]);
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((row) => row.row.MENSAGEM_LIMITE)).size).toBe(2);
    rows.forEach(({ row }) => expect(row.COPY_1_PRETO).not.toMatch(/@FirstName/));
  });
});
