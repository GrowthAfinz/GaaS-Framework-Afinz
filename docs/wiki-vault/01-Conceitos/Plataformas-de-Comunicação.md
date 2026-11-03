---
tags: [conceito,hub,plataformas,canais,audiencias]
tipo: conceito
camada: negocio
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Plataformas de Comunicação (hub)

**Definição:** o mapa único de **onde a Afinz fala com o cliente** — os canais executados pelo [[SFMC-Salesforce-Marketing-Cloud|SFMC]] e as plataformas de mídia — e de **como o mesmo público** ([[Segmentos]]) aparece em cada uma.

## As plataformas
| Plataforma | Canais | Estado | Identidade do público |
|---|---|---|---|
| **SFMC** | E-mail · SMS · WhatsApp · Push | ativos (Push subutilizado: 103 disparos, 3 cartões) | Data Extension (CPF/contato) |
| **SFMC — InApp** | in-app message | **nunca usado; não funciona ainda** (inexistente no código e em activities) | — |
| **Meta Ads** | Facebook/Instagram | 3 contas: Fábrica de Vendas (principal), Sorocred, +amigo Plurix | Custom Audience (hash SHA-256) |
| **Google Ads** | Search/Display/YouTube/App | campanhas via [[campaign_context]] | Customer Match (Data Manager API) |
| *(pseudo-canal)* | ECRED-API | finalizações assistidas fora do SFMC | — |

O elo entre todas: a base CRM → [[Ativacao-de-Audiencias-Diaria|pipeline S3]] → audiências; e o [[AppsFlyer-Tracking-CRM|AppsFlyer]] lendo tudo sob `pid=crm` (canal real em `af_channel`).

## Matriz real segmento × canal (onde cada público é trabalhado hoje)
> 📊 Snapshot 2026-06-10 (B2C+Plurix).

| Bloco / [[Segmentos|Segmento]] | E-mail | SMS | WhatsApp | Push | Meta hoje |
|---|---|---|---|---|---|
| [[Topo-de-Funil]] (Base_Proprietaria/CRM) | ●●● núcleo | ●● | ● | — | `CRM_PLURIX_202603_GC1/GC2`, `Tudao_B2C_202603` (congeladas) |
| [[Repescagem]] (Negados) | ● | ●● | ●●● | — | `AFINZ_Negados_Orgânicos_21_05_2025`, `AFINZ_Repescagem_Niver_A/B` (congeladas) |
| [[Upgrade]] (Aprovados_nao_convertidos) | ● | ●● | ●● | — | `AFINZ_Upgrade_Niver_A/B` (congeladas, ~1k) |
| [[Carrinho-Abandonado]] (Abandonados) | **lacuna** | ●● | ●●● núcleo | ● | `AFINZ_Abandonados_B2C_10_07_2025` (congelada há 11 meses) |
| Leads_Parceiros | ● | ●● | ●● | — | `AFINZ_LeadsParceiros_Niver_A/B` |
| Exclusão (já converteu) | — | — | — | — | `AFINZ_Ativos(Exclusão)`, `Cartões_Emitidos_2026` (inativa) |

## Diagnóstico das audiências Meta (lido via MCP, 2026-06-10)
1. **Tudo é CSV manual congelado** — nomes com data (`_10_07_2025`, `_202511`) e sem refresh; o público de Carrinho está 11 meses desatualizado.
2. **Sem convenção de nome** — mistura `AFINZ_*`, `[COPA]*`, `Tudão`, datas em 3 formatos.
3. **Espalhado em 3 contas** sem mapa de qual conta serve qual BU.
4. Lookalikes quase todos `INACTIVE`.

## Convenção proposta (audiências dinâmicas do pipeline diário)
`crm_<bu>_<bloco>_daily` → `crm_b2c_repescagem_daily`, `crm_plurix_topo_daily`, `crm_b2c_carrinho_daily`, `crm_b2c_upgrade_daily` + `crm_<bu>_exclusao_convertidos_daily`. Casa 1:1 com o `af_adset` do [[AppsFlyer-Tracking-CRM]] e com as 6 bases da [[Ativacao-de-Audiencias-Diaria]] — a mesma chave atravessa CRM, mídia e atribuição.

## Relacionado
- [[Canais]] · [[Plataformas-Mídia]] · [[SFMC-Salesforce-Marketing-Cloud]] · [[Ativacao-de-Audiencias-Diaria]] · [[AppsFlyer-Tracking-CRM]] · [[Topo-de-Funil]] · [[Repescagem]] · [[Upgrade]] · [[Carrinho-Abandonado]]
