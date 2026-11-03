---
tags: [growth, gaas, aprendizado, memoria, outcome, report-live, produto]
tipo: inteligencia-ia
camada: operacao
tipo_diataxis: explanation
criado: 2026-09-22
atualizado: 2026-10-31
status: release-7c-candidata
fonte: decisao-produto-pablo-codex
aliases: [Aprendizado Growth, Growth Learning Loop]
---

# Loop de aprendizado Growth

## Direção macro registrada em 31/10/2026

Pablo reposicionou os agentes como motor generativo de execução do Loop, ativado por pedido
explícito via skill ao Claude/Codex. Fila e Wiki são as superfícies prioritárias. Ativação e
releitura, interpretação de gatilhos/resultados, investigação/execução, aprendizado e reutilização
compõem o ciclo a planejar. O framework ainda não está finalizado.

Há direções futuras para Assuntos, Testes e Tarefas/cross-sell, geração assíncrona de PPTX,
incorporação de Apostas aos testes, revisão de Outcomes e novo Registros com fichas/histórico
integral de agentes. Não representam mudanças já aplicadas às telas. Detalhes e histórico em
[[Motor-de-Agentes-Loop-de-Memoria-2026-10]]; backlog em [[Backlog-Desenvolvimento-GaaS-Loop-2026-10]].
As seções anteriores de releases abaixo são preservadas como histórico, com suas datas e limites.


## Definição

O **Loop de aprendizado Growth** é a capacidade operacional do GaaS que transforma sinais de CRM Aquisição, Mídia Paga e Originação B2C em apostas acompanháveis, outcomes verificáveis e memória reutilizável.

O submenu no GaaS se chama **Aprendizado Growth**. A visualização editorial continua se chamando **Report Live**.

```text
Sinal → Interpretação → Aposta → Execução → Outcome → Aprendizado → Reutilização
```

## Arquitetura de produto

Dentro de `Relatórios`, o GaaS passa a prever:

```text
Overview | Diário | Mensal | Relatórios | Aprendizado Growth
```

O workspace Aprendizado Growth possui:

- **Fila:** feed sistêmico para avaliar sinais e recomendações;
- **Apostas:** decisões assumidas, execução, checklist e histórico;
- **Outcomes:** verificação de resultado e contestação de veredito;
- **Memória:** aprendizados classificados, versionados e com validade;
- **Report Live:** geração, certificação, publicação, recovery e histórico editorial.

## Feed

A Fila é a home e funciona como um feed de trabalho. Apenas o sistema publica. O operador age sobre os posts; suas ações geram novos eventos sistêmicos.

Ordenações:

- prioridade;
- recentes;
- relevância operacional.

Não há posts humanos, curtidas, reações ou comentários no feed no primeiro lançamento. Comentários existem dentro das apostas.

## Apostas e outcomes

Uma aposta registra hipótese, ação, baseline, expectativa, critério de sucesso, janela e evidência congelada. Owner individual é opcional; frente/time permanece obrigatório.

O sistema calcula o outcome quando a janela vence. O usuário pode confirmar ou contestar. A avaliação separa execução, disponibilidade do dado, comparabilidade e resultado, evitando tratar ação não executada como hipótese refutada.

## Memória

Todo outcome resolvido materializa memória automaticamente, inclusive:

- confirmado;
- parcialmente confirmado;
- não confirmado;
- premissa inválida;
- inconclusivo;
- não verificável.

Toda memória tem escopo, evidência, confiança, regime e data de revisão obrigatória. Correções solicitadas a uma LLM via Supabase geram nova revisão e preservam a anterior.

Essa decisão atualiza a proposta da [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]]: textos livres da IA continuam sem virar fato automaticamente, mas um outcome estruturado e resolvido passa a materializar conhecimento sem uma segunda fila manual de promoção.

## Report Live

O Report Live continua sendo a visualização editorial. Seus controles operacionais deixam a área de downloads e passam para `Aprendizado Growth > Report Live`.

- `Relatórios`: consumo, links e downloads;
- `Aprendizado Growth > Report Live`: build, certificação, publicação, recovery e histórico.

## Release 1 — fundação implementada

Em 22/09/2026, a branch `codex/growth-learning-release-1`, no commit `2804c82` (`feat: add Growth learning workspace foundation`), implementou o primeiro corte sem criar schema:

- novo workspace com `Fila | Apostas | Outcomes | Memória | Report Live`;
- deep-link por `?view=learning&section=<section>`;
- entrada pelo menu Análise e pelo seletor interno de Relatórios;
- operação do Report Live no novo workspace;
- consumo da publicação ativa em Relatórios, sem controles operacionais;
- separação entre publicação válida e candidata mais recente;
- estados honestos de fundação para as quatro áreas ainda sem produtores.

A inspeção read-only mostrou a mesma publicação ativa nos dois contextos: agosto/2026, versão 8, publicada em 13/09/2026 às 09:36, com 1.139 linhas sincronizadas. A candidata certificada apareceu somente no workspace operacional.

Evidência visual bruta, fora do Git: `ACALENDARIO APP/artifacts/learning-loop/release-1/`.

Gates: 129 testes Vitest, 57 testes do Report Live, 3 testes Office, Edge Functions, build e TypeScript com zero diagnósticos novos.

O PR #13 foi mergeado na `main` em `aadbae0` no mesmo dia. O workflow `Deploy to GitHub Pages` (`35745047325`) concluiu validação e publicação; o bundle público `index-BXG_xLnS.js` foi servido com HTTP 200 e contém `Aprendizado Growth`, `Report Live publicado` e o contrato de rota `report-live`. A superfície interna exige autenticação, portanto a conferência visual autenticada permanece como UAT, não como bloqueio técnico do artefato publicado.

O artefato imutável no GaaS/Supabase permanece a fonte de verdade. Google Slides, PDF e PPTX são representações.

## Release 2 — Fila sistêmica read-only

Em 22/09/2026, a branch `codex/growth-learning-release-2`, baseada na `main` do PR #13 (`aadbae0`), implementou a Fila real sem antecipar Apostas, Outcomes ou Memória.

O contrato publicado no Supabase adiciona `growth_feed_events` append-only e `growth_feed_v` como projeção `security_invoker`. Produtores transacionais observam somente mudanças materiais em `report_action_candidates`, `report_runs` e `report_publications`; checkpoints técnicos normais permanecem silenciosos. A publicação do Report Live só entra no feed após `published + active + QA passed`.

O backfill inicial materializou 82 eventos em 15 grupos: 31 recomendações, 17 bloqueios de qualidade, 9 candidatas certificadas, 24 bloqueios do Report Live e 1 publicação ativa. Por frente, são 31 eventos de CRM Aquisição, 17 de Mídia Paga e 34 de Report Live. Originação B2C permanece visível com estado vazio explícito porque ainda não existe produtor governado; nenhum conteúdo foi simulado.

A interface oferece prioridade, recentes e relevância determinística; filtros compartilháveis; agrupamento; registry de cards; motivo do score; e drawer com procedência, limite de leitura, referências de view/campo, IDs e ação. O deep-link usa o ID do evento e o back fecha o drawer sem apagar filtros.

Controles de acesso: `authenticated` lê a view sem escrever na tabela; `anon` não lê; as tabelas internas do Report Live continuam fechadas ao frontend. O teste SQL do CI monta PostgreSQL 17, importa a migration rastreada, cobre dedupe, agrupamento, append-only, RLS e rotas.

Gates locais da candidata: 135 testes Vitest, 57 testes Report Live, 3 testes Office, quatro entrypoints Deno, build e TypeScript sem diagnóstico novo. A migration foi ensaiada em transação com rollback antes da publicação e reconciliada depois. O PR #14 passou no Actions (`35752793973`) em 1m19s, incluindo o contrato SQL em PostgreSQL 17 limpo; a integração da UI na `main` depende apenas do merge explícito.

Detalhes executáveis: `docs/plans/learning-loop/RELEASE_2_IMPLEMENTATION.md`.

### Promoção para a main

O PR #14 foi mergeado em 22/09/2026 como `1584d17`. O workflow `Deploy to GitHub Pages` (`35753479391`) repetiu validação, contrato SQL em PostgreSQL 17, TypeScript, Edge Functions e build antes de publicar.

GitHub Pages e Vercel registraram sucesso para o mesmo merge. A página e o bundle público `index-D3eybt62.js` responderam HTTP 200; o bundle contém `Release 2`, `growth_feed_v`, `Fila sistêmica` e o estado explícito da frente B2C sem produtor. O deployment do Vercel exige autenticação para inspeção anônima, portanto sua evidência é o status de produção concluído.

## Release 3A — contrato de aposta em validação

Em 22/09/2026 foi iniciado, a partir da `main` em `1584d17`, o corte de persistência da Release 3. A 3A não adiciona ainda botão, formulário ou workspace operacional: estabelece o contrato transacional que a interface 3B consumirá.

O comando `growth_accept_signal_as_bet` aceita somente recomendações `confirmed` ou `directional` que não pertençam a view de qualidade. A aprovação exige time, hipótese, ação, métrica, baseline, expectativa, direção, critério, janela e view de verificação; owner permanece opcional.

Na mesma transação o banco congela um `growth_evidence_snapshot`, cria `growth_bets`, registra o primeiro item append-only em `growth_bet_updates`, emite `bet_created` no feed e marca a candidata de origem como aceita. Qualquer falha reverte o conjunto inteiro. Origem, evidência e `belief_snapshot` não podem ser reescritos.

A inspeção da base viva encontrou 48 candidatas: 31 `confirmed` e 17 `suspect`. Apenas 3 confirmadas já contêm expectativa, janela e view de verificação. Por isso o sistema não converterá automaticamente sinal incompleto; a futura UI pré-preenche o que existe e exige completar o contrato antes da aprovação.

A migration e o cenário adversarial foram ensaiados contra o schema real dentro de transação encerrada com `ROLLBACK`: 1 aposta, 1 snapshot, 1 update e 1 evento, sem órfãos; candidata aceita; crença e procedência preservadas; grants e view `security_invoker` corretos.

O PR #15 foi mergeado na `main` como `3fde5bc` em 22/09/2026. O workflow `Deploy to GitHub Pages` (`35794413827`) passou pelo PostgreSQL 17, pelos 135 testes de frontend, 57 testes do Report Live, 3 testes Office, TypeScript, Edge Functions e build antes da publicação.

O Supabase registrou a migration `20260922225227_growth_bets_release_3a`. A reconciliação posterior confirmou RLS nas três tabelas, RPC disponível apenas para `authenticated`, ausência de `INSERT` direto para a aplicação, view `security_invoker`, triggers de imutabilidade e contagens iniciais zeradas. Nenhuma aposta sintética foi persistida.

Detalhes executáveis: `docs/plans/learning-loop/RELEASE_3A_IMPLEMENTATION.md`.

## Release 3B — decisão e operação de apostas publicada

Em 22/09/2026, o PR #17 foi mergeado na `main` como `e9db756`. A Release 3B fecha a interação entre a Fila e a aposta sem antecipar Outcomes ou Memória: recomendações elegíveis podem ser assumidas, rejeitadas com motivo ou mescladas a uma aposta ativa da mesma frente.

O formulário pré-preenche apenas fatos presentes no snapshot do sinal. Time e baseline permanecem vazios quando não existem na evidência; uma aposta só é aprovada após hipótese, ação, métrica, baseline, expectativa, direção, critério, janela e view de verificação estarem completos. Owner individual continua opcional.

A área `Aprendizado Growth > Apostas` passa a oferecer busca, filtros, tabela compacta e deep-link. O drawer reúne contrato, evidência congelada, checklist, comentários internos, execução, mudança de estado e timeline. Comentários não geram post; mesclagem, checklist, execução e mudança de estado geram `bet_updated` porque alteram materialmente o ciclo.

O Supabase registrou `growth_bets_release_3b`, adicionando `growth_signal_decisions`, `growth_bet_checklist_items`, a projeção `growth_signal_decisions_v` e RPCs autenticadas para rejeição, mesclagem, checklist e timeline. Cada candidata admite uma única decisão imutável. As duas views operacionais usam `security_invoker`; `authenticated` não possui escrita direta nas tabelas. O estado inicial permaneceu em 0 apostas, 0 decisões e 0 itens de checklist.

A migration e o cenário completo foram validados primeiro com `ROLLBACK` no Postgres real. O PR passou por 139 testes frontend, contrato SQL em PostgreSQL 17, 57 testes do Report Live, 3 testes Office, TypeScript sem diagnóstico novo, Edge Functions e build. O workflow de `main` `35803398333` repetiu os gates e publicou o GitHub Pages. A página e o bundle público `index-DglFengp.js` responderam HTTP 200 e contêm `Release 3B`, `Assumir aposta`, `Apostas contratadas` e `Mesclar à existente`.

Um pipeline documental posterior revelou um desempate não determinístico na timeline quando vários updates compartilham o mesmo `created_at` transacional. O gate não foi relaxado: a migration `growth_bet_timeline_sequence` adicionou uma sequência identity monotônica e a view passou a ordenar a última execução por ela. O PR #18 foi mergeado como `4a195e4`; o workflow `35813046109` repetiu com sucesso o contrato SQL e o deploy. O Supabase foi reconciliado com a coluna identity, índice único, view `security_invoker` e zero updates iniciais.

Detalhes executáveis: `docs/plans/learning-loop/RELEASE_3B_IMPLEMENTATION.md`.

## Release 4 — agenda e revisão de outcomes publicada

Em 23/09/2026, o PR [#19](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/19) foi mergeado na `main` como `a473a27`. A migration `20260923034804_growth_outcomes_release_4` foi aplicada antes do merge e reconciliada com o arquivo rastreado de mesmo timestamp.

A área `Aprendizado Growth > Outcomes` agora deriva a agenda diretamente das janelas contratadas nas apostas. Os buckets distinguem vencimento, atraso, espera por dados, revisão, contestação, conclusão e não verificabilidade. O vencimento aparece sem depender de novo build; a medição continua vindo do avaliador determinístico já existente no Report Live.

A regra de proteção é explícita: sem execução concluída, um resultado nunca pode virar `not_confirmed`. Execução parcial vira `execution_diverged`; execução ausente, cancelada ou desconhecida vira `not_verifiable`; observado ausente vira `data_blocked`; mudança de regime declarada vira `invalid_premise`. Somente uma ação concluída permite comparar `observed_value` e expectativa.

O veredito sistêmico e a revisão humana são campos diferentes. O usuário pode confirmar ou contestar; a contestação preserva o resultado calculado e exige motivo. A Memória não foi antecipada: ela permanece como Release 5.

O ensaio transacional no Postgres real confirmou as três fronteiras de execução e foi encerrado com `ROLLBACK`. O pipeline do PR (`35815839611`) e o workflow pós-merge (`35815961161`) passaram pelo contrato SQL em PostgreSQL 17, 141 testes frontend, 57 testes do Report Live, TypeScript sem diagnóstico novo, Edge Functions e build. O bundle público `index-Bc9k64xX.js` respondeu HTTP 200 e contém `Release 4`, `Agenda de outcomes`, `Confirmar veredito`, `Contestar` e `growth_outcomes_due_v`.

O banco permaneceu sem apostas, outcomes ou eventos sintéticos. A view `growth_outcomes_due_v` usa `security_invoker`; `authenticated` lê a projeção e chama a RPC de revisão, mas não escreve diretamente em `report_action_outcomes`; `anon` não acessa view nem comando.

Detalhes executáveis: `docs/plans/learning-loop/RELEASE_4_IMPLEMENTATION.md`.

## Release 5 — memória versionada publicada

Em 23/09/2026, o PR [#21](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/21) foi mergeado na `main` como `df6827e`. A Release 5 substitui o placeholder da aba Memória por uma biblioteca pesquisável, versionada e com procedência visível.

O modelo separa duas origens que não podem ser tratadas como equivalentes. `outcome` identifica aprendizado produzido somente depois de uma aposta executada, outcome calculado e revisão confirmada ou resolvida. `vault_curated` identifica conhecimento histórico selecionado do vault, com fonte, escopo, limitações, vigência e data de revisão, sem alegar validação pelo loop atual.

O Supabase registrou as migrations `20260923144041_growth_memory_release_5` e `20260923144342_growth_memory_revision_guard_reset`. Foram criadas `growth_learnings`, `growth_learning_revisions`, `growth_learning_links`, `growth_curated_proposals` e a view `growth_memory_active_v` com `security_invoker`. Updates diretos são bloqueados; correções passam por função versionada restrita ao serviço. A segunda migration encerra a autorização interna imediatamente após a atualização versionada, impedindo uma segunda mutação direta na mesma transação.

A curadoria inicial materializou cinco aprendizados históricos: reconciliação numérica não prova uma regra futura; corte de objetivo da série B2C em 23/06/2026; ausência de instrumentação não é desempenho zero; preview local não substitui Test Send no SFMC; e o contrato observado de CSV vence convenções presumidas. Conteúdo de Copa Visa/opt-in não foi incluído porque a campanha está encerrada.

Duas propostas históricas entraram na Fila sem virar aposta fictícia: provar `af_sub3` no raw data do AppsFlyer e revalidar a completude diária Meta → Supabase. Ambas mostram fonte e limite de leitura; não oferecem `Assumir aposta` enquanto faltar contrato quantitativo verificável.

O estado inicial reconciliado é 5 memórias curadas, 5 revisões, 5 links, 2 propostas, 7 eventos de feed e 0 memórias de outcome, coerente com a ausência atual de outcomes revisados. `authenticated` lê a projeção, mas não escreve diretamente; `anon` não lê.

O pipeline do PR (`35877220960`) e o workflow pós-merge (`35877449664`) passaram pelo contrato SQL em PostgreSQL 17, 143 testes frontend, 57 testes do Report Live, TypeScript sem diagnóstico novo, Edge Functions e build. O GitHub Pages publicou `index-UYQZnnK7.js`, HTTP 200, contendo `Release 5`, `Validadas pelo loop`, `Curadas do vault` e `growth_memory_active_v`.

O fechamento documental foi mergeado pelo PR #22 como `2a5f08d`; o workflow pós-merge `35878378133` repetiu todos os gates e republicou o mesmo bundle funcional.

Detalhes executáveis: `docs/plans/learning-loop/RELEASE_5_IMPLEMENTATION.md`.

## Release 6 — reutilização determinística publicada

Em 23/09/2026, o PR [#23](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/23) foi mergeado na `main` como `ec223da`. A Release 6 completa o primeiro circuito de aprendizado: ao assumir uma aposta, o sistema consulta a memória versionada, explica por que cada caso é compatível e exige registrar se o aprendizado foi reutilizado ou descartado.

A recuperação é deliberadamente determinística. Mesma frente, sozinha, não basta. O matcher exige pelo menos uma coincidência específica e exclui conflitos explícitos nas dimensões `metric`, `signal_code`, `partner`, `regime`, `entity`, `entity_key`, `source_view`, `channel`, `platform`, `system`, `artifact`, `rule` e `campaign_family`. Não há embeddings, busca vetorial, similaridade por texto livre nem recomendação generativa neste corte.

Memórias ativas e vigentes podem ser reutilizadas. Revisão vencida aparece como `needs_review` e exige decisão consciente. Memória expirada, contestada, contraditória, substituída, invalidada ou bloqueada aparece somente como alerta e não pode orientar silenciosamente a aposta.

`growth_learning_applications` preserva um snapshot append-only criado na mesma transação da aposta: ID e revisão da memória, decisão `reused` ou `discarded`, justificativa obrigatória do descarte, score, razões do match, elegibilidade e contexto do sinal. Reuso também cria o link `applies_to` para a aposta. O `belief_snapshot` original continua imutável; a consulta fica auditável no registro associado, sem reescrever a crença histórica.

O Supabase registrou `20260923180746_growth_learning_reuse_release_6` e `20260923180940_growth_learning_reuse_candidate_index`. A reconciliação remota confirmou tabela vazia no momento da publicação, cinco memórias ativas, as três colunas de taxa de reuso, RPCs presentes, acesso do matcher restrito a autenticados e view de aplicações inacessível a `anon`. Nos dez sinais reais mais recentes, o matcher retornou zero casos: resultado esperado, pois nenhuma memória existente possui coincidência específica suficiente. A ausência de falso positivo foi preservada em vez de forçar conteúdo na interface.

O advisor apontou a FK de candidato sem cobertura; a segunda migration adicionou `growth_learning_applications_candidate_idx`. Os demais avisos específicos são os índices novos ainda sem uso e o uso intencional de RPCs `security definer` por autenticados, necessário porque os candidatos não são expostos diretamente ao frontend.

O pipeline final do PR (`35900571699`) e o workflow pós-merge (`35907261008`) passaram pelo contrato SQL em PostgreSQL 17, 143 testes frontend, 57 testes do Report Live, gate TypeScript com 57 diagnósticos preexistentes e zero novos, Edge Functions e build. O GitHub Pages publicou `index-DBXuWFmr.js`, HTTP 200, contendo `growth_find_applicable_learnings`, `growth_accept_signal_as_bet_with_memory` e a superfície `Memória aplicável`.

Contrato executável: `docs/plans/learning-loop/RELEASE_6_REUSE_SPEC.md`.

## Release 7A — entrada contextual publicada

Em 23/09/2026, o PR [#25](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/25) foi mergeado na `main` como `9a0786a`; o fechamento documental entrou pelo PR [#26](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/26), com `main` final em `cceac11`. A Release 7A abre o Loop a partir das telas analíticas: Relatórios → Overview, Diário e Mensal e o funil de onboarding selecionado agora possuem uma ação explícita para criar aposta.

O deep-link transporta somente contexto observável: frente, superfície, rota, período, filtros realmente aplicados, entidade e referência visual. Hipótese, ação, baseline, expectativa e critério continuam vazios ou explicitamente preenchidos pelo usuário; o sistema não extrai um número aparente do gráfico nem inventa meta. Fechar o formulário não persiste rascunho.

A transação `growth_create_contextual_bet_with_memory` cria o mesmo agregado das apostas originadas na Fila: evidence snapshot imutável, contrato, timeline, aplicações de memória e evento de feed. A origem contextual usa `source_action_candidate_id = null`, `source_run_id = null` e congela tela, rota, período, filtros e referência visual em `belief_snapshot.source_context`. O matcher passou a ter um núcleo comum `front + context_snapshot`; a Fila e as telas analíticas usam os mesmos pesos, conflitos e estados de elegibilidade.

O Supabase registrou `20260923200039_growth_context_entry_release_7a`. A reconciliação confirmou os dois RPCs, `action_candidate_id` anulável somente com origem contextual, execução permitida para `authenticated` e negada a `anon`, e `growth_bets_operational_v` com `security_invoker=true`. Nenhuma aposta contextual sintética foi criada em produção.

O workflow do PR (`35912744079`) e o deploy pós-merge (`35913808430`) executaram o contrato em PostgreSQL 17, 146 testes Vitest, todos os gates anteriores, TypeScript com zero novos diagnósticos sobre o baseline de 57, Edge Functions e build. O GitHub Pages publicou `index-C4JyqINd.js`, HTTP 200, contendo `Criar aposta`, `Criar aposta deste funil`, `growth_find_applicable_learnings_for_context` e `growth_create_contextual_bet_with_memory`.

A Release 7 continua dividida em cortes: 7B deve exibir a aposta relacionada e permitir voltar à leitura de origem; 7C deve projetar apostas, outcomes e aprendizados materiais no Report Live. A 7A não alterou renderer, build, certificação, Slides, Sheets, PDF ou ponteiro editorial.

Contratos executáveis: `docs/plans/learning-loop/RELEASE_7A_CONTEXT_ENTRY_SPEC.md` e `docs/plans/learning-loop/RELEASE_7A_IMPLEMENTATION.md`.

## Release 7B — retorno à origem publicado

Em 23/09/2026, o PR [#27](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/27) foi mergeado na `main` como `998c9fe`. Overview, Diário, Mensal e os Funis de onboarding agora exibem uma faixa própria de apostas contextuais relacionadas, fora da área do gráfico. Cada item explicita estado, expectativa, relação com a leitura e próxima verificação; abrir o item leva ao drawer governado em `Aprendizado Growth > Apostas`.

A relação não foi duplicada. `growth_bets.belief_snapshot.source_context`, congelado na 7A, permanece como fonte única. A view read-only `growth_bet_source_links_v`, com `security_invoker=true`, projeta o vínculo. `authenticated` possui `SELECT`, `anon` não possui, e o índice `growth_bets_context_source_idx` atende a consulta por frente, rota e entidade.

O critério é determinístico: `mesma leitura` exige frente, rota, entidade, período e filtros iguais; `mesma origem` preserva frente, rota e entidade, mas admite período ou filtros diferentes. Não há similaridade textual, matching por título ou associação automática de apostas nascidas da Fila.

O drawer de uma aposta contextual oferece `Voltar à origem`. O retorno restaura período, filtros, BUs válidas e o modo Overview/Diário/Mensal ou o funil específico. Snapshot inválido ou rota não governada não gera botão nem inferência.

O Supabase registrou `20260924015813_growth_related_bets_release_7b`. Na reconciliação, a view, o índice e os grants estavam corretos; havia zero apostas contextuais reais e zero apostas originadas da Fila na view, portanto o estado vazio publicado é o resultado honesto até a primeira aposta criada a partir de uma tela analítica. Advisors não atribuíram alerta novo ao corte.

O primeiro run do PR revelou e corrigiu apenas uma flutuação de teste anterior: o fixture de Outcomes usava a data UTC do runner enquanto a view usa `America/Sao_Paulo`. Nenhuma regra ou dado de outcome mudou. O run final do PR (`35945312256`) e o workflow pós-merge (`35945457751`) passaram por todos os contratos SQL em PostgreSQL 17, 150 testes Vitest, TypeScript com 57 diagnósticos históricos e zero novos, Edge Functions e build. O GitHub Pages publicou `index-DzP4WOf1.js`, HTTP 200, contendo `Apostas desta origem`, `Voltar à origem`, `mesma leitura` e `growth_bet_source_links_v`.

A 7B não altera Report Live. A seleção e projeção editorial de apostas, outcomes e aprendizados continuam exclusivas da Release 7C.

Contratos executáveis: `docs/plans/learning-loop/RELEASE_7B_RELATED_BETS_SPEC.md` e `docs/plans/learning-loop/RELEASE_7B_IMPLEMENTATION.md`.

## Release 7C — projeção editorial candidata

Em 24/09/2026 foi implementada localmente a candidata que leva o ciclo operacional para os slides C7 e C8 já existentes, sem adicionar slide, arquétipo ou renderer.

O C7 passa a consumir `VIEW_GROWTH_LEARNING_RETROSPECTIVE`. Cada linha declara se é `outcome`, `aprendizado_do_loop` ou `memoria_curada`. Agenda sem `outcome_id` não entra. Memória `vault_curated` declara que orienta contexto, mas não equivale a validação causal pelo loop.

O C8 continua em `VIEW_ACTION_QUEUE`, agora combinando apostas abertas e candidatas determinísticas. `editorial_origin` preserva `growth_bet` versus `report_action_candidate`: aposta é compromisso humano; candidata ainda aguarda decisão.

`growthBets`, `growthOutcomes` e `growthLearnings` entram em `report_frozen_inputs`, nos snapshots e nos hashes do artefato. Assim, C7/C8 podem ser reconstruídos offline a partir do mesmo artefato imutável que sustenta o restante do Report Live.

O estado real anterior ao corte era 1 aposta contextual aberta, 1 agenda ainda sem outcome, 0 outcomes verificados, 5 memórias curadas e 0 aprendizados de outcome. Portanto, um build de setembro deve mostrar a aposta em C8 e declarar 0 outcomes em C7; não deve converter a agenda futura nem as memórias curadas em resultado.

A candidata atualiza source para `1.5`, semantic para `1.5.0` e spec para `3.1`; renderer e perfis 12/31 permanecem inalterados. O PR #29 passou no Actions (`35956153582`), incluindo o contrato da migration em PostgreSQL 17 limpo, e no preview Vercel. A migration e a Edge Function ainda não foram publicadas, o PR ainda não foi mergeado e o deck vivo não foi tocado.

Contratos: `docs/plans/learning-loop/RELEASE_7C_EDITORIAL_SPEC.md` e `docs/plans/learning-loop/RELEASE_7C_IMPLEMENTATION.md`.

## Métrica norte

**Taxa de loops fechados:** apostas elegíveis com outcome revisado e aprendizado persistido, divididas pelas apostas aprovadas cuja janela terminou.

## Implementação incremental

1. workspace e relocação do Report Live;
2. feed sistêmico read-only;
3. sinal para aposta;
4. outcome;
5. memória versionada;
6. reutilização determinística publicada;
7. entrada contextual (7A) e retorno à origem (7B) publicados; projeção no Report Live em candidata 7C.

O primeiro marco de valor é fechar um loop real e reapresentar o aprendizado em uma decisão posterior.

## Documentação executável

O pacote de especificação fica em:

- [Índice do planejamento](../../calendar-estrategico/docs/plans/learning-loop/INDEX.md)
- [Product Spec](../../calendar-estrategico/docs/plans/learning-loop/PRODUCT_SPEC_LOOP_APRENDIZADO_GROWTH.md)
- [UX do feed](../../calendar-estrategico/docs/plans/learning-loop/UX_SPEC_GROWTH_FEED.md)
- [Modelo de domínio](../../calendar-estrategico/docs/plans/learning-loop/DOMAIN_MODEL_GROWTH_LEARNING.md)
- [Modelo de dados](../../calendar-estrategico/docs/plans/learning-loop/DATA_MODEL_GROWTH_LEARNING.md)
- [SDD](../../calendar-estrategico/docs/plans/learning-loop/SDD_GROWTH_LEARNING_WORKSPACE.md)
- [Roadmap](../../calendar-estrategico/docs/plans/learning-loop/IMPLEMENTATION_ROADMAP.md)
- [Release 7A — contrato](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7A_CONTEXT_ENTRY_SPEC.md)
- [Release 7A — implementação](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7A_IMPLEMENTATION.md)
- [Release 7B — contrato](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7B_RELATED_BETS_SPEC.md)
- [Release 7B — implementação](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7B_IMPLEMENTATION.md)
- [Release 7C — contrato editorial](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7C_EDITORIAL_SPEC.md)
- [Release 7C — implementação](../../calendar-estrategico/docs/plans/learning-loop/RELEASE_7C_IMPLEMENTATION.md)

## Relacionado

- [[Report-Live-Enciclopedia]]
- [[Report-Live-Loop-de-Outcome]]
- [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]]
- [[Report-Live-Versionamento-e-Publicacao]]
- [[Report-Live-Arquitetura-Editorial]]
