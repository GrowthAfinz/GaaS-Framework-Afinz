---
tags: [dimensao,midia,criativo]
tipo: dimensao
camada: dados
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Criativos (Mídia Paga)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[00-Indice/MOC-Midia-Paga|MOC de mídia paga]] (até a frente de mídia ficar pronta).

**Definição:** o conteúdo do anúncio — copy, título, CTA, imagem/vídeo e suas variações. É o paralelo de mídia ao [[Template]] do CRM. Vive em [[ad_creatives]].

## Valores reais
| Tipo de mídia | Qtd |
|---|---|
| Imagem | 254 |
| Vídeo | 37 |

**Status:** ACTIVE 18 · PAUSED 143 · ADSET_PAUSED 89 · CAMPAIGN_PAUSED 37 · WITH_ISSUES 4.

> 📊 Snapshot 2026-06-08 — 291 criativos. Só **18 ativos** — a maioria é histórico pausado (acervo de aprendizado de criativo).

## Contexto
Cada criativo guarda `body/title/description` + suas `*_variations` (jsonb) e `asset_insights` — base da análise de criativo na [[Mídia-Analytics]]. Conecta a inteligência de copy de mídia à futura inteligência de [[Template]] no CRM (ver [[Eficiência-de-Criativo]]).

## Relacionado
- [[ad_creatives]] · [[Template]] · [[Eficiência-de-Criativo]] · [[Mídia-Analytics]]
