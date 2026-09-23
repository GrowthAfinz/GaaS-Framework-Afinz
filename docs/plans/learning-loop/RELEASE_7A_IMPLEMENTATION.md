# Release 7A — implementação da entrada contextual

**Data:** 2026-09-23  
**Estado:** implementada na `main` e publicada no Supabase

## Entrega

O PR [#25](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/25) foi mergeado na `main` como `9a0786a`.

A Release 7A cobre o primeiro corte transversal da Release 7:

- `Criar aposta` em Relatórios → Overview, Diário e Mensal;
- `Criar aposta deste funil` para o funil de onboarding selecionado;
- deep-link validado com frente, superfície, período, filtros, entidade e referência visual;
- formulário de contrato sem baseline, hipótese, ação ou meta inventados;
- consulta do mesmo matcher de Memória usado pela Fila;
- criação atômica de evidência, aposta, timeline, aplicações de memória e evento do feed;
- abertura do drawer da aposta persistida após a confirmação.

Cancelar remove apenas os parâmetros contextuais. Não existe tabela nem registro de rascunho abandonado.

## Contrato de dados

A migration rastreada é `20260923210000_growth_context_entry_release_7a.sql`. O Supabase registrou a aplicação remota como `20260923200039_growth_context_entry_release_7a`.

Ela introduz:

- `growth_find_applicable_learnings_for_context(front, context_snapshot)`;
- `growth_create_contextual_bet_with_memory(...)`;
- núcleo comum do matcher contextual reutilizado pelo wrapper de candidatos;
- `growth_learning_applications.action_candidate_id` anulável somente quando o snapshot possui origem contextual;
- projeção da origem contextual em `growth_bets_operational_v` com `security_invoker`.

A aposta contextual preserva `source_action_candidate_id = null`; tela, rota, período, filtros e referência visual ficam em `belief_snapshot.source_context`. A evidência usa `source_run_id = null`, hash determinístico e qualidade `interactive_analytic_context`.

## Verificação

O workflow `Validate release` [35912744079](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/35912744079) passou em PostgreSQL 17 e executou o novo teste de contrato.

Gates do PR:

- 146 testes Vitest;
- contrato SQL da Release 7A, incluindo equivalência Fila ↔ contexto;
- todos os contratos SQL anteriores;
- Report Live, Office renderer e equivalência SQL ↔ TypeScript;
- TypeScript com zero diagnósticos novos sobre o baseline de 57;
- Edge Functions;
- build de produção;
- Vercel preview.

A reconciliação remota confirmou:

- `action_candidate_id` anulável nas aplicações;
- os dois RPCs presentes;
- execução concedida a `authenticated` e negada a `anon`;
- `growth_bets_operational_v` com `security_invoker=true`;
- zero apostas contextuais antes da UAT, pois nenhuma escrita sintética foi feita em produção.

Os advisors não apontaram RLS ou view nova incorreta. O aviso de RPC `security definer` para autenticados é esperado neste desenho: os comandos validam `auth.uid()`, recalculam o matcher no servidor e gravam o agregado numa transação. As demais ocorrências reportadas pertencem à dívida preexistente do projeto e não foram ampliadas neste corte.

## Limites preservados

- nenhuma mudança no renderer, build, certificação, Slides, Sheets, PDF ou ponteiro do Report Live;
- nenhuma aposta criada automaticamente;
- nenhuma captura fictícia de valor do gráfico;
- Relatórios de Rentabilização fora do corte, pois não pertencem às três frentes iniciais;
- links reversos nas telas de origem permanecem na Release 7B;
- projeção editorial no Report Live permanece na Release 7C.

## Incidente de ambiente local

O Postgres local não iniciou porque o Docker Desktop 4.48 encontrou um reparse point transitório inválido em `AppData/Local/Docker/run/dockerInference`. O teste SQL não foi substituído por execução contra produção: o gate obrigatório rodou no serviço PostgreSQL 17 do GitHub Actions antes da migration remota.
