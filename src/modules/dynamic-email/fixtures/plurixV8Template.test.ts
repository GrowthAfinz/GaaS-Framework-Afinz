import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLURIX_UX_V2_TEMPLATE } from './plurixUxV2Template';
import { PLURIX_V8_TEMPLATE } from './plurixV8Template';

describe('PLURIX V8 template recovery', () => {
  it('preserves every governed briefing field from UX v2', () => {
    const fields = [
      'ASSUNTO', 'PRE_CABECALHO', 'HEADER', 'TITULO_COPY_1_AZUL', 'COPY_1_PRETO',
      'TITULO_CTA_1', 'LINK_CTA_1', 'TITULO_COPY_2', 'COPY_2_PRETO', 'TITULO_CTA_2',
      'LINK_CTA_2', 'BANNER_1_CORPO', 'LINK_BANNER_1_CORPO', 'BANNER_2_CORPO',
      'LINK_BANNER_2_CORPO', 'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO', 'NOTA_LEGAL',
    ];
    fields.forEach((field) => {
      expect(PLURIX_UX_V2_TEMPLATE).toContain(`Field(@Row, "${field}")`);
      expect(PLURIX_V8_TEMPLATE).toContain(`Field(@Row, "${field}")`);
    });
  });

  it('preserves both title and price-image blocks used by E-mail 8', () => {
    expect(PLURIX_V8_TEMPLATE).toContain('TreatAsContent(@TituloCopy1)');
    expect(PLURIX_V8_TEMPLATE).toContain('v(@Banner1Corpo)');
    expect(PLURIX_V8_TEMPLATE).toContain('TreatAsContent(@TituloCopy2)');
    expect(PLURIX_V8_TEMPLATE).toContain('TreatAsContent(@Copy2Preto)');
  });

  it('restores CTA 1 to the E-mail 1 branch without losing the regular CTA', () => {
    expect(PLURIX_V8_TEMPLATE.match(/RedirectTo\(TreatAsContent\(@LinkCTA1\)\)/g)).toHaveLength(2);
  });

  it('keeps only the SFMC-generated sender footer', () => {
    expect(PLURIX_V8_TEMPLATE).not.toContain('NOT EMPTY(@Rodape)');
    expect(PLURIX_V8_TEMPLATE).not.toContain('TreatAsContent(@Rodape)');
    expect(PLURIX_V8_TEMPLATE).toContain('%%Member_Busname%%');
    expect(PLURIX_V8_TEMPLATE).toContain('%%profile_center_url%%');
  });

  it('preserves lookup, tracking and all three governed banner slots', () => {
    expect(PLURIX_V8_TEMPLATE).toContain('LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO",1');
    expect(PLURIX_V8_TEMPLATE).toContain('<custom name="opencounter" type="tracking"/>');
    expect(PLURIX_V8_TEMPLATE).toContain('v(@Banner1Corpo)');
    expect(PLURIX_V8_TEMPLATE).toContain('v(@Banner2Corpo)');
    expect(PLURIX_V8_TEMPLATE).toContain('v(@Banner3Corpo)');
  });

  it('keeps the shared Supabase source byte-for-byte aligned with the frontend source', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260902145708_recover_plurix_v8_template.sql'), 'utf8');
    expect(migration).toContain(`$plurix_v8$${PLURIX_V8_TEMPLATE}$plurix_v8$`);
  });
});
