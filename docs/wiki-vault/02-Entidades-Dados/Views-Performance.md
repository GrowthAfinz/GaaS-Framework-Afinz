---
tags: [supabase,views,performance,governanca]
tipo: entidade
camada: dados
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Views de Performance (fonte única de agregação)

**Definição:** as 4 views SQL no Supabase que padronizam **toda agregação de performance** — métricas sempre **ponderadas** (`sum/sum`, nunca `avg` de taxas) e flag de **confiança por volume de execução** (princípio da [[Ontologia-v2|v2]]).

## As views (migration `create_weighted_performance_views`, 2026-06-10)
| View | Grão | Métricas |
|---|---|---|
| `vw_performance_bu_segmento_safra` | [[Safra]] × [[BUs|BU]] × [[Segmentos|Segmento]] | disparos, base, propostas, aprovados, cartões, custo, `cac_ponderado`, `conv_ponderada`, `tx_proposta_pond`, `tx_aprovacao_pond`, `confianca` |
| `vw_performance_canal_safra` | Safra × BU × [[Canais|Canal]] | idem (sem taxas intermediárias) |
| `vw_media_campanha_mensal` | mês × plataforma × campanha | spend, impressões, cliques, conversões, `ctr/cpc/cpa_pond`, dias ativos |
| `vw_media_ad_mensal` | mês × campanha × adset × ad | idem, só linhas com `ad_id` |

## Regras embutidas
1. **Ponderação:** `cac_ponderado = sum(custo)/sum(cartões)`; `conv_ponderada = sum(cartões)/sum(base acionável)`. Média simples de taxas é proibida — distorce células pequenas.
2. **Confiança:** `alta` (≥10 disparos e ≥10k base), `media` (≥3), `baixa`. Leituras estratégicas só com `alta`/`media`.
3. **Sem dupla contagem na mídia:** Google chega nível-campanha, Meta nível-ad — **zero sobreposição** verificada (2026-06-10); somar é seguro.
4. Só `status='Realizado'` entra nas views de CRM.

## Contexto
Criadas para granularizar a leitura de BU/Segmento/Safra desde o início da base (jan/2025, 19 safras) e destravar o drill-down de mídia (35 campanhas, 149 ads) que dormia em [[paid_media_metrics]]. Pré-requisito: normalização da grafia de [[Safra]] (`06/26`→`2026-06`) — ver [[Inconsistências-a-Corrigir]]. App, vault e análises devem ler **daqui**, não re-agregar.

## Relacionado
- [[Supabase-Schema]] · [[Evolução-Temporal]] · [[Performance-por-Segmento]] · [[CPA-por-Plataforma]] · [[Runbook-Vault-Vivo]] · [[campaign_context]]
