import { describe, expect, it } from 'vitest';
import {
  allSelectableKeys, buildExportTree, EXPORT_FILENAME_BASE, isPartialSelection, nodeState,
  pruneSelection, sanitizeExportFilename, selectableWeeks, selectionTotals, suggestExportFilename,
  toggleNode, weekKeyFor, type ExportGroupInput,
} from './exportScope';

const group = (partner: string, segment: string, week: number, patch: Partial<ExportGroupInput> = {}): ExportGroupInput => ({
  id: `${partner}-${segment}-${week}-${patch.id ?? '1'}`,
  partner, segment, weekKey: `Semana ${week}`, rowCount: 1, hasErrors: false, ...patch,
});

/** Bem Barato: 4 semanas × 2 e-mails. Plurix: 4 semanas × 2 e-mails × 6 assinaturas. */
const factory = (): ExportGroupInput[] => [
  ...[1, 2, 3, 4].flatMap((week) => [
    group('Bem Barato', 'CRM', week, { id: 'a' }),
    group('Bem Barato', 'CRM', week, { id: 'b' }),
  ]),
  ...[1, 2, 3, 4].flatMap((week) => [
    group('Plurix', 'CRM', week, { id: 'a', rowCount: 6 }),
    group('Plurix', 'CRM', week, { id: 'b', rowCount: 6 }),
  ]),
];

const K = (partner: string, week: number) => weekKeyFor(partner, 'CRM', `Semana ${week}`);

describe('buildExportTree', () => {
  it('monta Parceiro → Régua → Semana em ordem natural', () => {
    const tree = buildExportTree(factory());
    expect(tree.map((node) => node.label)).toEqual(['Bem Barato', 'Plurix']);
    expect(tree[0].rulers.map((ruler) => ruler.label)).toEqual(['CRM']);
    expect(tree[0].rulers[0].weeks.map((week) => week.label))
      .toEqual(['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']);
  });

  it('separa contagem de e-mails da contagem de linhas do CSV', () => {
    const tree = buildExportTree(factory());
    const bemBarato = tree[0].rulers[0].weeks[0];
    const plurix = tree[1].rulers[0].weeks[0];
    expect(bemBarato.emails).toBe(2);
    expect(bemBarato.rows).toBe(2);
    // Plurix multiplica por assinatura: mesmos 2 e-mails, 12 linhas.
    expect(plurix.emails).toBe(2);
    expect(plurix.rows).toBe(12);
    expect(tree[1].rows).toBe(48);
  });

  it('ordena semanas numericamente, não alfabeticamente', () => {
    const tree = buildExportTree([2, 10, 1].map((week) => group('X', 'CRM', week)));
    expect(tree[0].rulers[0].weeks.map((week) => week.label)).toEqual(['Semana 1', 'Semana 2', 'Semana 10']);
  });

  it('usa rótulo de fallback quando o campo vem vazio', () => {
    const tree = buildExportTree([group('', '', 0, { weekKey: '' })]);
    expect(tree[0].label).toBe('Sem parceiro');
    expect(tree[0].rulers[0].label).toBe('Sem segmento');
    expect(tree[0].rulers[0].weeks[0].label).toBe('Sem semana');
  });
});

describe('bloqueio por semana', () => {
  const withError = () => [
    ...factory(),
    group('Bem Barato', 'CRM', 3, { id: 'c', hasErrors: true }),
  ];

  it('trava só a semana que tem e-mail com erro', () => {
    const tree = buildExportTree(withError());
    const weeks = tree[0].rulers[0].weeks;
    expect(weeks.map((week) => week.blocked)).toEqual([false, false, true, false]);
    expect(weeks[2].blockedEmails).toBe(1);
  });

  it('mantém as outras semanas da mesma régua exportáveis', () => {
    const tree = buildExportTree(withError());
    const keys = allSelectableKeys(tree);
    expect(keys.has(K('Bem Barato', 1))).toBe(true);
    expect(keys.has(K('Bem Barato', 2))).toBe(true);
    expect(keys.has(K('Bem Barato', 3))).toBe(false);
    expect(keys.has(K('Bem Barato', 4))).toBe(true);
  });

  it('nunca adiciona semana bloqueada à seleção, nem marcando o pai', () => {
    const tree = buildExportTree(withError());
    const selection = toggleNode(tree[0], new Set<string>(), true);
    expect(selection.has(K('Bem Barato', 3))).toBe(false);
    expect(selection.size).toBe(3);
  });

  it('régua totalmente bloqueada fica unchecked, nunca checked', () => {
    const tree = buildExportTree([group('X', 'CRM', 1, { hasErrors: true })]);
    expect(nodeState(tree[0], new Set())).toBe('unchecked');
    expect(toggleNode(tree[0], new Set<string>(), true).size).toBe(0);
  });
});

describe('estado tri-state', () => {
  it('deriva checked, indeterminate e unchecked do pai a partir das folhas', () => {
    const tree = buildExportTree(factory());
    const partner = tree[0];
    expect(nodeState(partner, new Set())).toBe('unchecked');
    expect(nodeState(partner, new Set([K('Bem Barato', 1)]))).toBe('indeterminate');
    expect(nodeState(partner, new Set([1, 2, 3, 4].map((week) => K('Bem Barato', week))))).toBe('checked');
  });

  it('desmarcar o pai limpa só as folhas dele', () => {
    const tree = buildExportTree(factory());
    const all = allSelectableKeys(tree);
    const next = toggleNode(tree[0], all, false);
    expect(nodeState(tree[0], next)).toBe('unchecked');
    expect(nodeState(tree[1], next)).toBe('checked');
  });
});

describe('selectionTotals', () => {
  it('soma e-mails e linhas apenas do que está marcado', () => {
    const tree = buildExportTree(factory());
    const totals = selectionTotals(tree, new Set([K('Bem Barato', 1), K('Plurix', 1)]));
    expect(totals).toEqual({ emails: 4, rows: 14, weeks: 2, partners: 2 });
  });

  it('seleção vazia zera tudo', () => {
    expect(selectionTotals(buildExportTree(factory()), new Set()))
      .toEqual({ emails: 0, rows: 0, weeks: 0, partners: 0 });
  });
});

describe('isPartialSelection', () => {
  it('acusa parcial quando sobra semana exportável do parceiro escolhido', () => {
    const tree = buildExportTree(factory());
    expect(isPartialSelection(tree, new Set([K('Bem Barato', 1)]))).toBe(true);
  });

  it('não acusa quando o parceiro entra inteiro', () => {
    const tree = buildExportTree(factory());
    const complete = new Set([1, 2, 3, 4].map((week) => K('Bem Barato', week)));
    expect(isPartialSelection(tree, complete)).toBe(false);
  });

  it('semana bloqueada não conta como sobra', () => {
    const tree = buildExportTree([...factory(), group('Bem Barato', 'CRM', 3, { id: 'c', hasErrors: true })]);
    const exportable = new Set([1, 2, 4].map((week) => K('Bem Barato', week)));
    expect(isPartialSelection(tree, exportable)).toBe(false);
  });

  it('seleção vazia não é parcial', () => {
    expect(isPartialSelection(buildExportTree(factory()), new Set())).toBe(false);
  });
});

describe('pruneSelection', () => {
  it('descarta chave que não existe mais ou que passou a estar bloqueada', () => {
    const tree = buildExportTree([...factory(), group('Bem Barato', 'CRM', 2, { id: 'c', hasErrors: true })]);
    const stale = new Set([K('Bem Barato', 1), K('Bem Barato', 2), K('Fantasma', 9)]);
    expect([...pruneSelection(tree, stale)]).toEqual([K('Bem Barato', 1)]);
  });
});

describe('suggestExportFilename', () => {
  const tree = buildExportTree(factory());

  it('sem parceiro único mantém o nome genérico', () => {
    const all = allSelectableKeys(tree);
    expect(suggestExportFilename(tree, all, '2026-09-04'))
      .toBe(`${EXPORT_FILENAME_BASE}_2026-09-04.csv`);
  });

  it('um parceiro inteiro entra com o slug do parceiro', () => {
    const complete = new Set([1, 2, 3, 4].map((week) => K('Bem Barato', week)));
    expect(suggestExportFilename(tree, complete, '2026-09-04'))
      .toBe(`${EXPORT_FILENAME_BASE}_bem-barato_2026-09-04.csv`);
  });

  it('parceiro parcial acrescenta as semanas em ordem', () => {
    const partial = new Set([K('Bem Barato', 4), K('Bem Barato', 1)]);
    expect(suggestExportFilename(tree, partial, '2026-09-04'))
      .toBe(`${EXPORT_FILENAME_BASE}_bem-barato_S1-S4_2026-09-04.csv`);
  });

  it('remove acento e espaço do slug do parceiro', () => {
    const acented = buildExportTree([group('Supermercado São João', 'CRM', 1)]);
    expect(suggestExportFilename(acented, allSelectableKeys(acented), '2026-09-04'))
      .toBe(`${EXPORT_FILENAME_BASE}_supermercado-sao-joao_2026-09-04.csv`);
  });
});

describe('sanitizeExportFilename', () => {
  it('remove caractere inválido de caminho e mantém .csv', () => {
    expect(sanitizeExportFilename('rela/tório:teste*?"<>|')).toBe('relatórioteste.csv');
  });

  it('não duplica a extensão', () => {
    expect(sanitizeExportFilename('arquivo.csv')).toBe('arquivo.csv');
    expect(sanitizeExportFilename('arquivo.CSV')).toBe('arquivo.csv');
  });

  it('nunca devolve nome vazio', () => {
    expect(sanitizeExportFilename('')).toBe(`${EXPORT_FILENAME_BASE}.csv`);
    expect(sanitizeExportFilename('   ')).toBe(`${EXPORT_FILENAME_BASE}.csv`);
    expect(sanitizeExportFilename('///')).toBe(`${EXPORT_FILENAME_BASE}.csv`);
  });

  it('descarta caractere de controle e limita o tamanho', () => {
    expect(sanitizeExportFilename('a bc')).toBe('abc.csv');
    expect(sanitizeExportFilename('x'.repeat(300))).toBe(`${'x'.repeat(120)}.csv`);
  });

  it('preserva acento — só o inválido de sistema de arquivo cai', () => {
    expect(sanitizeExportFilename('régua-são-joão')).toBe('régua-são-joão.csv');
  });
});

describe('selectableWeeks', () => {
  it('lista apenas as semanas exportáveis, achatando a árvore', () => {
    const tree = buildExportTree([...factory(), group('Plurix', 'CRM', 2, { id: 'c', hasErrors: true })]);
    const weeks = selectableWeeks(tree);
    expect(weeks).toHaveLength(7);
    expect(weeks.every((week) => !week.blocked)).toBe(true);
  });
});
