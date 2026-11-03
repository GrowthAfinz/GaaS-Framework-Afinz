---
tags: [supabase,tabela,midia,ingestao]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: collection_queue

**Definição:** a **fila de coleta** de métricas de mídia — cada item pede coleta de um `channel` num intervalo (`since`→`until`), com `status` (pending→processing→success/failed).

## Contexto
É o motor da [[Integração-Mídia-Paga]]: um cron (a cada ~5 min) consome a fila, chama o [[MCP-Visão-Geral|MCP]] da plataforma e grava em [[paid_media_metrics]]. `result` e `error_message` (jsonb) guardam o desfecho. Logs em [[collection_execution_logs]].

> 📊 Snapshot 2026-06-08 — 12 itens na fila.

## Relacionado
- [[collection_execution_logs]] · [[Integração-Mídia-Paga]] · [[paid_media_metrics]] · [[MCP-Visão-Geral]]
