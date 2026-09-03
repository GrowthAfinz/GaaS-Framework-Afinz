import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
import { renderDynamicEmail } from '../src/modules/dynamic-email/ampscript/renderer.ts';
import { emptyBriefingRow, type BriefingRow } from '../src/modules/dynamic-email/domain/briefing.ts';
import { DIA_CRM_DYNAMIC_TEMPLATE } from '../src/modules/dynamic-email/fixtures/diaCrmDynamicTemplate.ts';

const referencePath = process.argv[2] ?? 'C:/Users/Pablo Prado/Downloads/REGUA NOVA DIA.rtf';
const outputDir = join(process.cwd(), 'artifacts', 'dia-ruler-regression');
mkdirSync(outputDir, { recursive: true });

const cp1252 = new TextDecoder('windows-1252');
const decodeRtfCharacters = (value: string) => value
  .replace(/\\u(-?\d+)(?:\\'[0-9a-fA-F]{2}|\?)?/g, (_, raw) => String.fromCharCode((Number(raw) + 65536) % 65536))
  .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => cp1252.decode(Uint8Array.of(Number.parseInt(hex, 16))))
  .normalize('NFKC');

function extractReferenceEmails(rtf: string): Array<{ sequence: number; subject: string; preheader: string; html: string }> {
  const starts = [...rtf.matchAll(/EMAIL\s+(\d+):/g)];
  return starts.map((match, index) => {
    const block = rtf.slice(match.index!, starts[index + 1]?.index ?? rtf.length);
    const doctype = block.indexOf('<!DOCTYPE HTML');
    const end = block.lastIndexOf('</html>') + '</html>'.length;
    const decodedMeta = decodeRtfCharacters(block.slice(0, doctype))
      .replace(/\\line|\\par/g, '\n')
      .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
      .replace(/[{}]/g, ' ')
      .replace(/[ \t]+/g, ' ');
    const subject = decodedMeta.match(/ASSUNTO:\s*(.*?)\s*PRE CABEÇALHO:/s)?.[1]?.trim() ?? '';
    const preheader = decodedMeta.match(/PRE CABEÇALHO:\s*(.*?)(?:HTML \(PARA ADAPTAR|$)/s)?.[1]?.trim() ?? '';
    const logicalLines: string[] = [];
    for (const rawLine of block.slice(doctype, end).split(/\r?\n/)) {
      if (rawLine.startsWith('\\par')) logicalLines.push(rawLine.replace(/^\\par ?/, ''));
      else if (logicalLines.length) logicalLines[logicalLines.length - 1] += rawLine;
      else logicalLines.push(rawLine);
    }
    const html = decodeRtfCharacters(logicalLines.join('\n'))
      .replace(/\\\{/g, '{').replace(/\\\}/g, '}')
      .replace(/%%FIRST_NAME%%|%%PRI_NOME%%/g, 'VANIA');
    return { sequence: Number(match[1]), subject, preheader, html };
  });
}

async function inspect(page: Page) {
  return page.evaluate(() => {
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src, alt: image.alt, width: image.naturalWidth,
      height: image.naturalHeight, renderedWidth: Math.round(image.getBoundingClientRect().width),
      renderedHeight: Math.round(image.getBoundingClientRect().height), loaded: image.complete && image.naturalWidth > 0,
    }));
    const links = [...document.querySelectorAll('a')].map((link) => ({ text: (link.textContent ?? '').replace(/\s+/g, ' ').trim(), href: (link as HTMLAnchorElement).href }));
    const blocks = [...document.querySelectorAll('h1,h2,h3,p,div')]
      .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((text, index, all) => text.length >= 8 && all.indexOf(text) === index);
    return { title: document.title, images, links, blocks, bodyHeight: document.body.scrollHeight };
  });
}

const rtf = readFileSync(referencePath, 'latin1');
const references = extractReferenceEmails(rtf);
if (references.length !== 8) throw new Error(`Esperados 8 HTMLs no RTF; encontrados ${references.length}.`);

const queryPath = join(outputDir, 'query.sql');
writeFileSync(queryPath, `select briefing_data from public.dynamic_email_briefings where partner='Dia' and segment='CRM' order by (regexp_replace(briefing_data->>'SEQUENCIA','[^0-9]','','g'))::int;`, 'utf8');
const queryRaw = execSync(`npx supabase db query --linked --output-format json --file "${queryPath}"`, { encoding: 'utf8' });
const rows = (JSON.parse(queryRaw) as { rows: Array<{ briefing_data: Record<string, string> }> }).rows;
if (rows.length !== 8) throw new Error(`Esperados 8 briefings DIA; encontrados ${rows.length}.`);

const browser = await chromium.launch({ headless: true });
const report: Array<Record<string, unknown>> = [];
try {
  for (const reference of references) {
    const data = rows.find(({ briefing_data }) => briefing_data.SEQUENCIA === `E-mail ${reference.sequence}`)?.briefing_data;
    if (!data) throw new Error(`Briefing ausente para E-mail ${reference.sequence}.`);
    const row = Object.assign(emptyBriefingRow(), data) as BriefingRow;
    const dynamic = renderDynamicEmail(DIA_CRM_DYNAMIC_TEMPLATE, row, {
      CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500', PRODUTO: 'DIA',
      SEQUENCIA: data.SEQUENCIA, TP_CAMPANHA: data.TP_CAMPANHA,
    }, { pendingAssets: 'hidden' });
    if (dynamic.diagnostics.length) throw new Error(`${data.SEQUENCIA}: ${dynamic.diagnostics.join('; ')}`);
    const dir = join(outputDir, `email-${reference.sequence}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'reference.html'), reference.html, 'utf8');
    writeFileSync(join(dir, 'dynamic-dia-v1.html'), dynamic.html, 'utf8');
    const views: Record<string, unknown> = {};
    for (const [name, htmlFile] of [['reference', 'reference.html'], ['dynamicDiaV1', 'dynamic-dia-v1.html']] as const) {
      const page = await browser.newPage({ viewport: { width: 720, height: 1000 } });
      await page.goto(pathToFileURL(join(dir, htmlFile)).href, { waitUntil: 'networkidle' });
      views[name] = await inspect(page);
      await page.screenshot({ path: join(dir, `${name}-desktop.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: join(dir, `${name}-mobile.png`), fullPage: true });
      await page.close();
    }
    report.push({ sequence: reference.sequence, subject: reference.subject, preheader: reference.preheader, ...views });
  }
} finally {
  await browser.close();
}

writeFileSync(join(outputDir, 'comparison-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputDir, emails: report.length, pngs: report.length * 4 }, null, 2));
