---
tags: [supabase,tabela,midia,budget]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: paid_media_budgets

**Definição:** o **budget planejado** de mídia por mês e objetivo — quanto se pretende investir, contra o que [[paid_media_metrics]] mostra como realizado.

## Contexto
Campos: `month`, `channel`, `objective`, `budget`. É a referência de planejamento (plano × realizado). `campaign_budgets` detalha a alocação por campanha (FK → esta tabela).

> 📊 Snapshot 2026-06-08 — 13 linhas, budget total ~R$ 66 mil planejado (por objetivo). Compare com ~R$ 243 mil já realizados em mídia.

## Relacionado
- [[campaign_budgets]] · [[Objetivos-de-Campanha]] · [[paid_media_metrics]] · [[paid_media_targets]]
