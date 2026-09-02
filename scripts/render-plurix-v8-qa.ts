import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderDynamicEmail } from '../src/modules/dynamic-email/ampscript/renderer.ts';
import { emptyBriefingRow, type BriefingRow } from '../src/modules/dynamic-email/domain/briefing.ts';
import { PLURIX_V8_TEMPLATE } from '../src/modules/dynamic-email/fixtures/plurixV8Template.ts';

const sql = `select briefing_data from public.dynamic_email_briefings
where briefing_data->>'SEQUENCIA' in ('E-mail 1','E-mail 2','E-mail 3','E-mail 4','E-mail 5','E-mail 6','E-mail 7','E-mail 8')
and briefing_data->>'NM_PRODUTO_INTERNO' = 'AMIGAO'
order by (regexp_replace(briefing_data->>'SEQUENCIA', '[^0-9]', '', 'g'))::int;`;

const outputDir = join(process.cwd(), 'artifacts', 'plurix-v8-qa');
mkdirSync(outputDir, { recursive: true });
const queryPath = join(outputDir, 'query.sql');
writeFileSync(queryPath, sql, 'utf8');
const raw = execSync(`npx supabase db query --linked --output-format json --file "${queryPath}"`, { encoding: 'utf8' });
const result = JSON.parse(raw) as { rows: Array<{ briefing_data: Record<string, string> }> };

const links: string[] = [];
for (const { briefing_data: data } of result.rows) {
  const row = emptyBriefingRow(data.__id);
  Object.assign(row, data);
  const rendered = renderDynamicEmail(PLURIX_V8_TEMPLATE, row as BriefingRow, {
    CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '', PRODUTO: 'AMIGAO',
    SEQUENCIA: data.SEQUENCIA, TP_CAMPANHA: data.TP_CAMPANHA,
  }, { pendingAssets: 'hidden' });
  if (rendered.diagnostics.length) throw new Error(`${data.SEQUENCIA}: ${rendered.diagnostics.join('; ')}`);
  const filename = `${data.SEQUENCIA.toLowerCase().replace(/[^0-9]+/g, '')}.html`;
  writeFileSync(join(outputDir, filename), rendered.html, 'utf8');
  links.push(`<article><h2>${data.SEQUENCIA}</h2><p>${data.ASSUNTO}</p><iframe title="${data.SEQUENCIA}" src="./${filename}"></iframe></article>`);
}

if (links.length !== 8) throw new Error(`Expected 8 Amigão briefings, found ${links.length}.`);
writeFileSync(join(outputDir, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QA PLURIX V8</title><style>body{margin:0;padding:24px;background:#eef1f5;font-family:Arial;color:#172033}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}article{background:#fff;border:1px solid #d8dde8;border-radius:14px;padding:18px}h2{margin:0 0 4px}p{min-height:38px;color:#596174}iframe{width:100%;height:900px;border:1px solid #d8dde8;border-radius:10px;background:#fff}@media(max-width:1000px){main{grid-template-columns:1fr}}</style></head><body><h1>Régua Plurix — QA V8</h1><main>${links.join('')}</main></body></html>`, 'utf8');
console.log(join(outputDir, 'index.html'));
