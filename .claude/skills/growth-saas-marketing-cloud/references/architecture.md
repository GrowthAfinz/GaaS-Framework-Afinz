# Architecture

## 1. Arquitetura-alvo

Para SaaS de growth e marketing cloud orientado a inteligencia, separar pelo menos cinco camadas:

- ingestion: eventos, syncs, imports, jobs
- semantic layer: metricas canonicas, dimensoes, janelas, ownership
- analytics services: funnel, cohort, pacing, atribuicao, anomalia, comparativos
- insight engine: composicao de narrativa, score, confianca e proxima acao
- experience layer: cards, tabelas, drawers, feeds, filtros e atalhos

## 2. Semantic layer

Centralizar:

- formulas de KPI
- definicoes de status
- thresholds
- taxonomia de dimensoes
- comparativos padrao

Sem semantic layer, cada tela reinterpreta as metricas e a confianca do sistema colapsa.

## 3. Insight engine

Um insight senior nao e so texto automatico. Modelar pelo menos:

- padrao detectado
- impacto
- causa provavel ou fator correlato
- oportunidade sugerida
- confianca
- severidade
- owner sugerido
- atalho para acao

Estrutura util:

`Pattern -> Insight -> Cause -> Opportunity`

## 4. Recommendation engine

Pontuar recomendacoes por:

- impacto esperado
- facilidade ou custo
- confianca do diagnostico
- alinhamento estrategico
- urgencia temporal

Separar claramente:

- recomendacao automatica
- diagnostico com revisao humana
- automacao executavel

## 5. Explainability

Toda recomendacao precisa mostrar:

- que dados a originaram
- qual janela temporal foi usada
- qual regra ou modelo levou ao score
- como o usuario pode validar ou contestar

## 6. Contratos uteis

Definir tipos para:

- KPIValue
- ComparisonWindow
- Insight
- Recommendation
- Alert
- FilterState
- DataFreshness

## 7. Padrao de modulo front-end

Cada modulo analitico deve declarar:

- pergunta principal
- entidades de entrada
- metricas derivadas
- visualizacao principal
- interacoes secundarias
- estados sistemicos
- acoes possiveis

## 8. Riscos recorrentes

- insight sem dados confiaveis
- excesso de cross-filter e baixa explicabilidade
- latency alta por agregacao tardia
- logica de negocio espalhada em componentes visuais
- mistura de objetivo operacional com relatorio executivo na mesma camada

## 9. Fonte externa consultada

- Amplitude Session Replay and Experience Analytics: https://amplitude.com/session-replay

