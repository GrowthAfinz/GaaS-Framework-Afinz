---
tags: [gaas,aba,b2c,origem]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Originação B2C

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[07-Evolucao/Resultados-B2C|Resultados B2C]] (até a frente de originação B2C ficar pronta).

**Definição:** a aba que analisa a **aquisição B2C** (originação direta de cartão pessoa física) e abriga o **orquestrador de funil** — comparando a visão CRM com a originação B2C total e o canal integrado Serasa.

## O que entrega
- Comparação CRM × B2C total × canal Serasa API (`useB2CAnalysis`, `useB2CIntelligence`), lendo [[b2c_daily_metrics]].
- **Orquestrador de funil** (`originacao/orchestrator/`): `FunnelLayers`, `InfluenceMatrix`, `ActionLevers`, `ResultEstimates` — simula alavancas e estima resultado.
- Dashboard de originação diária (propostas, emissões, conversão, share).

## Contexto
B2C é a maior BU em volume de pessoa física (ver [[BUs]]). O canal **Serasa API Integrado** é a originação integrada (perfil de crédito dedicado — ver [[Perfis-de-Crédito]]). Alimentada pela skill `b2c-originacao-updater`.

## Relacionado
- [[b2c_daily_metrics]] · [[BUs]] · [[Perfis-de-Crédito]] · [[GaaS-9-Áreas]] · [[Orquestrador]]
