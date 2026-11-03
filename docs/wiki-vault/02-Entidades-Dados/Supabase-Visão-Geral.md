---
tags: [supabase,dados]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Supabase — Visão Geral

**Definição:** o banco de dados vivo do GaaS. Projeto **"GaaS Framework Afinz"** (`mipiwxadnpwtcgfcedym`, região us-east-2, Postgres 17).

## Contexto
Substituiu o conhecimento disperso em planilhas por uma fonte única, relacional e versionada — a fundação que torna automação e recomendação possíveis (ver [[Framework-v1-Diretor]] → [[Ontologia-v2]]).

## As tabelas principais
| Tabela | Papel | Linhas (snapshot) |
|---|---|---|
| [[activities]] | Disparos realizados (espinha dorsal) | 4.606 |
| [[gaas_dinamica_bi_metrics]] | Métricas diárias por bloco de canal | 8.511 |
| [[gaas_update_runs]] | Ingestão com revisão humana | 9 runs / 8.511 candidatos |
| [[campaign_context]] | Embrião de orquestrador (hipótese/objetivo) | 7 |
| [[paid_media_metrics]] | Spend e performance de mídia paga | 5.301 |
| [[paid_media_insights]] | Insights gerados (Contexto→Ação, score) | 249 |
| [[goals]] | Metas mensais (cartões, CAC) | 6 |
| [[b2c_daily_metrics]] | Métricas diárias B2C | 698 |
| [[rentabilizacao_activities]] | Disparos de rentabilização (referência) | 3.201 |
| [[ad_creatives]] | Criativos de mídia (copy, imagem, vídeo) | 291 |

> 📊 Snapshot 2026-06-08. Inventário completo das 21 tabelas em [[Supabase-Schema]].

## ⚠️ Governança
RLS desabilitado em 11 tabelas — ver [[Governança-de-Dados]].

## Relacionado
- [[Supabase-Schema]] · [[O-que-é-o-GaaS]] · [[Ingestão-de-Dados]] · [[Governança-de-Dados]]
