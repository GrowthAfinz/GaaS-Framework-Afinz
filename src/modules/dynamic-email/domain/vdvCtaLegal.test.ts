import { describe, expect, it } from 'vitest';
import patch from '../fixtures/vdvBF26CtaLegal.json';
import { VDV_POOL_TEMPLATE } from '../fixtures/vaiDeVisaPoolTemplate';
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from '../fixtures/vdvBF26V1.csv';
import { parseVdvBriefingCsv, parseVdvMovimentoCsv, resolveVdvPreview, VDV_SAMPLES } from './vaiDeVisa';
import { renderDynamicEmail } from '../ampscript/renderer';
import { emptyBriefingRow } from './briefing';

describe('Pool CTA adicional e aviso por marca', () => {
  for (const touch of ['V1','V2'] as const) for (const count of [1,2,3]) {
    it(`${touch}: ${count} marcas mantêm notas e ganham um único CTA final`, () => {
      const briefing = parseVdvBriefingCsv(VDV_BRIEFING_CSV).map(row => ({...row,...(row.ID===patch.theme.ID?patch.theme:patch.offers.find(o=>o.ID===row.ID))}));
      const r = resolveVdvPreview({briefing,movimento:parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV),sample:VDV_SAMPLES[0].sample,versaoEmail:touch,today:'2026-11-09'});
      const rendered = renderDynamicEmail(VDV_POOL_TEMPLATE,emptyBriefingRow(),{CPF:'00000000000',PRI_NOME:'ANA',LIMITE:'',PRODUTO:'',SEQUENCIA:'',TP_CAMPANHA:''},{vars:{...r.vars,N:String(count)}});
      expect(rendered.diagnostics).toEqual([]);
      expect(rendered.html.match(/VDV_VER_MAIS_OFERTAS/g)).toHaveLength(1);
      expect(rendered.html).toContain(`href="${patch.theme.LINK}"`);
      expect(rendered.html.match(/As ofertas, descontos, benefícios/g)).toHaveLength(count);
      expect(r.vars.Assunto).toContain('Black Afinz: confira as ofertas');
      expect(r.vars.PreHeader).toBe(patch.theme.PREHEADER);
      for (let slot=1;slot<=count;slot++) expect(rendered.html).toContain(r.vars[`S${slot}Url`]);
    });
  }
  it('does not render a dead additional button when the theme has no link', () => {
    const r=resolveVdvPreview({briefing:parseVdvBriefingCsv(VDV_BRIEFING_CSV),movimento:parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV),sample:VDV_SAMPLES[0].sample,versaoEmail:'V1',today:'2026-11-09'});
    const rendered=renderDynamicEmail(VDV_POOL_TEMPLATE,emptyBriefingRow(),{CPF:'00000000000',PRI_NOME:'ANA',LIMITE:'',PRODUTO:'',SEQUENCIA:'',TP_CAMPANHA:''},{vars:r.vars});
    expect(rendered.diagnostics).toEqual([]);
    expect(rendered.html).not.toContain('VDV_VER_MAIS_OFERTAS');
  });
  it('preserves all existing brand conditions and appends the exact approved notice once', () => {
    const old=parseVdvBriefingCsv(VDV_BRIEFING_CSV);
    expect(patch.offers).toHaveLength(66);
    for(const offer of patch.offers){expect(offer.CONDICOES).toContain(old.find(r=>r.ID===offer.ID)!.CONDICOES);expect(offer.CONDICOES.match(/As ofertas, descontos, benefícios/g)).toHaveLength(1);}
  });
});
