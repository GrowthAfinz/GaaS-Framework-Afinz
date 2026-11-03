---
tags: [ia,mcp,integracao]
tipo: operacao
camada: evolucao
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# MCP — Visão Geral

**Definição:** **Model Context Protocol** — o padrão (aberto, criado pela Anthropic) que liga uma IA às ferramentas e dados da operação. É o que permite a um agente *consultar e agir* sobre o GaaS, não só conversar.

## Conectores ativos na operação
| MCP | O que dá acesso | Uso |
|---|---|---|
| **Supabase** (`mipiwxadnpwtcgfcedym`) | SQL nas 21 tabelas ([[Supabase-Schema]]) | ler/agregar dados vivos, reidratar snapshots |
| **Google Ads** | métricas de campanha Google | coleta → [[paid_media_metrics]] (auth gcloud ADC) |
| **Meta Ads** (Marketing API) | campanhas, adsets, ads, criativos, insights | coleta Meta → [[paid_media_metrics]] / [[ad_creatives]] |
| **Google Analytics (GA4)** | relatórios GA4 somente leitura (Afinz – GA4, vários domínios) | comportamento no site, funil de checkout, origem de tráfego → [[GA4-MCP-Google-Analytics]] (mesmo ADC do Google Ads) |

> 📊 Snapshot 2026-06-08 — os 3 conectores acima sustentam a [[Integração-Mídia-Paga]] e a leitura de dados do CRM.

## Por que importa
O MCP é o que torna o [[Vault-como-Contexto|vault vivo]] possível: com o MCP do Supabase, um agente roda SQL → reidrata os snapshots datados do vault → mantém o conhecimento fresco ([[Runbook-Vault-Vivo]]). Para operar o próprio vault, ver [[Obsidian-MCP]].

## Relacionado
- [[Supabase-Schema]] · [[Integração-Mídia-Paga]] · [[Obsidian-MCP]] · [[Runbook-Vault-Vivo]] · [[Vault-como-Contexto]]
