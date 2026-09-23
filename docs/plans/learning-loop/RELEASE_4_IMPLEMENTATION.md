# Release 4 — agenda e revisão de outcomes

**Data:** 2026-09-23  
**Branch:** `codex/growth-learning-release-4-outcomes`  
**Base:** `4a195e4` — correção determinística da timeline da Release 3B integrada à `main`

**Estado:** publicada na `main`, no Supabase e no GitHub Pages em 23/09/2026

## Objetivo

Confrontar o contrato da aposta com resultado verificável sem criar um segundo motor de métricas e sem classificar ação não executada como hipótese refutada.

## Arquitetura

O cálculo quantitativo existente do Report Live continua soberano. Quando um build encontra uma recomendação aprovada cuja janela terminou, `evaluateMaturedOutcomes()` lê a `verification_view`, aplica `maior_melhor`, `menor_melhor` ou `atingir_meta` e grava `report_action_outcomes`.

A Release 4 liga esse registro à aposta por `source_action_candidate_id` e acrescenta uma segunda decisão determinística:

1. execução `partial` → `execution_diverged`;
2. execução diferente de `completed` → `not_verifiable`;
3. razão explícita de mudança de regime → `invalid_premise`;
4. observado ausente → `data_blocked`;
5. somente com execução concluída o resultado quantitativo pode virar `confirmed`, `partially_confirmed` ou `not_confirmed`.

O veredito do sistema nunca é sobrescrito pela revisão humana. Confirmação e contestação ficam em campos separados.

## Persistência e agenda

A migration `20260923034804_growth_outcomes_release_4.sql`:

- estende `report_action_outcomes` com `bet_id`, execução, veredito sistêmico, revisão, contestação, resolução e snapshot de evidência;
- cria triggers para ligar o outcome à aposta e aplicar a regra de execução;
- cria a RPC autenticada `growth_review_outcome`;
- cria `growth_outcomes_due_v` com `due_today`, `overdue`, `waiting_data`, `ready_review`, `reviewed`, `contested`, `not_verifiable` e `scheduled`;
- deriva vencimento de `outcome_window_end`, portanto uma aposta vencida aparece sem depender de outro build;
- classifica updates de execução como `execution_recorded` e outcomes calculados/revisados como `outcome_evaluated` no feed;
- mantém tabelas sem escrita direta para o papel autenticado e publica somente view/RPC governadas.

`outcome_due` fica reservado no contrato do feed para um produtor agendado futuro. A visibilidade automática do vencimento nesta release vem da view, não de polling que escreva eventos ao abrir a tela.

## Interface

`Aprendizado Growth > Outcomes` deixa de ser placeholder e oferece:

- badge de itens que exigem atenção;
- busca e filtros por frente e bucket;
- tabela compacta contrato × observado × execução;
- drawer com baseline, expectativa, direção, janela, medição, evidência e limite;
- ações `Confirmar veredito` e `Contestar` quando há avaliação sistêmica;
- estado explícito para janela vencida ainda sem medição;
- explicação explícita de que ausência e não execução não são zero nem fracasso.

## Gates

- migration completa executada no Postgres real dentro de `BEGIN … ROLLBACK`;
- ensaio transacional real confirmou `not_verifiable` sem execução, `execution_diverged` para parcial e `not_confirmed` somente para execução concluída;
- aposta vencida sem outcome apareceu como `overdue` na view;
- confirmação preservou o veredito sistêmico e contestação preservou motivo;
- nenhum dado sintético permaneceu após o rollback;
- 141 testes frontend verdes;
- 57 testes do Report Live verdes;
- `deno check` verde;
- build Vite verde;
- gate TypeScript manteve 57 diagnósticos históricos e zero novos.

## Fora desta release

- materialização de memória;
- resolução de contestação pela interface;
- scheduler para materializar `outcome_due` no feed;
- editor de contrato aprovado;
- novo motor de métricas ou consulta dinâmica a views arbitrárias pelo navegador;
- execução autônoma de campanha;
- alteração do renderer ou publicação do Report Live.

## Promoção

- PR [#19](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/19) mergeado como `a473a27d1fe034ff23e9e6d906a3e43e79fcc6c3`;
- gate do PR `35815839611` verde após o alinhamento do timestamp da migration;
- migration registrada no Supabase como `20260923034804_growth_outcomes_release_4` antes do merge;
- reconciliação confirmou oito colunas novas, view `security_invoker`, RPC autenticada, ausência de escrita direta e contagens iniciais zeradas;
- workflow pós-merge `35815961161` verde, incluindo o contrato SQL da Release 4 em PostgreSQL 17;
- GitHub Pages publicou o bundle `index-Bc9k64xX.js`, HTTP 200, contendo as superfícies e o contrato `growth_outcomes_due_v`;
- nenhum build, certificação ou publicação de Google Slides/Sheets/PDF foi executado;
- advisors não apontaram novo erro específico da estrutura criada; o alerta da RPC autenticada é intencional para o comando governado, e o índice novo permanece sem uso porque a base começa vazia.
