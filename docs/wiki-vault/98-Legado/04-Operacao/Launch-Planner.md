---
tags: [gaas,aba,planejamento]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Launch (Planner)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** o **calendário de agendamento** de disparos — entry point default do GaaS. Onde se vê o mês, se programa um [[Disparo]] e se recebe projeções de IA.

## O que entrega
- Calendário mensal com KPIs (`CalendarSummary`, `KPIOverview`, `LaunchPlannerKPIs`, `TimelineRow`).
- Invoca o [[Modal-de-Disparo]] (`ProgramarDisparoModal`) para programar disparo com [[Pilar-Automação-por-Histórico|sugestão por histórico]] e projeções ([[Pipeline-ML]]).
- `PerspectiveSwitcher`: alterna visão total / crm / b2c.

## Por que importa
É a tela onde planejamento vira ação — materializa o pilar de automação por histórico no momento da decisão.

## Relacionado
- [[Modal-de-Disparo]] · [[Pilar-Automação-por-Histórico]] · [[Pipeline-ML]] · [[GaaS-9-Áreas]]
