/**
 * Pacote SFMC da candidata PLURIX V13 + CSV da régua TOPO DE FUNIL DINÂMICO.
 * Uso: npx vite-node scripts/email-factory/build-plurix-v13-package.ts <topo_dinamico_rows.json> <pasta-de-saída>
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLURIX_V12_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV12Template';
import { PLURIX_V13_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV13Template';
import { plurixEnvelope } from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
import { BRIEFING_COLUMNS, emptyBriefingRow, exportBriefingCsv } from '../../src/modules/dynamic-email/domain/briefing';

const [rowsFile, out] = process.argv.slice(2);
if (!rowsFile || !out) throw new Error('Informe o JSON das linhas e a pasta de saída.');
mkdirSync(out, { recursive: true });
const envelope = plurixEnvelope(PLURIX_V13_TEMPLATE)!;
if (envelope.error) throw new Error(envelope.error);
const input = JSON.parse(readFileSync(rowsFile, 'utf-8')) as { rows: Array<{ data: Record<string, string> }> };
const rows = input.rows.map(({ data }) => {
  const row = emptyBriefingRow();
  BRIEFING_COLUMNS.forEach((column) => { row[column] = data[column] ?? ''; });
  return row;
});

writeFileSync(join(out, '01_email_dinamico_plurix_v13.html'), PLURIX_V13_TEMPLATE, 'utf-8');
writeFileSync(join(out, '02_pre_cabecalho_v13.ampscript'), envelope.preheader, 'utf-8');
writeFileSync(join(out, '03_assunto_v13.ampscript'), envelope.subject, 'utf-8');
writeFileSync(join(out, '04_TB_BRIEFING_CAMPANHA_AQUISICAO_TOPO_DINAMICO.csv'), exportBriefingCsv(rows), 'utf-8');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
writeFileSync(join(out, 'manifest.json'), `${JSON.stringify({
  version: 'PLURIX V13', status: 'needs_review', base: 'PLURIX V12 (motor com sequência atual, faixa de limite no briefing)',
  change: 'Header dinâmico lido do briefing (HEADER_TITULO, HEADER_SUBTITULO, HEADER_IMAGEM_CARTAO, HEADER_LOGO), TP Topo de Funil, E-mail 1 a 8 e bloco 3 do pool.',
  body_sha256: sha(PLURIX_V13_TEMPLATE), ancestor_v12_sha256: sha(PLURIX_V12_TEMPLATE),
  csv_rows: rows.length, csv_columns: BRIEFING_COLUMNS.length, sfmc_runtime_test: 'pending',
}, null, 2)}\n`, 'utf-8');
console.log(`Pacote em ${out}: ${rows.length} linhas, ${BRIEFING_COLUMNS.length} colunas`);
