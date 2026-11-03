---
tags: [supabase,tabela,midia,dimensao]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: paid_media_objectives

**Definição:** o **catálogo canônico** dos objetivos de campanha de mídia — a fonte da verdade para os valores usados em [[paid_media_campaign_mappings]] e [[paid_media_budgets]].

## Contexto
Campos: `key` (único), `label`, `color`, `sort_order`. Garante domínio canônico (regra da [[Ontologia-v2]]: "todo valor usa o domínio canônico").

> 📊 Snapshot 2026-06-08 — 6 objetivos: marca, b2c, plurix, seguros, aquisicao, rentabilizacao. Detalhe em [[Objetivos-de-Campanha]].

## Relacionado
- [[Objetivos-de-Campanha]] · [[paid_media_campaign_mappings]] · [[paid_media_budgets]]
