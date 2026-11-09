import { describe, it, expect } from 'vitest';
import { VDV_POOL_TEMPLATE } from '../fixtures/vaiDeVisaPoolTemplate';
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from '../fixtures/vdvBF26V1.csv';
import { parseVdvBriefingCsv, parseVdvMovimentoCsv, resolveVdvPreview, VDV_SAMPLES } from './vaiDeVisa';
import { emptyBriefingRow } from './briefing';
import { renderDynamicEmail } from '../ampscript/renderer';

describe('Pool desktop 2 + 1', () => {
  for (const touch of ['V1','V2'] as const) for (const count of [1,2,3]) {
    it(`${touch}: ${count} ofertas, na ordem e sem duplicação`, () => {
      const resolved = resolveVdvPreview({ briefing: parseVdvBriefingCsv(VDV_BRIEFING_CSV), movimento: parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV), sample: VDV_SAMPLES[0].sample, versaoEmail: touch, today:'2026-11-05' });
      const output = renderDynamicEmail(VDV_POOL_TEMPLATE, emptyBriefingRow(), {CPF:'00000000000',PRI_NOME:'ANA',LIMITE:'',PRODUTO:'',SEQUENCIA:'',TP_CAMPANHA:''}, {vars:{...resolved.vars,N:String(count)}});
      expect(output.diagnostics).toEqual([]);
      const grid = output.html.split('<!-- VDV:')[1].split('<!-- CONDIÇÕES -->')[0];
      expect([...grid.matchAll(/SLOT (\d)/g)].map(x=>Number(x[1]))).toEqual(Array.from({length:count},(_,i)=>i+1));
      if(count===3) expect(grid).toMatch(/SLOT 2[\s\S]*?<\/table><\/td><\/tr>[\s\S]*?vdv-space[\s\S]*?SLOT 3/);
      expect(output.html).toContain('.vdv-card');
      expect(output.html).toContain('.afz-grid > colgroup { display:none !important; }');
      expect(grid).toContain('<colgroup><col width="25%" style="width:25%;"><col width="50%" style="width:50%;"><col width="25%" style="width:25%;"></colgroup>');
    });
  }
});
