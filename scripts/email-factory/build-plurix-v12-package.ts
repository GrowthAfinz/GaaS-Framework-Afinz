/**
 * Pacote SFMC da candidata PLURIX V12 + CSV dos dois toques TOPO DE FUNIL (CRM) 3.
 * Uso: npx vite-node scripts/email-factory/build-plurix-v12-package.ts <pasta-de-saída>
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLURIX_V11_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV11Template';
import { PLURIX_V12_TEMPLATE } from '../../src/modules/dynamic-email/fixtures/plurixV12Template';
import { plurixEnvelope } from '../../src/modules/dynamic-email/domain/sfmcEnvelope';
import { exportBriefingCsv } from '../../src/modules/dynamic-email/domain/briefing';
import { validateImportPayload } from '../../src/modules/dynamic-email/domain/xlsxImport';

const out = process.argv[2];
if (!out) throw new Error('Informe a pasta de saída.');
mkdirSync(out, { recursive: true });
const root = join(__dirname, '../..');
const envelope = plurixEnvelope(PLURIX_V12_TEMPLATE)!;
if (envelope.error) throw new Error(envelope.error);
const { rows } = validateImportPayload(JSON.parse(readFileSync(join(root, 'docs/email-factory/examples/topo-crm3-import-payload.json'), 'utf-8')));
const order = ['AMIGAO', 'AVENIDA', 'BOA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO'];
const sorted = [...rows].sort((a, b) => a.sequence.localeCompare(b.sequence) || order.indexOf(a.network) - order.indexOf(b.network));

writeFileSync(join(out, '01_email_dinamico_plurix_v12.html'), PLURIX_V12_TEMPLATE, 'utf-8');
writeFileSync(join(out, '02_pre_cabecalho_v12.ampscript'), envelope.preheader, 'utf-8');
writeFileSync(join(out, '03_assunto_v12.ampscript'), envelope.subject, 'utf-8');
writeFileSync(join(out, '04_TB_BRIEFING_CAMPANHA_AQUISICAO_TOPO_CRM3.csv'), exportBriefingCsv(sorted.map((item) => item.row)), 'utf-8');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
writeFileSync(join(out, 'manifest.json'), `${JSON.stringify({
  version: 'PLURIX V12', status: 'needs_review', base: 'PLURIX V11 (validada no SFMC em 06/10/2026, E-mail 1 e 2)',
  change: 'Texto da faixa de limite vem de MENSAGEM_LIMITE (37a coluna); só {{nome}} e {{limite}} são trocados; sem TreatAsContent.',
  body_sha256: sha(PLURIX_V12_TEMPLATE), ancestor_v11_sha256: sha(PLURIX_V11_TEMPLATE),
  csv_rows: sorted.length, csv_columns: 37, sfmc_runtime_test: 'pending',
}, null, 2)}\n`, 'utf-8');
console.log(`Pacote em ${out}: ${sorted.length} linhas no CSV`);
