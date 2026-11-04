import { describe, expect, it } from 'vitest';
import {
  anchorStillMatches, buildQuoteAnchor, editorialDate, EMPTY_FILTERS, healthSummary, humanReviewOf, isGeneratedNote,
  matchesFilters, resolvePage, reviewQueue, sortItems, statusLabel, type FeedbackItem, type ReviewNote, type ReviewRecord,
} from './feedbackModel';

const item = (patch: Partial<FeedbackItem> = {}): FeedbackItem => ({
  id: 'i1', revision: 1, kind: 'knowledge', item_type: 'contradicao', body: 'Dispersão de CAC diverge', front: 'Aquisição CRM', subject: null,
  surface: 'vault', page_label: 'Wiki', location_label: 'Wiki › CAC', route: '', target_type: 'note', target_id: '01-Conceitos/CAC.md',
  anchor: {}, anchor_state: 'none', context: {}, status: 'open', priority: null, decision_note: null, decided_at: null, decided_via: null,
  executor: null, proposal: null, review_note: null, contribution_id: null, work_item_id: null, result_ref: null,
  created_by: 'u', created_at: '2026-11-03T10:00:00Z', updated_by: null, updated_at: '2026-11-03T10:00:00Z', ...patch,
});

describe('tag de página', () => {
  it('nota ou item de leitura vira Wiki', () => {
    expect(resolvePage('?view=learning&section=vault&item=x')).toEqual({ surface: 'vault', pageLabel: 'Wiki' });
    expect(resolvePage('?view=learning&section=results').pageLabel).toBe('Wiki');
  });
  it('outras abas usam o nome da página', () => {
    expect(resolvePage('?view=learning&section=investigations').pageLabel).toBe('Testes e Tarefas');
    expect(resolvePage('?view=learning&section=records').pageLabel).toBe('Registros');
    expect(resolvePage('?view=midia-paga')).toEqual({ surface: 'midia-paga', pageLabel: 'Mídia Paga' });
    expect(resolvePage('').pageLabel).toBe('Launch Planner');
  });
});

describe('âncora por citação', () => {
  const text = 'CAC isolado não é o objetivo. Varia fortemente por canal: há dispersão de ~3,2x entre canais (ver CAC-por-Canal).';
  it('guarda trecho, prefixo e sufixo', () => {
    const a = buildQuoteAnchor(text, '  dispersão de\n ~3,2x ', 'Contexto');
    expect(a.exact).toBe('dispersão de ~3,2x');
    expect(a.prefix?.endsWith('canal: há ')).toBe(true);
    expect(a.suffix?.startsWith(' entre canais')).toBe(true);
    expect(a.heading).toBe('Contexto');
  });
  it('fica órfã quando o trecho some', () => {
    const a = buildQuoteAnchor(text, 'dispersão de ~3,2x');
    expect(anchorStillMatches(a, text)).toBe(true);
    expect(anchorStillMatches(a, text.replace('3,2x', '3,7x'))).toBe(false);
    expect(anchorStillMatches({}, 'qualquer')).toBe(true);
  });
});

describe('fila', () => {
  it('filtra por página, frente, estado, busca e alvo', () => {
    const items = [item(), item({ id: 'i2', page_label: 'Mídia Paga', kind: 'app_adjustment', front: null, target_id: null, body: 'Filtro de período não muda o gráfico' }), item({ id: 'i3', status: 'applied' })];
    expect(items.filter(i => matchesFilters(i, EMPTY_FILTERS)).map(i => i.id)).toEqual(['i1', 'i2']);
    expect(items.filter(i => matchesFilters(i, { ...EMPTY_FILTERS, page: 'Mídia Paga' })).map(i => i.id)).toEqual(['i2']);
    expect(items.filter(i => matchesFilters(i, { ...EMPTY_FILTERS, onlyApp: true })).map(i => i.id)).toEqual(['i2']);
    expect(items.filter(i => matchesFilters(i, { ...EMPTY_FILTERS, state: 'closed' })).map(i => i.id)).toEqual(['i3']);
    expect(items.filter(i => matchesFilters(i, { ...EMPTY_FILTERS, q: 'DISPERSÃO', targetId: '01-Conceitos/CAC.md' })).map(i => i.id)).toEqual(['i1']);
  });
  it('prioridade combinada vem antes, depois os mais recentes', () => {
    const sorted = sortItems([item({ id: 'a', created_at: '2026-11-03' }), item({ id: 'b', priority: 2 }), item({ id: 'c', priority: 1 }), item({ id: 'd', created_at: '2026-11-04' })]);
    expect(sorted.map(i => i.id)).toEqual(['c', 'b', 'd', 'a']);
    expect(statusLabel({ status: 'in_conversation', priority: 1 })).toBe('Na conversa · prioridade 1');
  });
});

describe('saúde do acervo', () => {
  const notes: ReviewNote[] = [
    { id: '1', relative_path: '01-Conceitos/CAC.md', title: 'CAC', status: 'confirmado', content_hash: 'h1', updated: '2026-06-08' },
    { id: '2', relative_path: '06-Performance/CAC-por-Canal.md', title: 'CAC por Canal', status: 'confirmado', content_hash: 'h2', updated: '2026-06-10' },
    { id: '3', relative_path: '07-Evolucao/Assunto-CRM-0104a32e90.md', title: 'Assunto', status: 'candidato', content_hash: 'h3', updated: '2026-10-03' },
    { id: '4', relative_path: '09-Inteligencia-IA/Nova.md', title: 'Nova', status: 'confirmado', content_hash: 'h4', updated: '2026-11-03' },
  ];
  const reviews: ReviewRecord[] = [
    { relative_path: '01-Conceitos/CAC.md', content_hash: 'h1', verdict: 'ok', reviewed_at: '2026-11-04' },
    { relative_path: '06-Performance/CAC-por-Canal.md', content_hash: 'velho', verdict: 'ok', reviewed_at: '2026-10-01' },
  ];
  it('revisão vale só para a versão atual da nota', () => {
    expect(humanReviewOf(notes[0], reviews)?.verdict).toBe('ok');
    expect(humanReviewOf(notes[1], reviews)).toBeNull();
  });
  it('fila de revisão ignora geradas e já revisadas, mais antigas primeiro', () => {
    expect(reviewQueue(notes, reviews).map(n => n.id)).toEqual(['2', '4']);
    expect(isGeneratedNote('07-Evolucao/Assunto-CRM-0104a32e90.md')).toBe(true);
  });
  it('resume revisadas, vencidas, geradas e notas com correção aberta', () => {
    const summary = healthSummary(notes, reviews, [item()], new Date('2026-11-03T12:00:00'));
    expect(summary).toEqual({ total: 4, reviewed: 1, stale: 2, generated: 1, withOpenItems: 1 });
  });
  it('lê a data editorial do frontmatter', () => {
    expect(editorialDate({ atualizado: '"2026-10-02"' })).toBe('2026-10-02');
    expect(editorialDate({ atualizado: 'AAAA-MM-DD' })).toBeNull();
    expect(editorialDate(null)).toBeNull();
  });
});
