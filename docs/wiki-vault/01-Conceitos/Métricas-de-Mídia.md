---
tags: [conceito,midia,metrica]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Métricas de Mídia

**Definição:** o vocabulário de performance de [[Mídia-Paga]], distinto do funil CRM. Cada registro de [[paid_media_metrics]] carrega spend, impressões, cliques, conversões e as taxas derivadas.

## As métricas
| Métrica | Fórmula | O que mede |
|---|---|---|
| **CTR** | cliques / impressões | atratividade do criativo |
| **CPC** | spend / cliques | custo de tráfego |
| **CPM** | spend / impressões × 1000 | custo de alcance |
| **CPA** | spend / conversões | custo por conversão **de plataforma** |
| **Frequência** | impressões / alcance | pressão sobre a mesma pessoa |

> 📊 Snapshot 2026-06-08 — Meta: CTR 1,15% · CPC R$ 0,76 · CPA R$ 1,49. Google: CTR 1,51% · CPC R$ 0,20 · CPA R$ 0,73. Ver [[CPA-por-Plataforma]].

## ⚠️ CPA ≠ CAC
O CPA aqui é da **plataforma** (conversão = clique/lead/evento configurado), não o [[CAC]] de cartão. Comparar CPA entre plataformas é válido; igualar CPA a custo de cartão **não**. Ver [[Spend-to-Card]].

## Relacionado
- [[Mídia-Paga]] · [[paid_media_metrics]] · [[CPA-por-Plataforma]] · [[Spend-to-Card]] · [[CAC]]
