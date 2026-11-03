---
title: "CRM Aquisição"
tipo: dominio
camada: resultados
dominio: crm-aquisicao
aliases: [CRM Aquisição, Resultados CRM, Aquisição CRM]
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [dominio, crm, resultados, growth]
growth_catalog: {"dominio": "CRM Aquisição"}
analytics: {"domain": "crm", "scope": {}}
---

# CRM Aquisição

## Em uma frase

Os disparos de CRM (WhatsApp, e-mail, SMS e push) que levam pessoas a pedir o cartão Afinz, nas três BUs (B2C, Plurix e B2B2C) e nos oito públicos abaixo.

Fonte: `activities`. Cada público tem a sua página, com régua, regras, números e registro histórico; esta página junta todos eles e mostra onde o resultado muda.

## Principais números: jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, todos os segmentos de aquisição. Setembro ainda pode amadurecer. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados).

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Propostas/base | Aprovados/propostas | Cartões/aprovados | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 989 | 4.485.508 | 29.936 | 27.879 | 2.290 | 0,67% | 93,1% | 8,2% | R$ 43.993,44 | R$ 19,21 |
| ago/2026 | 809 | 5.720.324 | 29.718 | 27.179 | 2.804 | 0,52% | 91,5% | 10,3% | R$ 45.391,04 | R$ 16,19 |
| set/2026 | 1.228 | 1.980.059 | 23.473 | 22.250 | 2.599 | 1,2% | 94,8% | 11,7% | R$ 37.564,25 | R$ 14,45 |
| **Média mensal jul a set** | **1.009** | **4.061.964** | **27.709** | **25.769** | **2.564** | **0,68%** | **93,0%** | **10,0%** | **R$ 42.316,24** | **R$ 16,50** |
| Total jul a set | 3.026 | 12.185.891 | 83.127 | 77.308 | 7.693 | 0,68% | 93,0% | 10,0% | R$ 126.948,73 | R$ 16,50 |
| Média mensal abr a jun | 659 | 4.675.302 | 27.110 | 25.292 | 2.820 | 0,58% | 93,3% | 11,2% | R$ 47.603,74 | R$ 16,88 |
| Total abr a jun | 1.978 | 14.025.907 | 81.331 | 75.876 | 8.461 | 0,58% | 93,3% | 11,2% | R$ 142.811,23 | R$ 16,88 |

Como ler:
- **No trimestre, ~2.560 cartões por mês a CAC de R$ 16,50.** Contra abr a jun, foram 9% menos cartões (7.693 contra 8.461) com CAC praticamente igual (R$ 16,50 contra R$ 16,88).
- **A CAC melhorou mês a mês**: R$ 19,21 em julho, R$ 16,19 em agosto e R$ 14,45 em setembro.
- "Disparos" (linhas) subiu de 1.978 em abr a jun para 3.026 em jul a set, mas boa parte é mudança na forma de registrar (um mesmo disparo virou mais linhas em alguns públicos). Não usar o número de linhas como volume de contato.

## Árvore de métricas

O cartão sai de uma conta em cadeia. Ler de cima para baixo mostra em que degrau o resultado mudou:

`Cartões = Base acionável × (Propostas ÷ Base) × (Aprovados ÷ Propostas) × (Cartões ÷ Aprovados)` e `CAC = Custo ÷ Cartões`, com `Custo = tarifa do canal × Base acionável`.

| Degrau (jul a set/2026) | CRM inteiro | Sem o carrinho eCred da Serasa | Só o carrinho eCred da Serasa |
|---|---:|---:|---:|
| Base acionável | 12.185.891 | 12.125.832 | 60.059 |
| Propostas | 83.127 | 15.205 | 67.922 |
| Propostas ÷ base | 0,68% | 0,125% | 113% |
| Aprovados | 77.308 | 9.642 | 67.666 |
| Aprovados ÷ propostas | 93,0% | 63,4% | 99,6% |
| Cartões | 7.693 | 4.860 | 2.833 |
| Cartões ÷ aprovados | 10,0% | 50,4% | 4,2% |
| Custo | R$ 126.948,73 | R$ 108.474,24 | R$ 18.474,49 |
| CAC | R$ 16,50 | R$ 22,32 | R$ 6,52 |

Por que separar a Serasa: o carrinho eCred recebe lead externo, então tem mais propostas que base e quase todo mundo aparece como aprovado. Misturado com o resto, ele faz parecer que o CRM aprova 93% das propostas e só 10% dos aprovados viram cartão. Sem ele, o retrato é outro: **o gargalo do CRM está em transformar base em proposta (0,125%)**; depois disso, 63% das propostas são aprovadas e metade dos aprovados vira cartão.

As métricas norte e os drivers de CRM do Dossiê Mestre (referência; a nota original continua no lugar):

### Métricas norte

| Horizonte | Métrica | Uso | Restrição |
|---|---|---|---|
| Diário | produção válida | detectar quebra ou aceleração | exige dia fechado |
| Mensal | realizado versus meta | orientar prioridade | comparar com ritmo esperado |
| Tático | CAC por campanha/segmento | eficiência | interpretar com volume e conversão |
| Estratégico | evolução de CAC com escala | sustentar produção com eficiência | comparar campanhas, segmentos e safras equivalentes |

### Drivers de CRM

| Camada | Métricas | Leitura |
|---|---|---|
| Execução | base total, base acionável, disparos | capacidade e volume |
| Entrega | enviados, entregues, taxa de entrega | qualidade de contato |
| Engajamento | abertura, clique, resposta | canal, oferta e template |
| Intenção | propostas | intenção comercial |
| Qualidade | aprovados, taxa de aprovação | aderência do público |
| Resultado | cartões, conversão | produção final |
| Eficiência | custo total, CAC | custo por cartão |

Os drivers de intenção, qualidade, resultado e eficiência se aplicam à aquisição. Para rentabilização, usar somente base, disparos, entrega, abertura e clique.

Na campanha Copa Visa, acrescentar ao funil:

`acesso à LP -> Opt-in concluído`

| Métrica exclusiva | Fórmula | Leitura |
|---|---|---|
| Opt-ins LP | contagem de Opt-ins válidos | conversões promocionais da campanha |
| Taxa de Opt-in LP | Opt-ins LP / usuários da LP | capacidade da LP de concluir a adesão |
| Custo por Opt-in | spend de mídia Copa Visa / Opt-ins LP | eficiência de mídia para gerar adesão promocional |

O custo por Opt-in é uma métrica exclusiva da campanha e não deve ser nomeado como CPA de cartão ou CAC.

## Público × parceiro

Cartões e CAC de jul a set/2026, por público e parceiro. Célula vazia é combinação sem disparo no trimestre, não zero de resultado. Recência de compra, Cartonistas e Pós-instabilidade não tiveram disparo no período.

| Público | Serasa | Proprietária | Plurix | Bem Barato | Dia | Total |
|---|---:|---:|---:|---:|---:|---:|
| Carrinho abandonado | 2.833 · R$ 6,52 | 278 · R$ 31,00 | 170 · R$ 24,64 | 5 · R$ 39,63 |  | **3.286 · R$ 9,58** |
| Repescagem |  | 2.182 · R$ 19,38 | 673 · R$ 17,09 | 225 · R$ 11,56 |  | **3.080 · R$ 18,31** |
| Upgrade |  | 95 · R$ 135,21 | 85 · R$ 154,71 | 14 · R$ 39,40 |  | **194 · R$ 136,84** |
| Topo de funil (varejo) |  |  | 639 · R$ 4,74 | 264 · R$ 4,67 | 132 · R$ 42,97 | **1.035 · R$ 9,60** |
| Topo de funil (B2C) |  | 88 · R$ 24,69 |  |  |  | **88 · R$ 24,69** |
| Leads de parceiros |  | 10 · R$ 43,57 |  |  |  | **10 · R$ 43,57** |
| **Total** | **2.833 · R$ 6,52** | **2.653 · R$ 25,01** | **1.567 · R$ 20,33** | **508 · R$ 9,02** | **132 · R$ 42,97** | **7.693 · R$ 16,50** |

Páginas dos públicos: [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]] · [[10-Resultados/Publicos/Publico-Repescagem|Repescagem]] · [[10-Resultados/Publicos/Publico-Upgrade|Upgrade]] · [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]] · [[10-Resultados/Publicos/Publico-Leads-de-Parceiros|Leads de parceiros]] · [[10-Resultados/Publicos/Publico-Recencia-de-Compra|Recência de compra]] · [[10-Resultados/Publicos/Publico-Cartonistas|Cartonistas]] · [[10-Resultados/Publicos/Publico-Pos-Instabilidade|Pós-instabilidade]].

Páginas dos parceiros: [[10-Resultados/Parceiros/Serasa|Serasa]] · [[10-Resultados/Parceiros/Proprietaria|Proprietária]] · [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]] · [[10-Resultados/Parceiros/Dia|Dia]] · [[10-Resultados/Parceiros/Alvorada|Alvorada]] · [[10-Resultados/Parceiros/Acordo-Certo|Acordo Certo]] · [[10-Resultados/Parceiros/Bom-Pra-Credito|Bom Pra Crédito]] · [[10-Resultados/Parceiros/Super-Nosso|Super Nosso]] (novo, out/2026).

Como ler:
- **Dois públicos fazem 83% dos cartões**: carrinho abandonado (3.286) e repescagem (3.080).
- **A Serasa (só carrinho eCred) é o parceiro mais eficiente**, com CAC de R$ 6,52. No varejo, Plurix e Bem Barato fazem topo de funil abaixo de R$ 5.
- **Os pontos caros**: Upgrade na Proprietária e na Plurix (R$ 135 e R$ 155), topo de funil do Dia (R$ 42,97) e leads de parceiros (R$ 43,57).

## Onde o mês mudou

Cartões por público, mês a mês:

| Público | jul/2026 | ago/2026 | set/2026 | set contra ago |
|---|---:|---:|---:|---:|
| Carrinho abandonado | 1.052 | 1.049 | 1.185 | +136 |
| Repescagem | 666 | 1.326 | 1.088 | -238 |
| Upgrade | 46 | 40 | 108 | +68 |
| Topo de funil (varejo) | 496 | 373 | 166 | -207 |
| Topo de funil (B2C) | 30 | 16 | 42 | +26 |
| Leads de parceiros | | | 10 | +10 |
| **Total** | **2.290** | **2.804** | **2.599** | **-205** |

Setembro fez 205 cartões a menos que agosto. Quase tudo vem de dois lugares: o topo de funil do varejo mandou muito menos (base acionável de 5,1 milhões em agosto para 1,1 milhão em setembro) e a repescagem voltou do pico de agosto. Carrinho e upgrade cresceram e seguraram parte da queda, e a CAC do mês foi a melhor do trimestre.

## Canais e BUs

Por canal, jul a set/2026:

| Canal | Disparos | Base acionável | Propostas | Aprovados | Cartões | Propostas/base | Aprovados/propostas | Cartões/aprovados | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| WhatsApp | 1.786 | 296.559 | 63.060 | 62.125 | 6.247 | 21,3% | 98,5% | 10,1% | R$ 110.388,28 | R$ 17,67 |
| E-mail | 714 | 11.821.863 | 6.408 | 1.732 | 1.122 | 0,054% | 27,0% | 64,8% | R$ 12.075,75 | R$ 10,76 |
| SMS | 260 | 59.851 | 13.612 | 13.428 | 316 | 22,7% | 98,6% | 2,4% | R$ 4.476,85 | R$ 14,17 |
| Push | 266 | 7.618 | 47 | 23 | 8 | 0,62% | 48,9% | 34,8% | R$ 7,84 | R$ 0,98 |
| Total | 3.026 | 12.185.891 | 83.127 | 77.308 | 7.693 | 0,68% | 93,0% | 10,0% | R$ 126.948,72 | R$ 16,50 |

Por BU, jul a set/2026:

| BU | Disparos | Base acionável | Propostas | Aprovados | Cartões | Propostas/base | Aprovados/propostas | Cartões/aprovados | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| B2C | 1.989 | 2.381.252 | 75.980 | 74.095 | 5.486 | 3,2% | 97,5% | 7,4% | R$ 84.829,48 | R$ 15,46 |
| Plurix | 554 | 3.055.775 | 3.494 | 2.182 | 1.567 | 0,11% | 62,4% | 71,8% | R$ 31.863,37 | R$ 20,33 |
| B2B2C | 483 | 6.748.864 | 3.653 | 1.031 | 640 | 0,054% | 28,2% | 62,1% | R$ 10.255,88 | R$ 16,02 |
| Total | 3.026 | 12.185.891 | 83.127 | 77.308 | 7.693 | 0,68% | 93,0% | 10,0% | R$ 126.948,73 | R$ 16,50 |

Como ler:
- **O WhatsApp faz 81% dos cartões** (6.247 de 7.693), com CAC de R$ 17,67. O e-mail faz 1.122 cartões a R$ 10,76, falando com 11,8 milhões de base.
- As taxas de proposta e aprovação do WhatsApp e do SMS aparecem altas porque o carrinho eCred da Serasa está dentro deles (mesmo efeito da árvore).
- A Plurix tem a CAC mais alta das BUs (R$ 20,33) por causa do Upgrade e da Repescagem; no topo de funil ela é a mais barata.

## Guia de leitura

Conteúdo integral da antiga nota `Resultados-CRM` (03/10/2026): como ler, recortes possíveis e limites conhecidos.

**Pergunta central:** como volume, eficiência e composição mudaram, e quais segmentos e parceiros explicam a diferença?

### Contexto

Fonte: [[activities]]. Definições: [[Segmentos]], [[Jornada-Disparos]], [[Taxonomia-Activity-Name]] e [[Resultados]].

Declare BU, segmento, parceiro canônico, canal e período. Mostre propostas, aprovações, cartões e custo quando disponíveis, com cobertura de cada medida. Entrega, abertura e clique ajudam a diagnosticar a comunicação.

### Leques analíticos

| Leitura | Pergunta útil | Cuidado |
|---|---|---|
| Geral por mês | a produção mudou ou mudou o mix? | mês fechado ou mesmo corte |
| Segmento geral | qual estado do público explica o resultado? | públicos equivalentes |
| Segmento por parceiro | quais parceiros movem este segmento? | mesmo segmento, período e BU |
| Canal | mudou escala, resposta ou produção? | custo e cobertura |
| Jornada e etapa | onde a régua produz ou perde eficiência? | objetivo e janela |
| Oferta e comunicação | qual mensagem merece outra verificação? | vínculo confiável com template |
| Disparo equivalente | o padrão se repete? | taxonomia, público e contexto |
| Calendário e safra | há sazonalidade ou mudança do mix? | calendário e dias úteis |
| Custo e eficiência | o ganho exige mais investimento? | registrado versus estimado |
| Qualidade | quanto da leitura está reconciliado? | nulos, duplicidades e tracking |

### Evolução mensal e retrospectiva

Para cada recorte: **mês → volume → taxa compatível → custo → cobertura → retrospectiva**. Compare o mês anterior pelo mesmo corte quando o mês estiver parcial. Decomponha escala, eficiência e participação dos grupos.

Siga [[Retrospectiva-Mensal-Growth]]. Leia o segmento geral antes dos parceiros; depois abra canais, jornadas e disparos que ajudam a explicar a diferença. Conecte o mês anterior e registre a próxima verificação.

### Limites conhecidos

Na auditoria de 02/10/2026, havia chaves candidatas a duplicidade e coberturas diferentes para propostas, aprovações, cartões, custos e templates. Isso exige conciliação antes de uma soma conclusiva.

Agregação por data não certifica coorte nem incrementalidade. Comparar criativos exige identificação confiável da comunicação e públicos comparáveis.

### Consultar resultados e retrospectivas

[[Historico-Resultados-CRM]] reúne os meses e abre cada segmento, com parceiros dentro do mesmo período e retrospectiva integrada. [[Retrospectiva-Growth-2026-09]] conecta o fechamento parcial de setembro às demais frentes. [[Catalogo-Analitico-CRM]] organiza os 80 leques candidatos da auditoria; [[Resultados-Qualidade-e-Cobertura]] explicita as restrições atuais.

### Conexões

[[Resultados-Evolucao-e-Retrospectivas]] · [[Retrospectiva-Mensal-Growth]] · [[AppsFlyer-Tracking-CRM]] · [[Metas-e-CAC]] · [[Loop-de-Aprendizado-Growth]].



### Operações, parceiros e segmentos — inventário integrado

[[07-Evolucao/Inventario-Operacoes-Growth|Inventário completo e critérios]] organiza aquisição, rentabilização, seguros, mídia, originação, funis e réguas. As entradas distinguem operações candidatas, campanhas, populações e cadastros.

**Parceiros:** [[07-Evolucao/Parceiro-Acordo-Certo|Acordo Certo]] · [[07-Evolucao/Parceiro-Alvorada|Alvorada]] · [[07-Evolucao/Parceiro-Bem-Barato|Bem Barato]] · [[07-Evolucao/Parceiro-Bom-Pra-Credito|Bom_Pra_Credito]] · [[07-Evolucao/Parceiro-Dia|Dia]] · [[07-Evolucao/Parceiro-Plurix|Plurix]] · [[07-Evolucao/Parceiro-Proprietaria|Proprietaria]] · [[07-Evolucao/Parceiro-Serasa|Serasa]]

**Segmentos:** [[07-Evolucao/Segmento-Abandonados|Abandonados]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Aprovados_nao_convertidos]] · [[07-Evolucao/Segmento-Base-Proprietaria|Base_Proprietaria]] · [[07-Evolucao/Segmento-CRM|CRM]] · [[07-Evolucao/Segmento-Cartonistas|Cartonistas]] · [[07-Evolucao/Segmento-Instabilidade|Instabilidade]] · [[07-Evolucao/Segmento-Leads-Parceiros|Leads_Parceiros]] · [[07-Evolucao/Segmento-Negados|Negados]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Recencia_de_Compra]]

## Perguntas que esta página responde

Conteúdo integral do antigo `Catalogo-Analitico-CRM` (auditado em 02/10/2026): as 80 leituras possíveis e a prontidão de cada uma naquela data.

**Catálogo de possibilidades, auditado em 02/10/2026.** Não representa telas implementadas nem resultados certificados. Toda leitura deve acompanhar evolução mensal, cobertura e retrospectiva do mesmo recorte. A viabilidade registrada indica existência de campos; execução e decisão exigem os contratos e verificações descritos em [[Resultados-Qualidade-e-Cobertura]].

Use o sumário "Nesta página" para escolher um leque. Leia primeiro a pergunta e as condições; abra o histórico correspondente para consultar evidências. Esta organização reúne 80 possibilidades da auditoria anterior e preserva a data da avaliação.


### CRM — Panorama

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção mensal | Disponível |
| Funil mensal | Disponível |
| Mix de BU | Disponível |
| Variação mensal | Disponível |
| Acumulado comparável | Disponível |

### CRM — Segmentos

| Possibilidade | Prontidão na auditoria |
|---|---|
| Evolução por segmento | Disponível |
| Ranking de produção | Disponível |
| Participação mensal | Disponível |
| Base versus conversão | Disponível |
| Concentração de disparos | Disponível |

### CRM — Parceiros

| Possibilidade | Prontidão na auditoria |
|---|---|
| Evolução canônica | Disponível |
| Ranking de produção | Disponível |
| Mix mensal | Disponível |
| Concentração de parceiros | Disponível |
| Cobertura de classificação | Disponível |

### CRM — Segmento × parceiro

| Possibilidade | Prontidão na auditoria |
|---|---|
| Matriz de produção | Disponível |
| Matriz de conversão | Disponível |
| Histórico por combinação | Disponível |
| Ranking com volume mínimo | Disponível |
| Mudanças de participação | Disponível |

### CRM — Funil

| Possibilidade | Prontidão na auditoria |
|---|---|
| Base até cartões | Parcial |
| Propostas/base | Parcial |
| Aprovados/propostas | Parcial |
| Cartões/aprovados | Parcial |
| Gargalos mensais | Parcial |

### CRM — Canais

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção mensal | Disponível |
| Mix dentro do segmento | Disponível |
| Conversão comparável | Disponível |
| Dependência de canal | Disponível |
| Canal × parceiro | Disponível |

### CRM — Engajamento

| Possibilidade | Prontidão na auditoria |
|---|---|
| Aberturas de e-mail | Parcial |
| Cliques de e-mail | Parcial |
| Cliques/aberturas | Parcial |
| Aberturas WhatsApp | Parcial |
| Entrega por canal | Parcial |

### CRM — Custos

| Possibilidade | Prontidão na auditoria |
|---|---|
| Custo registrado mensal | Parcial |
| Cobertura de custos | Parcial |
| Custo/proposta | Parcial |
| Custo/cartão | Parcial |
| Custo versus produção | Parcial |

### CRM — Bases

| Possibilidade | Prontidão na auditoria |
|---|---|
| Volume acionado | Parcial |
| Acionável/total | Parcial |
| Distribuição de tamanho | Parcial |
| Disparos versus cartões | Parcial |
| Eficiência por tamanho | Parcial |

### CRM — Jornadas

| Possibilidade | Prontidão na auditoria |
|---|---|
| Histórico por jornada | Parcial |
| Pareto de jornadas | Parcial |
| Disparos equivalentes | Parcial |
| Calendário diário | Parcial |
| Ordem da régua | Parcial |

### CRM — Produtos e ofertas

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produto por mês | Disponível |
| Conversão por produto | Disponível |
| Mix de ofertas | Disponível |
| Ações promocionais | Disponível |
| Oferta × segmento × parceiro | Disponível |

### CRM — Perfil e etapa

| Possibilidade | Prontidão na auditoria |
|---|---|
| Perfil de crédito mensal | Disponível |
| Conversão por perfil | Disponível |
| Etapas de aquisição | Disponível |
| Subgrupos | Disponível |
| Mix de elegibilidade | Disponível |

### CRM — Safras e calendário

| Possibilidade | Prontidão na auditoria |
|---|---|
| Safra declarada | Parcial |
| Safra × mês | Parcial |
| Dia da semana | Parcial |
| Distribuição no mês | Parcial |
| Persistência semanal/mensal | Parcial |

### CRM — Templates e emissões

| Possibilidade | Prontidão na auditoria |
|---|---|
| Templates por mês | Parcial |
| Produção por template | Parcial |
| Templates comparáveis | Parcial |
| Assistidas versus independentes | Parcial |
| Conciliação das emissões | Parcial |

### CRM — Diagnóstico

| Possibilidade | Prontidão na auditoria |
|---|---|
| Volume versus eficiência | Parcial |
| Outliers | Parcial |
| Contribuição para variação | Parcial |
| Top três disparos | Parcial |
| Persistência de sinais | Parcial |

### CRM — Qualidade e aprendizado

| Possibilidade | Prontidão na auditoria |
|---|---|
| Completude mensal | Parcial |
| Repetições | Parcial |
| Cobertura temporal | Parcial |
| Taxonomia e classificação | Parcial |
| Retrospectiva ligada às evidências | Parcial |

### Retrospectiva junto da análise

Escolher uma possibilidade não cria um aprendizado. Registrar a evolução do mesmo recorte, fatos e hipóteses separados, ação proposta e evidência necessária para verificar. Se fonte, vínculo, evento ou cobertura faltar, registrar a pendência. [[Retrospectiva-Mensal-Growth]] orienta esta etapa.

### Conexões

[[Resultados-CRM]] · [[Resultados-Midia-Paga]] · [[Resultados-B2C]] · [[Historico-Resultados-CRM]] · [[Historico-Resultados-Midia-Paga]] · [[Historico-Resultados-B2C]].

## Registro histórico: série mensal e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Historico-Resultados-CRM`, gerada em 03/10/2026. Os números são daquela data; os desta página, acima, são de 28/10/2026 e não devem ser misturados.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Como ler

Fonte: [[activities]]. Soma descritiva dos campos preenchidos, preservando todas as linhas. **Chaves repetidas ainda não conciliadas: não usar estes valores como total oficial, CAC ou evidência causal.** Linhas sem cartões ou propostas continuam ausentes. Meses com mais linhas ou dias podem representar mudança de cobertura, além de operação. Outubro está parcial; não comparar com setembro inteiro.

### Evolução geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-01 | 186 | 31 | 360 | 186/186 | 1.848 | 137/186 | 24 | [[#Retrospectiva 2025-01|ler junto]] |
| 2025-02 | 340 | 28 | 58 | 340/340 | 1.479 | 228/340 | 96 | [[#Retrospectiva 2025-02|ler junto]] |
| 2025-03 | 159 | 27 | 28 | 159/159 | 624 | 98/159 | 0 | [[#Retrospectiva 2025-03|ler junto]] |
| 2025-04 | 25 | 12 | 28 | 25/25 | 737 | 21/25 | 4 | [[#Retrospectiva 2025-04|ler junto]] |
| 2025-05 | 50 | 19 | 833 | 50/50 | 3.977 | 37/50 | 6 | [[#Retrospectiva 2025-05|ler junto]] |
| 2025-06 | 42 | 19 | 1.125 | 42/42 | 2.866 | 42/42 | 12 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | 36 | 17 | 275 | 36/36 | 794 | 33/36 | 11 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | 109 | 20 | 942 | 109/109 | 2.043 | 72/109 | 28 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | 156 | 23 | 499 | 156/156 | 1.424 | 87/156 | 12 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | 332 | 31 | 873 | 332/332 | 4.006 | 298/332 | 20 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | 328 | 30 | 2.193 | 328/328 | 5.655 | 237/328 | 12 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | 319 | 31 | 2.715 | 319/319 | 7.141 | 267/319 | 12 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | 330 | 31 | 1.928 | 330/330 | 6.433 | 304/330 | 10 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | 677 | 28 | 1.860 | 677/677 | 16.343 | 536/677 | 7 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | 555 | 31 | 2.314 | 555/555 | 32.282 | 424/555 | 28 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | 606 | 30 | 3.366 | 606/606 | 31.056 | 438/606 | 16 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | 566 | 31 | 1.924 | 565/566 | 23.948 | 348/566 | 74 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | 806 | 30 | 3.171 | 777/806 | 26.327 | 780/806 | 324 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | 989 | 31 | 2.290 | 989/989 | 29.936 | 989/989 | 58 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | 809 | 31 | 2.804 | 809/809 | 29.718 | 809/809 | 6 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | 473 | 30 | 1.582 | 451/473 | 19.002 | 451/473 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-10 | 2 | 1 | 0 | 2/2 | 0 | 2/2 | 0 | [[#Retrospectiva 2026-10|ler junto]] |

### Escolha o segmento

- [[Resultados-CRM-Abandonados|Abandonados]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Aprovados_nao_convertidos|Aprovados nao convertidos]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Base_Proprietaria|Base Proprietaria]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-CRM|CRM]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Cartonistas|Cartonistas]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Instabilidade|Instabilidade]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Leads_Parceiros|Leads Parceiros]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Negados|Negados]] — histórico geral e detalhamento por parceiro.
- [[Resultados-CRM-Recencia_de_Compra|Recencia de Compra]] — histórico geral e detalhamento por parceiro.

### Retrospectivas integradas

#### Retrospectiva 2025-01

- **Observação:** 360 cartões registrados em 186/186 linhas; 24 linhas pertencem a chaves candidatas a repetição; registros entre 2025-01-01 e 2025-01-31, em 31 dias distintos.
- **Cobertura:** 186 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-02

- **Observação:** 58 cartões registrados em 340/340 linhas; 96 linhas pertencem a chaves candidatas a repetição; registros entre 2025-02-01 e 2025-02-28, em 28 dias distintos.
- **Cobertura:** 340 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-03

- **Observação:** 28 cartões registrados em 159/159 linhas; 0 linhas pertencem a chaves candidatas a repetição; registros entre 2025-03-01 e 2025-03-31, em 27 dias distintos.
- **Cobertura:** 159 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-04

- **Observação:** 28 cartões registrados em 25/25 linhas; 4 linhas pertencem a chaves candidatas a repetição; registros entre 2025-04-01 e 2025-04-30, em 12 dias distintos.
- **Cobertura:** 25 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-05

- **Observação:** 833 cartões registrados em 50/50 linhas; 6 linhas pertencem a chaves candidatas a repetição; registros entre 2025-05-01 e 2025-05-31, em 19 dias distintos.
- **Cobertura:** 50 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-06

- **Observação:** 1.125 cartões registrados em 42/42 linhas; 12 linhas pertencem a chaves candidatas a repetição; registros entre 2025-06-02 e 2025-06-30, em 19 dias distintos.
- **Cobertura:** 42 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-07

- **Observação:** 275 cartões registrados em 36/36 linhas; 11 linhas pertencem a chaves candidatas a repetição; registros entre 2025-07-05 e 2025-07-26, em 17 dias distintos.
- **Cobertura:** 36 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-08

- **Observação:** 942 cartões registrados em 109/109 linhas; 28 linhas pertencem a chaves candidatas a repetição; registros entre 2025-08-02 e 2025-08-30, em 20 dias distintos.
- **Cobertura:** 109 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-09

- **Observação:** 499 cartões registrados em 156/156 linhas; 12 linhas pertencem a chaves candidatas a repetição; registros entre 2025-09-01 e 2025-09-30, em 23 dias distintos.
- **Cobertura:** 156 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-10

- **Observação:** 873 cartões registrados em 332/332 linhas; 20 linhas pertencem a chaves candidatas a repetição; registros entre 2025-10-01 e 2025-10-31, em 31 dias distintos.
- **Cobertura:** 332 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-11

- **Observação:** 2.193 cartões registrados em 328/328 linhas; 12 linhas pertencem a chaves candidatas a repetição; registros entre 2025-11-01 e 2025-11-30, em 30 dias distintos.
- **Cobertura:** 328 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2025-12

- **Observação:** 2.715 cartões registrados em 319/319 linhas; 12 linhas pertencem a chaves candidatas a repetição; registros entre 2025-12-01 e 2025-12-31, em 31 dias distintos.
- **Cobertura:** 319 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-01

- **Observação:** 1.928 cartões registrados em 330/330 linhas; 10 linhas pertencem a chaves candidatas a repetição; registros entre 2026-01-01 e 2026-01-31, em 31 dias distintos.
- **Cobertura:** 330 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-02

- **Observação:** 1.860 cartões registrados em 677/677 linhas; 7 linhas pertencem a chaves candidatas a repetição; registros entre 2026-02-01 e 2026-02-28, em 28 dias distintos.
- **Cobertura:** 677 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-03

- **Observação:** 2.314 cartões registrados em 555/555 linhas; 28 linhas pertencem a chaves candidatas a repetição; registros entre 2026-03-01 e 2026-03-31, em 31 dias distintos.
- **Cobertura:** 555 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-04

- **Observação:** 3.366 cartões registrados em 606/606 linhas; 16 linhas pertencem a chaves candidatas a repetição; registros entre 2026-04-01 e 2026-04-30, em 30 dias distintos.
- **Cobertura:** 606 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-05

- **Observação:** 1.924 cartões registrados em 565/566 linhas; 74 linhas pertencem a chaves candidatas a repetição; registros entre 2026-05-01 e 2026-05-31, em 31 dias distintos.
- **Cobertura:** 566 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-06

- **Observação:** 3.171 cartões registrados em 777/806 linhas; 324 linhas pertencem a chaves candidatas a repetição; registros entre 2026-06-01 e 2026-06-30, em 30 dias distintos.
- **Cobertura:** 806 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-07

- **Observação:** 2.290 cartões registrados em 989/989 linhas; 58 linhas pertencem a chaves candidatas a repetição; registros entre 2026-07-01 e 2026-07-31, em 31 dias distintos.
- **Cobertura:** 989 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-08

- **Observação:** 2.804 cartões registrados em 809/809 linhas; 6 linhas pertencem a chaves candidatas a repetição; registros entre 2026-08-01 e 2026-08-31, em 31 dias distintos.
- **Cobertura:** 809 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-09

- **Observação:** 1.582 cartões registrados em 451/473 linhas; 0 linhas pertencem a chaves candidatas a repetição; registros entre 2026-09-01 e 2026-09-30, em 30 dias distintos.
- **Cobertura:** 473 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

#### Retrospectiva 2026-10

- **Observação:** 0 cartões registrados em 2/2 linhas; 0 linhas pertencem a chaves candidatas a repetição; registros entre 2026-10-01 e 2026-10-01, em 1 dias distintos.
- **Cobertura:** 2 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

### Conexões

[[Resultados-CRM]] · [[Resultados-Evolucao-e-Retrospectivas]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Growth-2026-09]].
