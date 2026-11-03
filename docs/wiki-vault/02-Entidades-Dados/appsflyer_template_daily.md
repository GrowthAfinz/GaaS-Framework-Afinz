---
tags: [supabase,tabela,appsflyer,template,proposto]
tipo: entidade
camada: dados
atualizado: 2026-07-28
status: proposto
fonte: investigacao-mcp-appsflyer
---

# Tabela: appsflyer_template_daily

**Definição:** performance de app (clique→install→sessão) por **[[Template|template_id]]** e dia, vinda do AppsFlyer via Pull API — o rastro de app que hoje falta em cada [[Disparo]].

## Contexto
Grão `date × template_id`. Colunas: `af_installs`, `af_sessions` (fase 2: `af_onboarding_started`, `af_onboarding_finished`). FK `template_id` → [[communication_templates]]. Chave de origem = `af_sub3` do link (case misto → join em `metadata.template_id_planilha`, nunca no PK UPPER).

> ⚠️ **Clique NÃO entra aqui via Pull API** — não existe relatório de clique no raw pull; `af_clicks` por template só com **Data Locker**. Sem ele, clique fica no grão de campanha (`appsflyer_acquisition_daily`).

Só cobre **links governados** (`LINK AJUSTADO?=True` na planilha); legados caem no crosswalk fuzzy `appsflyer_template_map`. Fonte é **raw data** (Pull API) porque o agregado só expõe `af_sub1` — ver [[AppsFlyer-Ingestao-Template-Arquitetura]].

> 📊 Proposta 2026-07-28 — tabela ainda não criada. Passo 0 da skill = provar `af_sub3` no raw antes de gravar.

## Relacionado
- [[AppsFlyer-Ingestao-Template-Arquitetura]] · [[AppsFlyer-Tracking-CRM]] · [[communication_templates]] · [[activities]] · [[Orquestrador]]
