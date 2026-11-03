---
tags: [supabase,tabela,b2c]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: b2c_daily_metrics

**Definição:** métricas diárias de originação B2C — propostas, emissões, conversão, com `tipo` (total / serasa_api).

## Contexto
Alimentada por skill dedicada (b2c-originacao-updater) que lê a planilha de produção diária. Permite comparar a visão CRM com a originação B2C total e o canal integrado Serasa.

> 📊 Snapshot 2026-06-08 — 698 linhas. PK composta (data, tipo).

## Relacionado
- [[Segmentos]] · [[Parceiros]] · [[O-que-é-o-GaaS]]
