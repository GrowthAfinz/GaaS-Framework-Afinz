/**
 * Regressão visual da régua Topo de Funil (CRM) do Bem Barato.
 *
 * Renderiza, para cada uma das 8 sequências, o HTML original extraído do RTF e o
 * HTML produzido por BEM_BARATO_CRM_DYNAMIC_TEMPLATE, em desktop e mobile, e
 * grava um relatório com inventário de imagens, links, blocos de texto e altura.
 *
 *   node node_modules/vite-node/vite-node.mjs scripts/render-bem-barato-ruler-regression.ts \
 *     -- "C:/Users/Pablo Prado/Downloads/REGUA NOVA BEM BARATO.rtf" artifacts/bem-barato-briefings.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
import { renderDynamicEmail } from '../src/modules/dynamic-email/ampscript/renderer.ts';
import { emptyBriefingRow, type BriefingRow } from '../src/modules/dynamic-email/domain/briefing.ts';
import { BEM_BARATO_CRM_DYNAMIC_TEMPLATE } from '../src/modules/dynamic-email/fixtures/bemBaratoCrmDynamicTemplate.ts';

const referencePath = process.argv[2] ?? 'C:/Users/Pablo Prado/Downloads/REGUA NOVA BEM BARATO.rtf';
const briefingsPath = process.argv[3] ?? join(process.cwd(), 'artifacts', 'bem-barato-briefings.json');
const outputDir = join(process.cwd(), 'artifacts', 'bem-barato-ruler-regression');
mkdirSync(outputDir, { recursive: true });

const cp1252 = new TextDecoder('windows-1252');
const decodeRtf = (value: string) => value
  .replace(/\\u(-?\d+)(?:\\'[0-9a-fA-F]{2}|\?)?/g, (_, raw) => String.fromCharCode((Number(raw) + 65536) % 65536))
  .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => cp1252.decode(Uint8Array.of(Number.parseInt(hex, 16))))
  .normalize('NFKC');

function extractReferenceEmails(rtf: string) {
  const starts = [...rtf.matchAll(/EMAIL\s+(\d+)\s*:/g)];
  return starts.map((match, index) => {
    const block = rtf.slice(match.index!, starts[index + 1]?.index ?? rtf.length);
    const doctype = block.indexOf('<!DOCTYPE HTML');
    const end = block.lastIndexOf('</html>') + '</html>'.length;
    const meta = decodeRtf(block.slice(0, doctype))
      .replace(/\\line|\\par/g, '\n').replace(/\\[a-zA-Z]+-?\d* ?/g, '').replace(/[{}]/g, ' ');
    const logicalLines: string[] = [];
    for (const rawLine of block.slice(doctype, end).split(/\r?\n/)) {
      if (rawLine.startsWith('\\par')) logicalLines.push(rawLine.replace(/^\\par ?/, ''));
      else if (logicalLines.length) logicalLines[logicalLines.length - 1] += rawLine;
      else logicalLines.push(rawLine);
    }
    // os originais usam três sintaxes de merge field inválidas para este motor;
    // na referência elas viram o mesmo nome fictício usado no dinâmico.
    const html = decodeRtf(logicalLines.join('\n'))
      .replace(/\\\{/g, '{').replace(/\\\}/g, '}')
      .replace(/%%FIRST_NAME%%|%%first_name%%|%%PRI_NOME%%/g, 'VANIA');
    return {
      sequence: Number(match[1]),
      subject: meta.match(/ASSUNTO:\s*(.*)/)?.[1]?.trim() ?? '',
      preheader: meta.match(/PRE[ -]?CABE[ÇC]ALHO:\s*(.*)/)?.[1]?.trim() ?? '',
      html,
    };
  });
}

async function inspect(page: Page) {
  return page.evaluate(() => {
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt,
      naturalWidth: image.naturalWidth,
      renderedWidth: Math.round(image.getBoundingClientRect().width),
      renderedHeight: Math.round(image.getBoundingClientRect().height),
      loaded: image.complete && image.naturalWidth > 0,
    }));
    const links = [...document.querySelectorAll('a')].map((link) => ({
      text: (link.textContent ?? '').replace(/\s+/g, ' ').trim(),
      href: (link as HTMLAnchorElement).href,
    }));
    const blocks = [...document.querySelectorAll('h1,h2,h3,p,div,span,td')]
      .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter((text, index, all) => text.length >= 12 && all.indexOf(text) === index);
    return {
      title: document.title,
      images,
      totalImages: images.length,
      brokenImages: images.filter((image) => !image.loaded).map((image) => image.src),
      links,
      totalLinks: links.length,
      blocks,
      bodyHeight: document.body.scrollHeight,
    };
  });
}

const references = extractReferenceEmails(readFileSync(referencePath, 'latin1'));
if (references.length !== 8) throw new Error(`Esperados 8 HTMLs no RTF; encontrados ${references.length}.`);

const briefings = JSON.parse(readFileSync(briefingsPath, 'utf8')) as Array<Record<string, string>>;
if (briefings.length !== 8) throw new Error(`Esperados 8 briefings; encontrados ${briefings.length}.`);

const browser = await chromium.launch({ headless: true });
const report: Array<Record<string, unknown>> = [];
try {
  for (const reference of references) {
    const data = briefings.find((row) => row.SEQUENCIA === `E-mail ${reference.sequence}`);
    if (!data) throw new Error(`Briefing ausente para E-mail ${reference.sequence}.`);
    const row = Object.assign(emptyBriefingRow(), data) as BriefingRow;
    const dynamic = renderDynamicEmail(BEM_BARATO_CRM_DYNAMIC_TEMPLATE, row, {
      CPF: '00000000000', PRI_NOME: 'VANIA', LIMITE: '3500',
      PRODUTO: data.NM_PRODUTO_INTERNO, SEQUENCIA: data.SEQUENCIA, TP_CAMPANHA: data.TP_CAMPANHA,
    }, { pendingAssets: 'hidden' });
    if (dynamic.diagnostics.length) throw new Error(`${data.SEQUENCIA}: ${dynamic.diagnostics.join('; ')}`);

    const dir = join(outputDir, `email-${reference.sequence}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'reference.html'), reference.html, 'utf8');
    writeFileSync(join(dir, 'dynamic-bem-barato-v1.html'), dynamic.html, 'utf8');

    const views: Record<string, unknown> = {};
    for (const [name, file] of [['reference', 'reference.html'], ['dynamicBemBaratoV1', 'dynamic-bem-barato-v1.html']] as const) {
      const page = await browser.newPage({ viewport: { width: 720, height: 1000 } });
      await page.goto(pathToFileURL(join(dir, file)).href, { waitUntil: 'networkidle' });
      views[name] = await inspect(page);
      await page.screenshot({ path: join(dir, `${name}-desktop.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: join(dir, `${name}-mobile.png`), fullPage: true });
      await page.close();
    }

    const ref = views.reference as { totalImages: number; brokenImages: string[]; totalLinks: number; bodyHeight: number };
    const dyn = views.dynamicBemBaratoV1 as typeof ref;
    report.push({
      sequence: reference.sequence,
      subject: reference.subject,
      preheader: reference.preheader,
      delta: {
        images: dyn.totalImages - ref.totalImages,
        links: dyn.totalLinks - ref.totalLinks,
        heightPct: Math.round(((dyn.bodyHeight - ref.bodyHeight) / ref.bodyHeight) * 100),
        brokenInDynamic: dyn.brokenImages,
      },
      ...views,
    });
  }
} finally {
  await browser.close();
}

writeFileSync(join(outputDir, 'comparison-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  outputDir,
  emails: report.length,
  pngs: report.length * 4,
  brokenTotal: report.reduce((sum, r) => sum + ((r.delta as { brokenInDynamic: string[] }).brokenInDynamic.length), 0),
  deltas: report.map((r) => ({ seq: r.sequence, ...(r.delta as object) })),
}, null, 2));
