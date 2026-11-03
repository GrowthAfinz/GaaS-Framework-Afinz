---
tags: [supabase,tabela,midia,ia]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: paid_media_insights

**Definição:** insights gerados sobre mídia no padrão **Contexto→Mudança→Causa→Ação**, com `score` 0-10 e `tipo` (oportunidade/risco/anomalia/tendência).

## Contexto
É o **modelo exato do output** que o [[Orquestrador]] de CRM deveria gerar — basta replicar a estrutura para aquisição CRM. Campos: período, score, channel/campaign/ad, contexto, mudanca, causa, `acoes` (jsonb), `evidencias` (jsonb), status (ativo/resolvido/descartado).

> 📊 Snapshot 2026-06-08 — 249 insights (246 ativos; tipos: risco 117, oportunidade 58, anomalia 38, tendência 36).

## Relacionado
- [[Orquestrador]] · [[Mídia-Analytics]] · [[Orientador]]
