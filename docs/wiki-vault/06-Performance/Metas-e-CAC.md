---
tags: [performance,metas,cac]
tipo: evidencia
camada: performance
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Metas e CAC

**Definição:** a leitura de negócio sobre a tabela [[goals]] — metas mensais de cartões/aprovados/propostas por BU e o teto `cac_max`, que viram o denominador da priorização.

## Contexto
Cada meta cadastrada tem `mes`, metas por BU (`b2c_meta`, `plurix_meta`, `b2b2c_meta`), `cartoes_meta`, `aprovados_meta`, `propostas_meta` e **`cac_max`** — a restrição dura da [[Função-Objetivo]]. O [[Orientador]] e o [[Orquestrador]] pesam o **gap entre realizado e meta do mês** ao pontuar oportunidades.

> 📊 Snapshot 2026-06-08 — 6 metas cadastradas na [[goals]]. CAC real da operação ~R$ 6–18 (ver [[CAC-por-Canal]] e [[Evolução-Temporal]]); o `cac_max` deve ser calibrado a essa faixa.

## ⚠️ Ponto de atenção
O score do [[Orientador]] usa baseline antiga de CAC (faixa R$60–150) — não a faixa real. Recalibrar contra `cac_max` real antes de persistir. Ver [[Decisões-Abertas]].

## Relacionado
- [[goals]] · [[Função-Objetivo]] · [[CAC]] · [[CAC-Ótimo]] · [[Orientador]] · [[Resultados]]
