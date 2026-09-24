# Release 7B — implementação de apostas relacionadas

**Estado:** publicada na `main`, no Supabase e no GitHub Pages.

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

Migração versionada:

- `20260924013705_growth_related_bets_release_7b.sql`.

Aplicação remota pelo MCP Supabase:

- `20260924015813_growth_related_bets_release_7b`;
- projeto `mipiwxadnpwtcgfcedym`.

## Evidência local

- Vitest completo: 23 arquivos, 150 testes verdes;
- testes focados da 7B: 14 testes verdes entre navegação e relação;
- `npm run typecheck:release`: 57 diagnósticos históricos, zero novo;
- `npm run check:edge`: verde;
- `npm run build`: verde;
- inspeção visual em `#funil-preview`: faixa própria entre o cabeçalho e o workspace, sem sobrepor o gráfico.
- PR [#27](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/27), run [35945082567](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/35945082567): todos os gates verdes, inclusive `Growth related bets SQL contract` no Postgres 17;
- Vercel preview do PR: verde.

O teste SQL `test-growth-related-bets-release-7b.mjs` foi incorporado ao `validate.yml`. Como o Docker local continua indisponível, o Postgres 17 do pull request é o gate de banco antes da aplicação remota.

O primeiro run do PR expôs uma flutuação anterior no teste da Release 4: o fixture usava `current_date` do runner em UTC, enquanto `growth_outcomes_due_v` classifica a data de negócio em `America/Sao_Paulo`. O fixture passou a usar a mesma data de negócio; nenhuma função, view ou regra de outcome foi alterada.

## Reconciliação remota

- `growth_bet_source_links_v` presente;
- `security_invoker=true`;
- `authenticated` possui `SELECT`; `anon` não possui;
- `growth_bets_context_source_idx` presente;
- zero apostas contextuais reais no momento da verificação, portanto o estado vazio é o resultado correto;
- zero apostas originadas da Fila vazaram para a view;
- Advisors não atribuíram alerta novo à view ou ao índice; os achados retornados são dívida anterior e fora deste corte.

## Fechamento

- PR [#27](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/27) mergeado como `998c9fe`;
- workflow pós-merge [35945457751](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/35945457751) verde;
- GitHub Pages publicou `assets/index-DzP4WOf1.js`, HTTP 200;
- bundle público reconciliado com `Apostas desta origem`, `Voltar à origem`, `mesma leitura` e `growth_bet_source_links_v`;
- vault consolidado atualizado e ontologia recompilada com 184 notas.

## Limite

A Release 7B não altera Report Live. Seleção e projeção editorial de apostas, outcomes e aprendizados permanecem exclusivas da Release 7C.
