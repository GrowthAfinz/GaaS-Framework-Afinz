---
tags: [engenharia, gaas, historia]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Histórico de Evolução

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

> ⚠️ Limitação: o repositório tem **apenas 1 commit** no git (`c5ea2cf feat: rename charts…`) — o histórico foi achatado/reiniciado. A linha do tempo abaixo é **reconstruída a partir das datas nos arquivos de RESUMO/FASE/ENTREGA** da raiz, não do git log. Datas em `(inferência)` quando deduzidas.

## Linha do tempo (do MVP ao Enhanced)

### ~Set–Out/2025 — Concepção (inferência)
"~9 meses de desenvolvimento acelerado" + MVP entregue em nov/2025 situam o início por volta de set/out 2025. Sem artefato datado anterior a nov/2025.

### 12/11/2025 — Entrega do MVP
`ENTREGA.md` / `ENTREGA_MVP_CALENDARIO.md`: "6 componentes React, 2 hooks, types full coverage, Tailwind dark mode, React 18 + Vite". Núcleo: upload CSV, calendário mensal, filtro BU, hover cards, dark mode. Este é o **marco zero versionado**.

### 24/01/2026 — Iteração de produto
Doc datado `24/01/2026` (marco de feature; provável consolidação de views de análise / Supabase). (inferência sobre escopo exato.)

### 02/02/2026 — Fase 1 + Fase 2: Motor de Inteligência
Dia de salto de capacidade (`RESUMO_FASE1_COMPLETO.md`, `RESUMO_FASE2_COMPLETO.md`, `DEPLOYMENT_SUMMARY.md`):
- **Fase 1 (Services, ~1.400 linhas)**: `performanceAnalyzer.ts` (520), `alternativeGenerator.ts` (480), `insightGenerator.ts` (400). Análise histórica de 90 dias, regressão linear, padrões por dia da semana, IC 95%.
- **Fase 2 (Charts)**: `PerformanceTimelineChart.tsx` (280), `ComparativeAnalysisChart.tsx` — série temporal com tendência, IC 95%, outliers.
- "Tempo total Fase 1+2: ~12 horas" — registro da velocidade IA-assistida.
- O pipeline ML "core" (similarity/prediction/causal/orchestrator) já existia para alimentar essas fases. Ver [[Pipeline-ML]].

### 27/04/2026 — Integração de dados B2C
`B2C_SYNC_REPORT_2026-04-27.md` + skill `b2c-originacao-updater`: sincronização de produção diária B2C (Total + canal Serasa) na tabela `b2c_daily_metrics`. Nasce a aba Originação B2C e o orquestrador de funil.

### 26/05/2026 — Iteração
Doc datado `2026-05-26` (refinamento; provável Media Analytics / relatórios). (inferência sobre escopo.)

### Pós-CLAUDE.md (02/02/2026) — Funcionalidades não documentadas
Adicionadas **depois** do CLAUDE.md ser escrito (por isso ausentes dele):
- Aba **Relatório** (`RelatorioView`) e **Explorador Avançado** (`DisparoExplorer` + `explorerStore` + `hooks/explorer/`).
- Camada de **autenticação** (`AuthContext`, `LoginView`, `SetPasswordView`, `UserRoleContext`).
- **Wizard** de disparo (`dispatch/wizard/`) paralelo aos blocks.
- Migração visual **dark → tema claro** (slate-50/white em `App.tsx`, accent cyan).
- `intelligentUpdateService`.

### Estado atual
`c5ea2cf` — renomeação de gráficos ("Evolução de Performance", "Análise Temporal").

## Marcos por categoria
- **MVP**: calendário + CSV + filtros (nov/2025).
- **Enhanced — Inteligência**: pipeline ML + projeções no modal (fev/2026).
- **Enhanced — Dados**: B2C, mídia paga, metas, versionamento (fev–mai/2026).
- **Enhanced — Plataforma**: auth, explorer, relatório, tema claro (pós-fev/2026).

## Relacionado
- [[Arquitetura-Geral]]
- [[Pipeline-ML]]
- [[Componentes-por-Aba]]
- [[Como-Rodar-e-Deploy]]
- [[MOC-Engenharia]]
