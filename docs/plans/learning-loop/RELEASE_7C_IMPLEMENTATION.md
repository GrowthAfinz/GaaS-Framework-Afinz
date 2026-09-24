# Release 7C — implementação da projeção editorial

**Data:** 2026-09-24
**Estado:** PR #29 verde; não aplicada nem publicada

## Entrega

A implementação projeta o Loop de aprendizado nos slides C7/C8 já existentes, sem criar arquétipo, alterar geometria ou publicar o deck.

- seleção pura em `report-live-growth-loop.ts`;
- captura de `growthBets`, `growthOutcomes` e `growthLearnings` no input congelado;
- fontes incluídas em `reportSourceRows`, nos snapshots e hashes;
- quatro views editoriais no artefato;
- C7 com retrospectiva tipada;
- C8 com aposta e candidata explicitamente distintas;
- narrativa determinística com limite causal;
- versões source `1.5`, semantic `1.5.0` e spec `3.1`;
- migration `20260924170000_growth_learning_editorial_release_7c.sql` para captura e ativação dos contratos C7/C8.

## Estado real observado antes do corte

Em 24/09/2026:

- 1 aposta contextual aberta;
- 1 linha de agenda sem `outcome_id`, com janela até 30/09;
- 0 outcomes verificados;
- 5 memórias curadas ativas;
- 0 aprendizados produzidos por outcome.

Consequência esperada para um build de setembro: C8 pode mostrar a aposta de recuperação da fonte; C7 deve declarar 0 outcomes e separar as memórias curadas de qualquer prova causal.

## Gates executados

- `npm test`: 150/150;
- `npm run test:report-live`: 61/61;
- `npm run test:report-live-office`: 3/3;
- `npm run typecheck:release`: 0 diagnóstico novo; dívida histórica da `main` = 57;
- `npm run check:edge`: verde;
- `npm run build`: verde; avisos históricos de chunk/dynamic import permanecem.

O Docker local estava indisponível. O PR [#29](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/pull/29) executou o contrato no PostgreSQL 17 limpo do Actions; o job `validate` (`35956153582`) passou em 1m27s. O preview Vercel também passou.

A migration não foi aplicada, a Edge Function não foi publicada, o PR não foi mergeado e o deck Google não foi tocado. Essas são ações de produção separadas.
