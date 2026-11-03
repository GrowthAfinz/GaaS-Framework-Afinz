---
tags: [supabase,tabela,midia,budget]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: campaign_budgets

**Definição:** a **alocação de budget por campanha** dentro de um objetivo — o detalhamento fino de [[paid_media_budgets]] (FK `objective_budget_id`).

## Contexto
Campos: `month`, `campaign_name`, `objective`, `channel`, `allocated_budget` (≥0), `notes`. Liga o budget macro por objetivo à campanha individual, fechando o ciclo planejamento → execução.

> 📊 Snapshot 2026-06-08 — 6 alocações cadastradas.

## Relacionado
- [[paid_media_budgets]] · [[Objetivos-de-Campanha]] · [[paid_media_metrics]]
