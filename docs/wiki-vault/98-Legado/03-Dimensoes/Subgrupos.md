---
tags: [dimensao,publico]
tipo: dimensao
camada: dados
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Subgrupos

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] (públicos, parceiros, canais e BUs).

**Definição:** o detalhamento do [[Segmentos|segmento]] — a granularidade fina de público dentro de uma campanha.

## Valores reais (principais)
Diario (2.390), N/A (1.476), Leais (121), Abandonados D-7 (68), Novos (58), Churn (56), Frequentes (56), Pre_Churn (50), Ocasional (51).

> 📊 Snapshot 2026-06-08.

## ⚠️ Inconsistência
"Leais" (121) + "Leal" (1) = duplicidade → unificar. Ver [[Inconsistências-a-Corrigir]].

## Contexto
Subgrupo entra na chave de [[Campanha]] (`BU+Segmento+Parceiro+Subgrupo+Etapa+Safra`). Subgrupos comportamentais (Churn, Pre_Churn, Frequentes) refletem o [[Funil-AARRR]].

## Relacionado
- [[Segmentos]] · [[Campanha]] · [[Inconsistências-a-Corrigir]]
