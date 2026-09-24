# Release 7B — implementação de apostas relacionadas

**Estado:** candidata; gates locais concluídos, validação SQL no CI e publicação remota pendentes.

## Entrega

- faixa `Apostas desta origem` em Relatórios → Overview, Diário e Mensal de Aquisição;
- a mesma faixa no funil de onboarding selecionado;
- estados `mesma leitura` e `mesma origem`, sem matching textual;
- estado da aposta, expectativa e próxima verificação na própria faixa;
- abertura da aposta relacionada em `Aprendizado Growth > Apostas`;
- ação `Voltar à origem` no drawer da aposta contextual;
- restauração de período, filtros, BU, modo de Relatórios ou funil selecionado;
- view read-only `growth_bet_source_links_v` e índice de lookup do snapshot contextual.

## Contrato de dados

A relação continua armazenada somente em `growth_bets.belief_snapshot.source_context`, congelado pela Release 7A. A view da 7B é uma projeção `security_invoker`; ela não introduz escrita, tabela de associação nem atualização retroativa.

Migração candidata:

- `20260924013705_growth_related_bets_release_7b.sql`.

## Evidência local

- Vitest completo: 23 arquivos, 150 testes verdes;
- testes focados da 7B: 14 testes verdes entre navegação e relação;
- `npm run typecheck:release`: 57 diagnósticos históricos, zero novo;
- `npm run check:edge`: verde;
- `npm run build`: verde;
- inspeção visual em `#funil-preview`: faixa própria entre o cabeçalho e o workspace, sem sobrepor o gráfico.

O teste SQL `test-growth-related-bets-release-7b.mjs` foi incorporado ao `validate.yml`. Como o Docker local continua indisponível, o Postgres 17 do pull request é o gate de banco antes da aplicação remota.

## Pendências para fechar

1. pipeline do pull request verde, inclusive o novo contrato SQL;
2. migration aplicada no projeto `mipiwxadnpwtcgfcedym`;
3. verificação remota de `security_invoker`, grants e índice;
4. merge na `main`;
5. GitHub Pages verde e bundle público reconciliado;
6. vault e ontologia compilada atualizados.

## Limite

A Release 7B não altera Report Live. Seleção e projeção editorial de apostas, outcomes e aprendizados permanecem exclusivas da Release 7C.
