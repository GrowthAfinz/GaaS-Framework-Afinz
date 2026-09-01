import { describe, expect, it } from 'vitest';
import { emptyBriefingRow } from './briefing';
import { projectMarketingPreview } from './previewProjection';
import { withMeta } from './workspace';

const makeRow = (id: string, sequence: string, image: string) => withMeta(Object.assign(emptyBriefingRow(id), {
  NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'CRM', SEQUENCIA: sequence, HEADER: image,
}), { partner: 'Plurix', segment: 'CRM', subgroup: 'AMIGAO', weekKey: 'Semana 1', campaignGroupId: id });

describe('projectMarketingPreview', () => {
  it('projeta o header governado da sequência sem alterar o briefing editorial', () => {
    const pending = makeRow('e3', 'E-mail 3', '[PENDENTE MKT] HEADER: criar nova peça.');
    const result = projectMarketingPreview(pending, [pending], []);
    expect(result.HEADER).toContain('/semana-01/header-amigao-semana-1.png');
    expect(pending.HEADER).toContain('[PENDENTE MKT]');
  });

  it('mantém headers distintos e fiéis para os e-mails 4 a 8', () => {
    const headers = [4, 5, 6, 7, 8].map((number) => {
      const pending = makeRow(`e${number}`, `E-mail ${number}`, '[PENDENTE MKT] HEADER');
      return projectMarketingPreview(pending, [pending], []).HEADER;
    });
    expect(new Set(headers).size).toBe(5);
    expect(headers).toEqual([
      expect.stringContaining('/semana-02/header-semana1-i2.png'),
      expect.stringContaining('/semana-03/header-i1.png'),
      expect.stringContaining('/semana-03/header-i2.png'),
      expect.stringContaining('/semana-04/header-i1.png'),
      expect.stringContaining('/semana-04/header-i2.png'),
    ]);
  });

  it('não aplica o header Amigão do e-mail 3 a outra assinatura', () => {
    const pending = makeRow('boa-e3', 'E-mail 3', '[PENDENTE MKT] HEADER');
    pending.NM_PRODUTO_INTERNO = 'BOA';
    pending.__meta.subgroup = 'Boa';
    expect(projectMarketingPreview(pending, [pending], []).HEADER).toBe('');
  });
});

