import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { renderDynamicEmail } from '../src/modules/dynamic-email/ampscript/renderer.ts';
import { emptyBriefingRow, type BriefingRow } from '../src/modules/dynamic-email/domain/briefing.ts';
import { PLURIX_V8_TEMPLATE } from '../src/modules/dynamic-email/fixtures/plurixV8Template.ts';
import { PLURIX_V9_TEMPLATE } from '../src/modules/dynamic-email/fixtures/plurixV9Template.ts';

const outputDir = join(process.cwd(), 'artifacts', 'plurix-v9-regression');
mkdirSync(outputDir, { recursive: true });
const queryPath = join(outputDir, 'query.sql');
writeFileSync(queryPath, `select briefing_data from public.dynamic_email_briefings
where briefing_data->>'SEQUENCIA' in ('E-mail 1','E-mail 2','E-mail 3','E-mail 4','E-mail 5','E-mail 6','E-mail 7','E-mail 8')
and briefing_data->>'NM_PRODUTO_INTERNO' = 'AMIGAO'
order by (regexp_replace(briefing_data->>'SEQUENCIA', '[^0-9]', '', 'g'))::int;`, 'utf8');

const raw = execSync(`npx supabase db query --linked --output-format json --file "${queryPath}"`, { encoding: 'utf8' });
const result = JSON.parse(raw) as { rows: Array<{ briefing_data: Record<string, string> }> };
if (result.rows.length !== 8) throw new Error(`Expected 8 Amigão briefings, found ${result.rows.length}.`);

const report: Array<Record<string, unknown>> = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const { briefing_data: data } of result.rows) {
    const row = emptyBriefingRow(data.__id);
    Object.assign(row, data);
    const subscriber = {
      CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500', PRODUTO: 'AMIGAO',
      SEQUENCIA: data.SEQUENCIA, TP_CAMPANHA: data.TP_CAMPANHA,
    };
    const v8 = renderDynamicEmail(PLURIX_V8_TEMPLATE, row as BriefingRow, subscriber, { pendingAssets: 'hidden' });
    const v9 = renderDynamicEmail(PLURIX_V9_TEMPLATE, row as BriefingRow, subscriber, { pendingAssets: 'hidden' });
    if (v8.diagnostics.length || v9.diagnostics.length) {
      throw new Error(`${data.SEQUENCIA}: ${[...v8.diagnostics, ...v9.diagnostics].join('; ')}`);
    }
    const number = data.SEQUENCIA.replace(/\D/g, '');
    const sequenceDir = join(outputDir, `email-${number}`);
    mkdirSync(sequenceDir, { recursive: true });
    writeFileSync(join(sequenceDir, 'v8.html'), v8.html, 'utf8');
    writeFileSync(join(sequenceDir, 'v9.html'), v9.html, 'utf8');
    const normalizeRenderedHtml = (html: string) => html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    const changed = normalizeRenderedHtml(v8.html) !== normalizeRenderedHtml(v9.html);
    if (data.SEQUENCIA === 'E-mail 2' && !changed) throw new Error('E-mail 2 should change in V9.');
    if (data.SEQUENCIA !== 'E-mail 2' && changed) throw new Error(`${data.SEQUENCIA} changed unexpectedly in V9.`);

    const views: Record<string, unknown> = {};
    for (const version of ['v8', 'v9'] as const) {
      const page = await browser.newPage({ viewport: { width: 720, height: 1200 } });
      await page.goto(pathToFileURL(join(sequenceDir, `${version}.html`)).href, { waitUntil: 'networkidle' });
      const images = await page.locator('img').evaluateAll((nodes) => nodes.map((node) => {
        const image = node as HTMLImageElement;
        return { src: image.currentSrc || image.src, loaded: image.complete && image.naturalWidth > 0 };
      }));
      const ctas = await page.locator('a').allTextContents();
      const headings = await page.locator('h1,h2,h3,h4,h5,h6').allTextContents();
      await page.screenshot({ path: join(sequenceDir, `${version}-desktop.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: join(sequenceDir, `${version}-mobile.png`), fullPage: true });
      views[version] = {
        images, brokenImages: images.filter((image) => !image.loaded),
        ctas: ctas.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean),
        headings: headings.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean),
      };
      await page.close();
    }
    const v8View = views.v8 as { images: unknown[]; brokenImages: unknown[]; ctas: string[]; headings: string[] };
    const v9View = views.v9 as { images: unknown[]; brokenImages: unknown[]; ctas: string[]; headings: string[] };
    if (v9View.brokenImages.length > v8View.brokenImages.length) throw new Error(`${data.SEQUENCIA}: V9 introduced broken images.`);
    if (v9View.ctas.length < v8View.ctas.length) throw new Error(`${data.SEQUENCIA}: V9 lost a CTA/link.`);
    report.push({ sequence: data.SEQUENCIA, changed, v8: v8View, v9: v9View });
  }
} finally { await browser.close(); }

writeFileSync(join(outputDir, 'regression-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(join(outputDir, 'regression-report.json'));
