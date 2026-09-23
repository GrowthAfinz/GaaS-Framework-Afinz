# Release 5 — memória versionada

**Data:** 2026-09-23
**Branch:** `codex/growth-learning-release-5-memory`
**Estado:** publicada na `main`, no Supabase e no GitHub Pages

## 1. Objetivo do corte

Transformar outcomes revisados em memória operacional, sem confundir conhecimento histórico curado com aprendizado validado pelo próprio loop.

O corte introduz duas origens explícitas:

- `outcome`: aprendizado produzido automaticamente depois que um outcome chega a `confirmed_by_user` ou `resolved`;
- `vault_curated`: conhecimento histórico selecionado do vault, com fonte, escopo, limitações, vigência e revisão, mas sem alegar validação por uma aposta do sistema.

## 2. Persistência e invariantes

As migrations `20260923144041_growth_memory_release_5.sql` e `20260923144342_growth_memory_revision_guard_reset.sql` criam e endurecem o contrato:

- `growth_learnings`, com origem, afirmação, escopo, aplicabilidade, limitações, regime, confiança e vigência;
- `growth_learning_revisions`, append-only;
- `growth_learning_links`, para outcome, aposta, evidência, relatório, memória e nota do vault;
- `growth_curated_proposals`, para propostas históricas que ainda precisam de verificação operacional;
- `growth_memory_active_v`, view `security_invoker` para a leitura autenticada;
- materialização idempotente por `growth_materialize_learning(outcome_id)`;
- revisão versionada por `growth_revise_learning(...)`, restrita ao `service_role`;
- eventos `learning_created`, `learning_revised` e `curated_proposal_created` no feed.

Updates diretos na memória são bloqueados. Uma correção precisa passar pela função de revisão e preservar a versão anterior. Revisões, links e propostas curadas são imutáveis.

A migration complementar encerra a autorização interna de revisão imediatamente depois do update versionado. O ensaio adversarial confirmou que uma segunda atualização direta na mesma transação volta a ser bloqueada.

## 3. Regra de materialização

O trigger observa `report_action_outcomes` e só materializa quando `review_status` chega a `confirmed_by_user` ou `resolved`. Um índice único parcial garante um aprendizado por outcome.

O veredito é traduzido assim:

| Veredito final | Classificação da memória |
|---|---|
| `confirmed` | `confirmed` |
| `partially_confirmed` | `directional` |
| `not_confirmed` | `contradictory` |
| `invalid_premise` | `invalidated` |
| demais estados verificáveis | `inconclusive` |

Execução ausente, dado faltante e mudança de regime continuam preservados como limitação; não viram zero nem fracasso por inferência.

## 4. Curadoria inicial do vault

Foram materializados cinco aprendizados históricos, cada um com `source_ref` verificável:

1. reconciliação numérica valida o resultado observado, não a regra futura;
2. a série de Aquisição B2C não pode atravessar o corte de objetivo de 23/06/2026;
3. ausência de instrumentação de instalação não é desempenho zero;
4. preview local não substitui Test Send no SFMC;
5. o contrato observado do CSV de importação vence a convenção presumida.

Também foram criadas duas propostas na Fila:

- provar a cobertura de `af_sub3` no raw data do AppsFlyer;
- revalidar a completude diária Meta → Supabase.

Essas propostas não oferecem `Assumir aposta` enquanto não possuírem contrato quantitativo verificável. A recomendação existente de cobertura de templates não foi duplicada.

Conteúdo da campanha Copa Visa/opt-in foi excluído da curadoria porque a iniciativa já foi encerrada.

## 5. Experiência no GaaS

A aba Memória agora oferece:

- contadores de memórias ativas, validadas pelo loop, curadas do vault e com revisão vencida;
- busca por texto, escopo, regime e fonte;
- filtros por origem, frente e classificação;
- badges de origem que impedem equivalência visual entre evidência histórica e outcome;
- drawer com afirmação, aplicabilidade, limitações, vigência, procedência, links e histórico de revisão;
- deep-link por `?view=learning&section=memory&item=<uuid>`.

## 6. Gates locais executados

- `npm run typecheck:release`: zero diagnóstico novo; dívida-base preservada em 57;
- `npm run build`: aprovado;
- `npm test`: 143 testes aprovados;
- `npm run test:report-live`: 57 testes aprovados;
- `npm run check:edge`: aprovado;
- migration executada no Postgres real dentro de `BEGIN ... ROLLBACK`: 5 aprendizados, 2 propostas e 7 eventos, sem persistência.

O teste SQL da release usa Postgres efêmero no CI e cobre materialização, idempotência, separação de origem, histórico de revisão, imutabilidade, grants e RLS.

## 7. Estado remoto do banco

O Supabase registrou `20260923144041_growth_memory_release_5` e `20260923144342_growth_memory_revision_guard_reset`. A reconciliação posterior confirmou:

- 5 aprendizados `vault_curated`, 5 revisões iniciais e 5 links de procedência;
- 2 propostas curadas e 7 eventos da Release 5;
- 0 memórias `outcome`, coerente com a ausência atual de outcomes revisados;
- RLS nas quatro tabelas, leitura autenticada e nenhuma escrita direta para `authenticated`;
- `anon` sem leitura e view com `security_invoker`;
- nenhum novo alerta de segurança nos objetos da Release 5.

Os quatro índices novos apareceram apenas como `unused_index` informativo logo após a criação, o que é esperado antes de tráfego de leitura.

## 8. Publicação da aplicação

O PR [#21](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/21) foi mergeado na `main` como `df6827e`. O pipeline do PR (`35877220960`) e o workflow pós-merge (`35877449664`) aprovaram o contrato SQL da Release 5 em PostgreSQL 17, os testes, TypeScript, Edge Functions e o build.

O GitHub Pages publicou `index-UYQZnnK7.js`, servido com HTTP 200 e contendo `Release 5`, `Validadas pelo loop`, `Curadas do vault` e `growth_memory_active_v`. A interface pública carregou até o login; a inspeção interna autenticada da aba Memória permanece como UAT do operador.

## 9. Fora deste corte

- recuperação automática de memória aplicável em um novo sinal ou aposta;
- embeddings ou busca vetorial;
- edição livre da memória pelo frontend;
- projeção de memória no Report Live;
- automação de campanhas;
- conteúdo de campanhas encerradas.
