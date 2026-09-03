import { describe, expect, it } from 'vitest';
import { emptyBriefingRow } from './briefing';
import { applyWorkspaceField, briefingRowsForView, ensurePlurixVariants, partnerLabel, withMeta } from './workspace';

describe('workspace da Fábrica de E-mails', () => {
  it('preserva N/A e deixa explícito que o parceiro não foi informado', () => {
    expect(partnerLabel('N/A')).toBe('Parceiro não informado (N/A)');
    expect(partnerLabel('Proprietaria')).toBe('Proprietaria');
  });

  it('propaga conteúdo compartilhado e mantém assinatura técnica isolada', () => {
    const group = '00000000-0000-4000-8000-000000000010';
    const a = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000011'), { campaignGroupId: group });
    const b = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000012'), { campaignGroupId: group });
    const shared = applyWorkspaceField([a, b], a.__id, 'ASSUNTO', 'Oferta da semana');
    expect(shared.map((row) => row.ASSUNTO)).toEqual(['Oferta da semana', 'Oferta da semana']);
    const signature = applyWorkspaceField(shared, a.__id, 'HEADER', 'https://example.com/a.jpg');
    expect(signature.map((row) => row.HEADER)).toEqual(['https://example.com/a.jpg', '']);
  });

  it('completa as seis assinaturas Plurix no mesmo grupo visual', () => {
    const row = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000020'), { campaignGroupId: '00000000-0000-4000-8000-000000000030' });
    row.NM_PRODUTO_INTERNO = 'AMIGAO';
    expect(ensurePlurixVariants([row], row.__id)).toHaveLength(6);
  });

  it('não recria uma assinatura desativada globalmente', () => {
    const row = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000040'), { campaignGroupId: '00000000-0000-4000-8000-000000000050' });
    row.NM_PRODUTO_INTERNO = 'AMIGAO';
    const variants = ensurePlurixVariants([row], row.__id, ['COMPRE MAIS']);
    expect(variants).toHaveLength(5);
    expect(variants.some((item) => item.NM_PRODUTO_INTERNO === 'COMPRE MAIS')).toBe(false);
  });

  it('separa a operação corrente da Lixeira sem misturar registros', () => {
    const active = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000060'), { status: 'ready' });
    const discarded = withMeta(emptyBriefingRow('00000000-0000-4000-8000-000000000061'), { status: 'archived' });
    expect(briefingRowsForView([active, discarded], false).map((row) => row.__id)).toEqual([active.__id]);
    expect(briefingRowsForView([active, discarded], true).map((row) => row.__id)).toEqual([discarded.__id]);
  });
});
