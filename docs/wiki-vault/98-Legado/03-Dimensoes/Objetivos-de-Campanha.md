---
tags: [dimensao,midia,objetivo]
tipo: dimensao
camada: dados
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Objetivos de Campanha (Mídia)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[00-Indice/MOC-Midia-Paga|MOC de mídia paga]] (até a frente de mídia ficar pronta).

**Definição:** a classificação de negócio de cada campanha de [[Mídia-Paga]], do catálogo [[paid_media_objectives]]. É o que conecta spend ao resultado certo na [[Spend-to-Card]].

## Os 6 objetivos (catálogo real)
| Key | Label | Cor | Campanhas mapeadas |
|---|---|---|---|
| `aquisicao` | Aquisição | blue | **16** |
| `rentabilizacao` | Rentabilização | green | 4 |
| `marca` | Branding (Marca) | violet | 3 |
| `plurix` | Plurix | purple | 2 |
| `seguros` | Seguros | orange | 1 |
| `b2c` | Performance (B2C) | blue | — |

> 📊 Snapshot 2026-06-08 — 26 campanhas mapeadas em [[paid_media_campaign_mappings]]. Aquisição domina (16).

## Contexto
O objetivo determina **como ler o sucesso**: campanha de `marca` não deve ser cobrada por CAC de cartão; `aquisicao`/`b2c` sim. Espelha as [[BUs]] e a [[Etapa-de-Aquisição]] no mundo de mídia. Budgets são planejados por objetivo ([[paid_media_budgets]]).

## Relacionado
- [[paid_media_objectives]] · [[paid_media_campaign_mappings]] · [[paid_media_budgets]] · [[Spend-to-Card]] · [[BUs]]
