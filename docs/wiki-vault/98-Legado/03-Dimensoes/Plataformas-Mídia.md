---
tags: [dimensao,midia,plataforma]
tipo: dimensao
camada: dados
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Plataformas de Mídia

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[00-Indice/MOC-Midia-Paga|MOC de mídia paga]] (até a frente de mídia ficar pronta).

**Definição:** os canais de [[Mídia-Paga]] onde a Afinz investe. Dois ativos: **Meta** (Facebook/Instagram) e **Google** (Search/Display/YouTube), cada um coletado por MCP próprio.

## Valores reais (jan/2025–jun/2026)
| Plataforma | Spend | Impressões | Cliques | CTR | CPC | Coleta |
|---|---|---|---|---|---|---|
| **Meta** | R$ 130.992 | 15,0 MM | 172.513 | 1,15% | R$ 0,76 | Meta Marketing API (MCP) |
| **Google** | R$ 111.981 | 37,3 MM | 563.290 | 1,51% | R$ 0,20 | Google Ads MCP |

> 📊 Snapshot 2026-06-08 — 5.301 registros em [[paid_media_metrics]] (Meta 4.256 / Google 1.814 linhas).

## Leitura
**Google** entrega ~2,5x mais impressões e CPC ~4x menor que **Meta** — perfil de alcance/tráfego barato. Meta tem CPC mais alto mas é o canal de criativo rico ([[Criativos]]). A escolha de plataforma por objetivo é alavanca de eficiência. Coleta automatizada via [[MCP-Visão-Geral|MCP]] — ver [[Integração-Mídia-Paga]].

## Relacionado
- [[Mídia-Paga]] · [[paid_media_metrics]] · [[Objetivos-de-Campanha]] · [[CPA-por-Plataforma]] · [[MCP-Visão-Geral]]
