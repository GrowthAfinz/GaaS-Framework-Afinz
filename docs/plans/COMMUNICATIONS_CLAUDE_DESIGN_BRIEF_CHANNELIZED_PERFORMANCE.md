# Brief para Claude Design — GaaS Comunicações: Performance por Canal

## Objetivo deste documento

Este documento é um prompt/brief para usar em uma ferramenta de design generativo, como Claude Design, v0, Lovable, Uizard ou similar, com o objetivo de criar previews visuais alternativos para a aba `Comunicações > Performance do Conteúdo` do GaaS.

Esta versão tem um objetivo diferente da spec anterior:

> Remodelar a experiência da aba Performance para analisar comunicações CRM por canal, separando E-mail, WhatsApp, Push e SMS em experiências mais adequadas para cada tipo de comunicação.

A prioridade aqui não é implementar ainda. A prioridade é gerar boas opções visuais para discutir produto, UX e arquitetura de informação.

---

## Contexto do produto

Estamos construindo uma área chamada `Comunicações` dentro do GaaS — Growth as a Service da Afinz.

O GaaS é um sistema interno para planejamento, governança e análise de Growth, CRM, mídia paga e aquisição.

A área `Comunicações` tem duas frentes:

1. `Cadastro e Templates`
   - governança de templates;
   - upload de assets;
   - preview das peças;
   - vínculo entre `template_id` e `activity_name`;
   - cobertura de réguas CRM.

2. `Performance do Conteúdo`
   - análise de performance das comunicações;
   - preview visual das peças;
   - KPIs agregados por `template_id`;
   - activity_names vinculadas;
   - timeline por dia;
   - drilldown para detalhe da activity.

O foco deste brief é remodelar principalmente a aba `Performance do Conteúdo`.

---

## Contexto de dados

O modelo conceitual é:

- `template_id`: identidade estável do conteúdo/criativo.
- `activity_name`: execução real no Salesforce Marketing Cloud/SFMC.
- `communication_templates`: catálogo dos templates e assets.
- `activities`: tabela de performance e metadados dos disparos.

Cada template pode estar vinculado a uma ou mais `activity_names`.

O GaaS consegue exibir:

- preview visual da peça;
- canal: E-mail, WhatsApp, Push ou SMS;
- parceiro: Dia, Bem Barato, B2C, Plurix etc.;
- segmento;
- jornada/campanha;
- data de disparo;
- base enviada;
- aberturas;
- cliques;
- cartões;
- propostas;
- conversão;
- gasto real ou estimado;
- CAC real ou estimado;
- timeline diária;
- drilldown de activity.

---

## Referências de mercado pesquisadas

Use essas referências como princípios, não como cópia visual:

1. Braze separa dashboards de performance por canal, como Email Performance, SMS Performance e Channel Performance. Isso sugere que a análise por canal deve ter métricas e layout próprios, não uma grade única para tudo.
   - https://www.braze.com/docs/user_guide/analytics/dashboards/channel_performance/
   - https://learning.braze.com/introduction-to-the-analytics-dashboard

2. Iterable Messaging Insights permite filtrar performance por message medium, campaign type, campaign state, campaign name/ID, journey e channel type. Isso reforça uma UX com filtros fortes e análise agregada por canal/campanha.
   - https://support.iterable.com/hc/en-us/articles/360052814452-Messaging-Insights
   - https://support.iterable.com/hc/en-us/articles/360053281451-Insights-Overview

3. Klaviyo trabalha com dashboards customizáveis e relatórios separados para e-mail, SMS e push, com foco em performance, receita/resultado e A/B testing. Para o GaaS, a tradução disso é: canal precisa ter contexto próprio, mas o resultado de negócio precisa permanecer comparável.
   - https://help.klaviyo.com/hc/en-us/articles/4708299478427
   - https://www.klaviyo.com/features/reporting

4. Customer.io diferencia jornada, campanha e mensagem. A métrica da mensagem pode ser aberta/clicada, mas a jornada continua em andamento. Isso é muito relevante para o GaaS, porque `template_id` é conteúdo, enquanto `activity_name` é execução.
   - https://docs.customer.io/journeys/metrics/analytics/
   - https://docs.customer.io/journeys/metrics/campaign-metrics/
   - https://docs.customer.io/journeys/metrics/run-reports/

5. Customer.io também tem dashboard inicial com “suggested action items”, reforçando que o painel deve sugerir próximos passos, não apenas listar KPIs.
   - https://docs.customer.io/journeys/metrics/dashboard/

---

## Problema atual da tela

A tela atual é visualmente interessante porque mostra os previews das peças, mas ainda parece uma galeria de criativos com KPIs.

Ela ainda não resolve bem:

- qual canal está performando melhor;
- quais templates merecem escala;
- quais templates precisam revisão;
- quais peças têm problema de abertura, clique ou conversão;
- quais activity_names explicam a performance;
- como comparar E-mail vs WhatsApp vs Push;
- como separar análise de conteúdo da análise de execução.

---

## Novo objetivo de UX

Criar uma experiência de `Performance do Conteúdo` que responda em até 2 minutos:

1. Qual canal está contribuindo mais para resultado?
2. Dentro de cada canal, quais conteúdos estão ganhando ou perdendo?
3. O problema é abertura, clique, conversão, custo ou vínculo operacional?
4. Qual conteúdo deve ser escalado, revisado, pausado ou comparado?
5. Quais campanhas/parceiros/segmentos precisam de atenção?

---

## Direção principal: separar por canal

A tela deve abandonar a ideia de “todos os templates juntos” como padrão.

Proponha uma navegação interna por canal:

```text
Performance do Conteúdo

[Todos] [E-mail] [WhatsApp] [Push] [SMS]
```

Ou uma estrutura lateral:

```text
Performance do Conteúdo

Canal
- Visão Geral
- E-mail
- WhatsApp
- Push
- SMS
```

O designer pode explorar os dois modelos.

---

## Papel de cada canal

### 1. Visão Geral

Objetivo:

Comparar canais e apontar onde o operador deve investigar.

Componentes sugeridos:

- cockpit cross-channel;
- ranking dos canais;
- gráfico de contribuição por canal;
- alertas de anomalia;
- comparação de CAC/conversão por canal;
- lista de “ações sugeridas”.

Perguntas que deve responder:

- Qual canal gerou mais cartões?
- Qual canal tem melhor CAC?
- Qual canal tem bom clique mas baixa conversão?
- Qual canal está com queda de performance?
- Onde há mais volume sem resultado?

### 2. E-mail

Objetivo:

Analisar conteúdo completo de e-mail, assunto, pré-cabeçalho e comportamento de abertura/clique/conversão.

Métricas principais:

- base enviada;
- abertura;
- taxa de abertura;
- cliques;
- CTR;
- cartões;
- conversão;
- CAC;
- gasto.

Componentes sugeridos:

- cards com preview do e-mail;
- destaque para assunto e pré-cabeçalho;
- ranking por abertura/CTR/conversão;
- análise de problema:
  - baixa abertura = assunto/timing/entregabilidade;
  - abertura boa + clique baixo = conteúdo/CTA;
  - clique bom + conversão baixa = oferta/público/destino.

### 3. WhatsApp

Objetivo:

Analisar mensagens mais diretas, conversacionais e caras, com foco em custo, conversão e eficiência.

Métricas principais:

- base enviada;
- cliques;
- CTR;
- cartões;
- conversão;
- custo estimado;
- CAC estimado;
- resposta/engajamento, se disponível futuramente.

Componentes sugeridos:

- cards em formato “phone preview”;
- destaque para CTA/link;
- análise de custo por cartão;
- alerta de alto gasto sem conversão;
- comparação WhatsApp vs E-mail para mesma campanha.

### 4. Push

Objetivo:

Analisar mensagens curtas e recorrentes, mais ligadas a timing, frequência e clique.

Métricas principais:

- base enviada;
- cliques;
- CTR;
- cartões;
- conversão;
- frequência de disparo;
- data/hora de disparo, se disponível.

Componentes sugeridos:

- cards pequenos com título/mensagem;
- timeline de clique por dia;
- heatmap de horário/frequência, mesmo que como placeholder;
- alerta de alto volume com baixo clique.

### 5. SMS

Objetivo:

Analisar mensagens diretas, custo e conversão, sem depender de preview visual complexo.

Métricas principais:

- base enviada;
- cliques;
- CTR;
- cartões;
- conversão;
- custo;
- CAC.

Componentes sugeridos:

- lista/tabela mais densa;
- preview textual curto;
- diagnóstico de custo;
- alertas de volume/custo.

---

## Estrutura visual sugerida

Gerar previews com este layout base:

```text
Header
Performance do Conteúdo
Subtítulo: Analise canais, criativos e activity_names vinculadas ao template_id.

Channel Tabs
[Visão Geral] [E-mail] [WhatsApp] [Push] [SMS]

Top Cockpit
Cards com KPIs e variação

Insight Strip
3 a 5 recomendações acionáveis

Main Area
Esquerda: ranking/filtros/lista de templates
Direita: preview destacado ou gráfico/matriz

Template Cards ou Table
Preview + métricas + diagnóstico + ação
```

---

## Componentes obrigatórios para os previews

1. Navegação por canal.
2. Cockpit no topo.
3. Filtros rápidos.
4. Área de insights/recomendações.
5. Cards ou ranking de templates.
6. Preview visual das peças.
7. Badges de diagnóstico.
8. Timeline ou gráfico de tendência.
9. Ação clara por item.

---

## Diagnósticos que devem aparecer na UI

Use badges visuais:

- `Escalar`
- `Revisar assunto`
- `Revisar CTA`
- `Revisar oferta`
- `Baixa abertura`
- `Bom clique, baixa conversão`
- `CAC alto`
- `Volume insuficiente`
- `Sem asset`
- `Vínculo suspeito`

Cada badge deve ter uma frase curta de explicação.

Exemplo:

```text
Bom clique, baixa conversão
O conteúdo gera interesse, mas a conversão para cartão está abaixo da média.
```

---

## Dados fictícios para usar no preview

Use nomes e números plausíveis:

### Templates

- `b2c_email_copa_bsp_S1D01`
- `b2c_email_copa_bsp_S4D02`
- `b2c_wpp_copa_ngd_D3`
- `dia_email_copa_bsp_S2D02`
- `bb_email_copa_crm_S4D01`
- `plurix_push_copa_crm_S3D01`

### Métricas exemplo

- Base enviada: 144.354
- Aberturas: 31.867
- Cliques: 182
- CTR: 0,07%
- Cartões: 10
- Conversão: 0,01%
- Gasto estimado: R$ 144,35
- CAC estimado: R$ 14,44

### Canais

- E-mail
- WhatsApp
- Push
- SMS

### Parceiros

- B2C
- Dia
- Bem Barato
- Plurix

### Segmentos

- Base_Proprietaria
- CRM
- Negados
- Aprovados_nao_convertidos

---

## Direção visual

O design deve parecer um SaaS analítico moderno, denso e operacional.

Referências de estilo:

- Linear pela clareza e foco;
- Stripe pela densidade e organização de tabelas;
- Amplitude/Mixpanel pela leitura analítica;
- Braze/Iterable/Klaviyo pela separação por canal e campanha.

Restrições:

- não usar visual genérico de dashboard corporativo;
- não empilhar cards sem ação;
- não esconder filtros críticos;
- não depender só de tooltip para entender diagnóstico;
- evitar excesso de cor decorativa.

Preferência visual:

- fundo claro;
- cards brancos;
- bordas sutis;
- cyan como cor primária Afinz/GaaS;
- badges semânticos;
- previews grandes onde houver conteúdo visual;
- tabelas densas onde a decisão for comparação.

---

## Variações que o Claude Design deve gerar

Peça para gerar pelo menos 3 propostas diferentes.

### Variação A — Channel Command Center

Foco em visão geral por canal.

Características:

- canais como tabs principais;
- cockpit cross-channel;
- ranking de canais;
- ações sugeridas;
- cards menores de templates.

### Variação B — Creative Performance Lab

Foco em análise de conteúdo e criativo.

Características:

- preview visual maior;
- grade de templates por canal;
- comparação lado a lado;
- badges de diagnóstico nos cards;
- modal/drawer com timeline.

### Variação C — Operational Audit + Performance

Foco em governança e problemas operacionais.

Características:

- tabela densa;
- status de asset/vínculo/dados;
- filtros fortes;
- coluna de próxima ação;
- preview lateral ao selecionar linha.

---

## Prompt pronto para Claude Design

Use o prompt abaixo:

```text
Você é um product designer sênior especializado em SaaS B2B, CRM analytics, lifecycle marketing, growth operations e dashboards de performance.

Quero que você crie previews visuais para remodelar a aba “Performance do Conteúdo” de um produto chamado GaaS — Growth as a Service da Afinz.

Contexto do produto:
O GaaS é uma plataforma interna de growth, CRM, mídia paga e aquisição. A área de Comunicações governa templates, assets, previews e performance de mensagens CRM. Cada peça tem um `template_id`, que representa a identidade estável do conteúdo. Cada execução real no Salesforce Marketing Cloud é uma `activity_name`. Um template pode estar vinculado a várias activity_names.

Objetivo da nova tela:
Não quero apenas uma galeria de templates com KPIs. Quero uma experiência de análise de performance por canal, separando E-mail, WhatsApp, Push e SMS. A tela deve ajudar o operador CRM/Growth a decidir em até 2 minutos quais conteúdos devem ser escalados, revisados, pausados, comparados ou investigados.

Dados disponíveis:
- template_id
- preview visual do asset
- canal: E-mail, WhatsApp, Push, SMS
- parceiro: B2C, Dia, Bem Barato, Plurix
- segmento: Base_Proprietaria, CRM, Negados, Aprovados_nao_convertidos
- jornada/campanha
- activity_names vinculadas
- data de disparo
- base enviada
- aberturas
- cliques
- CTR
- cartões
- propostas
- conversão
- gasto real ou estimado
- CAC real ou estimado
- timeline diária
- drilldown da activity

Crie pelo menos 3 propostas de layout:

1. Channel Command Center
   - visão geral por canal;
   - tabs: Visão Geral, E-mail, WhatsApp, Push, SMS;
   - cockpit cross-channel;
   - ranking dos canais;
   - recomendações acionáveis.

2. Creative Performance Lab
   - foco no conteúdo/criativo;
   - previews maiores;
   - cards por canal;
   - badges de diagnóstico;
   - comparação de templates;
   - modal/drawer com timeline.

3. Operational Audit + Performance
   - foco operacional;
   - tabela densa;
   - status de asset, vínculo e dados;
   - filtros fortes;
   - preview lateral;
   - coluna de próxima ação.

Princípios de UX:
- A tela deve ser orientada à decisão, não apenas visual.
- Separar claramente diagnóstico e ação.
- Cada card ou linha deve responder “o que devo fazer agora?”.
- Não misturar CAC real com CAC estimado sem label.
- Não esconder filtros críticos.
- Usar badges semânticos para status e diagnóstico.
- Permitir comparação entre canais e templates.
- A UI deve funcionar bem para CRM operators e analistas de performance.

Métricas por canal:

E-mail:
- base enviada
- aberturas
- taxa de abertura
- cliques
- CTR
- cartões
- conversão
- CAC
- assunto e pré-cabeçalho quando disponível

WhatsApp:
- base enviada
- cliques
- CTR
- cartões
- conversão
- custo estimado
- CAC estimado
- preview estilo celular

Push:
- base enviada
- cliques
- CTR
- cartões
- conversão
- frequência/timing
- preview compacto

SMS:
- base enviada
- cliques
- CTR
- cartões
- conversão
- custo
- CAC
- preview textual compacto

Diagnósticos esperados:
- Escalar
- Revisar assunto
- Revisar CTA
- Revisar oferta
- Baixa abertura
- Bom clique, baixa conversão
- CAC alto
- Volume insuficiente
- Sem asset
- Vínculo suspeito

Dados fictícios para usar nos mockups:
- b2c_email_copa_bsp_S1D01 — E-mail — Base 144.354 — Aberturas 31.867 — Cliques 182 — Cartões 10 — CAC R$ 14,44
- b2c_email_copa_bsp_S4D02 — E-mail — Base 144.596 — Cliques 180 — Cartões 9 — CAC R$ 16,07
- b2c_wpp_copa_ngd_D3 — WhatsApp — Base 6.704 — Cliques 0 — Cartões 80 — CAC R$ 35,20
- dia_email_copa_bsp_S2D02 — E-mail — Parceiro Dia
- bb_email_copa_crm_S4D01 — E-mail — Parceiro Bem Barato
- plurix_push_copa_crm_S3D01 — Push — Parceiro Plurix

Direção visual:
- SaaS B2B moderno;
- fundo claro;
- cards brancos;
- bordas sutis;
- cyan como cor primária;
- densidade operacional;
- evitar dashboard genérico;
- usar previews visuais como diferencial;
- usar tabelas quando a decisão exigir comparação;
- usar gráficos apenas quando facilitarem entender tendência, distribuição ou relação.

Entregue:
1. Três previews conceituais diferentes.
2. Uma explicação curta do objetivo de cada proposta.
3. Componentes principais de cada proposta.
4. Como cada proposta separa canais.
5. Qual proposta você recomenda para implementar primeiro e por quê.
```

---

## Resultado esperado da ferramenta de design

A saída ideal deve trazer:

- telas de alta fidelidade ou wireframes visuais;
- diferenciação clara entre canais;
- cockpit + detalhe;
- estados de análise, não só cards;
- proposta de navegação;
- exemplos de diagnóstico;
- ações por template/canal.

Se a ferramenta gerar apenas uma tela genérica, peça refinamento com:

> Refaça separando melhor os canais. Quero que E-mail, WhatsApp, Push e SMS tenham métricas, densidade e tipo de preview diferentes. A tela precisa sugerir ações operacionais, não apenas mostrar KPIs.

---

## Observações para implementação futura

Depois de escolher uma direção visual, converter o preview em spec técnica:

- atualizar `TemplatePerformanceGrid`;
- criar `CommunicationPerformanceChannelTabs`;
- criar `CommunicationPerformanceCockpit`;
- criar `CommunicationPerformanceInsights`;
- criar `CommunicationPerformanceRanking`;
- evoluir `CommunicationDetailModal`;
- preservar o modelo `template_id` + `activity_name`;
- manter diferenciação entre CAC real e CAC estimado.
