---
tags: [ia,agentes,workflow]
tipo: operacao
camada: evolucao
atualizado: 2026-06-08
status: inferência
fonte: gaas-supabase
---

# Agentes & Workflows

**Definição:** os **padrões de uso de IA** que se repetem na operação — sequências de skills/MCP que produzem um resultado de negócio.

## Padrões consolidados
1. **Análise → Síntese → Entrega**
   `growth-brain` (diagnóstico) → `storytellingfiltergaas` (narrativa) → `afinz-pptx`/`pdf` (deck). Ver [[Skills-do-Projeto]].
2. **Ingestão revisada** (humano no loop)
   dados colados → detecção de blocos + `confidence` → revisão do que está abaixo do limiar → aplica. Ver [[Ingestão-de-Dados]] / [[gaas_update_runs]].
3. **Coleta automatizada** (sem humano)
   cron → [[collection_queue]] → MCP (Google/Meta) → [[paid_media_metrics]]. Ver [[Integração-Mídia-Paga]].
4. **Vault vivo** (proposto)
   MCP Supabase → SQL → reidrata snapshots → vault fresco. Ver [[Runbook-Vault-Vivo]].

## Princípio
Confiança = volume de execução; humano revisa o que a IA marca como incerto. O mesmo padrão da ingestão deve guiar o [[Orquestrador]] (propor disparo, humano aprova).

## Relacionado
- [[Skills-do-Projeto]] · [[MCP-Visão-Geral]] · [[Ingestão-de-Dados]] · [[Orquestrador]] · [[Runbook-Vault-Vivo]]
