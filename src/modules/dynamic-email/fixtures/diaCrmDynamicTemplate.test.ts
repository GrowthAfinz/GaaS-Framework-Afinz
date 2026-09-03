import { describe, expect, it } from 'vitest';
import { DIA_CRM_DYNAMIC_TEMPLATE, DIA_CRM_DYNAMIC_TEMPLATE_ID } from './diaCrmDynamicTemplate';

describe('DIA CRM dynamic template', () => {
  it('keeps one governed template and the 36-field lookup contract', () => {
    expect(DIA_CRM_DYNAMIC_TEMPLATE_ID).toBe('dia-crm-dynamic-v1');
    expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain('LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO"');
    expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain('"NM_PRODUTO_INTERNO",@Produto');
    expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain('"SEQUENCIA",@Sequencia');
    expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain('"TP_CAMPANHA",@TpCampanha');
  });

  it('restores the DIA offers, Vibe benefits and complete footer', () => {
    for (const asset of [
      'd6162872-070f-4e72-af53-93b632946d98.png',
      'a17e95ff-52e3-4e39-8bf6-f71754fa38f0.png',
      'cfbad429-af19-4397-8062-c9df57d5e97c.png',
      'ba613caa-444d-4954-acd0-1b151dada6ec.png',
      'c392c8ff-b97f-4a86-8c56-df49ea5b2374.png',
      'f37dd205-17fa-47d9-a98a-4f538ef8d637.png',
      'ef14c352-0006-411d-b873-9b35c7dffde9.png',
      '787eb5c7-39ee-4b30-987a-0a81a38241a3.png',
    ]) expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain(asset);
    expect(DIA_CRM_DYNAMIC_TEMPLATE).toContain('Afinz, juntos fazemos mais!');
  });
});
