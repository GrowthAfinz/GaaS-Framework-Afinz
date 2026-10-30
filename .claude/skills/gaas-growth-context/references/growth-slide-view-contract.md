# Growth Slide View Contract

Este contrato define a ordem tecnica das tabelas/views. A narrativa pode reorganizar a leitura, mas cada comentario precisa apontar para a view de origem.

Variacoes percentuais sao campos auxiliares. Usar deltas apenas quando ajudarem a explicar impacto, risco, mudanca de mix, custo, funil, pacing, tracking ou prioridade de acao.

## Views substituidas ou proibidas

- Nao usar `VIEW_MEDIA_B2C_APP_FUNNEL` como estrutura principal do bloco de midia.
- Substituir por views simetricas por objetivo: `VIEW_MEDIA_PACING__OBJETIVO`, `VIEW_MEDIA_OBJETIVO_PLATAFORMA`, `VIEW_MEDIA_CAMPANHAS__OBJETIVO`, `VIEW_MEDIA_CRIATIVOS__OBJETIVO`, `VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO` e `VIEW_MEDIA_ACTION_QUEUE__OBJETIVO`.
- Se um objetivo nao tiver funil final, manter o objetivo no report com proxy adequado e limite de tracking, em vez de omitir ou privilegiar app B2C.

## Ordem tecnica

| Ordem | Bloco | View | Grao | Papel |
| --- | --- | --- | --- | --- |
| 1 | Cockpit Growth | `VIEW_GROWTH_COCKPIT` | Resumo executivo por frente | Estado da operacao e proxima acao. |
| 2 | Aquisicao CRM | `VIEW_AQS_BU` | BU/frente | Sustentacao de producao e eficiencia por frente. |
| 3 | Aquisicao CRM | `VIEW_AQS_PARCEIRO` | Parceiro | Importancia por volume, eficiencia, custo e risco. |
| 4 | Aquisicao CRM | `VIEW_AQS_SEGMENTO__PARCEIRO` | Segmento dentro de parceiro | Explicar resultado do parceiro por publico/funil. |
| 5 | Aquisicao CRM | `VIEW_AQS_CANAL__PARCEIRO__SEGMENTO` | Canal dentro de parceiro e segmento | Diagnosticar alavanca ou gargalo de canal. |
| 6 | Aquisicao CRM | `VIEW_AQS_FUNIL__PARCEIRO` | Funil por parceiro | Mostrar onde a producao escapa. |
| 7 | Aquisicao CRM | `VIEW_AQS_TOP_CAMPANHAS__PARCEIRO` | Campanhas/disparos por parceiro | Explicar producao ou risco por disparo. |
| 8 | Aquisicao CRM | `VIEW_AQS_ACTION_QUEUE__PARCEIRO` | Acoes por parceiro | Fechar com fila operacional. |
| 9 | Midia Paga | `VIEW_MEDIA_PACING__OBJETIVO` | Objetivo de midia | Controlar gasto, ritmo e entrega por objetivo. |
| 10 | Midia Paga | `VIEW_MEDIA_OBJETIVO_PLATAFORMA` | Objetivo x plataforma | Entender dependencia e eficiencia por plataforma. |
| 11 | Midia Paga | `VIEW_MEDIA_CAMPANHAS__OBJETIVO` | Campanha por objetivo | Explicar producao, desperdicio ou concentracao. |
| 12 | Midia Paga | `VIEW_MEDIA_CRIATIVOS__OBJETIVO` | Criativo/grupo/campanha por objetivo | Mostrar tracao, fadiga ou concentracao criativa. |
| 13 | Midia Paga | `VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO` | Qualidade por objetivo | Separar performance real de limite de mensuracao. |
| 14 | Midia Paga | `VIEW_MEDIA_ACTION_QUEUE__OBJETIVO` | Acoes por objetivo | Fechar midia com acompanhamento growth. |
| 15 | Seguros | `VIEW_SEGUROS_SUMMARY` | Resumo de seguros | Conectar seguros com CRM e midia. |
| 16 | Seguros | `VIEW_SEGUROS_ACTIONS` | Acoes de seguros | Acionar pendencias ou oportunidades. |
| 17 | Matriz Estrategica | `VIEW_GROWTH_MATRIX_FRENTE_PARCEIRO_SEGMENTO` | Frente x parceiro x segmento | Tabela-mae da inteligencia. |

## Regras de repeticao de slides

- `VIEW_AQS_SEGMENTO__PARCEIRO`: preferir 1 slide por parceiro relevante.
- `VIEW_AQS_CANAL__PARCEIRO__SEGMENTO`: usar dentro do contexto de parceiro e segmento, nao como media geral solta.
- `VIEW_AQS_TOP_CAMPANHAS__PARCEIRO`: sempre por parceiro; campanhas/disparos explicam producao ou risco.
- Views de midia devem manter mesmo nivel de importancia para todos os objetivos mapeados.

## Colunas por view

Use nomes tecnicos sem espacos quando for criar views/TSV normalizadas.

### `VIEW_GROWTH_COCKPIT`

`frente`, `papel_no_growth`, `resultado_principal`, `meta_ou_referencia`, `variacao`, `status`, `principal_driver`, `risco`, `proxima_acao`

### `VIEW_AQS_BU`

`frente`, `quantidade_disparos`, `quantidade_disparos_var_pct`, `base_acionada`, `base_acionada_var_pct`, `cartoes_gerados`, `cartoes_gerados_var_pct`, `taxa_conversao_sobre_base_acionada`, `taxa_conversao_sobre_base_acionada_var_pct`, `custo`, `custo_var_pct`, `cac`, `cac_var_pct`, `participacao_cartoes`, `status_growth`, `driver`

### `VIEW_AQS_PARCEIRO`

`parceiro`, `bu`, `quantidade_disparos`, `quantidade_disparos_var_pct`, `base_acionada`, `base_acionada_var_pct`, `cartoes_gerados`, `cartoes_gerados_var_pct`, `taxa_conversao_sobre_base_acionada`, `taxa_conversao_sobre_base_acionada_var_pct`, `custo`, `custo_var_pct`, `cac`, `cac_var_pct`, `mix_cartoes`, `mix_custo`, `diagnostico`

### `VIEW_AQS_SEGMENTO__PARCEIRO`

`parceiro`, `segmento`, `quantidade_disparos`, `quantidade_disparos_var_pct`, `quantidade_envios`, `quantidade_entregas`, `quantidade_entregas_var_pct`, `quantidade_propostas`, `quantidade_propostas_var_pct`, `quantidade_aprovados`, `quantidade_aprovados_var_pct`, `cartoes_gerados`, `cartoes_gerados_var_pct`, `taxa_conversao_sobre_base_acionada`, `taxa_conversao_sobre_base_acionada_var_pct`, `cac`, `cac_var_pct`, `participacao_no_parceiro`, `movimento_vs_periodo_anterior`, `leitura_growth`

### `VIEW_AQS_CANAL__PARCEIRO__SEGMENTO`

`parceiro`, `segmento`, `canal`, `quantidade_disparos`, `quantidade_disparos_var_pct`, `base`, `base_var_pct`, `entregues`, `entregues_var_pct`, `abertura`, `abertura_var_pct`, `cliques`, `cliques_var_pct`, `ctr`, `ctr_var_pct`, `cartoes`, `cartoes_var_pct`, `custo_total`, `custo_total_var_pct`, `cac`, `alerta`

### `VIEW_AQS_FUNIL__PARCEIRO`

`parceiro`, `etapa_funil`, `volume`, `taxa_passagem`, `perda_absoluta`, `perda_percentual`, `principal_segmento_afetado`, `hipotese`

### `VIEW_AQS_TOP_CAMPANHAS__PARCEIRO`

`parceiro`, `jornada`, `activity_name`, `segmento`, `canal`, `base_acionada`, `cartoes_gerados`, `conversao`, `custo`, `cac`, `motivo_do_destaque`, `acao_recomendada`

### `VIEW_AQS_ACTION_QUEUE__PARCEIRO`

`prioridade`, `parceiro`, `segmento`, `problema`, `evidencia`, `acao`, `responsavel_sugerido`, `janela`, `metrica_de_sucesso`, `confianca`

### `VIEW_MEDIA_PACING__OBJETIVO`

`objetivo`, `budget`, `investimento`, `investimento_var_pct`, `pacing_percentual`, `pacing_var_pontos`, `dias_decorridos`, `ritmo_esperado`, `desvio`, `resultado_principal`, `custo_por_resultado`, `status`

### `VIEW_MEDIA_OBJETIVO_PLATAFORMA`

`objetivo`, `plataforma`, `investimento`, `investimento_var_pct`, `impressoes`, `impressoes_var_pct`, `cpm`, `cpm_var_pct`, `alcance`, `alcance_var_pct`, `frequencia`, `frequencia_var_pct`, `cliques`, `cliques_var_pct`, `ctr`, `ctr_var_pct`, `cpc`, `cpc_var_pct`, `conversoes`, `conversoes_var_pct`, `cpa_plataforma`, `cpa_plataforma_var_pct`, `leitura`

### `VIEW_MEDIA_CAMPANHAS__OBJETIVO`

`objetivo`, `campanha`, `plataforma`, `investimento`, `investimento_var_pct`, `impressoes`, `impressoes_var_pct`, `cpm`, `cpm_var_pct`, `alcance`, `alcance_var_pct`, `cliques`, `cliques_var_pct`, `ctr`, `ctr_var_pct`, `cpc`, `cpc_var_pct`, `conversoes`, `conversoes_var_pct`, `cpa_plataforma`, `cpa_plataforma_var_pct`, `participacao_investimento`, `participacao_resultado`, `diagnostico`

### `VIEW_MEDIA_CRIATIVOS__OBJETIVO`

`objetivo`, `campanha`, `grupo_anuncio`, `criativo`, `investimento`, `investimento_var_pct`, `impressoes`, `impressoes_var_pct`, `cpm`, `cpm_var_pct`, `alcance`, `alcance_var_pct`, `cliques`, `cliques_var_pct`, `ctr`, `ctr_var_pct`, `cpc`, `cpc_var_pct`, `resultado`, `custo_resultado`, `sinal_criativo`

### `VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO`

`objetivo`, `fonte_resultado`, `evento_otimizado`, `evento_medido`, `cobertura_tracking`, `lacuna`, `impacto_na_leitura`, `classificacao_confianca`

### `VIEW_MEDIA_ACTION_QUEUE__OBJETIVO`

`prioridade`, `objetivo`, `campanha`, `problema`, `evidencia`, `acao`, `janela`, `metrica_de_sucesso`, `risco_se_nao_agir`, `confianca`

### `VIEW_SEGUROS_SUMMARY`

`produto_ou_frente`, `origem`, `quantidade_disparos`, `quantidade_disparos_var_pct`, `base_acionada`, `base_acionada_var_pct`, `cliques_crm`, `cliques_crm_var_pct`, `impressoes_midia`, `impressoes_midia_var_pct`, `cliques_midia`, `cliques_midia_var_pct`, `custo_por_clique_crm`, `custo_por_clique_crm_var_pct`, `cpc_midia`, `cpc_midia_var_pct`, `cpl_midia`, `status`, `acao`

### `VIEW_SEGUROS_ACTIONS`

`prioridade`, `produto`, `sinal`, `evidencia`, `acao`, `dependencia`, `metrica_de_sucesso`

### `VIEW_GROWTH_MATRIX_FRENTE_PARCEIRO_SEGMENTO`

`frente`, `parceiro`, `segmento`, `papel_no_funil`, `kpi_norte`, `kpi_guardrail`, `volume`, `eficiencia`, `risco`, `oportunidade`, `view_de_origem`, `slide_destino`
