# Metric Dictionary

Definir metricas como objetos semanticos, nao como colunas soltas.

## CRM Aquisicao

| Metrica | Sentido | Guardrail |
| --- | --- | --- |
| `quantidade_disparos` | Numero de execucoes/disparos. | Nao confundir com envios. |
| `base_acionada` | Publico acionado. | Denominador precisa existir para conversao sobre base. |
| `quantidade_envios` | Volume enviado. | Pode diferir de base. |
| `quantidade_entregas` | Entregas. | Taxas acima de 100% exigem auditoria. |
| `abertura` | Aberturas ou taxa de abertura, conforme fonte. | Definir unidade no output. |
| `cliques` | Cliques CRM. | Nao inferir cartao por clique. |
| `ctr` | Clique sobre entrega/impressao conforme canal. | Declarar denominador. |
| `quantidade_propostas` | Propostas originadas. | Confirmar fonte e janela. |
| `quantidade_aprovados` | Aprovacoes. | Confirmar se e etapa de negocio. |
| `cartoes_gerados` | Conversao de negocio. | Base de CAC quando custo existe. |
| `taxa_conversao_sobre_base_acionada` | Cartoes/base acionada. | Usar somente com denominador valido. |
| `custo` | Custo de CRM/aquisicao. | Confirmar regra de custo. |
| `cac` | Custo por cartao/conversao de negocio. | Nao usar se cartao ou custo estiver bloqueado. |

## Midia Paga

| Metrica | Sentido | Guardrail |
| --- | --- | --- |
| `investimento` | Spend da plataforma. | Pode nao fechar com custo de negocio. |
| `budget` | Orcamento planejado. | Separar meta de gasto de meta de resultado. |
| `pacing_percentual` | Consumo do budget. | Em semana parcial, comparar contra ritmo esperado. |
| `impressoes` | Entrega de midia. | Diferente de alcance. |
| `alcance` | Usuarios alcancados. | Pode faltar em algumas fontes. |
| `frequencia` | Impressoes/alcance. | Usar para saturacao. |
| `cpm` | Custo por mil impressoes. | Bom para objetivos de alcance/marca. |
| `cpc` | Custo por clique. | Nao e custo por cliente. |
| `ctr` | Clique/impressao. | Comparar por objetivo e formato compativel. |
| `conversoes` | Conversoes de plataforma/evento. | Confirmar evento otimizado. |
| `cpa_plataforma` | Custo por conversao de plataforma. | Nao e CAC. |

## Seguros

Seguros deve conectar CRM e midia quando possivel:

- `cliques_crm`
- `custo_por_clique_crm`, apenas se custo CRM for confiavel
- `impressoes_midia`
- `cliques_midia`
- `cpc_midia`
- `cpl_midia`

Nao promover seguros a bloco extenso salvo pedido explicito.

## Variacoes

Sufixo recomendado:

- `_var_pct` para variacao percentual.
- `_var_pontos` para diferenca em pontos percentuais.

Variacao e complemento de analise. Nao forcar julgamento de melhora/piora.

