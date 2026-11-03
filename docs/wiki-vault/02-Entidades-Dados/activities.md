---
tags: [supabase,tabela]
tipo: entidade
camada: dados
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Tabela: activities

**Definição:** a espinha dorsal da aquisição — um registro por [[Disparo]] realizado, com 49 campos cobrindo público, oferta, canal, custo e funil completo.

## Contexto
Cada linha = um Activity Name ([[Taxonomia-Activity-Name]]). Campos-chave: BU, Segmento, Parceiro, Subgrupos, Etapa de aquisição, Canal, Oferta, Promocional, Safra, Ordem de disparo, e o funil (Taxa de Entrega → Conversão), Cartões Gerados, CAC, Custo Total Campanha.

Status possíveis: `Rascunho`, `Scheduled`, `Enviado`, `Realizado` (hoje 100% Realizado — o orquestrador usará os outros para planejamento).

> 📊 Snapshot 2026-06-08 — 4.606 linhas, jan/25–jun/26. [[rentabilizacao_activities]] tem schema idêntico (FK para esta).

## Relacionado
- [[Disparo]] · [[Campanha]] · [[Canais]] · [[Segmentos]] · [[gaas_dinamica_bi_metrics]]
