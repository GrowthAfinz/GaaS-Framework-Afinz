import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import before from '../fixtures/emailInputV2Before.json';
import fixture from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import { emptyBriefingRow } from '../domain/briefing';
import { withMeta } from '../domain/workspace';
import { prepareEmailInput } from '../domain/emailInput';
import { renderDynamicEmail } from '../ampscript/renderer';
import { PLURIX_V13_TEMPLATE, PLURIX_V13_TEMPLATE_ID } from '../fixtures/plurixV13Template';
import { attachBrandFiles, attachImages, BRAND_FILES, buildSkillPack, packImageUrls, type SkillPackContext } from './skillPack';

const python = ['python3', 'python'].find((bin) => spawnSync(bin, ['--version']).status === 0);
const SEGMENT = 'V2 TOPO DE FUNIL DINÂMICO';
const products: SkillPackContext['productContexts'] = [{ id: 'p', product: '+amigo', partner: 'Plurix', status: 'active', version: 1, differentiators: ['A partir de +5%', 'Até 40 dias para pagar', 'Visa', 'até 70% em consultas'] }];
const briefings = before.map((b) => withMeta({ ...emptyBriefingRow(), ...b.data }, { partner: 'Plurix', segment: SEGMENT, weekKey: b.weekKey, campaignGroupId: `g-${b.sequence}`, version: 1, status: 'draft', templateSlotId: PLURIX_V13_TEMPLATE_ID }));

/** Os scripts do pacote rodam fora do GaaS: a prévia deles precisa ser a mesma da importação. */
describe.skipIf(!python)('scripts Python do pacote', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-'));
  const pack = buildSkillPack({ briefings, productContexts: products, productGuardrails: [], emailStrategies: [], rulers: [], assets: [], templates: [{ id: PLURIX_V13_TEMPLATE_ID, name: 'PLURIX V13', source: PLURIX_V13_TEMPLATE } as SkillPackContext['templates'][number]] }, { rulerKeys: [`Plurix|${SEGMENT}`], previewNetworks: 'all', includeTemplateSource: false, generatedAt: '2026-10-15T20:00:00.000Z' });
  // Imagens falsas no lugar das baixadas pela função email-image-proxy.
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const brand = Object.fromEntries(Object.keys(BRAND_FILES).map((name) => [name, new Uint8Array(readFileSync(new URL(`../../../../public/email-factory/marca/${name}`, import.meta.url)))]));
  const withImages = attachBrandFiles(attachImages(pack, Object.fromEntries(packImageUrls(pack).map((u) => [u, { contentType: 'image/png', bytes: png }]))), brand);
  for (const f of withImages.files) { const p = join(dir, f.path); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, f.bytes ?? f.content); }
  const skill = join(dir, pack.skillName);
  const input = join(skill, 'assets', 'exemplo_input.json');

  it('preparar_arte encaixa a arte no header (1247 x 977) e o caminho B usa o cartão oficial', () => {
    const hasPillow = spawnSync(python!, ['-c', 'import PIL']).status === 0;
    if (!hasPillow) return;
    // Cena falsa: PNG 300 x 200 azul liso, gerado pelo próprio Pillow.
    const scene = join(dir, 'cena_B1.png');
    execFileSync(python!, ['-c', `from PIL import Image; Image.new('RGB', (300, 200), (70, 88, 160)).save(r'${scene}')`]);
    const out = execFileSync(python!, ['-X', 'utf8', join(skill, 'scripts', 'preparar_arte.py'), input, scene, '--email', 'E-mail 4', '--saida', join(dir, 'artes')], { encoding: 'utf8' });
    expect(out).toContain('cartão oficial colocado pelo script');
    const png = readFileSync(join(dir, 'artes', 'arte_cena_B1.png'));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1247, 977]);
    expect(readFileSync(join(dir, 'artes', 'quadro_artes_celular.html'), 'utf8')).toContain('cena_B1');
  });

  it('validar_input aceita o exemplo e só pede revisão do header longo', () => {
    const out = execFileSync(python!, ['-X', 'utf8', join(skill, 'scripts', 'validar_input.py'), input], { encoding: 'utf8' });
    expect(out).toContain('BLOQUEIA (0)');
    expect(out).toContain('E-mail 4.HEADER_TITULO');
  });

  it('validar_input bloqueia marca em transição e fato fora da ficha', () => {
    const bad = structuredClone(fixture);
    bad.emails[0].fields.COPY_1_PRETO.value = 'Compre no Superpão com 90% de desconto';
    const path = join(dir, 'ruim.json'); writeFileSync(path, JSON.stringify(bad));
    const run = spawnSync(python!, ['-X', 'utf8', join(skill, 'scripts', 'validar_input.py'), path], { encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stdout).toContain('Superpão');
    expect(run.stdout).toContain('"90%"');
  });

  it('montar_previa gera o mesmo HTML que a importação do GaaS', () => {
    for (const extra of [[], ['--sem-nome'], ['--rede', 'AVENIDA', '--sem-nome'], ['--rede', 'COMPRE MAIS', '--sem-nome']]) execFileSync(python!, ['-X', 'utf8', join(skill, 'scripts', 'montar_previa.py'), input, ...extra, '--saida', join(dir, 'previa')], { encoding: 'utf8' });
    const prepared = prepareEmailInput(fixture, { briefings, products, guardrails: [] });
    const norm = (s: string) => s.replace(/<img\b[^>]*\bsrc=""[^>]*>/g, '').replace(/data:image\/png;base64,[A-Za-z0-9+/=]+|https:\/\/[^"\s]+?\.(?:png|jpe?g)/g, 'IMG').replace(/\s+/g, ' ');
    for (const [sequence, network, file, name] of [['E-mail 4', 'AMIGAO', 'email4_amigao_nome', 'VANIA'], ['E-mail 3', 'COMPRE MAIS', 'email3_compremais_sem_nome', ''], ['E-mail 4', 'AVENIDA', 'email4_avenida_sem_nome', '']] as const) {
      const row = prepared.rows.find((r) => r.sequence === sequence && r.network === network)!.row;
      const gaas = renderDynamicEmail(PLURIX_V13_TEMPLATE, row, { CPF: '0', PRI_NOME: name, LIMITE: '3500', PRODUTO: network, SEQUENCIA: sequence, TP_CAMPANHA: row.TP_CAMPANHA }, { pendingAssets: 'hidden' }).html;
      expect(norm(readFileSync(join(dir, 'previa', 'emails', `${file}.html`), 'utf8')), file).toBe(norm(gaas));
    }
    const board = readFileSync(join(dir, 'previa', 'quadro_celular.html'), 'utf8');
    expect(board).toContain('E-mail 1 · Semana 1');
    expect(board).toContain('rascunho (atual)');
    expect(board).toContain('proposta (novo)');
    // Sem internet no sandbox: toda imagem do pacote vai embutida no quadro.
    expect(packImageUrls(pack).length).toBeGreaterThan(5);
    expect(board).toContain('data:image/png;base64,');
    expect(board).not.toMatch(/https:\/\/(?:image\.relacionamento|stoplxmkt)[^"]+\.png/);
  });
});
