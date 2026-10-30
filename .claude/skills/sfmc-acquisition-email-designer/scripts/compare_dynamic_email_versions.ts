import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

type Args = Record<string, string | boolean>;
type Briefing = Record<string, string>;

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) throw new Error(`Argumento inesperado: ${token}`);
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) args[key] = true;
    else { args[key] = value; i += 1; }
  }
  return args;
}

function required(args: Args, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Informe --${key}.`);
  return value.trim();
}

function sql(value: string): string { return value.replaceAll("'", "''"); }
function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function cleanText(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }
function matches(source: string, regex: RegExp): string[] {
  return [...source.matchAll(regex)].map((match) => cleanText(match[1] ?? ''));
}
function audit(source: string, html: string) {
  const headings = matches(html, /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
  const ctas = matches(html, /<a\b[^>]*>([\s\S]*?)<\/a>/gi).filter((text) => text.length > 1);
  const images = unique([...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]));
  const fieldsRead = unique([...source.matchAll(/\bField\s*\([^,]+,\s*["']([^"']+)["']/gi)].map((m) => m[1]));
  const variablesRendered = unique([...html.matchAll(/%%=\s*v\s*\(@([A-Za-z0-9_]+)\)\s*=%%/gi)].map((m) => m[1]));
  return { headings, ctas, images, fieldsRead, variablesRendered, htmlBytes: Buffer.byteLength(html), sourceBytes: Buffer.byteLength(source) };
}

const args = parseArgs(process.argv.slice(2));
const fromId = required(args, 'from');
const toId = required(args, 'to');
const product = required(args, 'product');
const sequence = required(args, 'sequence');
const appRoot = resolve(typeof args['app-root'] === 'string' ? args['app-root'] : process.cwd());
const outputDir = resolve(appRoot, typeof args['output-dir'] === 'string' ? args['output-dir'] : `artifacts/dynamic-email-comparison/${product}-${sequence}`);
const firstName = typeof args.name === 'string' ? args.name : 'VANIA';
const limit = typeof args.limit === 'string' ? args.limit : '3500';
const visualRole = typeof args.role === 'string' ? args.role : 'unclassified';
mkdirSync(outputDir, { recursive: true });

const queryPath = join(outputDir, 'query.sql');
writeFileSync(queryPath, `
select jsonb_build_object(
  'briefing', (
    select briefing_data
    from public.dynamic_email_briefings
    where briefing_data->>'NM_PRODUTO_INTERNO' = '${sql(product)}'
      and briefing_data->>'SEQUENCIA' = '${sql(sequence)}'
    order by updated_at desc limit 1
  ),
  'templates', (
    select jsonb_object_agg(id, jsonb_build_object('name', name, 'version', version, 'source', source))
    from public.dynamic_email_template_slots
    where id in ('${sql(fromId)}', '${sql(toId)}') and status = 'active'
  )
) as comparison;
`, 'utf8');

const raw = process.platform === 'win32'
  ? execFileSync('powershell.exe', ['-NoProfile', '-Command', '& npx supabase db query --linked --output-format json --file $env:SFMC_COMPARE_QUERY'], {
      cwd: appRoot, encoding: 'utf8', shell: false, env: { ...process.env, SFMC_COMPARE_QUERY: queryPath },
    })
  : execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--output-format', 'json', '--file', queryPath], {
      cwd: appRoot, encoding: 'utf8', shell: false,
    });
const payload = JSON.parse(raw) as { rows: Array<{ comparison: { briefing: Briefing; templates: Record<string, { name: string; version: number; source: string }> } }> };
const data = payload.rows[0]?.comparison;
if (!data?.briefing) throw new Error(`Briefing não encontrado para ${product} · ${sequence}.`);
if (!data.templates?.[fromId] || !data.templates?.[toId]) throw new Error(`Templates ativos não encontrados: ${fromId}, ${toId}.`);

const rendererUrl = join(appRoot, 'src/modules/dynamic-email/ampscript/renderer.ts').replaceAll('\\', '/');
const briefingUrl = join(appRoot, 'src/modules/dynamic-email/domain/briefing.ts').replaceAll('\\', '/');
const { renderDynamicEmail } = await import(rendererUrl);
const { emptyBriefingRow } = await import(briefingUrl);
const row = emptyBriefingRow(data.briefing.__id);
Object.assign(row, data.briefing);
const subscriber = {
  CPF: '00000000000', PRI_NOME: firstName, LIMITE: limit, PRODUTO: product,
  SEQUENCIA: sequence, TP_CAMPANHA: data.briefing.TP_CAMPANHA,
};

const versions = [
  { key: 'from', id: fromId, ...data.templates[fromId] },
  { key: 'to', id: toId, ...data.templates[toId] },
] as const;
const report: Record<string, unknown> = {
  context: { product, sequence, campaign: data.briefing.TP_CAMPANHA, visualRole, subscriber: { name: firstName, limit }, pendingAssets: 'hidden' },
  generatedAt: new Date().toISOString(), versions: {}, browser: {},
};

const cards: string[] = [];
for (const version of versions) {
  const rendered = renderDynamicEmail(version.source, row, subscriber, { pendingAssets: 'hidden' });
  if (rendered.diagnostics.length) throw new Error(`${version.id}: ${rendered.diagnostics.join('; ')}`);
  const filename = `${version.key}.html`;
  writeFileSync(join(outputDir, filename), rendered.html, 'utf8');
  (report.versions as Record<string, unknown>)[version.key] = {
    id: version.id, name: version.name, version: version.version, audit: audit(version.source, rendered.html), diagnostics: rendered.diagnostics,
  };
  cards.push(`<section><header><strong>${escapeHtml(version.name || version.id)}</strong><span>${escapeHtml(version.id)}</span></header><iframe title="${escapeHtml(version.id)}" src="./${filename}"></iframe></section>`);
}

const indexHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comparação dinâmica</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#eef2f6;color:#172033;font-family:Arial,sans-serif}h1{margin:0 0 6px;font-size:26px}p{margin:0 0 20px;color:#596174}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}section{min-width:0;background:#fff;border:1px solid #d7deea;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px #17203312}header{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e7ef}header strong{color:#006b6b}header span{color:#697386;font-size:12px}iframe{display:block;width:100%;height:1100px;border:0;background:#f2f4f7}@media(max-width:1000px){.grid{grid-template-columns:1fr}}</style></head><body><h1>${escapeHtml(fromId)} × ${escapeHtml(toId)}</h1><p>Comparação controlada · ${escapeHtml(product)} · ${escapeHtml(sequence)} · mesmos briefing, assinatura e dados fictícios.</p><main class="grid">${cards.join('')}</main></body></html>`;
writeFileSync(join(outputDir, 'index.html'), indexHtml, 'utf8');

const browser = await chromium.launch({ headless: true });
try {
  for (const version of versions) {
    const page = await browser.newPage({ viewport: { width: 720, height: 1200 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(join(outputDir, `${version.key}.html`)).href, { waitUntil: 'networkidle' });
    const imageStatus = await page.locator('img').evaluateAll((nodes) => nodes.map((node) => {
      const image = node as HTMLImageElement;
      return { src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
    }));
    await page.screenshot({ path: join(outputDir, `${version.key}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(outputDir, `${version.key}-mobile.png`), fullPage: true });
    (report.browser as Record<string, unknown>)[version.key] = { images: imageStatus, brokenImages: imageStatus.filter((image) => !image.loaded) };
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto(pathToFileURL(join(outputDir, 'index.html')).href, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outputDir, 'side-by-side.png'), fullPage: true });
  await page.close();
} finally { await browser.close(); }

const fromAudit = ((report.versions as Record<string, any>).from.audit);
const toAudit = ((report.versions as Record<string, any>).to.audit);
const fromBrowser = ((report.browser as Record<string, any>).from);
const toBrowser = ((report.browser as Record<string, any>).to);
const difference = (before: string[], after: string[]) => before.filter((item) => !after.includes(item));
const legalLink = (text: string) => /descadastr|unsubscribe|prefer[eê]ncia/i.test(text);
const lostActionCtas = difference(fromAudit.ctas.filter((text: string) => !legalLink(text)), toAudit.ctas.filter((text: string) => !legalLink(text)));
const lostAssets = difference(fromAudit.images, toAudit.images);
const machineChecks = {
  noActionCtaLost: lostActionCtas.length === 0,
  noAssetLost: lostAssets.length === 0,
  noNewBrokenImage: toBrowser.brokenImages.length <= fromBrowser.brokenImages.length,
};
report.comparison = {
  lost: {
    headings: difference(fromAudit.headings, toAudit.headings),
    actionCtas: lostActionCtas,
    legalLinks: difference(fromAudit.ctas.filter(legalLink), toAudit.ctas.filter(legalLink)),
    assets: lostAssets,
    fieldsRead: difference(fromAudit.fieldsRead, toAudit.fieldsRead),
  },
  added: {
    headings: difference(toAudit.headings, fromAudit.headings),
    actionCtas: difference(toAudit.ctas.filter((text: string) => !legalLink(text)), fromAudit.ctas.filter((text: string) => !legalLink(text))),
    assets: difference(toAudit.images, fromAudit.images),
    fieldsRead: difference(toAudit.fieldsRead, fromAudit.fieldsRead),
  },
  machineChecks,
};
report.promotionGate = {
  machineChecksPassed: Object.values(machineChecks).every(Boolean),
  visualReviewRequired: true,
  sourceParityRequired: true,
  fieldCoverageReviewRequired: true,
  status: 'needs_review',
  note: 'Checks automáticos não promovem versão. Revise PNGs, contrato de campos, legal e paridade frontend/Supabase.',
};

writeFileSync(join(outputDir, 'comparison.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(join(outputDir, 'index.html'));
console.log(join(outputDir, 'comparison.json'));
