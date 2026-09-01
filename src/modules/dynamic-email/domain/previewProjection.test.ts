import { describe, expect, it } from 'vitest';
import { emptyBriefingRow } from './briefing';
import { projectMarketingPreview } from './previewProjection';
import { withMeta, type WorkspaceBriefing } from './workspace';

const makeRow = (id: string, sequence: string, image: string) => withMeta(Object.assign(emptyBriefingRow(id), {
  NM_PRODUTO_INTERNO: 'AMIGAO', TP_CAMPANHA: 'CRM', SEQUENCIA: sequence, HEADER: image,
}), { partner: 'Plurix', segment: 'CRM', subgroup: 'AMIGAO', weekKey: 'Semana 1', campaignGroupId: id });

describe('projectMarketingPreview', () => {
  it('projeta um ativo real da mesma bandeira sem alterar o briefing editorial', () => {
    const pending = makeRow('e3', 'E-mail 3', '[PENDENTE MKT] HEADER: criar nova peça.');
    const source = makeRow('e2', 'E-mail 2', 'https://cdn.example.com/amigao-header.jpg');
    const result = projectMarketingPreview(pending, [pending, source] as WorkspaceBriefing[], []);
    expect(result.HEADER).toBe(source.HEADER);
    expect(pending.HEADER).toContain('[PENDENTE MKT]');
  });

  it('remove o placeholder da projeção quando ainda não existe ativo compatível', () => {
    const pending = makeRow('e3', 'E-mail 3', '[PENDENTE MKT] HEADER: criar nova peça.');
    expect(projectMarketingPreview(pending, [pending], []).HEADER).toBe('');
  });
});

