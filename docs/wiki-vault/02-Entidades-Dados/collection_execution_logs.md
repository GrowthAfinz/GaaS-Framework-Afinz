---
tags: [supabase,tabela,midia,observabilidade]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: collection_execution_logs

**Definição:** o **log de observabilidade** da coleta de mídia — cada execução do cron com duração, status (success/failed/partial), `phases` e `summary` (jsonb).

## Contexto
É a auditoria da [[Integração-Mídia-Paga]]: permite ver se a coleta rodou, quanto demorou e o que falhou. Paralelo, no mundo de mídia, ao [[gaas_update_runs]] do CRM.

> 📊 Snapshot 2026-06-08 — 19 execuções registradas.

## Relacionado
- [[collection_queue]] · [[Integração-Mídia-Paga]] · [[paid_media_metrics]]
