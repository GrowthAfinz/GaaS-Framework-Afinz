---
tags: [supabase,schema,dados]
tipo: entidade
camada: dados
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Supabase — Schema Completo (21 tabelas)

**Definição:** o inventário completo das tabelas do projeto **"GaaS Framework Afinz"** (`mipiwxadnpwtcgfcedym`, Postgres 17, us-east-2), com papel e contagem real. Complementa a [[Supabase-Visão-Geral]] (que cobre as principais).

> 📊 Snapshot 2026-06-10 — 21 tabelas no schema `public`.

## CRM / Aquisição
| Tabela | Papel | Linhas | RLS |
|---|---|---|---|
| [[activities]] | Disparos realizados (49 campos) | 4.459 | ✅ |
| [[rentabilizacao_activities]] | Disparos de rentabilização (FK → activities) | 3.201 | ❌ |
| [[gaas_dinamica_bi_metrics]] | Fato diário por bloco de canal | 8.740 | ✅ |
| [[gaas_update_runs]] | Ingestão (runs) | 10 | ✅ |
| [[gaas_update_runs|gaas_update_candidates]] | Candidatos a update c/ confiança | 8.740 | ✅ |
| [[dispatch_descriptions]] | Descrições livres por disparo | 18 | ❌ |
| [[campaign_context]] | Embrião de orquestrador | 7 | ❌ |
| [[goals]] | Metas mensais + cac_max | 6 | ❌ |

## Mídia Paga
| Tabela | Papel | Linhas | RLS |
|---|---|---|---|
| [[paid_media_metrics]] | Spend/performance diária Meta+Google | 6.080 | ❌ |
| [[paid_media_insights]] | Insights Contexto→Ação c/ score | 249 | ✅ |
| [[ad_creatives]] | Criativos (copy, imagem, vídeo) | 291 | ✅ |
| [[paid_media_campaign_mappings]] | Campanha → objetivo de negócio | 34 | ✅ |
| [[paid_media_budgets]] | Budget por mês/objetivo | 13 | ❌ |
| [[campaign_budgets]] | Budget alocado por campanha | 6 | ✅ |
| [[paid_media_objectives]] | Catálogo de objetivos (6) | 6 | ❌ |
| [[paid_media_targets]] | Metas de métrica de mídia | 0 | ❌ |
| [[collection_queue]] | Fila de coleta (cron 5min) | 12 | ❌ |
| [[collection_execution_logs]] | Logs de execução da coleta | 21 | ❌ |

## B2C / Plataforma
| Tabela | Papel | Linhas | RLS |
|---|---|---|---|
| [[b2c_daily_metrics]] | Originação B2C diária (total/serasa) | 698 | ❌ |
| `framework_versions` | Versões de CSV no storage | 50 | ✅ |
| `profiles` | Usuários (auth) + papel | 7 | ✅ |

## Views de agregação (2026-06-10)
`vw_performance_bu_segmento_safra` · `vw_performance_canal_safra` · `vw_media_campanha_mensal` · `vw_media_ad_mensal` — agregação **ponderada** com flag de confiança; fonte única para leituras de performance. Ver [[Views-Performance]].

## ⚠️ Governança
**RLS desabilitado em 11 tabelas** — ver [[Governança-de-Dados]]. Pré-requisito da [[Roadmap-Framework|Fase 2]].

## Relacionado
- [[Supabase-Visão-Geral]] · [[Governança-de-Dados]] · [[Ingestão-de-Dados]]
