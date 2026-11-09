import { describe, expect, it } from 'vitest';
import patch from '../fixtures/vdvBF26CtaLegal.json';
import { VDV_POOL_TEMPLATE } from '../fixtures/vaiDeVisaPoolTemplate';
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from '../fixtures/vdvBF26V1.csv';
import { parseVdvBriefingCsv, parseVdvMovimentoCsv, resolveVdvPreview, VDV_SAMPLES } from './vaiDeVisa';
import { renderDynamicEmail } from '../ampscript/renderer';
import { emptyBriefingRow } from './briefing';

const LEGAL = patch.theme.CONDICOES;
const person = { CPF: '00000000000', PRI_NOME: 'ANA', LIMITE: '', PRODUTO: '', SEQUENCIA: '', TP_CAMPANHA: '' };

function render(touch: 'V1' | 'V2', count: number, overrides: Record<string, string> = {}) {
  const briefing = parseVdvBriefingCsv(VDV_BRIEFING_CSV).map(row => ({ ...row, ...(row.ID === patch.theme.ID ? patch.theme : {}) }));
  const r = resolveVdvPreview({ briefing, movimento: parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV), sample: VDV_SAMPLES[0].sample, versaoEmail: touch, today: '2026-11-09' });
  const out = renderDynamicEmail(VDV_POOL_TEMPLATE, emptyBriefingRow(), person, { vars: { ...r.vars, N: String(count), ...overrides } });
  expect(out.diagnostics).toEqual([]);
  return { html: out.html, vars: r.vars };
}
const conditions = (html: string) => html.split('<!-- CONDIÇÕES -->')[1].split('</td></tr></table>')[0];

describe('Condições compactas + aviso legal único', () => {
  for (const touch of ['V1', 'V2'] as const) for (const count of [1, 2, 3]) {
    it(`${touch}/${count}: título, uma linha por marca, aviso legal uma vez depois dos resumos`, () => {
      const { html, vars } = render(touch, count);
      const block = conditions(html);
      expect(block).toContain('Condições das ofertas');
      expect(html.split(LEGAL).length - 1).toBe(1);
      const legalAt = block.indexOf(LEGAL);
      for (let slot = 1; slot <= count; slot++) {
        const line = `<b>${vars[`S${slot}Marca`]}:</b> ${vars[`S${slot}Nota`]}<br>`;
        expect(block, `linha da marca ${slot}`).toContain(line);
        expect(block.indexOf(line)).toBeLessThan(legalAt);
      }
      expect((block.match(/<b>[^<]+:<\/b>/g) ?? []).length).toBe(count);
      for (let slot = count + 1; slot <= 3; slot++) expect(block).not.toContain(vars[`S${slot}Nota`] || '§§');
      expect(block).toContain('class="vdv-legal"');
      // rodapé existente preservado, depois do aviso, sem repetir o aviso
      expect(vars.RodCond).toBeTruthy();
      expect(block.indexOf(vars.RodCond)).toBeGreaterThan(legalAt);
      expect(block.split(vars.RodCond).length - 1).toBe(1);
    });
  }
  it('sem aviso no tema não deixa bloco vazio', () => {
    const { html } = render('V1', 3, { AvisoLegal: '' });
    expect(html).not.toContain('class="vdv-legal"');
  });
  it('mantém CTA "Ver mais ofertas" antes das condições e um único', () => {
    const { html } = render('V1', 3);
    expect(html.match(/VDV_VER_MAIS_OFERTAS/g)).toHaveLength(1);
    expect(html.indexOf('VDV_VER_MAIS_OFERTAS')).toBeLessThan(html.indexOf('<!-- CONDIÇÕES -->'));
  });
  it('aviso legal não vira texto fixo no HTML (continua vindo do campo CONDICOES do tema)', () => {
    expect(VDV_POOL_TEMPLATE).not.toContain('definidos e geridos');
  });
  it('contrato de 500 caracteres das condições por oferta intacto', () => {
    const offers = parseVdvBriefingCsv(VDV_BRIEFING_CSV).filter(r => r.TIPO === 'OFERTA');
    expect(offers.every(o => o.CONDICOES.length <= 500)).toBe(true);
    expect(offers.some(o => o.CONDICOES.includes('definidos e geridos'))).toBe(false);
  });
});

describe('Cupom selecionável (alternativa honesta ao botão copiar)', () => {
  it('o template não usa JavaScript nem recursos de clipboard', () => {
    expect(VDV_POOL_TEMPLATE).not.toMatch(/<script|onclick|navigator\.clipboard|execCommand|<button|<form|<input|javascript:/i);
  });
  for (const touch of ['V1', 'V2'] as const) for (const count of [1, 2, 3]) {
    it(`${touch}/${count}: código segue em texto, selecionável, com dica só nos cards com cupom`, () => {
      const { html, vars } = render(touch, count);
      const codes = Array.from({ length: count }, (_, i) => i + 1).filter(s => vars[`S${s}Resg`] === 'CUPOM' && vars[`S${s}Cupom`]);
      expect((html.match(/afz-coupon-hint/g) ?? []).length).toBe(codes.length);
      for (const s of codes) {
        const re = new RegExp(`<div class="afz-coupon"[^>]*user-select:all;">${vars[`S${s}Cupom`].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</div>`);
        expect(html).toMatch(re);
      }
      // CTA de cada oferta preservado, com o link/tracking da oferta
      for (let s = 1; s <= count; s++) expect(html).toContain(`alias="${vars[`S${s}Alias`]}"`);
    });
  }
  it('sem cupom (Pague com Visa / link / sem código) não aparece dica nem seleção', () => {
    for (const resg of ['PAGAR_COM_VISA', 'LINK', '']) {
      const { html } = render('V1', 3, { S1Resg: resg, S2Resg: resg, S3Resg: resg });
      expect(html).not.toContain('afz-coupon-hint');
      expect(html).not.toContain('Selecione o código');
    }
    const { html } = render('V1', 3, { S1Cupom: '', S2Cupom: '', S3Cupom: '' });
    expect(html).not.toContain('afz-coupon-hint');
  });
  it('cupom aparece só no card que o tem', () => {
    const { html } = render('V1', 3, { S1Resg: 'CUPOM', S1Cupom: 'VAIDEVISA15', S2Resg: 'PAGAR_COM_VISA', S3Resg: 'LINK' });
    expect((html.match(/afz-coupon-hint/g) ?? []).length).toBe(1);
    expect(html).toContain('>VAIDEVISA15</div>');
  });
});
