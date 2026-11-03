---
tags: [supabase,tabela,midia,v2]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: paid_media_campaign_mappings

**Definição:** o **elo spend→negócio** — mapeia cada `campaign_name` de mídia a um `objective` de negócio (marca/b2c/plurix/seguros/aquisicao/rentabilizacao).

## Contexto
É a tabela que torna a [[Spend-to-Card]] possível: sem ela, o spend de [[paid_media_metrics]] é só "gasto por campanha"; com ela, vira "gasto por objetivo de aquisição". `campaign_name` é único; `objective` tem CHECK nos 6 valores ([[Objetivos-de-Campanha]]).

> 📊 Snapshot 2026-06-08 — 26 mapeamentos: aquisicao 16, rentabilizacao 4, marca 3, plurix 2, seguros 1.

## Relacionado
- [[Objetivos-de-Campanha]] · [[paid_media_metrics]] · [[Spend-to-Card]] · [[paid_media_budgets]]
