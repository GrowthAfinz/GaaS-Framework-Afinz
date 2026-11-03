---
tags: [supabase,tabela,midia,criativo]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: ad_creatives

**Definição:** os criativos de mídia paga coletados — copy, título, imagem/vídeo, CTA, variações e asset insights.

## Contexto
É o paralelo de [[Template]] no mundo de mídia paga: rastreia o conteúdo do anúncio (body/title/image variations, asset_insights em jsonb). Conecta a inteligência de criativo ([[Mídia-Analytics]]) com a futura inteligência de template do CRM.

> 📊 Snapshot 2026-06-08 — 291 criativos (254 imagem, 37 vídeo; 18 ativos, 273 pausados). Leitura em [[Criativos]] e [[Eficiência-de-Criativo]].

## Relacionado
- [[Template]] · [[paid_media_metrics]] · [[Mídia-Analytics]]
