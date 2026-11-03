---
title: "Carrinho abandonado"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Abandonados
aliases: [Carrinho Abandonado, Abandonados, Carrinho, ABD]
etapa_funil: Reativacao
bus: [B2C, Plurix, B2B2C]
parceiros_ativos: [Serasa, Proprietaria, Plurix, Bem Barato]
canais: [WhatsApp, SMS, Push, E-mail]
subgrupos: [Diario, Abandonados D-7, Abandonados D-21 A D>7]
status: ativo
atualizado: 2026-10-29
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Abandonados"}
analytics: {"domain": "crm", "scope": {"segment": "Abandonados"}}
variantes: [{"operation_id": "CRM-f9b25b84df", "bu": "B2C", "partner": "Serasa"}, {"operation_id": "CRM-2cc364c6bd", "bu": "B2C", "partner": "Proprietaria"}, {"operation_id": "CRM-bdc57e480d", "bu": "Plurix", "partner": "Plurix"}, {"operation_id": "CRM-3bd920ad5c", "bu": "B2B2C", "partner": "Bem Barato"}, {"operation_id": "CRM-c063e536a7", "bu": "B2B2C", "partner": "Dia"}]
---

# Carrinho abandonado

## Em uma frase

Reabordar quem começou o pedido do cartão e parou no meio, enquanto a intenção ainda está quente.

**Definição:** a **campanha-tipo de recuperação imediata** — reabordar quem **iniciou o pedido e parou no meio** (abandono do fluxo/ECRED).

Nos dados, é o segmento `Abandonados`, com etapa `Reativacao`. É o público que mais gera cartão no CRM: no registro de 03/10/2026 foram 8.435 cartões observados de jan/2025 a set/2026, e mais de 1.000 por mês de mar a ago/2026.

## Principais números: média de jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Abandonados`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas da média e do total são calculadas sobre a soma do trimestre (ponderadas), não média de taxas.

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 512 | 35.903 | 26.034 | 25.917 | 1.052 | 2,9% | 4,1% | R$ 11.781,20 | R$ 11,20 |
| ago/2026 | 520 | 29.653 | 24.591 | 24.489 | 1.049 | 3,5% | 4,3% | R$ 9.816,34 | R$ 9,36 |
| set/2026 | 738 | 30.660 | 20.041 | 19.803 | 1.185 | 3,9% | 6,0% | R$ 9.881,06 | R$ 8,34 |
| **Média mensal** | **590** | **32.072** | **23.555** | **23.403** | **1.095** | **3,4%** | **4,7%** | **R$ 10.492,87** | **R$ 9,58** |
| Total do trimestre | 1.770 | 96.216 | 70.666 | 70.209 | 3.286 | 3,4% | 4,7% | R$ 31.478,60 | R$ 9,58 |

Por parceiro, no trimestre:

| Parceiro | BU | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão | Finalização | Custo | CAC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Serasa (eCred) | B2C | 488 | 60.059 | 67.922 | 67.666 | 2.833 | 4,7% | 4,2% | R$ 18.474,49 | R$ 6,52 |
| Proprietária | B2C | 759 | 24.208 | 2.349 | 2.241 | 278 | 1,1% | 12,4% | R$ 8.617,74 | R$ 31,00 |
| Plurix | Plurix | 407 | 10.987 | 366 | 288 | 170 | 1,5% | 59,0% | R$ 4.188,24 | R$ 24,64 |
| Bem Barato | B2B2C | 116 | 962 | 29 | 14 | 5 | 0,5% | 35,7% | R$ 198,13 | R$ 39,63 |

Como ler:
- **Uma média de ~1.100 cartões por mês, a CAC abaixo de R$ 10**, e a eficiência melhorou nos três meses (CAC de R$ 11,20 para R$ 8,34).
- **A Serasa faz 86% dos cartões do trimestre**, com a menor CAC (R$ 6,52). As propostas dela passam da base acionável porque o eCred recebe lead externo, então para a Serasa a conversão "cartões/base" e o funil proposta → aprovado não se comparam com os outros parceiros.
- **Proprietária e Plurix** convertem pouco da base (1,1% e 1,5%), mas quem chega a aprovado vira cartão bem mais (12,4% e 59,0%). O gargalo deles está antes da proposta.
- Setembro tem 738 linhas hoje contra 379 no registro de 03/10: a base foi atualizada depois. Os números desta tabela e do registro histórico não devem ser misturados.

## Por que esse público importa

Recência é tudo: o valor do público decai por dia — é o caso de uso **mais forte** do [[Ativacao-de-Audiencias-Diaria|pipeline diário]] (audiência D-1 no Meta enquanto o SFMC trabalha WPP/SMS). A virada de eficiência de mar/26 ([[Evolução-Temporal]]) aconteceu majoritariamente neste bloco.

Três leituras do registro de 03/10/2026 ajudam a entender o tamanho de cada parte (são leituras, não causas validadas):

- **O carrinho eCred da Serasa é quase todo o resultado.** A Serasa respondeu por 7.217 dos 8.435 cartões observados (86%). A operação começou em 13/02/2026, com o eCred (D0, D3, D6); as 3 linhas de dez/2025 eram configuração anterior ao lançamento, sem cartão. De mar a set/2026, entregou entre 883 e 1.148 cartões por mês.
- **Plurix tem o maior volume de disparo e pouco cartão.** São 2.072 linhas no inventário e 538 cartões em toda a série.
- **Bem Barato começou em 27/07/2026 e ainda não converteu.** Foram 100 linhas e 1 cartão até set/2026. A [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas]] fala em cerca de 15 pessoas por dia na régua.

## Pra quem é e quando entra

A pessoa iniciou a solicitação (no fluxo institucional ou no eCred) e não terminou. O valor do público cai a cada dia, por isso a régua é separada por recência, em três subgrupos oficiais:

| Subgrupo | Janela | Cadência típica | Como reconhecer a jornada |
|---|---|---|---|
| `Diario` | entrada recente, régua contínua | todos os dias da semana | `CARRINHO_AQUISICAO`, `CARRINHO_REATIVACAO`, Plurix `CARRINHO_ABANDONADO_*` |
| `Abandonados D-7` | até 7 dias | sábado | `SAB_ABD_REATIVACAO`, `CARRINHO_SABADO` |
| `Abandonados D-21 A D>7` | de 8 a 21 dias | dia útil, nunca sábado | `21D_ABD_REATIVACAO`, `ABD_MEIO_DE_FUNIL`, `ABD_CARRINHO21D` |

Regras de classificação que já foram confirmadas (detalhe em [[08-Engenharia/Importador-Segmentacao-Aquisicao-2026-10|Importador de segmentação]] e [[04-Operacao/SFMC-Packs-Fluxos-Vinculos-e-Aprendizados|Packs SFMC]]):

- O subgrupo vem da janela do público, não do dia em que o disparo saiu. Jornada diária que disparou num sábado continua `Diario` (sábado é cerca de 14 a 16% do volume dela).
- `JOR_AQS_PLURIX_CARRINHO_SABADO_PAD_26` é janela de 7 dias, mesmo com `21dias` no nome da activity.
- Desvio histórico único: a Plurix `JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26` saiu com nome de 21D, mas disparou 100% no sábado; o subgrupo foi corrigido para `Abandonados D-7` e o nome não vai ser trocado (limite do SFMC). Confirmado pelo Pablo em 15/07/2026.
- Em `Dispd1_21d`, o "1" é o disparo 1 e "21d" é o qualificador; não é o disparo 121.
- O carrinho usa `_aqs_` na taxonomia, mas é reativação; classificar pela jornada `*_ABD` ([[07-Evolucao/Inconsistências-a-Corrigir|incongruência registrada]]).

Como o público aparece em cada sistema:

| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Abandonados` (subgrupos `Diario`, `Abandonados D-7`) |
| Relatório diarizado | bloco `CARRINHO ABANDONADO B2C/PLURIX` |
| Taxonomia SFMC | journeys `*_ABD` (usam `_aqs_` mas são reativação — [[Inconsistências-a-Corrigir|incongruência 8]]); finalizados via ECRED fora do SFMC |
| Meta hoje | `AFINZ_Abandonados_B2C_10_07_2025` — **única e congelada há 11 meses** |
| Audiência proposta | `crm_b2c_carrinho_daily` · `crm_plurix_carrinho_daily` |
| AppsFlyer | `af_adset=abandonados` |

## Regra original (jan/2026) e o que a operação mostra hoje

A régua nasceu da [[05-Estrategia/Estrategia-Bases-Segmentadas-Original-2026-01|planilha de bases segmentadas]] (criada em 03/2025, revista em 01/2026). Na Visão Geral ela é a prioridade 1; no Racional Lógico, a 2.

| Ponto | Regra original (jan/2026) | O que a operação mostra hoje |
|---|---|---|
| Quem entra | Deu aceite na oferta e parou em fraude (docs/biometria), assinatura de contrato ou finalização | Mesmo público, com subgrupos por tempo de abandono: `Diario`, `Abandonados D-7` (sábado) e `Abandonados D-21 A D>7` (dia útil) |
| Quem sai | Negado por fraude | Sem medida em `activities`: a exclusão acontece antes da base chegar ao CRM |
| Pré-análise | Não; todo o público restante é elegível | Sem mudança registrada |
| Base nova | Diária, D+1 do abandono | Diária: houve disparo em todos os 92 dias do trimestre |
| Duração e ritmo | 15 dias, 2 ativações por semana | 27 jornadas e 1.770 disparos no trimestre, em três janelas (diário, D-7 e D-21). O ritmo por cliente depende da jornada e não aparece em `activities` |
| Canais | WhatsApp com transbordo, Push e SMS | WhatsApp faz 95% dos cartões. Push e SMS só no B2C (Proprietária e Serasa) e SMS também no Bem Barato. E-mail não estava na regra e teve 1 disparo |
| Objetivo | Visão Geral: finalizar a proposta de quem parou no fim. Racional: qualificar o abandono com atendimento mais especializado na mesa | A régua é toda de mensagem; o atendimento pela mesa não aparece nos dados de disparo |
| Status na planilha | "Avaliar com o Zaidan" | Régua ativa em todas as BUs (B2C, Plurix, B2B2C) |

Por canal, no trimestre:

| Canal | Disparos | Base acionável | Cartões | Conversão |
|---|---:|---:|---:|---:|
| WhatsApp | 1.270 | 79.824 | 3.120 | 3,91% |
| SMS | 233 | 8.771 | 158 | 1,80% |
| Push | 266 | 7.618 | 8 | 0,11% |
| E-mail | 1 | 3 | 0 | 0,00% |

O que fica de leitura:

- **Push quase não converte no carrinho:** 266 disparos para 8 cartões. Vale decidir se ele segue na régua ou se vira só lembrete sem expectativa de venda.
- **O ritmo de 2 ativações por semana virou régua diária por janela de abandono.** A regra original não previa as janelas D-7 e D-21.

Operação medida em `activities` em 29/10/2026, de 01/07 a 30/09/2026. Conversão aqui é cartões ÷ base acionável. "Dias com disparo" conta os dias com pelo menos um disparo do público, em qualquer jornada: mede o ritmo da operação, não quantas mensagens cada cliente recebe.

## Régua

Toda régua de carrinho tem três sub-jornadas (Diário, 21D e Sábado), cada uma com 3 disparos, nos canais WhatsApp, SMS e Push, para Afinz, Plurix e Bem Barato ([[05-Estrategia/Reguas-Inteligentes-Arquitetura|Réguas inteligentes]]). No B2C há dois ramos: o institucional (Proprietária) e o eCred da Serasa (D0, D3, D6, desde 13/02/2026). A auditoria de outubro leu 14 jornadas de carrinho 21D e sábado (mai a set/2026) e registrou que o D0 do eCred usa link genérico, sem `af_sub`.

O texto e a sequência de cada jornada estão nos pacotes do SFMC: [[04-Operacao/Comunicacoes-Pacote-SFMC-Catalogo|Catálogo de comunicações]] e [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|Auditoria das jornadas]]. A lista completa de jornadas e safras de cada parceiro está em [[#Detalhe das variantes por parceiro]].

## O que pode e não pode dizer

A [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria de outubro de 2026]] encontrou, nas mensagens de carrinho, promessas classificadas como risco alto: sorteio de R$ 100 mil (regulamento expirado em 11/05/2026), R$ 100 do Vibe sem a condição de anuidade ativa, "cartão virtual para usar na hora" no B2C, SMS sem "sujeito à análise de crédito", "limite de até R$ 6.000" sem teto aprovado e urgência do tipo "últimos dias". Antes de escrever ou revisar uma mensagem, conferir [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]] e [[03-Dimensoes/Vibe|Vibe]].

## Como medir sem cair em armadilha

- **Classifique pelo `Segmento`, nunca pelo nome da jornada.** O campo `jornada` aceita texto livre. Em jan/2026 existem 12 linhas com `jornada = "Carrinho Abandonado"` que na verdade são Serasa LP meio de funil (`Segmento = Leads_Parceiros`, 98 cartões) e duplicam disparos que já existem com o nome certo. Filtrar por `jornada ILIKE '%carrinho%'` infla o carrinho. O filtro certo é `Segmento IN ('Abandonados', 'Carrinho Abandonado')`. (Investigação de 16/07/2026 contra a Dinâmica BI e `activities`. Na consulta de 28/10/2026 essas 12 linhas já não existem mais em `activities`, mas a regra continua valendo para dado novo.)
- **Três coisas diferentes têm o mesmo nome.** `jornada = Carrinho Abandonado` (12 linhas de jan/2026, rótulo errado), `Segmento = Carrinho Abandonado` (4 linhas de 15/07/2026, variação de grafia que já foi corrigida: não aparece mais em `activities` na consulta de 28/10/2026) e `Segmento = Abandonados` (o histórico real). Segmento fora da lista de rótulos do Relatório aparece como série solta na legenda do gráfico.
- **Jan/2026 teve zero carrinho B2C, e isso é real.** A jornada antiga das 14h (institucional) parou em 10/11/2025 e o eCred só começou em 13/02/2026. A atribuição do carrinho B2C ficou cega de 20/03/2025 a 13/02/2026, com a jornada das 14h disparando 21.744 entregas sem nenhum resultado no bloco de performance. Comparar com esse período subestima o carrinho antigo.
- **`Diario` não prova D0**, e **N/A não é Plurix confirmado.**
- **Chave repetida distorce a soma.** Jun/2026 tem 308 linhas com chave repetida (a maior parte em Serasa e Proprietária); comparar junho com outros meses exige deduplicar antes.
- **Teste, seedlist e respostas de opt-out aparecem no meio dos disparos** e ainda não são excluídos automaticamente. Resposta de opt-out não define subgrupo nem autoriza sugerir subgrupo de carrinho para outra jornada ([[04-Operacao/WhatsApp-Respostas-de-Opt-out|regra de opt-out]]).
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o segmento inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Enquanto o filtro por parceiro dentro da página não fica pronto no app, cada linha abaixo leva à nota que já mostra o resultado ao vivo daquela combinação.

| Parceiro | BU | Subgrupos | Canais | Ofertas | Linhas no inventário | Período observado | Cartões (registro 03/10) |
|---|---|---|---|---|---:|---|---:|
| Serasa (eCred) | B2C | Diario, D-7, D-21 A D>7 | WhatsApp, SMS, Push | Padrao, Vibe | 1.158 | 11/12/2025 a 30/09/2026 | 7.217 |
| Proprietária (institucional) | B2C | Diario, D-7, D-21 A D>7, N/A | WhatsApp, SMS, Push, E-mail | Padrao, Vibe | 1.206 | 01/01/2025 a 30/09/2026 | 678 |
| Plurix | Plurix | Diario, D-7, N/A | WhatsApp, SMS | Padrao, Vibe | 2.072 | 06/06/2025 a 30/09/2026 | 538 |
| Bem Barato | B2B2C | Diario | WhatsApp, SMS | Padrao, Vibe | 100 | 27/07/2026 a 30/09/2026 | 1 |
| Dia | B2B2C | Diario | WhatsApp | Vibe | 1 | só 25/07/2025 | 1 |

Resultado ao vivo de cada combinação: [[07-Evolucao/Assunto-CRM-f9b25b84df|Serasa]] · [[07-Evolucao/Assunto-CRM-2cc364c6bd|Proprietária]] · [[07-Evolucao/Assunto-CRM-bdc57e480d|Plurix]] · [[07-Evolucao/Assunto-CRM-3bd920ad5c|Bem Barato]] · [[07-Evolucao/Assunto-CRM-c063e536a7|Dia]].

Os cartões por parceiro são a soma da tabela "Segmento por parceiro e mês" do registro histórico abaixo. Visão de cada parceiro: [[10-Resultados/Parceiros/Serasa|Serasa]] · [[10-Resultados/Parceiros/Proprietaria|Proprietária]] · [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]] · [[10-Resultados/Parceiros/Dia|Dia]].

## O que já aprendemos

Nenhum aprendizado de carrinho foi validado por outcome no loop ainda. O que existe são leituras registradas, com a fonte de cada uma:

- **A estratificação por recência em mar/2026 é a melhor explicação até agora para o salto de eficiência.** Mesma oferta e mesmo subgrupo núcleo, mas em março surgem os subgrupos D-7 e D-21 A D>7 e o WhatsApp `Diario` sobe de 8,42% para 24,05% de conversão ([[05-Estrategia/Sistema-de-Experimentacao-Referencias|Sistema de experimentação, caso 2]]).
- **Vibe como oferta teve um A/B natural em fev/2026:** no carrinho B2C por WhatsApp, Vibe converteu 8,42% contra 0,49% do Padrão, lado a lado ([[05-Estrategia/Sistema-de-Experimentacao-Referencias|caso 1]]). A chave de oferta é sempre o par Oferta + Promocional.
- **No Bem Barato em ago/2026, SMS rendeu mais que WhatsApp na Repescagem** (45 cartões, CAC R$ 4,76, contra 31 e R$ 17,40); no carrinho do Bem Barato ainda não há conversão para comparar ([[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria]]).

As leituras de cada mês (cobertura e pendências) estão no registro histórico abaixo. Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Carrinho Plurix tem muito disparo e pouco cartão: é público, oferta ou régua? | decide se vale manter o volume atual | resultado por subgrupo e canal, mesmo corte de dias | a confirmar |
| Bem Barato com cerca de 15 pessoas/dia e 0 cartões em set/2026 | régua pode não se pagar | entrada diária, canal e maturação | a confirmar |
| E-mail tinha zero disparo de carrinho em jun/2026 e retargeting pago estava parado | canal barato fora do público mais quente | conferir execução atual por canal | a confirmar |
| Audiência de carrinho no Meta estava congelada desde 10/07/2025 | mídia não acompanha o público fresco | estado do pipeline diário de audiências (ver Ativação diária, abaixo) | a confirmar |
| O importador herda subgrupo pelo histórico do mesmo activity name; um 21D genuíno que reuse `plu_car_vis_aqs_wpp_car_21d1copa_diario` vai herdar D-7 | classificação errada aprovada sozinha | regra fixa pelo token da jornada (SAB vira D-7, 21D vira D-21 A D>7), aguardando go/no-go | Pablo |
| Entrada por abandono, origem, recência e destino de cada variante | o pertencimento ainda é candidato | definição e execução de cada jornada | a confirmar |

## Onde mais o carrinho aparece

Estas notas tratam de outros assuntos e também falam de carrinho. Elas continuam no lugar:

- [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|Auditoria das jornadas SFMC (out/2026)]]: jornadas lidas, problemas de mensagem e resultado por parceiro.
- [[05-Estrategia/Reguas-Inteligentes-Arquitetura|Réguas inteligentes]]: esqueleto Diário, 21D e Sábado usado para gerar régua.
- [[08-Engenharia/Importador-Segmentacao-Aquisicao-2026-10|Importador de segmentação]]: janelas e subgrupos confirmados.
- [[04-Operacao/WhatsApp-Respostas-de-Opt-out|Respostas de opt-out no WhatsApp]]: por que respostas não viram subgrupo de carrinho.
- [[01-Conceitos/Plataformas-de-Comunicação|Plataformas de comunicação]]: matriz público × canal e audiência Meta.
- [[05-Estrategia/Ativacao-de-Audiencias-Diaria|Ativação diária de audiências]] e [[04-Operacao/AppsFlyer-Tracking-CRM|AppsFlyer]]: `crm_b2c_carrinho_daily` e `af_adset=abandonados`.
- [[98-Legado/03-Dimensoes/Subgrupos|Subgrupos]] e [[07-Evolucao/Inventario-Operacoes-Growth|Inventário de operações]].

## Relacionado

- [[Plataformas-de-Comunicação]] · [[Topo-de-Funil]] · [[Segmentos]] · [[Subgrupos]] · [[Evolução-Temporal]] · [[Ativacao-de-Audiencias-Diaria]] · [[Anti-Overlap-Pressão-de-Contato]]

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes; não comparar um com o outro sem conferir o método.

### Nota de conceito, 10/06/2026

> 📊 Snapshot 2026-06-10. **O maior ativo da operação**: 2.409 disparos, CAC R$ 4,83 (melhor relação), conversão 6,1%. Núcleo absoluto: **WhatsApp** (1.893 disparos/5.147 cartões) + SMS; Push só aqui (102 disparos/3 cartões). **Lacunas: E-mail = zero disparos** e retargeting pago morto.

### Dimensão Segmentos, 08 a 10/06/2026

| Segmento | Etapa | Disparos | Conversão | CAC |
|---|---|---|---|---|
| Abandonados | Meio funil | 2.409 | 6,1% | **R$ 4,83** |

### Performance por segmento, 10/06/2026

| Segmento | Conversão | CAC | Leitura |
|---|---|---|---|
| Abandonados | 6,1% | R$ 4,83 | melhor relação — alavanca principal |

### Dossiê Mestre, baseline de 08/06/2026

| Segmento | Conversão | CAC | Papel |
|---|---:|---:|---|
| Abandonados | 23,7% | R$ 3,93 | principal alavanca documentada |

### Cohort por safra, 10/06/2026

> 📊 Snapshot 2026-06-10 — `vw_performance_bu_segmento_safra`, segmento Abandonados.

| Safra | Abandonados B2C (CAC / conv) | Abandonados Plurix (CAC / conv) |
|---|---|---|
| 2026-02 | R$ 9,32 / 2,7% | R$ 27,70 / 1,5% |
| 2026-03 | **R$ 2,79 / 9,7%** | R$ 6,60 / 6,4% |
| 2026-04 | R$ 3,74 / 8,2% | R$ 7,41 / 5,7% |
| 2026-05 | R$ 5,34 / 6,1% | R$ 6,67 / 6,2% |

A virada de **fev→mar/26** (CAC ÷3, conversão ×3,6 nos dois BUs simultaneamente) é o maior salto de eficiência da série — candidata a causa estrutural (oferta/régua/qualidade de base), não sazonal. Vale investigar o que mudou na operação em março e replicar.

### Alerta de reidratação

**Crescimento:** Disparos 4.606 → 6.216 (+35%). Base de aprendizado ampliou.

**Oportunidade:** Abandonados agora é maior segmento (3.589 disparos) com CAC R$ 6,95 (mais barato que CRM R$ 10,76).

**Ação:** Priorizar Abandonados na próxima safra.

**Status:** PRONTO · Planejamento de orçamento

---

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Abandonados`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Abandonados`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-01 | 32 | 31 | 10 | 32/32 | 22 | 31/32 | 0 | [[#Retrospectiva 2025-01|ler junto]] |
| 2025-02 | 28 | 28 | 4 | 28/28 | 12 | 28/28 | 0 | [[#Retrospectiva 2025-02|ler junto]] |
| 2025-03 | 17 | 17 | 0 | 17/17 | 16 | 17/17 | 0 | [[#Retrospectiva 2025-03|ler junto]] |
| 2025-06 | 4 | 4 | 14 | 4/4 | 53 | 4/4 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | 10 | 6 | 22 | 10/10 | 85 | 8/10 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | 17 | 6 | 139 | 17/17 | 311 | 17/17 | 2 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | 72 | 14 | 56 | 72/72 | 184 | 48/72 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | 201 | 31 | 129 | 201/201 | 1.473 | 190/201 | 8 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | 190 | 30 | 31 | 190/190 | 69 | 120/190 | 2 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | 195 | 31 | 43 | 195/195 | 130 | 164/195 | 2 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | 193 | 31 | 17 | 193/193 | 37 | 173/193 | 2 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | 256 | 28 | 307 | 256/256 | 11.287 | 180/256 | 4 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | 395 | 31 | 1.212 | 395/395 | 28.746 | 296/395 | 28 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | 407 | 30 | 1.227 | 407/407 | 25.741 | 283/407 | 8 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | 464 | 31 | 1.119 | 463/464 | 21.234 | 261/464 | 62 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | 645 | 30 | 1.092 | 625/645 | 21.541 | 628/645 | 308 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | 512 | 31 | 1.052 | 512/512 | 26.034 | 512/512 | 57 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | 520 | 31 | 1.049 | 520/520 | 24.591 | 520/520 | 3 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | 379 | 30 | 912 | 372/379 | 17.285 | 372/379 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2025-01 | Proprietaria | 32 | 31 | 10 | 32/32 | 0 | [[#Retrospectiva 2025-01|ler junto]] |
| 2025-02 | Proprietaria | 28 | 28 | 4 | 28/28 | 0 | [[#Retrospectiva 2025-02|ler junto]] |
| 2025-03 | Proprietaria | 17 | 17 | 0 | 17/17 | 0 | [[#Retrospectiva 2025-03|ler junto]] |
| 2025-06 | Plurix | 2 | 2 | 1 | 2/2 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-06 | Proprietaria | 2 | 2 | 13 | 2/2 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | Dia | 1 | 1 | 1 | 1/1 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-07 | Plurix | 1 | 1 | 2 | 1/1 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-07 | Proprietaria | 8 | 4 | 19 | 8/8 | 0 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | Plurix | 2 | 1 | 30 | 2/2 | 2 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-08 | Proprietaria | 15 | 5 | 109 | 15/15 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | Plurix | 62 | 12 | 17 | 62/62 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-09 | Proprietaria | 10 | 4 | 39 | 10/10 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | Plurix | 186 | 31 | 52 | 186/186 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-10 | Proprietaria | 15 | 5 | 77 | 15/15 | 8 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | Plurix | 180 | 30 | 30 | 180/180 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-11 | Proprietaria | 10 | 5 | 1 | 10/10 | 2 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | Plurix | 186 | 31 | 17 | 186/186 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2025-12 | Proprietaria | 6 | 4 | 26 | 6/6 | 2 | [[#Retrospectiva 2025-12|ler junto]] |
| 2025-12 | Serasa | 3 | 3 | 0 | 3/3 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | Plurix | 186 | 31 | 17 | 186/186 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-01 | Proprietaria | 7 | 6 | 0 | 7/7 | 2 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | Plurix | 168 | 28 | 7 | 168/168 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-02 | Proprietaria | 51 | 19 | 38 | 51/51 | 4 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-02 | Serasa | 37 | 16 | 262 | 37/37 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | Plurix | 186 | 31 | 39 | 186/186 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-03 | Proprietaria | 113 | 31 | 25 | 113/113 | 28 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-03 | Serasa | 96 | 31 | 1.148 | 96/96 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | Plurix | 176 | 30 | 57 | 176/176 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | Proprietaria | 127 | 30 | 38 | 127/127 | 4 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | Serasa | 104 | 30 | 1.132 | 104/104 | 4 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | Plurix | 177 | 31 | 50 | 177/177 | 0 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Proprietaria | 132 | 31 | 44 | 131/132 | 18 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Serasa | 155 | 31 | 1.025 | 155/155 | 44 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | Plurix | 158 | 30 | 58 | 158/158 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-06 | Proprietaria | 212 | 30 | 147 | 203/212 | 127 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-06 | Serasa | 275 | 30 | 887 | 264/275 | 181 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | Bem Barato | 6 | 5 | 0 | 6/6 | 1 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Plurix | 185 | 31 | 99 | 185/185 | 2 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Proprietaria | 130 | 31 | 14 | 130/130 | 24 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Serasa | 191 | 31 | 939 | 191/191 | 30 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | Bem Barato | 38 | 22 | 1 | 38/38 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Plurix | 138 | 31 | 53 | 138/138 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Proprietaria | 168 | 31 | 54 | 168/168 | 3 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Serasa | 176 | 31 | 941 | 176/176 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | Bem Barato | 56 | 30 | 0 | 56/56 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-09 | Plurix | 79 | 30 | 9 | 79/79 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-09 | Proprietaria | 123 | 30 | 20 | 116/123 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-09 | Serasa | 121 | 30 | 883 | 121/121 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2025-01

- **Observação:** segmento geral com 10 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-01-01 e 2025-01-31, em 31 dias distintos.
- **Cobertura:** 32 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 10 cartões em 32/32 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-02

- **Observação:** segmento geral com 4 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-02-01 e 2025-02-28, em 28 dias distintos.
- **Cobertura:** 28 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 4 cartões em 28/28 linhas; 28 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-03

- **Observação:** segmento geral com 0 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-03-03 e 2025-03-20, em 17 dias distintos.
- **Cobertura:** 17 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 0 cartões em 17/17 linhas; 17 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-06

- **Observação:** segmento geral com 14 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-06-06 e 2025-06-13, em 4 dias distintos.
- **Cobertura:** 4 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 1 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 13 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-07

- **Observação:** segmento geral com 22 cartões observados; 3 classificações de parceiro registradas; registros entre 2025-07-05 e 2025-07-26, em 6 dias distintos.
- **Cobertura:** 10 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Dia:** 1 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 2 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 19 cartões em 8/8 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-08

- **Observação:** segmento geral com 139 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-08-02 e 2025-08-30, em 6 dias distintos.
- **Cobertura:** 17 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 30 cartões em 2/2 linhas; 1 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 109 cartões em 15/15 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-09

- **Observação:** segmento geral com 56 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-09-06 e 2025-09-30, em 14 dias distintos.
- **Cobertura:** 72 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 17 cartões em 62/62 linhas; 12 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 39 cartões em 10/10 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-10

- **Observação:** segmento geral com 129 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-10-01 e 2025-10-31, em 31 dias distintos.
- **Cobertura:** 201 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 52 cartões em 186/186 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 77 cartões em 15/15 linhas; 5 dias, 8 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-11

- **Observação:** segmento geral com 31 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-11-01 e 2025-11-30, em 30 dias distintos.
- **Cobertura:** 190 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 30 cartões em 180/180 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 1 cartões em 10/10 linhas; 5 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-12

- **Observação:** segmento geral com 43 cartões observados; 3 classificações de parceiro registradas; registros entre 2025-12-01 e 2025-12-31, em 31 dias distintos.
- **Cobertura:** 195 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 17 cartões em 186/186 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 26 cartões em 6/6 linhas; 4 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 0 cartões em 3/3 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-01

- **Observação:** segmento geral com 17 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-01-01 e 2026-01-31, em 31 dias distintos.
- **Cobertura:** 193 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 17 cartões em 186/186 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 0 cartões em 7/7 linhas; 6 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-02

- **Observação:** segmento geral com 307 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-02-01 e 2026-02-28, em 28 dias distintos.
- **Cobertura:** 256 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 7 cartões em 168/168 linhas; 28 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 38 cartões em 51/51 linhas; 19 dias, 4 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 262 cartões em 37/37 linhas; 16 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-03

- **Observação:** segmento geral com 1.212 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-03-01 e 2026-03-31, em 31 dias distintos.
- **Cobertura:** 395 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 39 cartões em 186/186 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 25 cartões em 113/113 linhas; 31 dias, 28 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 1.148 cartões em 96/96 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-04

- **Observação:** segmento geral com 1.227 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-04-01 e 2026-04-30, em 30 dias distintos.
- **Cobertura:** 407 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 57 cartões em 176/176 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 38 cartões em 127/127 linhas; 30 dias, 4 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 1.132 cartões em 104/104 linhas; 30 dias, 4 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-05

- **Observação:** segmento geral com 1.119 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-05-01 e 2026-05-31, em 31 dias distintos.
- **Cobertura:** 464 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 50 cartões em 177/177 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 44 cartões em 131/132 linhas; 31 dias, 18 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 1.025 cartões em 155/155 linhas; 31 dias, 44 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-06

- **Observação:** segmento geral com 1.092 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-06-01 e 2026-06-30, em 30 dias distintos.
- **Cobertura:** 645 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 58 cartões em 158/158 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 147 cartões em 203/212 linhas; 30 dias, 127 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 887 cartões em 264/275 linhas; 30 dias, 181 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-07

- **Observação:** segmento geral com 1.052 cartões observados; 4 classificações de parceiro registradas; registros entre 2026-07-01 e 2026-07-31, em 31 dias distintos.
- **Cobertura:** 512 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 0 cartões em 6/6 linhas; 5 dias, 1 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 99 cartões em 185/185 linhas; 31 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 14 cartões em 130/130 linhas; 31 dias, 24 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 939 cartões em 191/191 linhas; 31 dias, 30 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-08

- **Observação:** segmento geral com 1.049 cartões observados; 4 classificações de parceiro registradas; registros entre 2026-08-01 e 2026-08-31, em 31 dias distintos.
- **Cobertura:** 520 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 1 cartões em 38/38 linhas; 22 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 53 cartões em 138/138 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 54 cartões em 168/168 linhas; 31 dias, 3 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 941 cartões em 176/176 linhas; 31 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-09

- **Observação:** segmento geral com 912 cartões observados; 4 classificações de parceiro registradas; registros entre 2026-09-01 e 2026-09-30, em 30 dias distintos.
- **Cobertura:** 379 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 0 cartões em 56/56 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 9 cartões em 79/79 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 20 cartões em 116/123 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 883 cartões em 121/121 linhas; 30 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das cinco notas de assunto, uma por parceiro, mais a lista do antigo hub do segmento.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-3bd920ad5c]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-c063e536a7]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-2cc364c6bd]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-f9b25b84df]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-bdc57e480d]] | Escopo candidato de operação | activities |

### Serasa (B2C), CRM-f9b25b84df

#### O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Serasa |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Abandonados D-21 A D>7", "Abandonados D-7", "Diario"] |
| channels | ["Push", "SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-63eed11f97 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 3 |
| CAMP-8114b31d60 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-05 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-d9ec225c59 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26 | 2026-06 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-9a0a3aabaf | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_MAIO26 | 2026-05 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-68247c788e | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-c246705237 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 2 |
| CAMP-11484c8fd1 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 3 |
| CAMP-8498477f34 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-fe8a6c8421 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Reativacao | Abandonados D-7 | 4 |
| CAMP-d2ab5e1b95 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Reativacao | Abandonados D-7 | 2 |
| CAMP-fb7106b985 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 06/26 | Reativacao | Abandonados D-7 | 2 |
| CAMP-dbe3fd8712 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 08/26 | Reativacao | Abandonados D-7 | 3 |
| CAMP-ed2cdee207 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 2026-07 | Reativacao | Abandonados D-7 | 2 |
| CAMP-aa8bc0759c | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-04 | Reativacao | Abandonados D-7 | 1 |
| CAMP-c56a6772f0 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_MAIO26 | 2026-05 | Reativacao | Abandonados D-7 | 3 |
| CAMP-f4de043afb | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_JUN26 | 2026-06 | Reativacao | Abandonados D-7 | 1 |
| CAMP-1febe29a3c | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_MAIO26 | 2026-05 | Reativacao | Abandonados D-7 | 1 |
| CAMP-a67b0f5434 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PAD_VIBE_AGO26 | 08/26 | Reativacao | Diario | 3 |
| CAMP-6472aaac2b | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PAD_VIBE_AGO26 | 09/26 | Reativacao | Diario | 1 |
| CAMP-97ead00282 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_AGO26 | 08/26 | Reativacao | Diario | 2 |
| CAMP-0b354966c4 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 07/26 | Reativacao | Diario | 4 |
| CAMP-a9444ddc80 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 2026-07 | Reativacao | Diario | 1 |
| CAMP-c28227b68a | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_VIBE_JUL26 | 2026-07 | Reativacao | Diario | 1 |
| CAMP-a319322302 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_VIBE_MAIO26 | 05/26 | Reativacao | Diario | 1 |
| CAMP-edaa6a36e3 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_VIBE_PAD_AGO26 | 08/26 | Reativacao | Diario | 1 |
| CAMP-fe422ae6ff | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26 | 2026-05 | Reativacao | Diario | 43 |
| CAMP-b944a05608 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26 | 2026-06 | Reativacao | Diario | 35 |
| CAMP-459e0b9c41 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26 | 2026-07 | Reativacao | Diario | 3 |
| CAMP-f5d072e885 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2025-12 | Reativacao | Diario | 3 |
| CAMP-269fd029d6 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-02 | Reativacao | Diario | 8 |
| CAMP-622ba9c1f0 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-03 | Reativacao | Diario | 7 |
| CAMP-64b29f8a86 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 07/26 | Reativacao | Diario | 107 |
| CAMP-dd1af81233 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 08/26 | Reativacao | Diario | 115 |
| CAMP-55967c3a53 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-05 | Reativacao | Diario | 50 |
| CAMP-e047f740fa | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-06 | Reativacao | Diario | 236 |
| CAMP-8e19c9cf86 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-07 | Reativacao | Diario | 73 |
| CAMP-6cc1fa11ab | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 08/26 | Reativacao | Diario | 52 |
| CAMP-1524771e9d | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 09/26 | Reativacao | Diario | 120 |
| CAMP-a389ab3f36 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-02 | Reativacao | Diario | 29 |
| CAMP-8414d90d7b | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-03 | Reativacao | Diario | 86 |
| CAMP-5398e01f3f | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-04 | Reativacao | Diario | 90 |
| CAMP-daf437b0be | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-05 | Reativacao | Diario | 55 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-f9b25b84df |
| Fonte | activities |
| Linhas no corte do inventário | 1158 |
| Primeira data observada | 2025-12-11 |
| Última data observada | 2026-09-30 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Serasa|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-f9b25b84df",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Serasa — B2C",
  "family": "Carrinho abandonado",
  "bu": "B2C",
  "partner": "Serasa",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Abandonados D-21 A D>7",
    "Abandonados D-7",
    "Diario"
  ],
  "channels": [
    "Push",
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Cartao",
    "Classic"
  ],
  "credit_profiles": [
    "Mar_aberto",
    "Pre_analisado"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Padrao"
  ],
  "records": 1158,
  "first_date": "2025-12-11",
  "last_date": "2026-09-30",
  "observed_months": [
    "2025-12",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 3,
  "journey_count": 22,
  "activity_name_count": 39,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [],
  "name_signals": [
    "Copa"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Abandonados",
    "partner": "Serasa"
  }
}
```

### Proprietária (B2C), CRM-2cc364c6bd

#### O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Proprietaria |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Abandonados D-21 A D>7", "Abandonados D-7", "Diario", "N/A"] |
| channels | ["E-mail", "Push", "SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Em dobro", "N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-e7acd67ffb | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 3 |
| CAMP-438f145f50 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-05 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-e16a92976a | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26 | 2026-06 | Reativacao | Abandonados D-21 A D>7 | 7 |
| CAMP-fc2f23d165 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_MAIO26 | 2026-05 | Reativacao | Abandonados D-21 A D>7 | 3 |
| CAMP-9829796216 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 1 |
| CAMP-8745b780e0 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 2 |
| CAMP-b4917b8702 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26 | 2026-04 | Reativacao | Abandonados D-21 A D>7 | 2 |
| CAMP-6748906d25 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Reativacao | Abandonados D-21 A D>7 | 2 |
| CAMP-af9bd031dc | JOR_AQUISICAO_B2C_CARRINHO_SABADO_JAN26 | 2026-01 | Reativacao | Abandonados D-7 | 6 |
| CAMP-b96394cdc1 | JOR_AQUISICAO_B2C_CARRINHO_SABADO_JAN26 | 2026-02 | Reativacao | Abandonados D-7 | 2 |
| CAMP-eec874810f | JOR_AQUISICAO_B2C_CARRINHO_SABADO_JAN26 | 2026-03 | Reativacao | Abandonados D-7 | 1 |
| CAMP-54ef918985 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Reativacao | Abandonados D-7 | 3 |
| CAMP-9a8b1a3fe0 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Reativacao | Abandonados D-7 | 6 |
| CAMP-652b288192 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PAD_VIBE_26 | 08/26 | Reativacao | Abandonados D-7 | 1 |
| CAMP-c660f59ea3 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 06/26 | Reativacao | Abandonados D-7 | 2 |
| CAMP-94db5fd54d | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 08/26 | Reativacao | Abandonados D-7 | 3 |
| CAMP-386e4b5cfa | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_26 | 2026-07 | Reativacao | Abandonados D-7 | 2 |
| CAMP-f3eb2fa527 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_ABR26 | 2026-04 | Reativacao | Abandonados D-7 | 1 |
| CAMP-2908cc0f7e | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_COPA_MAIO26 | 2026-05 | Reativacao | Abandonados D-7 | 3 |
| CAMP-5edaf967f5 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_26 | 08/26 | Reativacao | Abandonados D-7 | 1 |
| CAMP-5560004082 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_JUN26 | 2026-06 | Reativacao | Abandonados D-7 | 1 |
| CAMP-a399e6771b | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_MAIO26 | 2026-05 | Reativacao | Abandonados D-7 | 1 |
| CAMP-3445176c13 | JOR_AQUISICAO_B2C_SABADO_SMS_A_B | 2025-08 | Reativacao | Abandonados D-7 | 7 |
| CAMP-d37d9db156 | JOR_AQUISICAO_B2C_SABADO_SMS_A_B | 2025-09 | Reativacao | Abandonados D-7 | 9 |
| CAMP-b38cee8f3a | JOR_AQUISICAO_B2C_SABADO_SMS_A_B | 2025-10 | Reativacao | Abandonados D-7 | 6 |
| CAMP-216e3b3744 | JOR_AQUISICAO_B2C_SABADO_SMS_A_B | 2025-11 | Reativacao | Abandonados D-7 | 8 |
| CAMP-b00f597f2d | JOR_AQUISICAO_B2C_SABADO_SMS_A_B | 2025-12 | Reativacao | Abandonados D-7 | 2 |
| CAMP-d281ab3f4a | JOR_AQUISICAO_B2C_SABADO_SMS_A_B: | 2025-08 | Reativacao | Abandonados D-7 | 8 |
| CAMP-4ee13fb4d0 | JOR_AQUISICAO_B2C_SABADO_SMS_A_B: | 2025-09 | Reativacao | Abandonados D-7 | 1 |
| CAMP-fb13d9d37f | JOR_AQUISICAO_B2C_SABADO_WPP_A_B | 2025-07 | Reativacao | Abandonados D-7 | 8 |
| CAMP-2b98ccc6fb | JOR_AQUISICAO_B2C_SABADO_WPP_A_B | 2025-10 | Reativacao | Abandonados D-7 | 1 |
| CAMP-394f17abb2 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PAD_VIBE_AGO26 | 08/26 | Reativacao | Diario | 12 |
| CAMP-11ecee47f9 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PAD_VIBE_AGO26 | 09/26 | Reativacao | Diario | 1 |
| CAMP-aa728aacb4 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_AGO26 | 08/26 | Reativacao | Diario | 6 |
| CAMP-710a45d4a8 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 07/26 | Reativacao | Diario | 7 |
| CAMP-6c9b1caf56 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 2026-07 | Reativacao | Diario | 1 |
| CAMP-3166ee0e20 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_VIBE_JUL26 | 2026-07 | Reativacao | Diario | 1 |
| CAMP-cc9530c4be | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_PADRAO_VIBE_MAIO26 | 05/26 | Reativacao | Diario | 1 |
| CAMP-35b2999c09 | JOR_AQUISICAO_B2C_21D_ABD_REATIVACAO_VIBE_PAD_AGO26 | 08/26 | Reativacao | Diario | 8 |
| CAMP-041eea8527 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26 | 2026-05 | Reativacao | Diario | 36 |
| CAMP-5e1ad2a281 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26 | 2026-06 | Reativacao | Diario | 24 |
| CAMP-23d832e3d3 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2025-01 | Reativacao | Diario | 1 |
| CAMP-b533b41f4f | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-02 | Reativacao | Diario | 20 |
| CAMP-9d497ee35b | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-03 | Reativacao | Diario | 63 |
| CAMP-78c2405c30 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-04 | Reativacao | Diario | 30 |
| CAMP-8b4f3297f0 | JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_VIBE_PAD_26 | 2026-05 | Reativacao | Diario | 4 |
| CAMP-d1691558aa | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 07/26 | Reativacao | Diario | 70 |
| CAMP-95a9c27bcd | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 08/26 | Reativacao | Diario | 84 |
| CAMP-86cc0266f6 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-05 | Reativacao | Diario | 32 |
| CAMP-33dddf5341 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-06 | Reativacao | Diario | 178 |
| CAMP-a6ec765cab | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_COPA_PAD_26 | 2026-07 | Reativacao | Diario | 49 |
| CAMP-e86e385972 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 08/26 | Reativacao | Diario | 50 |
| CAMP-51446dae44 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 09/26 | Reativacao | Diario | 115 |
| CAMP-9bdae8fe3f | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2025-01 | Reativacao | Diario | 31 |
| CAMP-96d8a6f99f | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2025-02 | Reativacao | Diario | 28 |
| CAMP-8d38aec9bc | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2025-03 | Reativacao | Diario | 17 |
| CAMP-a9bfd2077b | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-02 | Reativacao | Diario | 25 |
| CAMP-95755403a2 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-03 | Reativacao | Diario | 41 |
| CAMP-3c89ddc9f7 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-04 | Reativacao | Diario | 84 |
| CAMP-aee73d7d12 | JOR_AQUISICAO_B2C_CARRINHO_REATIVACAO_VIBE_PAD_26 | 2026-05 | Reativacao | Diario | 50 |
| CAMP-0c1a834f8a | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PAD_VIBE_26 | 08/26 | Reativacao | Diario | 1 |
| CAMP-2e9c6b2ed7 | JOR_AQUISICAO_B2C_SAB_ABD_REATIVACAO_PADRAO_VIBE_26 | 08/26 | Reativacao | Diario | 1 |
| CAMP-50df65a182 | JOR_AQUISICAO_TESTE_DINAMICO3 | 08/26 | Reativacao | Diario | 1 |
| CAMP-422d295dbd | JOR_AQS_B2C_PROPRI_ABD_CARRINHO21D_PADRAO_21D_SET26 |  | Reativacao | N/A | 2 |
| CAMP-25aca0f664 | JOR_AQS_B2C_PROPRI_ABD_CARRINHO21D_PADRAO_21DIAS_SET26 |  | Reativacao | N/A | 2 |
| CAMP-9bfa85ae3b | JOR_AQS_B2C_PROPRI_ABD_SABADO_PADRAO_21D_SET26 |  | Reativacao | N/A | 3 |
| CAMP-60a027adac | JOR_AQUISICAO_B2C_MEIO_FUNIL_NAMORADOS_ABANDONADOS_30D | 2025-06 | Reativacao | N/A | 1 |
| CAMP-94f54a0e8d | JOR_AQUISICAO_B2C_MEIO_FUNIL_NAMORADOS_ABANDONADOS_30D_rpk | 2025-06 | Reativacao | N/A | 1 |
| CAMP-b3d67ed65a | JOR_AQUISICAO_B2C_PESQUISA_MAIO26 | 05/26 | Reativacao | N/A | 1 |
| CAMP-ed79ea0514 | JOR_AQUISICAO_B2C_PROPRI_ABD_AQUISICAO_PADRAO_NA_NOV25 | 2025-11 | Reativacao | N/A | 1 |
| CAMP-b5b1b243eb | JOR_AQUISICAO_B2C_PROPRI_ABD_AQUISICAO_PADRAO_NA_OUT25 | 2025-10 | Reativacao | N/A | 4 |
| CAMP-eebd5b3134 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_DEZ25 | 2025-12 | Reativacao | N/A | 1 |
| CAMP-5f4517a034 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_JAN26 | 2026-01 | Reativacao | N/A | 1 |
| CAMP-73357d322a | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Reativacao | N/A | 1 |
| CAMP-b5af3bf368 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_FEV26 | 2026-02 | Reativacao | N/A | 4 |
| CAMP-071fc0c732 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_NOV25 | 2025-11 | Reativacao | N/A | 1 |
| CAMP-498369ae44 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Reativacao | N/A | 3 |
| CAMP-ac49694910 | JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_VIBE_DOBRO_DEZ25 | 2025-12 | Reativacao | N/A | 3 |
| CAMP-34deaefe86 | JOR_AQUISICAO_B2C_PROPRI_NGD_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Reativacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Há nomes com teste/seedlist, sem exclusão automática
- Nome de resposta/opt-out entre disparos do escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-2cc364c6bd |
| Fonte | activities |
| Linhas no corte do inventário | 1206 |
| Primeira data observada | 2025-01-01 |
| Última data observada | 2026-09-30 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Proprietaria|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-2cc364c6bd",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Proprietaria — B2C",
  "family": "Carrinho abandonado",
  "bu": "B2C",
  "partner": "Proprietaria",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Abandonados D-21 A D>7",
    "Abandonados D-7",
    "Diario",
    "N/A"
  ],
  "channels": [
    "E-mail",
    "Push",
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Cartao",
    "Classic"
  ],
  "credit_profiles": [
    "Mar_aberto",
    "N/A",
    "Pre_analisado",
    "Whitelist"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Em dobro",
    "N/A",
    "Padrao"
  ],
  "records": 1206,
  "first_date": "2025-01-01",
  "last_date": "2026-09-30",
  "observed_months": [
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-06",
    "2025-07",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 4,
  "journey_count": 44,
  "activity_name_count": 84,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [
    "Há nomes com teste/seedlist, sem exclusão automática",
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Instabilidade",
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Abandonados",
    "partner": "Proprietaria"
  }
}
```

### Plurix, CRM-bdc57e480d

#### O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | Plurix |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Abandonados D-7", "Diario", "N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-af70121328 | JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 07/26 | Reativacao | Abandonados D-7 | 2 |
| CAMP-da72d0fd5d | JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 08/26 | Reativacao | Abandonados D-7 | 3 |
| CAMP-97461dec2c | JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26 | 07/26 | Reativacao | Abandonados D-7 | 1 |
| CAMP-97a334168d | JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUN26 | 2026-07 | Reativacao | Abandonados D-7 | 2 |
| CAMP-e96f769929 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUN26 | 2026-05 | Reativacao | Abandonados D-7 | 1 |
| CAMP-f16e558ede | JOR_AQUISICAO_PLURIX_21D_ABD_REATIVACAO_PADRAO_COPA_JUL26 | 07/26 | Reativacao | Diario | 2 |
| CAMP-b9ef7428fb | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 07/26 | Reativacao | Diario | 49 |
| CAMP-2dfb70209b | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 08/26 | Reativacao | Diario | 80 |
| CAMP-c24d0b1d0e | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 09/26 | Reativacao | Diario | 51 |
| CAMP-a4cea8d404 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2025-09 | Reativacao | Diario | 30 |
| CAMP-434d2d3e7c | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2025-10 | Reativacao | Diario | 93 |
| CAMP-9c4ba66e4a | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2025-11 | Reativacao | Diario | 90 |
| CAMP-e74bdde14c | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2025-12 | Reativacao | Diario | 93 |
| CAMP-38d9269dc7 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-01 | Reativacao | Diario | 93 |
| CAMP-eb9e2457c5 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-02 | Reativacao | Diario | 84 |
| CAMP-a4ca7bf488 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-03 | Reativacao | Diario | 93 |
| CAMP-0195a91495 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-04 | Reativacao | Diario | 86 |
| CAMP-530ebb27d9 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-05 | Reativacao | Diario | 85 |
| CAMP-c13d07b84a | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-06 | Reativacao | Diario | 84 |
| CAMP-a1cae6f155 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_ASSISTIDO | 2026-07 | Reativacao | Diario | 36 |
| CAMP-407478db97 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2025-09 | Reativacao | Diario | 32 |
| CAMP-37ca0da316 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2025-10 | Reativacao | Diario | 93 |
| CAMP-06c5d6c627 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2025-11 | Reativacao | Diario | 90 |
| CAMP-4ad189eb08 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2025-12 | Reativacao | Diario | 93 |
| CAMP-64fdeb3e18 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-01 | Reativacao | Diario | 93 |
| CAMP-fc85cbd238 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-02 | Reativacao | Diario | 84 |
| CAMP-fe109ac148 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-03 | Reativacao | Diario | 93 |
| CAMP-fa48a1460e | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-04 | Reativacao | Diario | 90 |
| CAMP-5ad2dbb2e5 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-05 | Reativacao | Diario | 91 |
| CAMP-f96701fc00 | JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE | 2026-06 | Reativacao | Diario | 55 |
| CAMP-ff7b2d8497 | JOR_AQUISICAO_PLURIX_CARRINHO_REATIVACAO_PAD_PAD_26 | 08/26 | Reativacao | Diario | 4 |
| CAMP-55d6ae1e9f | JOR_AQUISICAO_PLURIX_CARRINHO_REATIVACAO_PAD_PAD_26 | 09/26 | Reativacao | Diario | 28 |
| CAMP-80dfce7d68 | JOR_AQUISICAO_PLURIX_NA_ABD_AQUISICAO_COPA_IND_26 | 07/26 | Reativacao | Diario | 54 |
| CAMP-a2c61cb43d | JOR_AQUISICAO_PLURIX_NA_ABD_AQUISICAO_COPA_IND_26 | 08/26 | Reativacao | Diario | 51 |
| CAMP-be1d800bf4 | JOR_AQUISICAO_PLURIX_NA_ABD_AQUISICAO_COPA_IND_26 | 2026-06 | Reativacao | Diario | 19 |
| CAMP-13ec994762 | JOR_AQUISICAO_PLURIX_NA_ABD_AQUISICAO_COPA_IND_26 | 2026-07 | Reativacao | Diario | 39 |
| CAMP-988d1c8dc9 | JOR_AQUISICAO_CARRINHO_PLURIX_ | 2025-08 | Reativacao | N/A | 1 |
| CAMP-e4bfe0e8f2 | JOR_AQUISICAO_CARRINHO_PLURIX_+AMIGO_AGOSTO | 2025-08 | Reativacao | N/A | 1 |
| CAMP-06b808cc93 | JOR_AQUISICAO_CARRINHO_PLURIX_+AMIGO_JULHO | 2025-07 | Reativacao | N/A | 1 |
| CAMP-c72ae926b8 | JOR_AQUISICAO_CARRINHO_PLURIX_+AMIGO_JUNHO | 2025-06 | Reativacao | N/A | 1 |
| CAMP-77f311348e | JOR_AQUISICAO_CARRINHO_PLURIX_+AMIGO_JUNHO_2 | 2025-06 | Reativacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-bdc57e480d |
| Fonte | activities |
| Linhas no corte do inventário | 2072 |
| Primeira data observada | 2025-06-06 |
| Última data observada | 2026-09-30 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-bdc57e480d",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Plurix — Plurix",
  "family": "Carrinho abandonado",
  "bu": "Plurix",
  "partner": "Plurix",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Abandonados D-7",
    "Diario",
    "N/A"
  ],
  "channels": [
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Cartao",
    "Classic"
  ],
  "credit_profiles": [
    "Mar_aberto",
    "Pre_analisado"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "N/A",
    "Padrao"
  ],
  "records": 2072,
  "first_date": "2025-06-06",
  "last_date": "2026-09-30",
  "observed_months": [
    "2025-06",
    "2025-07",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 3,
  "journey_count": 12,
  "activity_name_count": 18,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [
    "Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia"
  ],
  "name_signals": [
    "Copa"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Abandonados",
    "partner": "Plurix"
  }
}
```

### Bem Barato (B2B2C), CRM-3bd920ad5c

#### O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Diario"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-7e20e1de97 | JOR_AQUISICAO_B2B2C_BB_CARRINHO_REATIVACAO_COPA_PAD_26 | 07/26 | Reativacao | Diario | 6 |
| CAMP-87fdcdc149 | JOR_AQUISICAO_B2B2C_BB_CARRINHO_REATIVACAO_COPA_PAD_26 | 08/26 | Reativacao | Diario | 13 |
| CAMP-5b57b51f27 | JOR_AQUISICAO_BB_CARRINHO_REATIVACAO_VIBE_PAD_26 | 08/26 | Reativacao | Diario | 25 |
| CAMP-2c13cb304e | JOR_AQUISICAO_BB_CARRINHO_REATIVACAO_VIBE_PAD_26 | 09/26 | Reativacao | Diario | 56 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Nome de resposta/opt-out entre disparos do escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-3bd920ad5c |
| Fonte | activities |
| Linhas no corte do inventário | 100 |
| Primeira data observada | 2026-07-27 |
| Última data observada | 2026-09-30 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-3bd920ad5c",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Bem Barato — B2B2C",
  "family": "Carrinho abandonado",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Diario"
  ],
  "channels": [
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Cartao"
  ],
  "credit_profiles": [
    "Mar_aberto"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Padrao"
  ],
  "records": 100,
  "first_date": "2026-07-27",
  "last_date": "2026-09-30",
  "observed_months": [
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 1,
  "journey_count": 2,
  "activity_name_count": 8,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Abandonados",
    "partner": "Bem Barato"
  }
}
```

### Dia (B2B2C), CRM-c063e536a7

#### O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Dia |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Diario"] |
| channels | ["WhatsApp"] |
| products | ["Cartao"] |
| offers | ["Vibe"] |
| promotions | ["Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-7009d18f33 | JOR_AQUISICAO_B2B2C_DIA_ABANDONADOS_JULHO | 07/25 | Reativacao | Diario | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-c063e536a7 |
| Fonte | activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2025-07-25 |
| Última data observada | 2025-07-25 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Dia|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-c063e536a7",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Dia — B2B2C",
  "family": "Carrinho abandonado",
  "bu": "B2B2C",
  "partner": "Dia",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Diario"
  ],
  "channels": [
    "WhatsApp"
  ],
  "products": [
    "Cartao"
  ],
  "credit_profiles": [
    "Mar_aberto"
  ],
  "offers": [
    "Vibe"
  ],
  "promotions": [
    "Padrao"
  ],
  "records": 1,
  "first_date": "2025-07-25",
  "last_date": "2025-07-25",
  "observed_months": [
    "2025-07"
  ],
  "physical_combinations": 1,
  "journey_count": 1,
  "activity_name_count": 1,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [],
  "name_signals": [],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Abandonados",
    "partner": "Dia"
  }
}
```
