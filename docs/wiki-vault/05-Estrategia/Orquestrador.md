---
tags: [estrategia,orquestrador,visao]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Orquestrador (a visão de destino)

**Definição:** a camada de **decisão** acima do GaaS — transforma dados, hipóteses e oportunidades em campanhas de aquisição acionáveis.

## O que faz
Sugere campanhas, organiza públicos, prioriza oportunidades, evita sobreposição de comunicação, controla calendário, recomenda canais, gera briefings, acompanha resultados e alimenta aprendizados.

## Por que é viável
Duas peças já existem: o histórico denso ([[activities]]) e a ingestão com revisão humana ([[gaas_update_runs]]). Falta o **loop prospectivo** — hoje o sistema sabe *o que aconteceu*, não decide *o que disparar a seguir*. O modelo de output já existe em [[paid_media_insights]].

## Modelo proposto (validar contra Supabase)
`orchestrator_campaigns` (jornada-safra), `orchestrator_dispatches` (régua), `orchestrator_opportunities` (output do motor), frequency_ledger (anti-overlap, depende de dado individual).

## Relacionado
- [[campaign_context]] · [[Entidades-v2]] · [[Roadmap-Framework]] · [[Função-Objetivo]] · [[Decisões-Abertas]]
