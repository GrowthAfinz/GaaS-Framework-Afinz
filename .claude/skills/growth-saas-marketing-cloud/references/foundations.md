# Foundations

## 1. Comecar pelo modelo de negocio

Nao projetar analytics antes de explicitar:

- North Star metric
- metricas de entrada, conversao, retencao e receita
- unidade economica: usuario, conta, campanha, assinatura, pedido
- horizonte temporal: diario, semanal, mensal, ciclo de renovacao
- frequencia de decisao: operacional, tatica, executiva

Para growth e marketing cloud, uma estrutura base costuma ser:

- Aquisição: alcance, sessoes, leads, MQLs, trials, signups
- Ativacao: onboarding completo, primeira campanha, primeiro envio, primeira integracao
- Engajamento: contas ativas, campanhas enviadas, segmentos criados, usuarios ativos por workspace
- Monetizacao: conversao para plano pago, expansao, ARPA, margem, payback, LTV/CAC
- Retencao: renovacao, churn logo, churn receita, cohort retention

## 2. Construir uma metric tree

Tratar metricas como arvore causal:

- topo: objetivo de negocio
- meio: drivers principais
- base: alavancas operacionais

Exemplo simplificado:

- Receita recorrente
- Contas pagas x ticket medio
- Conversao trial->paid, expansao, churn, ativacao, qualidade de aquisicao
- tempo ate valor, uso de features core, volume de campanhas, health score

Se a tela nao mostrar como a metrica local se conecta ao objetivo maior, ela vira ornamento.

## 3. Modelar semantica, nao so schema

Definir:

- entidades: workspace, account, campaign, audience, journey, touchpoint, experiment
- eventos: created, launched, sent, delivered, opened, clicked, converted, upgraded, churned
- propriedades: canal, segmento, oferta, parceiro, jornada, plano, pais, device
- janelas: D0, D7, D30, rolling 7d, MTD, QTD
- filtros oficiais: periodo, BU, canal, segmento, owner, status

Boas perguntas:

- qual evento define ativacao?
- qual evento define valor realizado?
- quando uma conta e considerada ativa?
- o que e uma conversao valida?
- como resolver identity merge e deduplicacao?

## 4. Leading e lagging indicators

Separar:

- lagging: receita, churn, emissao, upgrades, volume consolidado
- leading: configuracao concluida, qualidade da base, uso recorrente de feature core, tempo ate a primeira campanha, cobertura de tracking

Sistemas seniores mostram ambos. O operador precisa de sinais antecipados; o executivo precisa do resultado.

## 5. Funnels e loops

Usar funnel quando existe sequencia obrigatoria e drop-off claro.
Usar loop quando o crescimento depende de repeticao e reforco, por exemplo:

- uso -> resultado -> confianca -> mais uso
- campanha bem sucedida -> mais verba -> mais segmentacao -> mais conversao

Para marketing cloud, muitas vezes coexistem:

- funnel operacional: importar base -> montar jornada -> disparar -> entregar -> abrir -> clicar -> converter
- loop de maturidade: mais dados -> melhor segmentacao -> melhor resultado -> mais adesao do time -> mais dados

## 6. Regras de instrumentacao

- Nomear eventos por acao de negocio, nao por detalhe tecnico.
- Evitar duplicidade semantica entre eventos quase iguais.
- Definir formulas canônicas e reuso.
- Versionar metricas derivadas e ownership.
- Decidir desde cedo o que e computado em tempo real e o que e batch.

## 7. Perguntas que um senior faz

- Essa metrica muda decisao ou so enfeita?
- O sistema explica causa ou so exibe sintoma?
- O mesmo numero aparece diferente em telas diferentes?
- Existe owner claro para cada insight gerado?
- O operador sabe o que fazer em seguida?

## 8. Fontes externas consultadas

- Amplitude Product Analytics Fundamentals: https://amplitude.com/product-analytics-fundamentals
- Mixpanel Metric Trees: https://mixpanel.com/platform/metric-trees/
- Mixpanel guide on metric trees: https://mixpanel.com/blog/metric-tree/

