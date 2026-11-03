---
tags: [ia,runbook,vault-vivo]
tipo: referencia
camada: evolucao
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Runbook — Vault Vivo

**Definição:** o procedimento que liga cada **snapshot datado** do vault à **query SQL** que o reidrata. Rode estas queries no Supabase ([[MCP-Visão-Geral|MCP]] `mipiwxadnpwtcgfcedym`), atualize o número e a data `> 📊 Snapshot AAAA-MM-DD` na nota correspondente.

## Contagens gerais → [[Supabase-Schema]] / [[KPIs-Núcleo]]
```sql
SELECT 'activities' t, count(*) FROM activities
UNION ALL SELECT 'gaas_dinamica_bi_metrics', count(*) FROM gaas_dinamica_bi_metrics
UNION ALL SELECT 'paid_media_metrics', count(*) FROM paid_media_metrics
UNION ALL SELECT 'paid_media_insights', count(*) FROM paid_media_insights
UNION ALL SELECT 'ad_creatives', count(*) FROM ad_creatives;
```

## CAC/conversão por canal → [[CAC-por-Canal]] / [[Canais]]
```sql
SELECT "Canal", count(*),
  round(avg("CAC"),2) cac, round(avg("Taxa de Conversão"),3) conv,
  sum("Cartões Gerados") cartoes
FROM activities
WHERE "Etapa de aquisição" IN ('Aquisicao','Meio_de_Funil')
GROUP BY "Canal" ORDER BY cartoes DESC;
```

## Performance por segmento → [[Performance-por-Segmento]] / [[Segmentos]]
```sql
SELECT "Segmento", count(*),
  round(avg("Taxa de Conversão"),3) conv, round(avg("CAC"),2) cac
FROM activities GROUP BY "Segmento" ORDER BY count(*) DESC;
```

## Mídia por plataforma → [[CPA-por-Plataforma]] / [[Plataformas-Mídia]]
```sql
SELECT channel, round(sum(spend)::numeric,0) spend, sum(conversions) conv,
  round((sum(spend)/NULLIF(sum(clicks),0))::numeric,2) cpc
FROM paid_media_metrics GROUP BY channel ORDER BY spend DESC;
```

## Granular ponderado (preferir!) → [[Views-Performance]] / [[Evolução-Temporal]]
```sql
-- cohort por safra (só confianca alta/media)
SELECT * FROM vw_performance_bu_segmento_safra
WHERE confianca <> 'baixa' ORDER BY safra, bu, segmento;
-- drill de mídia por campanha/mês
SELECT * FROM vw_media_campanha_mensal ORDER BY mes DESC, spend DESC;
-- nível ad (criativo)
SELECT * FROM vw_media_ad_mensal WHERE mes >= to_char(now()-interval '2 months','YYYY-MM');
```

## Disciplina
- Sempre atualizar **data + número juntos** (não deixar data velha com número novo).
- Marcar `status: a-validar` se a query mudar de definição.
- Idealmente: um agente roda este runbook no início do mês e abre as edições para revisão (ver [[Agentes-e-Workflows]]).

## Relacionado
- [[Vault-como-Contexto]] · [[MCP-Visão-Geral]] · [[Supabase-Schema]] · [[Convenções-do-Vault]]
