import { describe, expect, it, vi } from 'vitest';
import type { CatalogEntry, OrphanRow } from '../hooks/useReconciliation';
import type { CommunicationTemplate } from '../types/communication';
import type { MessageContent, TemplateContent } from '../modules/sfmc-package/types';
import type { ProposalRow } from '../services/communicationProposalService';
import type { FrameworkActivity } from './communicationOrchestrator';
import {
  approvalState, buildApprovedLibrary, buildTemplatePerformance, executionMetrics, facetsFromRecords, libraryCounts,
  libraryVisible, matchesFacets, templateMomentLabel,
} from './contentPerformanceModel';
import { applyBatchLinks, batchEligibility, effectiveBatchSelection } from './executionLinkEligibility';
import { resolvePreview } from './communicationVisualResolution';
import { scoreTemplate } from '../components/communications/performance/perfModel';

const act = (patch: Partial<FrameworkActivity> = {}): FrameworkActivity => ({
  id: 'a1', jornada: 'JOR_AQS_B2C_CARRINHO', 'Activity name / Taxonomia': 'afz_car_b2c_aqs_wpp_aba_disp1_pontual', Canal: 'WhatsApp',
  BU: 'B2C', Parceiro: 'Serasa', parceiro_canonico: 'Serasa', parceiro_canonico_confianca: null, Segmento: 'Abandonados', Subgrupos: 'Abandonados D-7',
  Oferta: 'Vibe', Promocional: 'Padrao', 'Oferta 2': null, 'Promocional 2': null, Produto: null, 'Etapa de aquisição': null, 'Perfil de Crédito': null,
  Safra: null, 'Ordem de disparo': null, 'Data de Disparo': '2026-09-10T03:00:00+00:00', 'Horário de Disparo': null, 'Base Total': 1000,
  'Base Acionável': null, template_id: null, Propostas: 4, Aprovados: null, 'Cartões Gerados': 2, Cliques: 30, Abertura: 500, ...patch,
} as FrameworkActivity);
const tpl = (id: string, patch: Partial<CommunicationTemplate> = {}): CommunicationTemplate => ({
  template_id: id, channel: 'WhatsApp', version_label: 'v1', status: 'active', source_system: 'gaas', storage_bucket: 'b', metadata: {},
  created_at: '2026-01-01', updated_at: '2026-01-01', original_path: null, preview_path: null, thumbnail_path: null, ...patch,
} as CommunicationTemplate);
const entry = (t: CommunicationTemplate): CatalogEntry => ({ id: t.template_id, channel: t.channel, hasAsset: !!t.original_path, inCurrentFilter: true, vinc: 0, dims: {} as CatalogEntry['dims'], raw: t });
const content = (templateId: string, channel = 'WhatsApp', isCurrent = true, body: string | null = 'Oi'): TemplateContent => ({
  id: `c-${templateId}-${channel}-${isCurrent}`, template_id: templateId, content_hash: 'h'.repeat(64), is_current: isCurrent, first_seen_at: '2026-09-01T12:00:00Z',
  payload: { schema_version: 1, channel, meta_template_name: null, body_text: body, body_params: [], footer: null, buttons: [], banner_url: null, sms_from: null },
});
const orphan = (records: FrameworkActivity[], templateId: string | null, patch: Partial<OrphanRow> = {}): OrphanRow => ({
  executionRecords: records, period: { start: '2026-09-01', end: '2026-09-30' }, uid: `${records[0].jornada}|${records[0].Canal}|${records[0].id}`,
  name: records[0]['Activity name / Taxonomia'], jornada: records[0].jornada, channel: 'wpp', canalLabel: records[0].Canal, segmentoLabel: records[0].Segmento ?? '—',
  subgrupoLabel: records[0].Subgrupos ?? '—', base: 0, exec: records.length, latestDate: null, parsed: { divergencias: [] } as unknown as OrphanRow['parsed'],
  match: templateId ? { tpl: entry(tpl(templateId)), score: 100, reasons: [] } : null, confidence: templateId ? 'forte' : 'novo', suggestedId: templateId ?? '',
  momentSuggestion: { kind: 'disparo', enabled: true, dispatch: 1, week: null, label: 'Disparo 1', confidence: 'alta', source: 'parser' }, momentConflict: false,
  packEvidence: { source: 'pack', ids: templateId ? [templateId] : [], observedIds: templateId ? [templateId] : [], conflicts: [], reasons: [], reusedJourneys: 0, versions: 1 },
  ...patch,
});

describe('visão 1: com template vinculado', () => {
  it('template com execução no período aparece com métricas reais', () => {
    const perf = buildTemplatePerformance([act({ id: 'x', template_id: 'b2c_wpp_vibe_aba_D1' })], [tpl('b2c_wpp_vibe_aba_D1')]);
    expect(perf).toHaveLength(1);
    expect(perf[0].executions).toBe(1);
    expect(perf[0].cartoes).toBe(2);
    expect(perf[0].timeline[0].date).toBe('2026-09-10');
  });
  it('execução vinculada ainda sem resultado entra, mas sem score (ausência não vira zero)', () => {
    const rec = act({ id: 'y', template_id: 'T1', Propostas: null, 'Cartões Gerados': null, Cliques: null, Abertura: null });
    const [p] = buildTemplatePerformance([rec], [tpl('T1')]);
    expect(p.resultsMeasured).toBe(0);
    expect(scoreTemplate(p).score).toBeNull();
    expect(scoreTemplate(p).diagnoses).toEqual([]);
  });
  it('momento da peça segue o contrato da régua; Dispd1_21d é disparo 1', () => {
    expect(templateMomentLabel('b2c_car21_vibe_srsa_Dispd1_21d')).toBe('Disparo 1');
    expect(templateMomentLabel('b2c_email_copa_bsp_S1D02')).toBe('Semana 1 · Disparo 2');
    expect(templateMomentLabel('plx_wpp_padrao_ngd_D5')).toBe('Disparo 5');
    expect(templateMomentLabel('sem_momento')).toBeNull();
  });
});

describe('visão 2: disparos sem template', () => {
  it('métricas ausentes ficam nulas com cobertura, não zero', () => {
    const m = executionMetrics([act({ id: '1' }), act({ id: '2', 'Base Total': null, 'Cartões Gerados': null })]);
    expect(m.base).toEqual({ value: 1000, covered: 1, total: 2 });
    expect(executionMetrics([act({ 'Cartões Gerados': null })]).cartoes.value).toBeNull();
  });
  it('lote só aceita candidato único, contexto completo e sem conflito; nunca sobrescreve vínculo', () => {
    const cat = [entry(tpl('T1'))];
    expect(batchEligibility(orphan([act()], 'T1'), cat).eligible).toBe(true);
    expect(batchEligibility(orphan([act({ template_id: 'OUTRO' })], 'T1'), cat).reasons.join()).toContain('já vinculada');
    expect(batchEligibility(orphan([act({ Segmento: 'N/A' })], 'T1'), cat).reasons.join()).toContain('Segmento');
    const twoIds = orphan([act()], 'T1', { packEvidence: { source: 'pack', ids: ['T1', 'T2'], observedIds: [], conflicts: [], reasons: [], reusedJourneys: 0, versions: 1 } });
    expect(batchEligibility(twoIds, cat).eligible).toBe(false);
    expect(batchEligibility(orphan([act()], 'T1', { confidence: 'provavel' }), cat).eligible).toBe(false);
    expect(batchEligibility(orphan([act()], 'T1'), [entry(tpl('T1', { channel: 'SMS' }))]).reasons.join()).toContain('Canal');
  });
  it('filtros limitam a seleção do lote ao conjunto visível', () => {
    const cat = [entry(tpl('T1')), entry(tpl('T2'))];
    const a = orphan([act({ id: 'a' })], 'T1');
    const b = orphan([act({ id: 'b', jornada: 'JOR_OUTRA', Segmento: 'Negados' })], 'T2');
    const visible = [a, b].filter((o) => matchesFacets(facetsFromRecords(o.executionRecords), { segmento: 'Abandonados' }));
    const sel = effectiveBatchSelection(visible, new Set([a.uid, b.uid]), cat);
    expect(sel.groups.map((g) => g.uid)).toEqual([a.uid]);
    expect(sel.executions).toBe(1);
  });
  it('aplica só os IDs revisados de cada grupo e reporta falha parcial', async () => {
    const same = orphan([act({ id: 'mesma-jornada' })], 'T1');
    const other = orphan([act({ id: 'outra-jornada', jornada: 'JOR_OUTRA' })], 'T2');
    const calls: string[][] = [];
    const link = vi.fn(async (row: OrphanRow, templateId: string) => {
      calls.push(row.executionRecords.map((r) => r.id));
      if (templateId === 'T2') throw new Error('Execução alterada; atualize e revise novamente');
      return row.executionRecords.length;
    });
    const out = await applyBatchLinks([same, other], 'conferido no pack', link, (e) => (e as Error).message);
    expect(calls).toEqual([['mesma-jornada'], ['outra-jornada']]);
    expect(out.map((o) => o.ok)).toEqual([true, false]);
    expect(out[1].error).toContain('alterada');
  });
  it('aprovar um vínculo move as execuções da visão 2 para a visão 1', () => {
    const rec = act({ id: 'r1' });
    const before = { linked: buildTemplatePerformance([], [tpl('T1')]), orphans: [orphan([rec], 'T1')] };
    expect(before.linked).toHaveLength(0);
    // Após o RPC, a recarga traz a mesma execução com template_id e a fila não a lista mais.
    const linkedRec = { ...rec, template_id: 'T1' };
    const after = { linked: buildTemplatePerformance([linkedRec], [tpl('T1')]), orphans: [] as OrphanRow[] };
    expect(after.linked[0].executions).toBe(1);
    const lib = buildApprovedLibrary({ catalog: [tpl('T1')], contents: null, proposals: [], periodLinked: [linkedRec], historyLinked: [linkedRec], orphans: after.orphans });
    expect(lib[0].periodExecutions).toHaveLength(1);
    expect(lib[0].compatibleOrphans).toHaveLength(0);
  });
});

describe('visão 3: comunicações aprovadas', () => {
  const contents = new Map<string, TemplateContent[]>([['PACK', [content('PACK', 'WhatsApp', false)]]]);
  const catalog = [tpl('ATIVO'), tpl('PACK', { status: 'draft', source_system: 'sfmc_package' }), tpl('RASCUNHO', { status: 'draft', source_system: 'governanca' }), tpl('ARQ', { status: 'archived' })];
  const ready = { status: 'ready', proposed_template_id: 'RASCUNHO', message: { payload: { utm: { af_sub3: 'rascunho' }, asset_name: 'outro' } } } as unknown as ProposalRow;
  const applied = { status: 'applied', proposed_template_id: 'PACK', message: { payload: { utm: { af_sub3: 'pack_original' }, asset_name: 'WPP_CARRINHO_D1' } } } as unknown as ProposalRow;
  const lib = buildApprovedLibrary({ catalog, contents, proposals: [ready, applied], periodLinked: [], historyLinked: [], orphans: [] });
  const byId = (id: string) => lib.find((i) => i.template.template_id === id)!;

  it('aprovação segue o contrato: versão aprovada no pack ou cadastro ativo; ready não é aprovação', () => {
    expect(byId('ATIVO').state).toBe('catalog_active');
    expect(byId('PACK').state).toBe('pack_approved');
    expect(byId('RASCUNHO').state).toBe('draft');
    expect(byId('RASCUNHO').approved).toBe(false);
    expect(byId('ARQ').state).toBe('inactive');
    expect(approvalState(tpl('X', { status: 'paused' }), [])).toBe('catalog_paused');
  });
  it('comunicação aprovada sem execução aparece sem métricas inventadas', () => {
    const item = byId('ATIVO');
    expect(item.approved).toBe(true);
    expect(item.periodExecutions).toEqual([]);
    expect(item.lastUse).toBeNull();
    expect(Object.keys(item)).not.toContain('score');
  });
  it('rascunhos alteram lista e contagem somente quando incluídos', () => {
    const counts = libraryCounts(lib);
    expect(counts).toMatchObject({ approved: 2, drafts: 1, inactive: 1, withExecution: 0 });
    expect(libraryVisible(lib, false).map((i) => i.template.template_id).sort()).toEqual(['ATIVO', 'PACK']);
    expect(libraryVisible(lib, true)).toHaveLength(4);
  });
  it('nome da peça vem do asset_name da ocorrência aprovada, sem substituir o ID', () => {
    expect(byId('PACK').assetNames).toEqual(['WPP_CARRINHO_D1']);
    expect(byId('PACK').template.template_id).toBe('PACK');
    expect(byId('RASCUNHO').assetNames).toEqual([]); // proposta ready com outro af_sub3 não é evidência
  });
});

describe('prévias consolidadas', () => {
  const wpp = (body: string | null = 'Olá'): MessageContent => content('X', 'WhatsApp', true, body).payload;
  it('prioriza a versão atual escolhida e não escolhe outra versão automaticamente', () => {
    const c = new Map([['T1', [content('T1', 'WhatsApp', false, 'Antiga'), content('T1', 'WhatsApp', true, 'Atual')]]]);
    const r = resolvePreview({ channel: 'WhatsApp', catalog: [tpl('T1')], contents: c, templateId: 'T1' });
    expect(r.kind).toBe('pack_current');
    expect(r.content?.body_text).toBe('Atual');
    const none = resolvePreview({ channel: 'WhatsApp', catalog: [tpl('T1')], contents: new Map([['T1', [content('T1', 'WhatsApp', false)]]]), templateId: 'T1' });
    expect(none.kind).toBe('none');
    expect(none.detail).toContain('nenhuma escolhida como atual');
  });
  it('renderiza SMS e Push quando há corpo; valida canal', () => {
    expect(resolvePreview({ channel: 'SMS', catalog: [], contents: new Map([['S', [content('S', 'SMS')]]]), templateId: 'S' }).kind).toBe('pack_current');
    expect(resolvePreview({ channel: 'Push', catalog: [], contents: new Map([['P', [content('P', 'Push')]]]), templateId: 'P' }).kind).toBe('pack_current');
    expect(resolvePreview({ channel: 'SMS', catalog: [], contents: new Map([['S', [content('S', 'WhatsApp')]]]), templateId: 'S' }).kind).toBe('none');
  });
  it('e-mail distingue HTML de imagem e avisa ausência de arquivo', () => {
    const html = tpl('E1', { channel: 'E-mail', original_path: 'crm/email/E1/email.html', mime_type: 'text/html' });
    const img = tpl('E2', { channel: 'E-mail', original_path: 'crm/email/E2/original.png', mime_type: 'image/png' });
    expect(resolvePreview({ channel: 'E-mail', catalog: [html], templateId: 'E1' }).kind).toBe('catalog_html');
    expect(resolvePreview({ channel: 'E-mail', catalog: [img], templateId: 'E2' }).kind).toBe('catalog_image');
    const missing = resolvePreview({ channel: 'E-mail', catalog: [tpl('E3', { channel: 'E-mail' })], templateId: 'E3' });
    expect(missing.kind).toBe('none');
    expect(missing.detail).toContain('E-mail sem HTML');
  });
  it('mensagem do pack deste uso vence; ID original ≠ proposto mantém proveniência de candidato', () => {
    expect(resolvePreview({ channel: 'WhatsApp', catalog: [], packContent: wpp(), candidateId: 'T9' }).kind).toBe('pack_message');
    const proposed = tpl('proposto', { original_path: 'x/original.png', mime_type: 'image/png' });
    const r = resolvePreview({ channel: 'WhatsApp', catalog: [proposed], templateId: 'Original_ID', candidateId: 'proposto' });
    expect(r.kind).toBe('catalog_image');
    expect(r.candidate).toBe(true);
    expect(r.label).toContain('candidato');
    expect(r.templateId).toBe('proposto');
    // caixa preservada: 'original_id' não casa com 'Original_ID'
    expect(resolvePreview({ channel: 'WhatsApp', catalog: [tpl('original_id', { original_path: 'a.png' })], templateId: 'Original_ID' }).kind).toBe('none');
  });
});

describe('momento da execução × momento da peça', () => {
  it('rotula a execução pelo tipo do motor e compara posições numericamente', async () => {
    const { executionMomentLabel, momentsDiffer } = await import('./contentPerformanceModel');
    const m = { kind: 'disparo', dispatch: 3, week: null, label: 'Dia 3', source: 'parser' };
    expect(executionMomentLabel(m)).toBe('Disparo 3');
    expect(executionMomentLabel({ ...m, source: 'manual', label: 'Semana 2 · Disparo 1' })).toBe('Semana 2 · Disparo 1');
    expect(momentsDiffer(m, 'plx_sms_padrao_ngd_D3')).toBe(false);
    expect(momentsDiffer(m, 'plx_sms_padrao_ngd_D2')).toBe(true);
    expect(momentsDiffer({ kind: 'semana_disparo', week: 1, dispatch: 2 }, 'b2c_email_copa_bsp_S2D02')).toBe(true);
    expect(momentsDiffer({ kind: 'pontual', dispatch: 1 }, 'x_D1')).toBeNull();
  });
});
