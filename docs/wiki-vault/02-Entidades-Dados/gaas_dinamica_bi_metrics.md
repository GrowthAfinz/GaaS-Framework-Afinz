---
tags: [supabase,tabela]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: gaas_dinamica_bi_metrics

**Definição:** a tabela de **fato diário** — granularidade por dia e por bloco de canal (whatsapp/email/sms/push/performance).

## Contexto
Onde o orquestrador lê para projeção fina (não a [[activities]] agregada). Campos: channel, journey, activity_name, metric_date, sent/delivered/opens/clicks/proposals/approved/finalized, `raw_payload` (jsonb) e `natural_key`.

> 📊 Snapshot 2026-06-08 — 8.511 linhas. Prova de granularidade para leitura fina de performance.

## Relacionado
- [[activities]] · [[gaas_update_runs]] · [[Funil-de-Aquisição]]
