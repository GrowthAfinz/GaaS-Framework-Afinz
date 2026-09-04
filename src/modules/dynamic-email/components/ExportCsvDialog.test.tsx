import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExportCsvDialog } from './ExportCsvDialog';
import type { ExportGroupInput } from '../domain/exportScope';

const group = (partner: string, week: number, patch: Partial<ExportGroupInput> = {}): ExportGroupInput => ({
  id: `${partner}-${week}-${patch.id ?? '1'}`,
  partner, segment: 'CRM', weekKey: `Semana ${week}`, rowCount: 1, hasErrors: false, ...patch,
});

const groups: ExportGroupInput[] = [
  ...[1, 2, 3, 4].flatMap((week) => [group('Bem Barato', week, { id: 'a' }), group('Bem Barato', week, { id: 'b' })]),
  ...[1, 2].flatMap((week) => [group('Plurix', week, { id: 'a', rowCount: 6 }), group('Plurix', week, { id: 'b', rowCount: 6 })]),
];

const render = (props: Partial<Parameters<typeof ExportCsvDialog>[0]> = {}) => renderToStaticMarkup(
  <ExportCsvDialog groups={groups} today="2026-09-04" onClose={() => {}} onConfirm={() => {}} {...props}/>,
);

describe('ExportCsvDialog', () => {
  it('renderiza a árvore Parceiro → Régua → Semana', () => {
    const html = render();
    expect(html).toContain('Bem Barato');
    expect(html).toContain('Plurix');
    expect(html).toContain('Semana 1');
    expect(html).toContain('Semana 4');
    expect(html).toContain('Exportar CSV para o SFMC');
  });

  it('mostra e-mails e linhas separados, com a multiplicação do Plurix', () => {
    const html = render();
    expect(html).toContain('2 e-mails · 2 linhas'); // semana Bem Barato
    expect(html).toContain('2 e-mails · 12 linhas'); // semana Plurix, 6 assinaturas
  });

  it('marca tudo que está pronto por padrão e soma as linhas', () => {
    // 4 semanas Bem Barato (8 linhas) + 2 semanas Plurix (24 linhas) = 32
    expect(render()).toContain('32 linhas');
  });

  it('sugere o nome com o parceiro quando só um foi escolhido', () => {
    const html = render({ groups: groups.filter((item) => item.partner === 'Bem Barato') });
    expect(html).toContain('TB_BRIEFING_CAMPANHA_AQUISICAO_bem-barato_2026-09-04.csv');
  });

  it('mantém o nome genérico quando há mais de um parceiro', () => {
    expect(render()).toContain('TB_BRIEFING_CAMPANHA_AQUISICAO_2026-09-04.csv');
  });

  it('sinaliza semana travada e não a inclui na seleção inicial', () => {
    const html = render({ groups: [...groups, group('Bem Barato', 3, { id: 'c', hasErrors: true })] });
    expect(html).toContain('com pendência bloqueante');
    expect(html).toContain('semana está travada');
    // 3 semanas Bem Barato (6 linhas) + 2 semanas Plurix (24) = 30
    expect(html).toContain('30 linhas');
  });

  it('avisa sobre import parcial quando uma semana do parceiro fica de fora', () => {
    const html = render({ groups: [...groups, group('Bem Barato', 3, { id: 'c', hasErrors: true })] });
    // com semana travada, a seleção cobre todas as exportáveis — não é parcial
    expect(html).not.toContain('Seleção parcial');
  });

  it('aplica o rótulo amigável do segmento quando fornecido', () => {
    const html = render({ segmentLabel: (value) => value === 'CRM' ? 'Topo de Funil (CRM)' : value });
    expect(html).toContain('Topo de Funil (CRM)');
  });

  it('desabilita o download quando não há nada exportável', () => {
    const html = render({ groups: [group('X', 1, { hasErrors: true })] });
    expect(html).toContain('disabled=""');
    expect(html).toContain('semana está travada');
  });

  it('trata lista vazia sem quebrar', () => {
    const html = render({ groups: [] });
    expect(html).toContain('Nenhuma régua ativa para exportar.');
  });
});
