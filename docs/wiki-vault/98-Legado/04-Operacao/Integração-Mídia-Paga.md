---
tags: [midia,integracao,marco]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Integração de Mídia Paga

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a coleta automatizada de métricas de **Meta e Google Ads** para o Supabase, via **MCP / edge function**, em fila com cron.

## Como funciona
1. Itens entram na [[collection_queue]] (`channel`, `since`→`until`, `status`).
2. Um cron (~5 min) consome a fila e chama o conector da plataforma:
   - **Google** → Google Ads MCP (auth via gcloud ADC).
   - **Meta** → Meta Marketing API MCP.
3. Resultado grava em [[paid_media_metrics]] (+ [[ad_creatives]]); execução logada em [[collection_execution_logs]].
Ver o panorama de conectores em [[MCP-Visão-Geral]].

## Contexto
Marco dos 9 meses: trouxe mídia paga para a **mesma base do CRM**, permitindo leitura unificada de eficiência ([[Spend-to-Card]]).

> 📊 Snapshot 2026-06-08 — 5.301 registros em [[paid_media_metrics]] (Meta 4.256 / Google 1.814), 291 criativos, 19 execuções de coleta logadas.

## Relacionado
- [[Mídia-Analytics]] · [[paid_media_metrics]] · [[ad_creatives]] · [[collection_queue]] · [[collection_execution_logs]] · [[MCP-Visão-Geral]]
