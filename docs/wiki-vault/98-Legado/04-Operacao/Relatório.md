---
tags: [gaas,aba,analise]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Relatório

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a aba de **relatórios comparativos** (`RelatorioView`) — comparação mês a mês e exportação. Adicionada **depois** do CLAUDE.md (não documentada nele).

## O que entrega
- Comparação temporal (`useMonthComparison`) reusando os gráficos de `analise/` (`EfficiencyHeatmap`, `DualAxisTimeline`, `ScatterRegression`).
- Exportação Excel (`useExport` via exceljs) — alimenta os relatórios diarizados (ver [[Skills-do-Projeto]]).

## Relacionado
- [[Jornada-Disparos]] · [[Resultados]] · [[Skills-do-Projeto]] · [[GaaS-9-Áreas]] · [[Componentes-por-Aba]]
