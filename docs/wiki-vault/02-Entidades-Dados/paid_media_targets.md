---
tags: [supabase,tabela,midia,metas]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: a-validar
fonte: gaas-supabase
---

# Tabela: paid_media_targets

**Definição:** as **metas de métrica de mídia** por mês/canal/objetivo — o paralelo de [[goals]] para o mundo de mídia paga.

## Contexto
Campos: `month`, `metric`, `channel`, `objective`, `target_value`. Permitiria comparar realizado ([[paid_media_metrics]]) × meta de métrica (ex.: CPA-alvo, spend-alvo).

> 📊 Snapshot 2026-06-08 — **0 linhas (vazia)**. Estrutura pronta, ainda não populada. Oportunidade: definir metas de CPA/spend por objetivo. Ver [[Decisões-Abertas]].

## Relacionado
- [[goals]] · [[Métricas-de-Mídia]] · [[paid_media_budgets]] · [[Objetivos-de-Campanha]]
