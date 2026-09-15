# Estudo de reconhecimento — Report Live

[observado] Data da leitura: 2026-09-14. Escopo: dados, engine, renderer, Google Sheets/Slides e pipeline; nenhuma implementação.

## Base, método e limites

- [observado] A base de código é o commit `2a03f1a` da branch `codex/report-live-editorial-2a-sheets`; a UX publicada é o run `9bb55892-4b17-4f76-825a-0ac97c92b525`, publicação `54649269-7cce-460a-a87d-b4cc5f310a62`, renderer `2.0-light`, 57 slides e 57 páginas PDF (`report_runs`, `report_publications`).
- [observado] A candidata 2a `5137402b-145d-44bf-8c10-08d926a71842` usa `2.1-editorial-2a`, está isolada/oculta e não é a UX publicada (`report_runs`, `report_publications`).
- [observado] `VIEW_REGISTRY` não é um registro de views: é uma tabela de 62 instâncias de slide mais cabeçalho, com `slide_instance_id`, código, seção, título, audiência, fonte, parceiro, eligibility, confiança e ordem (`report-live-engine.ts:1942-1949`; artefato imutável do run vivo).
- [observado] A inspeção Google autenticada retornou `google_mutated=false`, 169 slides físicos, 152 gerenciados, 264 abas físicas, 1.023 shapes e 76 `sheetsChart`; a geração viva tem 57 slides visíveis e 69 abas próprias (`report_live_dispatch_result(1893)`, `report_publications.generation_manifest`).
- [não verificável] O navegador não abriu o conteúdo por exigir login Google; por isso fit visual, clipping e overflow não são verificáveis pela superfície visual atual. Faltaria uma sessão Google autenticada ou o PDF vivo acessível localmente.
- [observado] O comando existente `inspect_publication` não alterou Google, mas criou um snapshot de auditoria no Storage em `runs/9bb55892.../publications/audit-fcfcfaa1-c3fa-447f-a2d8-40c0625284f7/before-write.json`; o objeto foi preservado, porque apagá-lo seria uma escrita destrutiva fora do escopo (`report_live_dispatch_result(1891)`).
- [observado] Por decisão do usuário nesta rodada, `K-VISA` e `VIEW_VISA_OPTIN` são legado de campanha encerrada: aparecem no inventário histórico do deck vivo, mas não entram como requisito nem lacuna futura.

## A — Inventário de dados

### A1. Registro de views

- [observado] O inventário exaustivo está em [`inventario_views.csv`](./inventario_views.csv): 1 view Postgres, 69 abas da geração publicada e 5 abas editoriais presentes somente na candidata 2a.
- [observado] As 69 abas publicadas somam 538 posições de coluna, 1.139 linhas de corpo e 9 abas apenas com cabeçalho (`report_publications.generation_manifest`; SQL: `SUM(column_count)`, `SUM(row_count-1)`, `COUNT(*) FILTER (WHERE row_count=1)`).
- [observado] As únicas relações Postgres com prefixo/view do escopo são `public.v_aquisicao_mensal_canonico`; `VIEW_*` e `VP_*` são matrizes geradas no TypeScript e materializadas como abas físicas do Sheets (`information_schema.views`; `report-live-engine.ts:1252-1949`).
- [observado] As cinco abas novas da 2a são `VIEW_EDITORIAL_RULERS` (25×19), `VIEW_EDITORIAL_LAYOUTS` (12×9), `VIEW_EDITORIAL_CHART_REGISTRY` (12×11), `VIEW_EDITORIAL_MONTHLY_CHARTS` (240×10) e `VIEW_EDITORIAL_PACING_CHARTS` (32×3), contagens incluindo cabeçalho (`report_publications` do run `5137402b...`; `report-live-engine.ts:577-735`).

### A2. View Postgres

- [observado] `v_aquisicao_mensal_canonico` tem grão `mês × parceiro_canonico`, chave candidata `(mes, parceiro)`, 48 colunas, 92 linhas entre 2025-01 e 2026-09 e 31 linhas em mar–ago/2026 (`information_schema.columns`; `SELECT count(*), min(mes), max(mes)` na view).
- [observado] O SQL efetivamente publicado, obtido por `pg_get_viewdef`, é:

```sql
WITH params AS (
  SELECT 30::numeric AS denominador_minimo_faixa_taxa,
         DATE '2026-02-01' AS corte_regime_serasa
), base AS (
  SELECT date_trunc('month', a."Data de Disparo" AT TIME ZONE 'America/Sao_Paulo')::date AS mes,
         a.parceiro_canonico AS parceiro,
         count(*) AS disparos,
         sum(a."Base Acionável") AS base_acionavel,
         sum(a."Propostas") AS propostas,
         sum(a."Aprovados") AS aprovados,
         sum(a."Cartões Gerados") AS cartoes,
         sum(a."Custo Total Campanha") AS custo,
         max((a."Data de Disparo" AT TIME ZONE 'America/Sao_Paulo')::date) AS ultima_data_observada
  FROM activities a
  WHERE a."Data de Disparo" IS NOT NULL
  GROUP BY 1, a.parceiro_canonico
), calc AS (
  SELECT b.*,
         CASE WHEN b.cartoes > 0 THEN b.custo / b.cartoes END AS cac,
         CASE WHEN b.aprovados > 0 THEN b.cartoes / b.aprovados END AS tx_finalizacao,
         CASE WHEN b.propostas > 0 THEN b.aprovados / b.propostas END AS tx_aprovacao,
         CASE WHEN b.base_acionavel > 0 THEN b.propostas / b.base_acionavel END AS tx_proposta,
         b.propostas > b.base_acionavel OR (b.propostas > 0 AND b.aprovados / b.propostas > 0.95) AS funil_nao_padrao_no_mes,
         b.mes < date_trunc('month', timezone('America/Sao_Paulo', now()))::date AS mes_fechado,
         greatest(0, least((date_trunc('month', b.mes::timestamptz) + interval '1 mon -1 days')::date - b.mes + 1,
                           b.ultima_data_observada - b.mes + 1)) AS dias_cobertos,
         p.denominador_minimo_faixa_taxa,
         CASE WHEN b.parceiro='Serasa' AND b.mes<p.corte_regime_serasa THEN 'serasa_pre_2026_02'
              WHEN b.parceiro='Serasa' THEN 'serasa_pos_2026_02' ELSE 'regime_unico' END AS regime_serie,
         CASE WHEN b.parceiro='Serasa' THEN p.corte_regime_serasa END AS corte_regime,
         CASE WHEN b.parceiro='Serasa' THEN 'Mudanca de definicao de Aprovados em 2026-02; comparacoes nao atravessam o corte.' END AS limitacao_medicao
  FROM base b CROSS JOIN params p
), windowed AS (
  SELECT c.*,
         min(c.disparos) OVER faixa_historica AS disparos_min_6m,
         max(c.disparos) OVER faixa_historica AS disparos_max_6m,
         min(c.base_acionavel) OVER faixa_historica AS base_acionavel_min_6m,
         max(c.base_acionavel) OVER faixa_historica AS base_acionavel_max_6m,
         min(c.propostas) OVER faixa_historica AS propostas_min_6m,
         max(c.propostas) OVER faixa_historica AS propostas_max_6m,
         min(c.aprovados) OVER faixa_historica AS aprovados_min_6m,
         max(c.aprovados) OVER faixa_historica AS aprovados_max_6m,
         min(c.cartoes) OVER faixa_historica AS cartoes_min_6m,
         max(c.cartoes) OVER faixa_historica AS cartoes_max_6m,
         min(c.custo) OVER faixa_historica AS custo_min_6m,
         max(c.custo) OVER faixa_historica AS custo_max_6m,
         min(c.cac) FILTER (WHERE c.cartoes>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS cac_min_6m,
         max(c.cac) FILTER (WHERE c.cartoes>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS cac_max_6m,
         min(c.tx_finalizacao) FILTER (WHERE c.aprovados>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_final_min_6m,
         max(c.tx_finalizacao) FILTER (WHERE c.aprovados>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_final_max_6m,
         min(c.tx_aprovacao) FILTER (WHERE c.propostas>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_aprovacao_min_6m,
         max(c.tx_aprovacao) FILTER (WHERE c.propostas>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_aprovacao_max_6m,
         min(c.tx_proposta) FILTER (WHERE c.base_acionavel>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_proposta_min_6m,
         max(c.tx_proposta) FILTER (WHERE c.base_acionavel>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_proposta_max_6m,
         count(*) OVER faixa_historica AS meses_observados,
         count(c.cac) FILTER (WHERE c.cartoes>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS cac_meses_validos_6m,
         count(c.tx_finalizacao) FILTER (WHERE c.aprovados>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_final_meses_validos_6m,
         count(c.tx_aprovacao) FILTER (WHERE c.propostas>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_aprovacao_meses_validos_6m,
         count(c.tx_proposta) FILTER (WHERE c.base_acionavel>=c.denominador_minimo_faixa_taxa) OVER faixa_historica AS tx_proposta_meses_validos_6m,
         count(*) OVER janela_semantica AS funil_semantica_meses_observados,
         bool_and(c.funil_nao_padrao_no_mes) OVER janela_semantica AS funil_nao_padrao_persistente
  FROM calc c
  WINDOW faixa_historica AS (PARTITION BY c.parceiro,c.regime_serie ORDER BY c.mes
                             RANGE BETWEEN interval '6 mons' PRECEDING AND interval '1 mon' PRECEDING),
         janela_semantica AS (PARTITION BY c.parceiro,c.regime_serie ORDER BY c.mes
                              RANGE BETWEEN interval '5 mons' PRECEDING AND CURRENT ROW)
)
SELECT mes, parceiro, disparos, base_acionavel, propostas, aprovados, cartoes, custo,
       cac, tx_finalizacao, tx_aprovacao, tx_proposta, funil_nao_padrao_no_mes,
       disparos_min_6m, disparos_max_6m, base_acionavel_min_6m, base_acionavel_max_6m,
       propostas_min_6m, propostas_max_6m, aprovados_min_6m, aprovados_max_6m,
       cartoes_min_6m, cartoes_max_6m, custo_min_6m, custo_max_6m,
       cac_min_6m, cac_max_6m, tx_final_min_6m, tx_final_max_6m,
       tx_aprovacao_min_6m, tx_aprovacao_max_6m, tx_proposta_min_6m, tx_proposta_max_6m,
       meses_observados, funil_semantica_meses_observados, funil_nao_padrao_persistente,
       CASE WHEN funil_semantica_meses_observados>=4 AND funil_nao_padrao_persistente
            THEN 'lead_pre_qualificado' ELSE 'padrao' END AS funil_semantica,
       ultima_data_observada, mes_fechado, dias_cobertos, denominador_minimo_faixa_taxa,
       cac_meses_validos_6m, tx_final_meses_validos_6m, tx_aprovacao_meses_validos_6m,
       tx_proposta_meses_validos_6m, regime_serie, corte_regime, limitacao_medicao
FROM windowed;
```

### A3. Colunas e consumidores

- [inferido] Na view Postgres, 33 colunas são fatos/medidas e faixas, 2 são dimensões (`mes`, `parceiro`) e 13 são qualidade/metadado; a classificação semântica foi inferida dos nomes e fórmulas, e a lista completa está na ordem do SQL acima (`information_schema.columns`; `pg_get_viewdef`).
- [observado] Em 31 linhas mar–ago, nulos são: `propostas` 3,23%; `aprovados`, `cac`, `tx_finalizacao`, `tx_aprovacao`, `tx_proposta`, `cac_min/max_6m` e `tx_final_min/max_6m` 6,45%; `funil_nao_padrao_no_mes`, `funil_nao_padrao_persistente` e `tx_aprovacao_min/max_6m` 3,23%; `corte_regime` e `limitacao_medicao` 80,65%; todas as outras 32 colunas 0% (`SELECT key, count(*) FILTER(value='null') FROM v_aquisicao_mensal_canonico CROSS JOIN jsonb_each(to_jsonb(...))`).
- [observado] A candidata 2a referencia diretamente 30 das 48 colunas canônicas em régua/layout/série; as outras 18 continuam no snapshot, mas não são desenhadas (`_shared/report-live-editorial.ts:69-250`; `report-live-engine.ts:577-735`).
- [observado] No inventário transversal do run vivo, `VIEW_FIELD_COVERAGE` contém 247 pares fonte×campo: 73 `consumed`, 1 `excluded_privacy` e 173 sem consumidor/exclusão certificada (`VIEW_FIELD_COVERAGE`; narrativa A4 no checkpoint imutável).
- [observado] As abas Sheets não possuem tipos SQL: o contrato físico é matriz JSON/Sheets; tipo é inferido por valor e pode variar por célula (`rowsToTable`, `report-live-engine.ts:401-409`).
- [não verificável] Não existe um catálogo persistido `view.column -> slide.element`; logo não há prova exata de consumo por coluna das 538 posições físicas. Faltaria um lineage manifest por campo, criado no engine/blueprint.

### A4. Tempo

| família | tem tempo? | extensão/grão | consequência |
|---|---:|---|---|
| [observado] `v_aquisicao_mensal_canonico` | sim | mês; 2025-01–2026-09 | sustenta seis meses no dado |
| [observado] `VP_*_SEGMENTS` | não | foto de agosto | evolução exige nova view/aba por mês×parceiro×segmento |
| [observado] `VP_*_CHANNELS` | não | foto de agosto | evolução exige nova view/aba; a view atual nem mantém segmento |
| [observado] `VP_*_CAMPAIGNS` | não | foto de agosto | evolução exige mês/data na chave e regra de identidade estável |
| [observado] `VP_*_FUNNEL` | não | foto de agosto | evolução exige mês×etapa ou família mensal canônica |
| [observado] `VIEW_PACING_ISODAYS` | sim | 31 dias de agosto | já sustenta linha diária |
| [observado] `VIEW_B2C_DAILY` | sim | fonte congelada até 2026-07-20 | agosto fica vazio, não zero |

- [observado] Portanto P2/P3/P5 de seis meses não são “só renderer”; o dado temporal fino não existe nas views que esses slides consomem (`report-live-engine.ts:1511-1592`).

### A5. Origens e relações

- [observado] `activities` alimenta CRM, parceiros, CAC, funil, cobertura de templates e a view mensal canônica; `rentabilizacao_activities` é fonte paralela de seguros, ligada por `activities_id` (`loadInputs`, `index.ts:366-500`; schema congelado).
- [observado] `paid_media_metrics` fornece fatos diários de plataforma; `paid_media_actions` fornece evento nomeado/atribuição; budgets, targets, aliases, mappings, objetivos, collection runs/logs e `event_map` governam leitura e qualidade (`loadInputs`, `index.ts:408-500`).
- [observado] `b2c_daily_metrics` fornece `data × tipo` com propostas/emissões, sem chave transacional para unir a CRM ou mídia (`MASTER_DECK_SPEC.md:127-131`; snapshot: 40 linhas).
- [observado] Qualidade e publicação usam `report_metric_certifications`, `report_slide_contracts`, `report_frozen_inputs`, `report_slide_runs`, `report_slide_blueprints`, `report_validations`, `report_publications` e os logs de coleta (`index.ts:408-500`, migrations Report Live).
- [observado] A relação cross-source é deliberadamente paralela/direcional; não há join certificado CRM↔B2C e CPA de plataforma não vira CAC (`manifest.comparability`, run vivo).

### A6. SQL versus TypeScript

| derivação no engine | local | equivalente SQL | risco |
|---|---|---|---|
| [observado] parceiro canônico/motivo/confiança | `report-live-engine.ts:205-272` | sim, 3 colunas GENERATED | divergência bloqueada por teste SQL↔TS e gate no build |
| [observado] período equivalente | `:130-137` | não | mudança de calendário altera todos os deltas |
| [observado] frente de mídia | `:139-149` | não | campanha nova pode cair em frente errada |
| [observado] métricas CRM e mídia SUM/SUM | `:276-399` | parcial na mensal canônica | duas implementações podem divergir em missing/custo |
| [observado] régua/veredito editorial | `:447-735` | valores/faixas vêm de SQL; texto/veredito em TS | regra editorial pode divergir do dado sem hash de regra |
| [observado] modo full/compact/quality_flag | `:777-827` | não | profundidade de capítulo muda sem histórico explícito |
| [observado] identidade canônica de campanha | `:829-841` | tabela de aliases; resolução em TS | alias pendente pode separar a mesma campanha |
| [observado] ações determinísticas e dedupe | `:843-957` | persistência SQL; produção em TS | sinal muda de identidade se `entity_key/signal_code` mudar |
| [observado] cobertura de campo | `:959-1050` | não | catálogo muda com schema e consumidor sem versionamento próprio |
| [observado] prontidão/confiança/eligibility | `:1052-1249` | contratos persistidos; decisão em TS | slide bloqueado pode ainda renderizar com limites |
| [observado] cutoff integrado | `:741-775` | não | `null` pode suprimir comparação e ações de gap |

### A7. Blueprint

- [observado] O envelope externo contém `slide_instance_id`, `slide_code`, `renderer_version`, `archetype`, `density`, `data_hash`, `narrative_hash`, `visual_hash` e `blueprint_hash`; o miolo contém identidade, parceiro, fonte, readiness, eligibility, confidence, campos faltantes, fallback, narrativa, contagem/hash da fonte, `visual{theme,archetype,density,minimum_body_pt,renderer_version}` e `evidence{requested_view,view_exists,quality_scope,native_cutoffs,gap_closure_days}` (`report-live-versioning.ts:183-310`; `report_slide_blueprints`).
- [observado] A certificação recalcula hashes de tabela, narrativa, visual e blueprint e compara snapshots de fonte por contagem+hash (`report-live-versioning.ts:361-388`).
- [observado] O blueprint é contrato de integridade e intenção visual; não guarda coordenadas, caixas, ordem z, regras de fit ou IDs de componentes. Portanto não é contrato completo de layout (`report-live-versioning.ts:183-220`).

## B — Matriz de disponibilidade por grão

### B1. Cardinalidades mar–ago/2026

| dimensão | distintos | N/A/vazio em linhas | valores |
|---|---:|---:|---|
| [observado] parceiro canônico | 6 | 1 | Bem Barato; Dia; N/A; Plurix; Proprietaria; Serasa |
| [observado] canal | 4 | 0 | E-mail; Push; SMS; WhatsApp |
| [observado] segmento | 8 | 0 | Abandonados; Aprovados_nao_convertidos; Base_Proprietaria; CRM; Instabilidade; Leads_Parceiros; Negados; Recencia_de_Compra |
| [observado] subgrupo | 14 | 1.066 | 14 valores; inclui N/A e Sem Segmento |
| [observado] oferta | 2 | 0 | Padrao; Vibe |
| [observado] jornada | 126 | 0 | lista longa; `COUNT(DISTINCT jornada)` |
| [observado] etapa | 3 | 0 | Aquisicao; Meio_de_Funil; Reativacao |
| [observado] produto | 2 | 0 | Cartao; Classic |
| [observado] perfil de crédito | 3 | 0 | Mar_aberto; Pre_analisado; Whitelist |
| [observado] safra | 9 | 0 | 05/26–08/26 e 2026-03–2026-07 |

- [observado] Fonte: 4.331 linhas de `activities`, `Data de Disparo BETWEEN '2026-03-01' AND '2026-08-31'`; a consulta unpivotou as dez dimensões e contou `DISTINCT` e `NULL/N/A`.

### B2. Células e meses

| grão | células | ≥2 meses | ≥4 meses qualquer dado | ≥4 base≥30 | ≥4 propostas≥30 | ≥4 aprovados≥30 | ≥4 cartões≥30 |
|---|---:|---:|---:|---:|---:|---:|---:|
| [observado] parceiro | 6 | 5 | 5 | 5 | 5 | 5 | 4 |
| [observado] parceiro×canal | 17 | 15 | 13 | 12 | 8 | 8 | 7 |
| [observado] parceiro×segmento | 22 | 15 | 11 | 11 | 10 | 10 | 8 |
| [observado] parceiro×canal×segmento | 46 | 28 | 16 | 15 | 11 | 11 | 8 |
| [observado] parceiro×oferta | 11 | 10 | 9 | 8 | 8 | 7 | 7 |
| [observado] parceiro×campanha | 601 | 124 | 21 | 19 | 6 | 6 | 2 |

- [observado] A referência de 46 células e 15 com quatro meses de base≥30 confere exatamente (`activities`, SQL de agrupamento por mês e `COUNT(*) FILTER`).
- [observado] A divergência relevante aparece por métrica: no mesmo grão fino, somente 8 células sustentam faixa de CAC (cartões≥30), não 15.

### B3. Métrica × grão

| grão/view atual | base | propostas | aprovados | cartões | custo | CAC | proposta/base | aprovado/proposta | cartão/aprovado | cartão/base |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [observado] parceiro `VP_*_RESULT/FUNNEL` | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| [observado] parceiro×segmento `VP_*_SEGMENTS` | sim | não | não | sim | sim | sim | não | não | não | sim |
| [observado] parceiro×canal `VP_*_CHANNELS` | sim | não | não | sim | sim | sim | não | não | não | sim |
| [observado] parceiro×canal×segmento `VIEW_CAC_DRIVERS` | sim | não | não | sim | sim | sim | não | não | não | sim |
| [observado] parceiro×campanha `VP_*_CAMPAIGNS` | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| [observado] parceiro×oferta | calculável da `activities` | calculável | calculável | calculável | calculável | calculável | calculável | calculável | calculável | calculável |

- [observado] “Calculável” não significa “materializado”: não existe view do deck para parceiro×oferta (`report-live-engine.ts:1481-1610`).

### B4. Denominador

- [observado] O valor é global `30`, declarado em `params`; a coluna é única, mas o denominador usado muda por métrica: cartões para CAC, aprovados para finalização, propostas para aprovação e base para proposta (`pg_get_viewdef`).
- [observado] Reprovações entre células que já têm ≥4 meses: parceiro `0/0/0/1`; parceiro×canal `1/5/5/6`; parceiro×segmento `0/1/1/3`; parceiro×canal×segmento `1/5/5/8`; parceiro×oferta `1/1/2/2`; parceiro×campanha `2/15/15/19`, na ordem base/propostas/aprovados/cartões (B2 SQL).

### B5. Regime

- [observado] Há 1 série com corte não nulo: Serasa; são 6 linhas mar–ago com `corte_regime=2026-02-01` e `regime_serie=serasa_pos_2026_02` (`v_aquisicao_mensal_canonico`).
- [observado] O disparo é `parceiro='Serasa'`; o SQL impede a janela histórica de atravessar o corte ao particionar por `parceiro, regime_serie` (`pg_get_viewdef`).

## C — Frescor, latência e cobertura

### C1. Lag

- [não verificável] `activities` registra data de disparo e total agregado de cartões, mas não registra data de aparecimento de cada cartão. Logo mediana, p75 e p90 por parceiro não podem ser calculadas. Faltaria uma tabela de eventos/cartões com `activity_id` e `observed_at` ou snapshots cumulativos versionados.
- [observado] A afirmação “~7 dias” permanece sem base no contrato atual; não foi convertida em número (`information_schema.columns` de `activities`).

### C2–C4. Granularidade, cutoffs e mês aberto

| fonte | dado nativo | snapshot vivo | cutoff | frequência |
|---|---|---|---|---|
| [observado] CRM | disparo; totais posteriores sem timestamp de chegada | 1.798 linhas 2026-07-01–08-31 | 2026-08-31 | não persistida; carga manual/irregular |
| [observado] mídia | dia×objeto e evento | 1.110 fatos + 13.974 ações | 2026-08-31 | Meta: 101 intervalos completos, mediana 5,88h, p75 24h |
| [observado] B2C | dia×tipo | 40 linhas 2026-07-01–07-20 | `null` para agosto | não persistida; base atual parou em 20/07 |
| [observado] seguros | disparo | 1.643 linhas 2026-07-01–08-23 | 2026-08-23 | não persistida |

- [observado] O cutoff integrado é `null`, `integrated_reading_available=false` e `gap_closure_days=null`; não há gap numérico integrado a reportar no run vivo (`report_frozen_inputs.inputs.manifest`).
- [observado] Mês aberto é definido no SQL por `mes < primeiro_dia_mes_atual`; `dias_cobertos` usa a última data observada e o limite do calendário (`v_aquisicao_mensal_canonico`).
- [observado] A faixa histórica exclui o mês corrente pelo frame até `1 mon PRECEDING`; na 2a, `current_month_open` e `comparison_eligible` entram na régua para retirar veredito de período parcial (`report-live-engine.ts:447-735`).
- [inferido] No renderer vivo 2.0, mês aberto não tinha componente específico; o tratamento visual só existe na candidata 2a, deduzido da ausência de `VIEW_EDITORIAL_*` nas 69 abas vivas e da presença na candidata.

### C5. Ausência versus zero

- [observado] Preserva ausência: `sumNullable` retorna `null` quando nenhum número existe; `sumComplete` retorna `null` se qualquer parcela falta; `ratio` retorna `null` se numerador/denominador faltam ou denominador é zero; `delta` retorna `null` se o anterior é zero (`report-live-engine.ts:276-299`).
- [observado] O SQL mensal usa `CASE WHEN denominador>0 THEN ... END`, portanto taxa/CAC impossível vira `null`, não zero (`v_aquisicao_mensal_canonico`).
- [observado] Coerções a zero que afetam decisão existem em `buildPartnerModes`: total de cartões, share e sinal usam `?? 0`; isso pode classificar ausência como share zero/sinal sem cartões (`report-live-engine.ts:790-800`).
- [observado] `gap_closure_days ?? 0` pode suprimir a ação de gap quando o gap é desconhecido; coberturas ausentes de template/slot viram zero para decidir status de backlog (`report-live-engine.ts:864`, `:1822-1829`).
- [observado] As demais ocorrências `??0` em sort, contador e geometria não alteram a métrica exibida (`report-live-engine.ts:826`, `:1477-1768`; `index.ts:557-764`).

### C6. Qualidade atual

- [observado] `activities` tem 7.466 linhas; 377 grupos repetem a chave candidata `activity_name normalizado × canal × data`, 330 têm valores/jornada diferentes, abrangendo 764 linhas, 1.440 cartões e R$ 13.346,95 de custo. SQL: `GROUP BY normalized(activity), canal, data HAVING count(*)>1`.
- [observado] 440 linhas têm custo nulo; 103 delas têm cartões, somando 1.046 cartões sem custo (`activities`).
- [observado] 779 linhas têm CAC armazenado divergente de `custo/cartões` por mais de R$0,01; abrangem 12.838 cartões e R$147.647,92 de custo (`activities`).
- [observado] No recorte mar–ago: 267 custos nulos com 538 cartões; 553 CACs divergentes, 7.674 cartões e R$98.218,58 (`activities`).
- [observado] Hoje 1.025/7.466 activities têm `template_id` (13,73%) e 2/115 slots têm `current_template_id` (1,74%); o snapshot vivo de agosto congelou 7,54% de cobertura CRM (`activities`, `communication_slots`, `manifest.field_coverage`).
- [observado] Nenhuma linha foi deduplicada, nenhum CAC foi recalculado em massa e custo nulo não foi corrigido nesta rodada.

## D — Vocabulário e limites do renderer

### D1. Primitivas expostas

| função/caminho | assinatura/efeito |
|---|---|
| [observado] `rgb(hex)` | `string -> {red,green,blue}` (`report-sync-v4-setup/index.ts:933-940`) |
| [observado] `ensureV1Charts(registry,titleMap,editorialPlans)` | cria/atualiza/remove gráficos no Sheets, retorna `chartBySlide` e manifest (`:1057-1310`) |
| [observado] `addTextBox(requests,pageId,objectId,text,x,y,w,h,style)` | cria `TEXT_BOX` ou `ROUND_RECTANGLE`, texto e estilo uniforme (`:1313-1392`) |
| [observado] `v1PreviewText(view,titleMap)` | lê A1:H8, mostra 7×5 e corta cada célula em 22 caracteres (`:1394-1406`) |
| [observado] `renderPreviewText(preview,missingChart)` | envolve preview em mensagem de dado indisponível (`:1409-1412`) |
| [observado] `ensureV1Slides(...)` | cria slide blank, fundo, caixas, gráfico vinculado e visibilidade por geração (`:1415-1779`) |

- [observado] Não há API de componentes por arquétipo; as primitivas efetivas de Slides usadas são `createSlide`, `updatePageProperties`, `createShape`, `insertText`, `updateTextStyle`, `updateShapeProperties` e `createSheetsChart` (`index.ts:1333-1388`, `:1571-1737`).

### D2. Impossibilidades atuais

- [observado] O renderer não chama `createTable`, `createLine`, `createImage` nem cria ícones/sparklines; essas primitivas não existem no código (`report-sync-v4-setup/index.ts`, busca pelos requests da Slides API).
- [observado] Não existe célula nativa com fundo condicional no Slides; só há shape inteiro com fill. Não existe texto com múltiplos estilos no mesmo bloco; `updateTextStyle` aplica `ALL` (`index.ts:1367-1379`).
- [observado] Não existe autofit, redução automática de fonte, medição de texto, reflow por conteúdo, limite de linhas, elipse, paginação de tabela ou detecção de overflow (`addTextBox`, `index.ts:1313-1392`).
- [inferido] A API Google suporta linha, tabela, imagem e links, mas o componente atual não os encapsula; a limitação é da implementação, não do produto Google, deduzido do conjunto de requests documentado pela API e ausente no código.

### D3. Gráficos

- [observado] O caminho legado expõe BAR, SCATTER, COLUMN e LINE; AREA e COMBO não têm config; eixo duplo só aparece no caminho editorial LINE da 2a (`chartConfigFor`, `index.ts:1034-1054`; editorial `:1099-1193`).
- [observado] O código lê `A1:AZ500`, encontra domínio e séries pelo nome do cabeçalho, elimina séries sem número e monta ranges exatos por coluna de `row 0` até `values.length` (`index.ts:1189-1245`; `_shared/report-live-chart-policy.ts`).
- [observado] Nome de série vem do cabeçalho; legenda é nenhuma para 1 série e inferior para >1; cores legadas ciclam cyan/blue/green/purple. Grade, min/max de eixo, rótulo de dados e formato numérico não são configurados (`index.ts:1208-1245`).
- [observado] A 2a aceita LEFT/RIGHT axis, cor, largura e ponto por série, legenda inferior e `interpolateNulls=false`, mas fixa `chartType=LINE` (`index.ts:1099-1193`).

### D4. Formatação numérica

- [observado] Texto narrativo usa `Intl.NumberFormat` no engine; gráficos recebem números brutos e não há `numberFormat` nem formato de eixo no renderer (`report-sync/index.ts:1960-1980`; setup `:1208-1245`).
- [observado] Hoje não há controle que garanta eixo `58,6%` em vez de `0.59`. A alternativa mínima é materializar série em pontos percentuais e nomear `%`; a alternativa robusta é adicionar formato explícito no Sheets/axis e validá-lo no inspector.

### D5. Texto

- [observado] Preview corta sem reticências em 22 caracteres; shape usa caixa e fonte fixas, e o Google decide quebra/transbordo (`index.ts:1394-1406`, `:1313-1392`).
- [observado] Título usa 570×40 pt, 24 pt; o corpo/preview 438×255 pt e leitura 212×255 pt. Duas linhas não deslocam o corpo; portanto podem colidir visualmente com a faixa fixa (`index.ts:1606-1723`).
- [não verificável] Quais slides efetivamente transbordam não é retornado pelo inspector; o CSV distingue corte determinístico, risco inferido e overflow não verificável.

### D6. Link interno

- [observado] A Slides API usada suporta `Link` para slide por índice/ID, mas o renderer atual nunca configura `link` em `updateTextStyle` ([Google Slides Link](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations.pages/other); `index.ts:1367-1379`).
- [inferido] Esforço é pequeno no primitivo e médio no produto: requer mapa estável destino→pageId, range de texto clicável, estilo e verificação pós-publicação; não exige gráfico vinculado.

## E — Especificação do slide

### E1. Da view ao slide

- [observado] Fluxo: `loadInputs` lê e congela fontes (`index.ts:366-500`) → `buildReport` cria views (`report-live-engine.ts:1252-1949`) → `buildSlides` cruza contratos, campos, fallback e qualidade (`:1100-1249`) → `VIEW_REGISTRY` materializa a decisão (`:1942-1949`) → renderer lê registro (`setup index.ts:1027-1031`) → escolhe gráfico por código ou plano editorial (`:1034-1310`) → monta slide (`:1415-1779`).

### E2–E3. Layout e coordenadas

- [observado] No vivo, arquétipo é metadado; todos os 12 arquétipos passam pelo mesmo layout hardcoded. A 2a adiciona dados de régua/layout, mas as coordenadas continuam em código (`index.ts:1535-1738`).
- [inferido] O canvas usado é widescreen 720×405 pt; a função não altera `pageSize`, e todas as caixas fecham nesse envelope. Faltaria ler `presentation.pageSize` para converter a inferência em observação.

| elemento | x | y | largura | altura | fonte |
|---|---:|---:|---:|---:|---:|
| [observado] eyebrow | 28 | 18 | 500 | 18 | 9 pt |
| [observado] título | 28 | 38 | 570 | 40 | 24 pt bold |
| [observado] acento | 28 | 82 | 664 | 3 | shape |
| [observado] badge | 590 | 28 | 102 | 24 | 9 pt bold |
| [observado] gráfico vivo | 28 | 100 | 438 | 238 | vinculado |
| [observado] preview vivo | 28 | 100 | 438 | 255 | 11 pt; anexo 9 pt |
| [observado] leitura | 480 | 100 | 212 | 255 | 11 pt |
| [observado] rodapé | 28 | 371 | 664 | 16 | 8 pt |
| [observado] régua 2a | 28 | 98 | 438 total | 78 | 8–9 pt |
| [observado] gráfico com régua | 28 | 184 | 438 | 158 | vinculado |

### E4. Tipografia e cor

- [observado] Escala usada: 24 pt título; 11–12 pt corpo/leitura; 9 pt eyebrow/badge/anexo mínimo; 8 pt rodapé/suporte/régua densa; família Arial por default (`index.ts:1373-1378`, `:1602-1737`).
- [observado] Tokens centralizados em `AFINZ_LIGHT`: canvas `#F7F9FA`, surface `#FFFFFF`, muted `#EEF3F4`, text `#111827`, textMuted `#667085`, border `#D9E2E5`, cyan `#00C6CC`, lime `#D3FF00`, blue `#3B82F6`, green `#10B981`, purple `#A855F7`, amber `#F59E0B`, red `#DC2626` (`_shared/report-live-design.ts:1-16`).
- [observado] Há aliases `V1_COLORS`, mas apontam para tokens centrais; duas cores degradadas `#991B1B/#FDECEC` ainda aparecem inline (`setup index.ts:919-930`, `:1693-1694`).
- [inferido] Aderência de cor é alta ao guia Afinz; aderência tipográfica é parcial porque Arial substitui a tipografia institucional e não há hierarquia responsiva.

### E5–E6. Componentização e arquétipos

- [observado] Componentização real: `addTextBox`, um construtor de chart e um layout único; arquétipos não têm componentes próprios (`setup index.ts:1313-1779`).
- [observado] A régua 2a é produzida uma vez por `buildEditorialTabs` e desenhada pelo mesmo loop para P1/P4; C4 usa a mesma família de plano/renderer, como especificado (`engine.ts:447-735`; setup `:1638-1655`).

| arquétipo | códigos | visual vivo | varia com dado? |
|---|---|---|---|
| [observado] cover_contract | C0 | preview + leitura | não |
| [observado] executive_takeaway | C1 | preview + leitura | não |
| [observado] quality_gate | C2 M6 B3 K-QLT | preview + leitura | não |
| [observado] scorecard | C3 P1 | preview + leitura | não |
| [observado] time_series_pacing | C4 M1 B2 | M1 chart; C4/B2 preview | só presença de série |
| [observado] router_ranking | C5 M2 M3 | chart | não |
| [observado] driver_scatter | C6 | chart | não |
| [observado] funnel | P4 M4 B1 | chart | não |
| [observado] heatmap | P3 A1 | chart de barra; não heatmap nativo | não |
| [observado] analytical_table | P2 P5 C7 K-TPL e condicionais | chart ou preview | só chart disponível |
| [observado] action_queue | C8 P7 M7 | preview | não |
| [observado] technical_annex | A2–A7 | preview | não |

### E7. Estados degradados

- [observado] Sem série numérica esperada: `renderPreviewText` cria shape vermelho com “DADO INDISPONÍVEL...” (`setup index.ts:1409-1412`, `:1683-1695`).
- [observado] Amostra/regime incomparável: a 2a carrega `comparison_eligible`, `current_month_open`, `limitation` e pode mostrar linha sem faixa/veredito (`engine.ts:447-565`).
- [observado] View bloqueada: `buildSlides` força `blocked`/`render_com_limites` conforme readiness, campos e volume; não impede render por si só (`engine.ts:1100-1249`).
- [observado] Tabela vazia vira cabeçalho no Sheets; o preview desenha esse cabeçalho em caixa branca. É exatamente o caminho previsto que produz P7 sem ação, não uma exceção do Google (`rowsToTable`, `engine.ts:401-409`; `v1PreviewText`, setup `:1394-1406`).
- [observado] Cinco P6 e K-EXP são omitidos antes do renderer por `omitir_bloqueado`; no vivo são 5 omissões, não 6, porque Dia compacto não instancia P6 (`VIEW_REGISTRY`, run vivo).

### E8. Densidade

- [observado] Há convenção de `minimum_body_pt` 11, anexo 9, e densidade `standard/analytical`; o vivo mantém 7 elementos em todos os 57 slides (`_shared/report-live-design.ts:56-58`; inspect request 1893).
- [observado] Não há limite validado de caracteres, linhas, rótulos, elementos ou gráficos por slide; a única poda é preview 7×5×22. A auditoria histórica recomenda título≤60, takeaway≤240 e action≤180, mas o renderer não valida (`AUDITORIA_REPORT_LIVE_2026-07-23.md:1343`; setup `:1394-1406`).

## F — Linha de base de UX

- [observado] As 57 linhas, na ordem física publicada, estão em [`inventario_slides.csv`](./inventario_slides.csv). Número de elementos e gráficos vem da inspeção Google; corpo foi recomputado do artefato imutável pela mesma regra 7×5×22; narrativa vem do blueprint.
- [observado] F1: 3 slides têm arquétipo temporal (C4, M1, B2), mas 0 têm linha temporal incorporada no vivo: C4 é preview diário, M1 é barra mensal por objetivo e B2 está vazio. Os outros 54 são foto/contrato do recorte.
- [observado] F2: 27 slides têm gráfico vinculado; 30 têm tabela/preview como texto; 7 desses 30 têm fonte só com cabeçalho e, portanto, nenhum visual analítico com dado (C7, B2 e P7×5).
- [inferido] F3: badge 2.448 pt² + rodapé 10.624 pt² + leitura 54.060 pt² = 67.132 pt², ou 23,02% do canvas inferido de 720×405 pt. A caixa principal ocupa 38,30%; o restante é título, margens e respiro (`setup index.ts:1595-1737`).
- [observado] F4: Alta 13 (22,81%), Média 1 (1,75%), Baixa 22 (38,60%) e Indisponível 21 (36,84%) nos 57 slides (`report_slide_runs`, excluindo 5 `omit`).
- [observado] F5: documento inteiro 264 abas físicas e 117 gráficos; geração viva 69 abas, 9 sem linhas de corpo e 28 gráficos. Os 57 slides vivos incorporam 27 gráficos; a diferença é `VIEW_VISA_OPTIN`, legado encerrado cujo gráfico físico não é usado por K-VISA (`report_live_dispatch_result(1893)` + `generation_manifest`).
- [inferido] F5 físico total: 117 gráficos no Sheets menos 76 incorporações `sheetsChart` nos 152 slides gerenciados = 41 gráficos sem incorporação. É delta de contagem, não prova por ID; faltaria o inspector devolver `chartId` por page element.
- [não verificável] F5 abas vazias no documento inteiro: o inspector retorna grid e charts, não valores de todas as 264 abas. Para a geração viva, 9 vazias de corpo são verificáveis pelo manifest; o número comparável aos “82 vazios” históricos exigiria ler as 264 matrizes.
- [observado] F6: 0 grupos repetem a mesma frase trocando apenas o nome da view; 5 P7 repetem exatamente a frase “Nenhuma ação candidata...” sem nome de view (`report_slide_blueprints GROUP BY narrative`).

## G — Pipeline

### G1. Build

- [observado] Fases duráveis: `refresh -> capture -> calculate -> persist -> certify`; com autopublish, entra no job de publicação (`index.ts:2242-2295`).
- [observado] O run vivo foi criado 23:12:17, capturado 23:15:26 e marcado built 23:15:55: 3m38s até build; certificação ocorreu 2026-09-13 01:46:56 e inclui espera externa, não tempo de CPU (`report_runs`, `report_frozen_inputs`).
- [não verificável] Duração por fase não é persistida: checkpoints/receipts não têm `started_at`, `completed_at` ou `duration_ms`. Faltaria telemetria por transição em build/publication jobs.
- [observado] Falhas principais: leitura/paginação de fonte, congelamento/hash, persistência Storage, contrato/retangularidade, credencial worker, quota/API Google, chart sem série, verificação de Sheets/Slides, PDF e ativação (`index.ts:366-500`, `:1173-1590`, `:2242-2527`).

### G2. Certificação

- [observado] Certifica conteúdo imutável: fontes por hash+contagem, tabelas, retangularidade, campos obrigatórios, coerência readiness/confidence/eligibility, narrativas, blueprints, períodos e materialidade; qualquer validação blocking failed reprova (`report-live-versioning.ts:361-660`).
- [observado] A publicação exige run certificado e role `publisher/admin`; analyst pode gerar candidato, viewer só lê (`index.ts:2606-2670`; `Report-Live-Versionamento-e-Publicacao.md`).

### G3. Geração e rollback

- [observado] A publicação cria namespace de abas e IDs de slide por release, escreve/verifica Sheets, cria slides `isSkipped=true`, verifica geração, exporta/verifica PDF, ativa escondendo a geração anterior e só então commita o ponteiro (`report-live-publication.ts:2-35`; migration `20260913103543_report_live_pdf_before_activation.sql`; `index.ts:2393-2527`).
- [observado] Antes de `activate`, a candidata fica oculta; rollback é nova publicação de artefato certificado anterior, com `rollback_of_publication_id` e restauração de visibilidade/pointer (`index.ts:2959-2983`).

### G4. Verificação

- [observado] Sheets verifica existência, dimensão e valores/contagem das tabelas da geração; Slides verifica IDs esperados, contagem, estado skipped e estrutura/hash; PDF verifica bytes e páginas (`index.ts:912-1159`, `:1498-1545`, `:1751-1857`, `report-live-immutable-file.ts:15-20`).
- [observado] Não verifica fit/overflow, semântica de eixo, formato percentual, contraste, rótulo duplicado, legibilidade ou correspondência visual screenshot↔blueprint.
- [observado] O modo `inspect_publication` atual compara títulos lógicos com abas físicas namespaced e reportou 0 matches no run vivo; é um bug do inspector, não da publicação (`report_live_dispatch_result(1891)`; `index.ts:2711-2728`).

### G5. Cadência

- [inferido] Rodar 2–3 vezes/semana não quebra imutabilidade, mas cresce Google linearmente porque gerações antigas permanecem ocultas: hoje há 264 abas, 169 slides e 152 slides gerenciados. Em quatro semanas, a 69–74 abas e 57 slides por run, seriam +552–888 abas e +456–684 slides.
- [inferido] O custo dominante de verificação também cresce se o inspector varrer o documento inteiro; a geração-aware pode permanecer O(tamanho da geração). É necessário retenção/arquivo por política, não delete ad hoc.

### G6. Estado entre rodadas

- [observado] Persistem contratos, frozen inputs, artefatos, blueprints, validações, publicações, ponteiro, aliases, certificações, membros, candidatos e outcomes. As métricas/tabelas do run são recalculadas de snapshot congelado (`report_*` schemas; `report-live-versioning.ts:238-310`).
- [observado] Narrativa e fila do slide não “lembram” a rodada anterior automaticamente; a persistência existe, mas o engine só usa `actionOutcomes` fornecidos no input e não fecha outcomes (`loadInputs`, `buildDeterministicCandidates`).

### G7. Fila de ação

- [observado] `report_action_candidates` possui 24 campos: id, run, fonte, entity/signal keys, domínio, parceiro, bucket, sinal, impacto, causa, evidências, limite, ação, owner, prazo, métrica, confiança, gerador, review, status, resultado posterior e timestamps (`information_schema.columns`).
- [observado] A deduplicação dentro do run é `entity_key × signal_code`; o banco tem 45 candidatas em 22 runs, 0 aprovadas e 45 abertas. O número 43 da ficha já estava dois abaixo do estado lido (`report_action_candidates`; `engine.ts:843-957`).
- [observado] O run vivo gerou 1 candidata (`TEMPLATE_COVERAGE_LT_80`); a candidata 2a também gerou 1. O schema de outcomes tem 15 campos, incluindo baseline, esperado, observado, unidade, janela e conclusão, mas a tabela tem 0 linhas (`report_action_outcomes`).
- [observado] Portanto há estado, direção esperada pode ser expressa em `expected_value`, e janela existe no schema; o fechamento automático/verificação ainda não existe. Hoje a candidata é recalculada por run e o loop não produz outcome.

## H — Lacunas explícitas

### Trilha Painel

| lacuna | camada | dependência | risco de fazer errado |
|---|---|---|---|
| [observado] mês nas séries de segmento | view/engine | P2 seis meses | comparar categorias que mudaram de nome/definição |
| [observado] mês + segmento no canal | view/engine | P3 parceiro×canal×segmento | repetir o erro atual: view é só canal e não responde ao contrato |
| [observado] identidade mensal de campanha | tabela de alias + view | P5 seis meses | fundir campanhas por similaridade textual ou quebrar continuidade |
| [observado] denominador por métrica/grão | view | régua e veredito | usar base≥30 para validar finalização, que exige aprovados≥30 |
| [observado] corte de regime por série fina | view/qualidade | todas as faixas | atravessar mudança semântica como se fosse performance |
| [observado] family views retangulares | engine/Sheets | linhas vinculadas | recomputar no renderer e quebrar imutabilidade |
| [observado] componentes de painel | renderer | linha, faixa, tabela/heatmap, missing | chamar barra de heatmap e esconder a segunda dimensão |
| [observado] formatação de eixo | renderer/Sheets | taxas e CAC | exibir 0.59 sem unidade ou comparar escalas incompatíveis |
| [observado] QA de fit e rótulo | pipeline | títulos/categorias longas | truncamento silencioso e quebra no meio da palavra |
| [observado] mover governança repetida | blueprint/layout | liberar 23,02% do canvas | retirar limite crítico sem manter acesso no overview/anexo |

### Trilha Overview + loop

| lacuna | camada | dependência | risco de fazer errado |
|---|---|---|---|
| [observado] contrato de exceção/materialidade | engine + contract | abertura movida a exceção | virar ranking genérico ou omitir falha de integridade |
| [observado] lineage campo→sinal→slide | blueprint | explicabilidade | ação sem evidência reproduzível |
| [observado] identidade estável cross-run | tabela/engine | tabela de sinais e apostas | duplicar a mesma aposta em cada run |
| [observado] estado humano | tabela/RBAC/UI | motor propõe; humano aprova | IA publicar compromisso sem owner |
| [observado] direction + baseline + janela obrigatórios | schema/gate | verificação posterior | concluir “funcionou” sem hipótese temporal |
| [observado] avaliador de outcome | engine/job | fechar loop | tabela existe e permanece vazia indefinidamente |
| [observado] política de conflito/dedupe cross-run | engine/tabela | fila canônica | apagar sinais legítimos ou acumular clones |
| [observado] sitelinks estáveis | renderer + verificação | sumário navegável | link quebrar quando a geração troca IDs |
| [observado] componente overview responsivo | renderer | densidade por exceção | título/leitura fixos continuarem empurrando conteúdo |
| [observado] retenção de gerações | pipeline/Storage/Google | cadência 2–3× semana | documento crescer centenas de abas/slides por mês |
| [observado] aposentadoria K-VISA | contrato + engine + renderer | retirar campanha encerrada | apagar histórico ou manter custo/ruído operacional eterno |

## Síntese em três linhas

- [observado] O que mais surpreendeu: 69 abas pertencem à geração viva, mas o documento carrega 264; imutabilidade foi resolvida sem política de retenção.
- [observado] O que está pior: P2/P3/P5 não têm tempo nas views, o fit não é verificado e 173 campos continuam sem consumidor; não é uma troca simples de layout.
- [observado] O que está melhor: o artefato, os hashes, a geração isolada, a ativação e o schema do loop já existem; a próxima fase estende uma fundação real, não parte do zero.
