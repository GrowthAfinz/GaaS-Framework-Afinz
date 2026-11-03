---
tags: [engenharia, gaas, divida-tecnica]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Dívida Técnica

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

Débitos reais encontrados no código, com caminho. Honesto, não exaustivo. Reflete o snapshot atual.

> 📊 Snapshot 2026-06-08: **18** ocorrências de `TODO/FIXME/HACK/XXX` e **211** ocorrências de `: any` em `src/`. CLAUDE.md afirma "strict mode, no `any`" — não corresponde à realidade.

## Segurança
- **Credenciais Supabase hardcoded** em `src/services/supabaseClient.ts` (URL + anon key versionados). Ver [[Decisões-Técnicas]] #2.
- **RLS desligado**: `disable_rls.sql`, `fix_rls.sql`, `fix_rls_dev.sql`, `fix_all_rls_for_upload.sql` na raiz de `calendar-estrategico/`. Com anon key pública, leitura/escrita aberta. **Bloqueador para deploy público.**

## Tipagem
- 211× `: any` — viola a convenção declarada. Ex.: `navigation.ts` (`icon: any`), `useAppStore.migrate(persisted: any)`, normalizadores em `dataService`. Reduzir gradualmente nas bordas (parsing, persist).

## Scores e baselines hardcoded (afeta confiabilidade dos números)
Em `src/hooks/useRecommendationEngine.ts`:
- **Baseline de CAC = R$150** e fórmula `cacScore = 100 - (avgCAC / 2)`.
  - ⚠️ **Comentário diverge do código**: o comentário diz `Formula: 100 - (CAC / 1.5)`, o código usa `/ 2`. Decidir qual é correto e alinhar.
- **Meta de conversão = 5%** (`(avgConversion / 0.05) * 100`).
- **Pesos do score**: `cacScore*0.4 + conversionScore*0.4 + volumeScore*0.2` — fixos, não configuráveis.
- `successRate: 0, // TODO: Define success threshold` — métrica nunca implementada.
- Thresholds de insight chumbados: CAC `< R$60`/`> R$150`, conversão `> 3%`/`< 0.5%`, volume `< 3`/`> 10`.
- Esses números deveriam vir de [[CAC-Ótimo]] / [[Metas-e-CAC]] (negócio), não de literais no hook.

## Custos zerados
- `src/constants/frameworkFields.ts`: `CUSTO_UNITARIO_OFERTA` com **todas as ofertas em 0.00** e `// TODO: Ajustar com custo real do Test_Drive_3_meses`. O cálculo de "Total Campanha" ignora custo de oferta hoje.

## "ML" rotulado além do que faz
- `causalAnalyzer.ts`: "Shapley Values (simplificado)" e "Do-Calculus simplificado" são, na prática, variância entre grupos. Risco de leitura como causalidade rigorosa. Ver [[Pipeline-ML]].

## Arquivos soltos / organização
- **14 arquivos `.sql`** na raiz de `calendar-estrategico/` (`fix_goals_*.sql`, `add_*_constraints.sql`, `force_fix_goals_mes.sql`…) — migrações ad-hoc sem pasta de migrations versionada. Há `supabase/` e `database/` também — fragmentação.
- Scripts soltos: `check-dates.ts`, `test_presets.ts`, `tmp_test.ts`, `run_targets_migration.cjs`, `deploy_log.txt`, `dev-server.log`, `vite-dev.err.log` versionados.
- **Duas pastas de contexts**: `src/context/` e `src/contexts/`. Ver [[Convenções-de-Código]].
- `vite.config.ts`, `vite.config.js` **e** `vite.config.d.ts` coexistem.

## Dependências
- `react-beautiful-dnd` 13 — **descontinuada**, problemas conhecidos com React 18.
- `xlsx` + `exceljs` — sobreposição de função (ler vs escrever planilha).
- `playwright` instalado sem suíte de testes evidente / CI.

## Docs desatualizadas (drift)
- CLAUDE.md: "9 abas" (são 11), "13 services" (16), "3 stores" (4), "Zod 3.x" (4.1), dev na porta 5173 (é **3000**), `useFieldProjection` em `src/hooks` (está em `dispatch/hooks`), `versionService.ts` separado (vive em `activityService.ts`).

## Componentes grandes (candidatos a quebra)
- `App.tsx` concentra roteamento, fusão de estado, lógica de comparação de período e UI de filtro (436 linhas).
- ⚠️ A validar com métrica de linhas: `JornadaDisparosView.tsx`, `OriginacaoB2CView.tsx`, `PaidMediaAfinzApp.tsx` são candidatos a "god components".

## Relacionado
- [[Decisões-Técnicas]]
- [[Pipeline-ML]]
- [[Convenções-de-Código]]
- [[Orientador]]
- [[CAC-Ótimo]]
- [[MOC-Engenharia]]
