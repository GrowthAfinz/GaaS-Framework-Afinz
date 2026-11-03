---
tags: [supabase,tabela,ingestao]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabelas: gaas_update_runs + gaas_update_candidates

**Definição:** o pipeline de ingestão com **revisão humana** — metade de um orquestrador já construída, mas apontada para trás (validar KPIs que chegaram) em vez de para frente.

## Contexto
- `gaas_update_runs`: cada importação (status draft→processed→reviewing→applied), com `detected_blocks`, `summary`, `warnings`.
- `gaas_update_candidates`: cada candidato a atualização, com `confidence` (0-100), `field_to_review`, `suggestion`, `proposed_activity_update` (jsonb), `match_count`, `suggested_dispatch_order`.

Esse fluxo de confiança + revisão é o **modelo reaproveitável** para o [[Orquestrador]] propor disparos (não só validar resultados).

> 📊 Snapshot 2026-06-08 — 9 runs, 8.511 candidatos.

## Relacionado
- [[Ingestão-de-Dados]] · [[Orquestrador]] · [[Template]]
