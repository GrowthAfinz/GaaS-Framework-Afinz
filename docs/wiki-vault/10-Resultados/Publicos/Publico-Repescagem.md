---
title: "Repescagem"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Negados
aliases: [Repescagem, Negados, NGD, Segunda chance]
etapa_funil: Meio_de_Funil
bus: [B2C, Plurix, B2B2C]
parceiros_ativos: [Proprietaria, Plurix, Bem Barato]
canais: [WhatsApp, SMS, E-mail]
status: ativo
atualizado: 2026-10-29
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Negados"}
analytics: {"domain": "crm", "scope": {"segment": "Negados"}}
variantes: [{"operation_id": "CRM-89856bcf7b", "bu": "B2C", "partner": "Proprietaria"}, {"operation_id": "CRM-92fbd40403", "bu": "Plurix", "partner": "Plurix"}, {"operation_id": "CRM-e3353b859a", "bu": "B2B2C", "partner": "Bem Barato"}, {"operation_id": "CRM-24693c62ef", "bu": "B2B2C", "partner": "Dia"}]
---

# Repescagem

## Em uma frase

Dar uma segunda chance a quem pediu o cartão, foi negado e, depois de uma nova análise de crédito, recebeu um limite pré-aprovado.

**Definição:** a **campanha-tipo de segunda chance** — reabordar quem fez uma proposta, não foi aprovado naquele momento e depois **já passou por uma nova análise de crédito**, recebendo inclusive um limite pré-aprovado.

Nos dados, é o segmento `Negados`, com etapa `Meio_de_Funil`. Em volume de cartões, é o segundo público do CRM, logo atrás do carrinho abandonado.

## Principais números: média de jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Negados`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados), não média de taxas.

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 25 | 41.205 | 1.162 | 1.028 | 666 | 1,6% | 64,8% | R$ 16.283,34 | R$ 24,45 |
| ago/2026 | 28 | 92.201 | 2.357 | 2.016 | 1.326 | 1,4% | 65,8% | R$ 23.571,29 | R$ 17,78 |
| set/2026 | 202 | 47.742 | 1.930 | 1.800 | 1.088 | 2,3% | 60,4% | R$ 16.528,45 | R$ 15,19 |
| **Média mensal** | **85** | **60.383** | **1.816** | **1.615** | **1.027** | **1,7%** | **63,6%** | **R$ 18.794,36** | **R$ 18,31** |
| Total do período | 255 | 181.148 | 5.449 | 4.844 | 3.080 | 1,7% | 63,6% | R$ 56.383,08 | R$ 18,31 |

Por parceiro, no trimestre:

| Parceiro | BU | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão | Finalização | Custo | CAC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Proprietária | B2C | 185 | 136.242 | 3.918 | 3.655 | 2.182 | 1,6% | 59,7% | R$ 42.283,83 | R$ 19,38 |
| Plurix | Plurix | 24 | 35.002 | 979 | 860 | 673 | 1,9% | 78,3% | R$ 11.498,63 | R$ 17,09 |
| Bem Barato | B2B2C | 46 | 9.904 | 552 | 329 | 225 | 2,3% | 68,4% | R$ 2.600,62 | R$ 11,56 |

Como ler:
- **Uma média de ~1.030 cartões por mês, a CAC de R$ 18,31**, e a CAC caiu mês a mês: R$ 24,45 em julho, R$ 17,78 em agosto e R$ 15,19 em setembro.
- **O gargalo está antes da proposta.** Só 3% da base acionável vira proposta (5.449 de 181.148), mas 63,6% dos aprovados viram cartão.
- **A Proprietária faz 71% dos cartões** (2.182 de 3.080). O Bem Barato tem a menor CAC (R$ 11,56) e a Plurix a maior finalização (78,3%).
- Setembro tem 202 linhas contra 25 e 28 em julho e agosto, com base menor que a de agosto. A forma de registrar os disparos mudou ou a régua ganhou toques: não comparar "disparos" entre esses meses sem conferir.

## Por que esse público importa

É o melhor argumento para mídia paga coordenada: a base de Negados no Meta (230k+) está congelada há 13 meses enquanto o CRM trabalha o segmento toda safra — sincronizar diariamente fecha esse vão. Timing importa: reabordar perto da reavaliação de crédito ([[Perfis-de-Crédito]]).

Na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]], o primeiro disparo da repescagem da Proprietária em set/2026 fez 435 cartões, com CAC de R$ 8,96 e 4,3% de conversão; os disparos seguintes rendem bem menos (em agosto, WhatsApp com Vibe teve CAC de R$ 49,90 e SMS, R$ 27,10).

## Pra quem é e quando entra

A pessoa fez uma proposta, foi negada naquele momento e já passou por uma nova análise de crédito antes de entrar na régua. O estado real do cliente e a regra de comunicação:

### Estado real do cliente e regra de comunicação

- A nova análise de crédito já aconteceu antes da entrada na campanha; a copy pode dizer **"pré-aprovado"** e, quando disponível, informar o limite verdadeiro da pessoa.
- A conclusão ainda depende da jornada final, especialmente da validação antifraude/biometria. Uma biometria inválida pode impedir a emissão mesmo com limite pré-aprovado.
- Por isso, **"sujeito à análise de crédito" continua obrigatório**: é a ressalva operacional adotada pela Afinz para uma aprovação com probabilidade muito alta, mas ainda não irrevogável.
- O texto não deve relembrar a negativa anterior. A narrativa começa na nova oportunidade: limite pré-aprovado + continuidade do pedido.
- CTA recomendado: **"Peça seu cartão"** ou equivalente de continuidade, sem prometer emissão garantida.

Como o público aparece em cada sistema:

| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Negados` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `REPESCAGEM B2C/PLURIX` |
| Meta hoje | `AFINZ_Negados_Orgânicos_21_05_2025` (230–271k, congelada), `AFINZ_Repescagem_Niver_A/B` (~1k, out/25), `AFINZ_Serasa_Repescagem_05_05_2025` |
| Audiência proposta | `crm_b2c_repescagem_daily` · `crm_plurix_repescagem_daily` |
| AppsFlyer | `af_adset=negados` |

## Regra original (jan/2026) e o que a operação mostra hoje

A régua nasceu da [[05-Estrategia/Estrategia-Bases-Segmentadas-Original-2026-01|planilha de bases segmentadas]] (criada em 03/2025, revista em 01/2026). Status: "Feito". A planilha já pedia "validar se a hipótese é válida enquanto não temos swapin".

| Ponto | Regra original (jan/2026) | O que a operação mostra hoje |
|---|---|---|
| Quem entra | Negado no crédito. B2C: últimos 6 meses. B2B2C: negados há mais de 6 meses (o Racional escreve "6 a 12 meses+") | Mesmo público, nas três BUs (B2C, Plurix e Bem Barato) |
| Quem sai | Celular repetido | Sem medida em `activities` |
| Pré-análise | Sim; só pré-aprovados, com a informação do novo limite | Sem mudança registrada |
| Base nova | Mensal | 59 dos 92 dias com disparo (cerca de 4,5 por semana), em 15 jornadas |
| Duração e ritmo | 15 dias, 2 ativações por semana | 255 disparos no trimestre |
| Canais | WhatsApp, E-mail e SMS | WhatsApp em 248 disparos, SMS em 7, **nenhum e-mail** |
| Subgrupo | Não previsto | Em setembro, 144 disparos foram gravados como `Abandonados D-21 A D>7`. É herança errada do importador |
| A hipótese | Validar se negado reabordado converte | Validada: entre os públicos de aquisição, é o segundo que mais gera cartão no trimestre (3.080), quase empatado com o carrinho (3.286) |

Por canal, no trimestre:

| Canal | Disparos | Base acionável | Cartões | Conversão |
|---|---:|---:|---:|---:|
| WhatsApp | 248 | 147.276 | 2.935 | 1,99% |
| SMS | 7 | 33.872 | 145 | 0,43% |

O que fica de leitura:

- **A hipótese da planilha se confirmou.** Repescagem deixou de ser aposta e virou volume.
- **O e-mail saiu da régua**, como no upgrade. Vale testar de novo como apoio barato ao WhatsApp.

Operação medida em `activities` em 29/10/2026, de 01/07 a 30/09/2026. Conversão aqui é cartões ÷ base acionável. "Dias com disparo" conta os dias com pelo menos um disparo do público, em qualquer jornada: mede o ritmo da operação, não quantas mensagens cada cliente recebe.

## Régua

Padrão observado na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]]: entrada pela DE `DE_JORNADA_UNIFICADA_*` com 5 exclusões, decisão por `MES_REF` e `CAMPANHA`, às vezes um split 50/50 com 1 dia de espera, template de WhatsApp aprovado na Meta e espera de 2 dias pela resposta. Quem responde "Não tenho interesse agora" vira exclusão (`sem_interesse.resposta`, por exemplo "ngd DDMM b2c"). Há também a versão em SMS, pelo número 29776, com a mesma entrada.
No Bem Barato, as primeiras peças reais de CRM (WhatsApp `repescagem_bb_vibe_1/2`) apareceram no pacote SFMC de 07/10/2026 ([[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Bem-Mais-Afinz-Visa|Cartão Bem Mais]]). Respostas de opt-out são tratadas em [[04-Operacao/WhatsApp-Respostas-de-Opt-out|respostas de opt-out]].

## O que pode e não pode dizer

Pode dizer "pré-aprovado" e o limite verdadeiro, mas "sujeito à análise de crédito" continua obrigatório, e a mensagem não relembra a negativa (regra completa em Pra quem é).
A [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]] marcou como risco alto nas mensagens de repescagem: "aproveite antes que essa oferta expire" e "últimos dias" (disparo 3), sorteio de R$ 100 mil (regulamento expirado em 11/05/2026), SMS sem "sujeito à análise de crédito" e "cartão virtual para usar na hora" (disparos 4 e 6). Erro confirmado: no disparo 6 da repescagem B2C (30/09), `%%FirstName%%` e `%%State%%` apareceram no lugar de nome e limite.
Antes de escrever, conferir [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como medir sem cair em armadilha

- Repescagem é `Negados` com `Meio_de_Funil`, sem subgrupo. Não inferir que houve nova análise só porque a pessoa está no histórico de Negados.
- A mensagem de Upgrade `menor` reaproveita textos da Repescagem: o segmento da execução decide onde o resultado entra, não o texto ([[04-Operacao/SFMC-Packs-Fluxos-Vinculos-e-Aprendizados|Packs SFMC]]).
- Nos templates, o público aparece como `neg` ou `ngd`; no `af_sub3`, `Negados` vira `ngd` ([[04-Operacao/AppsFlyer-Tracking-CRM|AppsFlyer]]).
- As jornadas de repescagem do Bem Barato de setembro não estavam em `activities` na auditoria de outubro: o resultado do Bem Barato pode estar subestimado.
- Os alertas de reidratação já mostraram conversões muito diferentes para o mesmo segmento (16,7% num método, 84,2% em outro). Sempre dizer qual divisão está sendo usada.
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o público inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Registro do inventário de 03/10/2026 (linhas e período observados naquela data). Os números do trimestre estão em Principais números, acima.

| Variante | BU | Parceiro | Subgrupos | Canais | Linhas no inventário | Período observado | Situação |
|---|---|---|---|---|---:|---|---|
| Repescagem candidata | B2C | Proprietaria | N/A | E-mail, SMS, WhatsApp | 252 | 20/01/2025 a 23/09/2026 | candidata |
| Repescagem candidata | Plurix | Plurix | N/A | SMS, WhatsApp | 49 | 23/09/2025 a 09/09/2026 | operação confirmada em 28/10/2026 |
| Repescagem candidata | B2B2C | Bem Barato | N/A | SMS, WhatsApp | 13 | 18/05/2026 a 31/08/2026 | candidata |
| Repescagem candidata | B2B2C | Dia | N/A | WhatsApp | 2 | 18/09/2025 a 23/09/2025 | candidata |

Resultado ao vivo de cada combinação, enquanto o filtro por parceiro dentro desta página não fica pronto: [[07-Evolucao/Assunto-CRM-89856bcf7b|Proprietaria]] · [[07-Evolucao/Assunto-CRM-92fbd40403|Plurix]] · [[07-Evolucao/Assunto-CRM-e3353b859a|Bem Barato]] · [[07-Evolucao/Assunto-CRM-24693c62ef|Dia]].

Visão de cada parceiro: [[10-Resultados/Parceiros/Proprietaria|Proprietária]] · [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]] · [[10-Resultados/Parceiros/Dia|Dia]]

## O que já aprendemos

- No Bem Barato, em ago/2026, SMS rendeu mais que WhatsApp: 45 cartões com CAC de R$ 4,76 contra 31 cartões com CAC de R$ 17,40.
- Na Proprietária, o primeiro toque concentra o resultado (435 cartões no disparo 1 de setembro); os toques finais custam bem mais por cartão.
- Hipótese registrada, não testada: concentrar a repescagem entre D0 e D3 depois do `MES_REF` e reduzir os toques finais.

Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Vale cortar os toques finais da régua? | pode baixar a CAC sem perder cartão | teste com grupo de controle por número de toques | a confirmar |
| Repescagem do Bem Barato de set/2026 ausente em `activities` | resultado do parceiro subestimado | conferir ingestão das jornadas NGD de setembro | a confirmar |
| Audiência de Negados no Meta (230 mil) congelada desde 21/05/2025 | mídia não acompanha a régua | estado do pipeline diário de audiências | a confirmar |
| O erro de `%%FirstName%%` e `%%State%%` do disparo 6 foi corrigido? | mensagem quebrada para o cliente | Test Send da jornada atual | operador SFMC |
| Reanálise e elegibilidade de cada variante | pertencimento ainda candidato em 3 das 4 variantes | definição e execução de cada jornada | a confirmar |

## Onde mais este público aparece

Estas notas tratam de outros assuntos e também falam deste público. Elas continuam no lugar:

- [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]]: padrões de jornada, mensagens e resultado por parceiro.
- [[04-Operacao/WhatsApp-Respostas-de-Opt-out|Respostas de opt-out no WhatsApp]] e [[08-Engenharia/Importador-Segmentacao-Aquisicao-2026-10|Importador de segmentação]].
- [[04-Operacao/SFMC-Packs-Fluxos-Vinculos-e-Aprendizados|Packs SFMC]] e [[04-Operacao/SFMC-Package-Manager-e-Pacotes|Package Manager]].
- [[01-Conceitos/Plataformas-de-Comunicação|Plataformas de comunicação]] e [[05-Estrategia/Ativacao-de-Audiencias-Diaria|Ativação diária de audiências]].
- [[04-Operacao/Emails-Dinamicos-SFMC|E-mails dinâmicos]]: jornada de teste que só aceita `TP_CAMPANHA = Repescagem`.
- [[09-Inteligencia-IA/Reidratacao-Alerts-Vivo|Alertas de reidratação]] e [[01-Conceitos/Funil-AARRR|Funil AARRR]].

## Relacionado

- [[Plataformas-de-Comunicação]] · [[Topo-de-Funil]] · [[Upgrade]] · [[Segmentos]] · [[Ativacao-de-Audiencias-Diaria]] · [[Performance-por-Segmento]]

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes.

### Nota de conceito, 10/06/2026

> 📊 Snapshot 2026-06-10. **Conversão 16,7% (5x o topo), CAC R$ 39** — converte muito bem, mas caro. Canal núcleo: **WhatsApp** (98 disparos/3.146 cartões); SMS e E-mail secundários. 199 disparos no total — bloco **subescalado** vs potencial.

### Dimensão Segmentos, 08 a 10/06/2026

| Segmento | Etapa | Disparos | Conversão | CAC |
|---|---|---|---|---|
| Negados | Meio funil | 199 | **16,7%** | R$ 39,04 |

### Performance por segmento, 10/06/2026

| Segmento | Conversão | CAC | Leitura |
|---|---|---|---|
| Negados | 16,7% | R$ 39,04 | converte bem, CAC alto |

### Dossiê Mestre, baseline de 08/06/2026

| Segmento | Conversão | CAC | Papel |
|---|---:|---:|---|
| Negados | 23,6% | R$ 40,74 | resultado relevante, eficiência crítica |

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Negados`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Negados`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-01 | 5 | 4 | 311 | 5/5 | 708 | 5/5 | 0 | [[#Retrospectiva 2025-01|ler junto]] |
| 2025-05 | 4 | 3 | 577 | 4/4 | 2.294 | 4/4 | 2 | [[#Retrospectiva 2025-05|ler junto]] |
| 2025-06 | 3 | 3 | 77 | 3/3 | 179 | 3/3 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-08 | 1 | 1 | 214 | 1/1 | 370 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | 9 | 7 | 319 | 9/9 | 710 | 9/9 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | 35 | 12 | 347 | 35/35 | 797 | 32/35 | 2 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | 10 | 9 | 146 | 10/10 | 505 | 10/10 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | 7 | 5 | 3 | 7/7 | 23 | 5/7 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | 22 | 14 | 925 | 22/22 | 2.090 | 20/22 | 2 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | 9 | 5 | 277 | 9/9 | 527 | 7/9 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | 10 | 5 | 187 | 10/10 | 315 | 10/10 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | 35 | 14 | 1.214 | 35/35 | 2.111 | 33/35 | 4 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | 48 | 21 | 219 | 48/48 | 542 | 36/48 | 8 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | 50 | 24 | 1.320 | 41/50 | 2.028 | 41/50 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | 25 | 13 | 666 | 25/25 | 1.162 | 25/25 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | 28 | 16 | 1.326 | 28/28 | 2.357 | 28/28 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | 15 | 12 | 441 | 5/15 | 657 | 5/15 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2025-01 | Proprietaria | 5 | 4 | 311 | 5/5 | 0 | [[#Retrospectiva 2025-01|ler junto]] |
| 2025-05 | Proprietaria | 4 | 3 | 577 | 4/4 | 2 | [[#Retrospectiva 2025-05|ler junto]] |
| 2025-06 | Proprietaria | 3 | 3 | 77 | 3/3 | 0 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-08 | Proprietaria | 1 | 1 | 214 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | Dia | 2 | 2 | 39 | 2/2 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-09 | Plurix | 2 | 2 | 75 | 2/2 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-09 | Proprietaria | 5 | 5 | 205 | 5/5 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | Plurix | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-10 | Proprietaria | 34 | 12 | 347 | 34/34 | 2 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | Plurix | 1 | 1 | 114 | 1/1 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-11 | Proprietaria | 9 | 8 | 32 | 9/9 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | Plurix | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2025-12 | Proprietaria | 6 | 4 | 3 | 6/6 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | Plurix | 2 | 2 | 37 | 2/2 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-01 | Proprietaria | 20 | 13 | 888 | 20/20 | 2 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | Plurix | 4 | 3 | 52 | 4/4 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-02 | Proprietaria | 5 | 4 | 225 | 5/5 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | Plurix | 2 | 2 | 116 | 2/2 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-03 | Proprietaria | 8 | 5 | 71 | 8/8 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | Plurix | 10 | 9 | 357 | 10/10 | 2 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | Proprietaria | 25 | 13 | 857 | 25/25 | 2 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | Bem Barato | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Plurix | 4 | 4 | 79 | 4/4 | 0 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Proprietaria | 43 | 21 | 140 | 43/43 | 8 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | Plurix | 4 | 3 | 553 | 4/4 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-06 | Proprietaria | 46 | 24 | 767 | 37/46 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | Bem Barato | 6 | 6 | 61 | 6/6 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Plurix | 6 | 6 | 194 | 6/6 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Proprietaria | 13 | 12 | 411 | 13/13 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | Bem Barato | 6 | 6 | 86 | 6/6 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Plurix | 10 | 10 | 403 | 10/10 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Proprietaria | 12 | 12 | 837 | 12/12 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | Plurix | 2 | 2 | 6 | 2/2 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-09 | Proprietaria | 13 | 12 | 435 | 3/13 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2025-01

- **Observação:** segmento geral com 311 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-01-20 e 2025-01-23, em 4 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 311 cartões em 5/5 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-05

- **Observação:** segmento geral com 577 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-05-19 e 2025-05-29, em 3 dias distintos.
- **Cobertura:** 4 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 577 cartões em 4/4 linhas; 3 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-06

- **Observação:** segmento geral com 77 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-06-02 e 2025-06-30, em 3 dias distintos.
- **Cobertura:** 3 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 77 cartões em 3/3 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-08

- **Observação:** segmento geral com 214 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-08-29 e 2025-08-29, em 1 dias distintos.
- **Cobertura:** 1 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 214 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-09

- **Observação:** segmento geral com 319 cartões observados; 3 classificações de parceiro registradas; registros entre 2025-09-01 e 2025-09-25, em 7 dias distintos.
- **Cobertura:** 9 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Dia:** 39 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 75 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 205 cartões em 5/5 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-10

- **Observação:** segmento geral com 347 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-10-01 e 2025-10-31, em 12 dias distintos.
- **Cobertura:** 35 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 347 cartões em 34/34 linhas; 12 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-11

- **Observação:** segmento geral com 146 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-11-04 e 2025-11-28, em 9 dias distintos.
- **Cobertura:** 10 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 114 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 32 cartões em 9/9 linhas; 8 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-12

- **Observação:** segmento geral com 3 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-12-02 e 2025-12-20, em 5 dias distintos.
- **Cobertura:** 7 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 3 cartões em 6/6 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-01

- **Observação:** segmento geral com 925 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-01-03 e 2026-01-29, em 14 dias distintos.
- **Cobertura:** 22 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 37 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 888 cartões em 20/20 linhas; 13 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-02

- **Observação:** segmento geral com 277 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-02-03 e 2026-02-24, em 5 dias distintos.
- **Cobertura:** 9 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 52 cartões em 4/4 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 225 cartões em 5/5 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-03

- **Observação:** segmento geral com 187 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-03-16 e 2026-03-31, em 5 dias distintos.
- **Cobertura:** 10 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 116 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 71 cartões em 8/8 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-04

- **Observação:** segmento geral com 1.214 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-04-07 e 2026-04-30, em 14 dias distintos.
- **Cobertura:** 35 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 357 cartões em 10/10 linhas; 9 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 857 cartões em 25/25 linhas; 13 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-05

- **Observação:** segmento geral com 219 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-05-05 e 2026-05-31, em 21 dias distintos.
- **Cobertura:** 48 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 79 cartões em 4/4 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 140 cartões em 43/43 linhas; 21 dias, 8 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-06

- **Observação:** segmento geral com 1.320 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-06-01 e 2026-06-29, em 24 dias distintos.
- **Cobertura:** 50 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 553 cartões em 4/4 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 767 cartões em 37/46 linhas; 24 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-07

- **Observação:** segmento geral com 666 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-07-07 e 2026-07-30, em 13 dias distintos.
- **Cobertura:** 25 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 61 cartões em 6/6 linhas; 6 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 194 cartões em 6/6 linhas; 6 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 411 cartões em 13/13 linhas; 12 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-08

- **Observação:** segmento geral com 1.326 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-08-03 e 2026-08-31, em 16 dias distintos.
- **Cobertura:** 28 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 86 cartões em 6/6 linhas; 6 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 403 cartões em 10/10 linhas; 10 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 837 cartões em 12/12 linhas; 12 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-09

- **Observação:** segmento geral com 441 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-09-08 e 2026-09-23, em 12 dias distintos.
- **Cobertura:** 15 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 6 cartões em 2/2 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 435 cartões em 3/13 linhas; 12 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das notas de assunto, uma por variante, mais a lista do antigo hub.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-e3353b859a]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-24693c62ef]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-89856bcf7b]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-92fbd40403]] | Escopo candidato de operação | activities |

### Proprietaria (B2C), CRM-89856bcf7b

#### O que este assunto representa

Reabordar após negativa anterior e nova análise já realizada.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Proprietaria |
| segment | Negados |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["E-mail", "SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["", "Padrao", "Vibe"] |
| promotions | ["", "Copa", "Em dobro", "N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-89b064c6c8 | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_JUNHO_1 | 2025-06 | Meio_de_Funil | N/A | 1 |
| CAMP-f70f0dbc8b | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_JUNHO_1_RPK | 2025-06 | Meio_de_Funil | N/A | 1 |
| CAMP-7920aaa0fc | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_MAIO | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-f1d08f83fb | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_MAIO_1 | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-f3e70b13bc | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_MAIO_1_RPK | 2025-06 | Meio_de_Funil | N/A | 1 |
| CAMP-a0754d96ea | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_MAIO_1.1 | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-e12b6bde70 | DISPARO_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_MAIO_RPK | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-127a87de8a | DISPARO_AQUISICAO_B2C_SERASA_REPESCAGEM_MEIO_FUNIL_AGOSTO | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-80d1ce0203 | DISPARO_AQUISICAO_B2C_SERASA_REPESCAGEM_MEIO_FUNIL_AGOSTO_RPK | 2025-09 | Meio_de_Funil | N/A | 1 |
| CAMP-cc7bfc6b27 | JOR_AQS_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26 |  | Meio_de_Funil | N/A | 10 |
| CAMP-e116305a46 | JOR_AQUISICAO_B2C_BPC_NGD_AQUISICAO_VIBE_NA_DEZ25 | 2025-12 | Meio_de_Funil | N/A | 6 |
| CAMP-48aa9b2c10 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_JUN26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-a0ff2a8ddf | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 23 |
| CAMP-b4a2047975 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_ABRI26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-d521531901 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 08/26 | Meio_de_Funil | N/A | 6 |
| CAMP-a4d785a43a | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 07/26 | Meio_de_Funil | N/A | 11 |
| CAMP-e420d316d5 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 2026-07 | Meio_de_Funil | N/A | 2 |
| CAMP-04a9b7e149 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUN26 | 2026-05 | Meio_de_Funil | N/A | 6 |
| CAMP-6d2a02d50b | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_JUN26 | 2026-06 | Meio_de_Funil | N/A | 33 |
| CAMP-315695044f | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 32 |
| CAMP-1b3385ea6b | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_COPA_PAD_MAIO26 | 2026-06 | Meio_de_Funil | N/A | 13 |
| CAMP-d0673d04f4 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_AGO26 | 08/26 | Meio_de_Funil | N/A | 6 |
| CAMP-a1c1d595f0 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26 | 09/26 | Meio_de_Funil | N/A | 3 |
| CAMP-e84bd152ed | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_VIBE_PAD_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 2 |
| CAMP-06a7f7c492 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_VIBE_PAD_FEV26 | 2026-01 | Meio_de_Funil | N/A | 1 |
| CAMP-6378dec0ae | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_VIBE_PAD_FEV26 | 2026-02 | Meio_de_Funil | N/A | 5 |
| CAMP-705b7c9728 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_VIBE_PAD_JAN26 | 2026-01 | Meio_de_Funil | N/A | 18 |
| CAMP-4f4f4777e1 | JOR_AQUISICAO_B2C_NA_NGD_MEIO_DE_FUNIL_VIBE_PAD_MAR26 | 2026-03 | Meio_de_Funil | N/A | 8 |
| CAMP-e45d96aaa7 | JOR_AQUISICAO_B2C_PESQUISA_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 3 |
| CAMP-2bb5a2eb3f | JOR_AQUISICAO_B2C_PROPRI_ANC_MEIO_DE_FUNIL_VIBE_DOBRO1.1_OUT25 | 2025-10 | Meio_de_Funil | N/A | 5 |
| CAMP-c5df8867ed | JOR_AQUISICAO_B2C_PROPRI_BP_AQUISICAO_PADRAO_NA_OUT25 | 2025-11 | Meio_de_Funil | N/A | 1 |
| CAMP-0d5cf1cdb4 | JOR_AQUISICAO_B2C_PROPRI_NGD_MEIO_DE_FUNIL_PADRAO_DOBRO_OUT25 | 2025-10 | Meio_de_Funil | N/A | 1 |
| CAMP-768a976ad6 | JOR_AQUISICAO_B2C_PROPRI_NGD_MEIO_DE_FUNIL_PADRAO_NA_NOV25 | 2025-11 | Meio_de_Funil | N/A | 8 |
| CAMP-75bb01b2ca | JOR_AQUISICAO_B2C_PROPRI_NGD_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Meio_de_Funil | N/A | 6 |
| CAMP-d38e5fcc2a | JOR_AQUISICAO_B2C_PROPRI_NGD_MEIO_DE_FUNIL_VIBE_PAD_JAN26 | 2026-01 | Meio_de_Funil | N/A | 1 |
| CAMP-7d3376634f | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_OUTUBRO_NIVER | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-c54dfd56fa | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_OUTUBRO_NIVER_3 | 10/25 | Meio_de_Funil | N/A | 1 |
| CAMP-8d59db4077 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_OUTUBRO_NIVER_3 | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-d210767aa2 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_OUTUBRO_POS_NIVER | 2025-10 | Meio_de_Funil | N/A | 1 |
| CAMP-2ba0fe4e49 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_2 | 2025-10 | Meio_de_Funil | N/A | 4 |
| CAMP-cea52732d9 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_SMS | 10/25 | Meio_de_Funil | N/A | 2 |
| CAMP-2c127b82df | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_SMS | 2025-10 | Meio_de_Funil | N/A | 4 |
| CAMP-a414b3686d | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_SMS _2 | 10/25 | Meio_de_Funil | N/A | 1 |
| CAMP-e127727787 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_SMS _2 | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-eccb002790 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_WPP | 10/25 | Meio_de_Funil | N/A | 1 |
| CAMP-643026e9c0 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_NIVER_WPP | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-221c167c9f | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_SEMANA1 | 2025-09 | Meio_de_Funil | N/A | 3 |
| CAMP-99cd9ac2a8 | JOR_AQUISICAO_B2C_REPESCAGEM_MEIO_FUNIL_SETEMBRO_SEMANA2 | 2025-09 | Meio_de_Funil | N/A | 1 |
| CAMP-2a10e31f17 | JOR_AQUISICAO_VC_ORGANICO_042024 (Repescagem) | 2025-01 | Meio_de_Funil | N/A | 2 |
| CAMP-a438284922 | JOR_AQUISICAO_VC_REPESCAGENS | 2025-01 | Meio_de_Funil | N/A | 3 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Nome de resposta/opt-out entre disparos do escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-89856bcf7b |
| Fonte | activities |
| Linhas no corte do inventário | 252 |
| Primeira data observada | 2025-01-20 |
| Última data observada | 2026-09-23 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Repescagem|Definição relacionada]] · [[07-Evolucao/Parceiro-Proprietaria|Visão do parceiro]] · [[07-Evolucao/Segmento-Negados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-89856bcf7b",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Repescagem candidata — Proprietaria — B2C",
  "family": "Repescagem candidata",
  "bu": "B2C",
  "partner": "Proprietaria",
  "segment": "Negados",
  "stages": [
    "Meio_de_Funil"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "E-mail",
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
    "Whitelist"
  ],
  "offers": [
    "",
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "",
    "Copa",
    "Em dobro",
    "N/A",
    "Padrao"
  ],
  "records": 252,
  "first_date": "2025-01-20",
  "last_date": "2026-09-23",
  "observed_months": [
    "2025-01",
    "2025-05",
    "2025-06",
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
  "physical_combinations": 1,
  "journey_count": 41,
  "activity_name_count": 134,
  "definition": "Reabordar após negativa anterior e nova análise já realizada.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Repescagem.md",
  "validation": "Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.",
  "flags": [
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Negados",
    "partner": "Proprietaria"
  }
}
```

### Plurix (Plurix), CRM-92fbd40403

#### O que este assunto representa

Reabordar após negativa anterior e nova análise já realizada.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | Plurix |
| segment | Negados |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-2b7ea26034 | JOR_AQUISICAO_PLURIX_MEIO_FUNIL_REPESCAGEM | 2025-09 | Meio_de_Funil | N/A | 2 |
| CAMP-fea7069258 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 2 |
| CAMP-350baece73 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-02 | Meio_de_Funil | N/A | 2 |
| CAMP-6106c4914f | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_NOV25.1 | 2025-11 | Meio_de_Funil | N/A | 1 |
| CAMP-10a9cb1f0e | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PAD_PAD_AGO26 | 08/26 | Meio_de_Funil | N/A | 6 |
| CAMP-1478f6f5bb | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PAD_SET26 | 09/26 | Meio_de_Funil | N/A | 2 |
| CAMP-b4f4658075 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 7 |
| CAMP-0fa0024473 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_AGO26 | 08/26 | Meio_de_Funil | N/A | 4 |
| CAMP-02e8b93e26 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_JUL26 | 07/26 | Meio_de_Funil | N/A | 4 |
| CAMP-1884bf7d7a | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_JUL26 | 2026-07 | Meio_de_Funil | N/A | 2 |
| CAMP-75eb508611 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_JUN26 | 2026-06 | Meio_de_Funil | N/A | 4 |
| CAMP-f385085f63 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 4 |
| CAMP-356d647c16 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 1 |
| CAMP-ed41e39d38 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_DEZ25 | 2025-12 | Meio_de_Funil | N/A | 1 |
| CAMP-eeeecd6815 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_FEV26 | 2026-02 | Meio_de_Funil | N/A | 2 |
| CAMP-b8d4973e57 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_JAN26 | 2026-01 | Meio_de_Funil | N/A | 2 |
| CAMP-11b0ea3619 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Meio_de_Funil | N/A | 2 |
| CAMP-a9616bde1e | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Meio_de_Funil | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-92fbd40403 |
| Fonte | activities |
| Linhas no corte do inventário | 49 |
| Primeira data observada | 2025-09-23 |
| Última data observada | 2026-09-09 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Repescagem|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Negados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-92fbd40403",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Repescagem candidata — Plurix — Plurix",
  "family": "Repescagem candidata",
  "bu": "Plurix",
  "partner": "Plurix",
  "segment": "Negados",
  "stages": [
    "Meio_de_Funil"
  ],
  "subgroups": [
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
    "Pre_analisado",
    "Whitelist"
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
  "records": 49,
  "first_date": "2025-09-23",
  "last_date": "2026-09-09",
  "observed_months": [
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
  "physical_combinations": 1,
  "journey_count": 17,
  "activity_name_count": 28,
  "definition": "Reabordar após negativa anterior e nova análise já realizada.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Repescagem.md",
  "validation": "Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.",
  "flags": [
    "Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia"
  ],
  "name_signals": [
    "Ramo maior no nome",
    "Ramo menor no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Negados",
    "partner": "Plurix"
  }
}
```

### Bem Barato (B2B2C), CRM-e3353b859a

#### O que este assunto representa

Reabordar após negativa anterior e nova análise já realizada.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Negados |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-1535bdaf11 | JOR_AQUISICAO_B2B2C_BB_NGD_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 08/26 | Meio_de_Funil | N/A | 2 |
| CAMP-a542456031 | JOR_AQUISICAO_B2B2C_BB_NGD_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 07/26 | Meio_de_Funil | N/A | 5 |
| CAMP-6747326dae | JOR_AQUISICAO_B2B2C_BB_NGD_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 2026-07 | Meio_de_Funil | N/A | 1 |
| CAMP-6c4a161901 | JOR_AQUISICAO_B2B2C_BB_NGD_MEIO_DE_FUNIL_COPA_PAD_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-a9254d6b25 | JOR_AQUISICAO_B2B2C_BB_NGD_MEIO_DE_FUNIL_PAD_VIBE_AGO26 | 08/26 | Meio_de_Funil | N/A | 4 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-e3353b859a |
| Fonte | activities |
| Linhas no corte do inventário | 13 |
| Primeira data observada | 2026-05-18 |
| Última data observada | 2026-08-31 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Repescagem|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Negados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-e3353b859a",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Repescagem candidata — Bem Barato — B2B2C",
  "family": "Repescagem candidata",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Negados",
  "stages": [
    "Meio_de_Funil"
  ],
  "subgroups": [
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
    "Whitelist"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Padrao"
  ],
  "records": 13,
  "first_date": "2026-05-18",
  "last_date": "2026-08-31",
  "observed_months": [
    "2026-05",
    "2026-07",
    "2026-08"
  ],
  "physical_combinations": 1,
  "journey_count": 4,
  "activity_name_count": 8,
  "definition": "Reabordar após negativa anterior e nova análise já realizada.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Repescagem.md",
  "validation": "Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.",
  "flags": [],
  "name_signals": [
    "Copa"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Negados",
    "partner": "Bem Barato"
  }
}
```

### Dia (B2B2C), CRM-24693c62ef

#### O que este assunto representa

Reabordar após negativa anterior e nova análise já realizada.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Dia |
| segment | Negados |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["WhatsApp"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["N/A"] |

**O que precisa ser validado:** Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-b4b840665f | JOR_AQUISICAO_B2B2C_DIA_REPESCAGEM_MEIO_FUNIL_SETEMBRO | 2025-09 | Meio_de_Funil | N/A | 2 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-24693c62ef |
| Fonte | activities |
| Linhas no corte do inventário | 2 |
| Primeira data observada | 2025-09-18 |
| Última data observada | 2025-09-23 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Repescagem|Definição relacionada]] · [[07-Evolucao/Parceiro-Dia|Visão do parceiro]] · [[07-Evolucao/Segmento-Negados|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-24693c62ef",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Repescagem candidata — Dia — B2B2C",
  "family": "Repescagem candidata",
  "bu": "B2B2C",
  "partner": "Dia",
  "segment": "Negados",
  "stages": [
    "Meio_de_Funil"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "WhatsApp"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Pre_analisado"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "N/A"
  ],
  "records": 2,
  "first_date": "2025-09-18",
  "last_date": "2025-09-23",
  "observed_months": [
    "2025-09"
  ],
  "physical_combinations": 1,
  "journey_count": 1,
  "activity_name_count": 2,
  "definition": "Reabordar após negativa anterior e nova análise já realizada.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Repescagem.md",
  "validation": "Confirmar reanálise e elegibilidade atual; não inferir apenas do histórico Negados.",
  "flags": [],
  "name_signals": [],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Negados",
    "partner": "Dia"
  }
}
```
