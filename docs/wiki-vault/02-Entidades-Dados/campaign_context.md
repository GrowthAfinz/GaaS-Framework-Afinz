---
tags: [supabase,tabela,v2]
tipo: entidade
camada: dados
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Tabela: campaign_context

**Definição:** o **embrião do orquestrador** — guarda hipótese, objetivo de negócio, etapa de funil, público, oferta, métrica-norte e KPI-alvo por campanha.

## Contexto
É literalmente a tabela-cérebro de um orquestrador, mas hoje (1) só tem mídia paga, não CRM, e (2) campos `hipotese`/`publico`/`oferta` quase todos nulos.

**As 7 campanhas contextualizadas** (4 frentes): `aquisicao` — App Install B2C + App Install B2C [[Copa-2026|Copa]] (métrica-norte CPA install, alimenta install→cadastro→proposta cartão); `plurix` — App Install +Amigo; `seguros` — Conversão de Leads (CPL); `rentabilizacao` — 3 campanhas Copa de tráfego/display p/ LP Visa (CTR/CPC, `conversao_baixa_esperada=true`).

**Decisão aberta:** estender esta tabela para CRM ou criar `orchestrator_campaigns` do zero? Risco de duplicação conceitual com [[Entidades-v2]]. Ver [[Decisões-Abertas]].

> 📊 Snapshot 2026-06-10 — 7 linhas, só mídia.

## Relacionado
- [[Orquestrador]] · [[Entidades-v2]] · [[Decisões-Abertas]] · [[Hipótese]]
