---
tags: [supabase,tabela,midia]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: paid_media_metrics

**Definição:** spend e performance diária de mídia paga (Meta + Google), por campanha/adset/ad.

## Contexto
Conecta investimento de mídia a resultado — base da [[Mídia-Analytics]]. Campos: date, channel, campaign, objective, spend, impressions, clicks, conversions, ctr/cpc/cpm/cpa, reach, frequency. Coleta diária automatizada via MCP/edge function.

> 📊 Snapshot 2026-06-08 — 5.301 linhas (Meta 4.256 / Google 1.814). Acompanha [[paid_media_budgets]], [[paid_media_targets]], [[paid_media_objectives]], [[campaign_budgets]], [[paid_media_campaign_mappings]].

## Relacionado
- [[Mídia-Analytics]] · [[paid_media_insights]] · [[ad_creatives]] · [[Integração-Mídia-Paga]]
