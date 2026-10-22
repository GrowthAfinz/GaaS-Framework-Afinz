import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemplateContent } from '../modules/sfmc-package/types';

const mocks = vi.hoisted(() => ({ from: vi.fn(), readContents: vi.fn() }));
vi.mock('./supabaseClient', () => ({ supabase: { from: mocks.from } }));
vi.mock('./sfmcPackageService', () => ({ readContents: mocks.readContents }));
vi.mock('./templateContentIndex', () => ({ indexContents: (rows: TemplateContent[]) => new Map(rows.map(r => [r.template_id, [r]])) }));
import { readActivityPreview } from './activityPreviewService';

let eq: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  eq = vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
  mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });
  mocks.readContents.mockResolvedValue([]);
});

describe('prévia limitada ao template selecionado', () => {
  it('consulta o ID exato e distingue ausência de conteúdo', async () => {
    const result = await readActivityPreview('Case_Sensitive_ID', 'SMS');
    expect(eq).toHaveBeenCalledWith('template_id', 'Case_Sensitive_ID');
    expect(mocks.readContents).toHaveBeenCalledWith('Case_Sensitive_ID');
    expect(result.kind).toBe('none');
  });
  it('propaga erro de acesso em vez de apresentá-lo como ausência', async () => {
    eq.mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } }) });
    await expect(readActivityPreview('TPL', 'SMS')).rejects.toMatchObject({ message: 'permission denied' });
  });
  it('prefere a versão atual aprovada e não uma versão antiga ou outro canal', async () => {
    mocks.readContents.mockResolvedValue([{ template_id: 'TPL', is_current: true, payload: { schema_version: 1, channel: 'SMS', body_text: 'Mensagem atual', body_params: [], buttons: [] } }]);
    expect((await readActivityPreview('TPL', 'SMS')).kind).toBe('pack_current');
    expect((await readActivityPreview('TPL', 'WhatsApp')).kind).toBe('none');
  });
});
