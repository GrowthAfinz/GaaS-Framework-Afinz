---
title: "Upgrade (aprovados não convertidos)"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Aprovados_nao_convertidos
aliases: [Upgrade, Aprovados não convertidos, Aprovados_nao_convertidos, ANC]
etapa_funil: Meio_de_Funil
bus: [B2C, Plurix, B2B2C]
parceiros_ativos: [Proprietaria, Plurix, Bem Barato]
canais: [WhatsApp, SMS, E-mail]
status: ativo
atualizado: 2026-10-29
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Aprovados_nao_convertidos"}
analytics: {"domain": "crm", "scope": {"segment": "Aprovados_nao_convertidos"}}
variantes: [{"operation_id": "CRM-a695575900", "bu": "B2C", "partner": "Proprietaria"}, {"operation_id": "CRM-015928e5ba", "bu": "Plurix", "partner": "Plurix"}, {"operation_id": "CRM-b9d196a55b", "bu": "B2B2C", "partner": "Bem Barato"}, {"operation_id": "CRM-85fefd8ebc", "bu": "B2C", "partner": "Serasa"}]
---

# Upgrade (aprovados não convertidos)

## Em uma frase

Fechar o pedido de quem já foi aprovado e não terminou, depois de uma nova análise que pode ter aumentado o limite.

**Definição:** a **campanha-tipo de fechamento** — reabordar quem já havia feito uma proposta, não concluiu o pedido e foi submetido a uma **nova análise** antes da campanha.

Nos dados, é o segmento `Aprovados_nao_convertidos`, com etapa `Meio_de_Funil` e sem subgrupo (`N/A`).

## Principais números: média de jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Aprovados_nao_convertidos`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados), não média de taxas.

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 33 | 28.304 | 127 | 114 | 46 | 0,16% | 40,4% | R$ 11.092,16 | R$ 241,13 |
| ago/2026 | 25 | 23.218 | 86 | 75 | 40 | 0,17% | 53,3% | R$ 6.476,57 | R$ 161,91 |
| set/2026 | 189 | 33.627 | 345 | 301 | 108 | 0,32% | 35,9% | R$ 8.978,81 | R$ 83,14 |
| **Média mensal** | **82** | **28.383** | **186** | **163** | **65** | **0,23%** | **39,6%** | **R$ 8.849,18** | **R$ 136,84** |
| Total do período | 247 | 85.149 | 558 | 490 | 194 | 0,23% | 39,6% | R$ 26.547,54 | R$ 136,84 |

Por parceiro, no trimestre:

| Parceiro | BU | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão | Finalização | Custo | CAC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Proprietária | B2C | 188 | 47.791 | 321 | 290 | 95 | 0,20% | 32,8% | R$ 12.845,28 | R$ 135,21 |
| Plurix | Plurix | 24 | 34.948 | 187 | 168 | 85 | 0,24% | 50,6% | R$ 13.150,71 | R$ 154,71 |
| Bem Barato | B2B2C | 35 | 2.410 | 50 | 32 | 14 | 0,58% | 43,8% | R$ 551,54 | R$ 39,40 |

Como ler:
- **Uma média de 65 cartões por mês, a CAC de R$ 136,84**, a mais cara do CRM. Mas a CAC caiu forte: R$ 241,13 em julho, R$ 161,91 em agosto e R$ 83,14 em setembro.
- Menos de 1% da base vira proposta (558 de 85.149); dos aprovados, 39,6% viram cartão.
- **O Bem Barato tem CAC de R$ 39,40**, contra R$ 135,21 da Proprietária e R$ 154,71 da Plurix.
- Setembro tem 189 linhas contra 33 e 25 nos meses anteriores: mesma ressalva da Repescagem antes de comparar disparos.

## Por que esse público importa

O dinheiro já foi gasto aprovando — cada conversão aqui tem custo marginal de crédito zero. O desafio é **CAC de incentivo**, não de mídia: candidato natural a [[Experimento|experimentos]] de oferta (Vibe %, em dobro). Em mídia, melhor uso é **retargeting de fechamento** + exclusão imediata pós-emissão (senão o CAC explode ainda mais).

Na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]], o Upgrade da Proprietária fez 7 cartões por R$ 3.036 em agosto e 16 cartões com CAC de R$ 97 no disparo 1 de setembro.

## Pra quem é e quando entra

A pessoa já fez proposta, não concluiu o pedido e passou por uma nova análise antes da campanha. O resultado da nova análise divide a comunicação em dois ramos:

### Bifurcação pelo resultado da nova análise

A nova análise compara o limite atual com o limite anteriormente disponível e determina a comunicação:

- **`maior`** — houve aumento de limite. O cliente recebe a peça específica de aumento, destacando o novo limite verdadeiro quando o campo estiver disponível.
- **`menor`** — não houve aumento. O cliente recebe a mesma linha de comunicação da [[Repescagem]], com limite pré-aprovado e continuidade do pedido.

`maior` e `menor` são declarações operacionais associadas ao `activity_name`; não devem ser inferidas apenas pelo nome genérico da jornada.

Para os dois caminhos, o cliente ainda precisa concluir o pedido. CTA recomendado: **"Conclua seu pedido"**. Quando houver `%%LIMITE_CRD%%`, usar o limite verdadeiro; quando não houver, trabalhar o cartão e os benefícios sem inventar valor. A opção **"até R$ 6.000"** pode ser usada como variante de teste somente quando esse teto comercial estiver aprovado para a campanha.

Como o público aparece em cada sistema:

| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Aprovados_nao_convertidos` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `UPGRADE B2C/PLURIX` |
| Meta hoje | `AFINZ_Upgrade_Niver_A/B` (~1k, out/25 — uma já INACTIVE) |
| Audiência proposta | `crm_b2c_upgrade_daily` · `crm_plurix_upgrade_daily` |
| AppsFlyer | `af_adset=aprovados_nao_convertidos` |

## Regra original (jan/2026) e o que a operação mostra hoje

A régua nasceu da [[05-Estrategia/Estrategia-Bases-Segmentadas-Original-2026-01|planilha de bases segmentadas]] (criada em 03/2025, revista em 01/2026), onde aparece como "Upgrade de oferta". Status: "Feito".

| Ponto | Regra original (jan/2026) | O que a operação mostra hoje |
|---|---|---|
| Quem entra | Aprovado e não convertido. B2C: últimos 3 meses. B2B2C: últimos 6 meses (Visão Geral) ou de 6 a 12 meses (Racional): as duas abas não batem | Mesmo público, nas três BUs (B2C, Plurix e Bem Barato) |
| Quem sai | Celular repetido | Sem medida em `activities` |
| Pré-análise | Sim; só pré-aprovados, com a informação do novo limite | A jornada se divide em dois ramos: `maior` (o limite aumentou) e `menor` (segue a linha da repescagem) |
| Oferta | Aumento de limite até R$ 2000; acima de R$ 2000, limite + Platinum | Ver a seção O que pode e não pode dizer |
| Base nova | Mensal | 55 dos 92 dias com disparo (cerca de 4 dias por semana), em 14 jornadas |
| Duração e ritmo | 15 dias, 2 ativações por semana | 247 disparos no trimestre |
| Canais | WhatsApp, E-mail e SMS | WhatsApp em 238 disparos, SMS em 9, **nenhum e-mail** |
| Subgrupo | Não previsto | O oficial é `N/A`, mas em setembro 149 disparos foram gravados como `Abandonados D-21 A D>7` e 65 como `Diario`. É herança errada do importador |

Por canal, no trimestre:

| Canal | Disparos | Base acionável | Cartões | Conversão |
|---|---:|---:|---:|---:|
| WhatsApp | 238 | 68.316 | 182 | 0,27% |
| SMS | 9 | 16.833 | 12 | 0,07% |

O que fica de leitura:

- **O e-mail saiu da régua.** Ele custa R$ 0,001 por envio e estava na regra original. Vale testar de novo como toque de apoio, já que o upgrade tem conversão baixa por base.
- **Antes de ler resultado por subgrupo neste público, corrija ou ignore o subgrupo:** 6 em cada 10 disparos estão com o subgrupo do carrinho.

Operação medida em `activities` em 29/10/2026, de 01/07 a 30/09/2026. Conversão aqui é cartões ÷ base acionável. "Dias com disparo" conta os dias com pelo menos um disparo do público, em qualquer jornada: mede o ritmo da operação, não quantas mensagens cada cliente recebe.

## Régua

Usa o mesmo padrão de WhatsApp com opt-out e de SMS da Repescagem, descrito na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]] (entrada `DE_JORNADA_UNIFICADA_*`, decisão por `MES_REF` e `CAMPANHA`, espera de 2 dias pela resposta).
No Bem Barato, a peça real de CRM é o WhatsApp `upgrade_vibe_mais_limite_bb_2_` (pacote SFMC de 07/10/2026). O ramo `menor` reaproveita as mensagens da Repescagem.

## O que pode e não pode dizer

CTA recomendado: "Conclua seu pedido". Limite só com o valor verdadeiro (`%%LIMITE_CRD%%`); "até R$ 6.000" só como variante de teste e com o teto comercial aprovado.
A [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]] marcou como risco alto: "limite de até R$ 6.000" em SMS sem teto aprovado, urgência e sorteio no ANC maior e "cartão virtual para usar na hora" no ANC menor.
Antes de escrever, conferir [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]] e [[03-Dimensoes/Vibe|Vibe]].

## Como medir sem cair em armadilha

- Regra confirmada em 26/10/2026: ANC é `Meio_de_Funil` sem subgrupo (`N/A`). Subgrupos herdados de outras jornadas (como `Diario` ou `Abandonados D-21 A D>7`) não devem aparecer como sugestão ([[08-Engenharia/Importador-Segmentacao-Aquisicao-2026-10|Importador]]).
- `JOR_AQS_BB_NA_ANC_*` é B2B2C, Bem Barato, ANC. O sufixo `_resposta_optout_pontual` é a resposta ao "Não tenho interesse agora" e é reaproveitado entre jornadas: o histórico dele não prova o público.
- O segmento não certifica Upgrade: é preciso confirmar a reanálise e o ramo `maior` ou `menor`, que vêm do `activity_name`, não do nome da jornada.
- Público pequeno: com poucos disparos por mês, uma variação de dezenas de cartões muda muito a CAC.
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o público inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Registro do inventário de 03/10/2026 (linhas e período observados naquela data). Os números do trimestre estão em Principais números, acima.

| Variante | BU | Parceiro | Subgrupos | Canais | Linhas no inventário | Período observado | Situação |
|---|---|---|---|---|---:|---|---|
| Finalização de proposta e Upgrade candidato | B2C | Proprietaria | Diario, N/A | E-mail, SMS, WhatsApp | 116 | 09/04/2025 a 23/09/2026 | operação confirmada em 28/10/2026 |
| Finalização de proposta e Upgrade candidato | Plurix | Plurix | Diario, N/A | SMS, WhatsApp | 53 | 27/10/2025 a 10/09/2026 | candidata |
| Finalização de proposta e Upgrade candidato | B2B2C | Bem Barato | Diario, N/A | SMS, WhatsApp | 12 | 18/05/2026 a 28/08/2026 | candidata |
| Finalização de proposta e Upgrade candidato | B2C | Serasa | N/A | WhatsApp | 6 | 10/07/2025 a 15/01/2026 | candidata |

Resultado ao vivo de cada combinação, enquanto o filtro por parceiro dentro desta página não fica pronto: [[07-Evolucao/Assunto-CRM-a695575900|Proprietaria]] · [[07-Evolucao/Assunto-CRM-015928e5ba|Plurix]] · [[07-Evolucao/Assunto-CRM-b9d196a55b|Bem Barato]] · [[07-Evolucao/Assunto-CRM-85fefd8ebc|Serasa]].

Visão de cada parceiro: [[10-Resultados/Parceiros/Proprietaria|Proprietária]] · [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]] · [[10-Resultados/Parceiros/Serasa|Serasa]]

## O que já aprendemos

- O Upgrade foi o piloto do Vibe 100% e é o candidato natural a testes de oferta, porque o custo de aprovar já foi pago (nota de conceito).
- No Bem Barato, em ago/2026, o Upgrade fez 4 cartões, todos por SMS.

Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Por que a CAC caiu de R$ 241 para R$ 83 entre julho e setembro? | saber se a melhora se sustenta | comparar ramo, canal e oferta mês a mês | a confirmar |
| O público cabe numa audiência de mídia? | o mínimo do Meta é de 100 a 1.000 pessoas | tamanho diário do público por BU | a confirmar |
| Reanálise e ramo maior/menor de cada variante | pertencimento ainda candidato | definição e execução de cada jornada | a confirmar |

## Onde mais este público aparece

Estas notas tratam de outros assuntos e também falam deste público. Elas continuam no lugar:

- [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]].
- [[08-Engenharia/Importador-Segmentacao-Aquisicao-2026-10|Importador de segmentação]] e [[04-Operacao/WhatsApp-Respostas-de-Opt-out|respostas de opt-out]].
- [[04-Operacao/SFMC-Packs-Fluxos-Vinculos-e-Aprendizados|Packs SFMC]] e [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Bem-Mais-Afinz-Visa|Cartão Bem Mais]].
- [[01-Conceitos/Plataformas-de-Comunicação|Plataformas de comunicação]] e [[01-Conceitos/Funil-AARRR|Funil AARRR]].

## Relacionado

- [[Plataformas-de-Comunicação]] · [[Repescagem]] · [[Vibe]] · [[Ofertas]] · [[Segmentos]] · [[Ativacao-de-Audiencias-Diaria]]

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes.

### Nota de conceito, 10/06/2026

> 📊 Snapshot 2026-06-10. **Conversão 16,4%, mas CAC R$ 93,51** (o mais caro) — público pequeno (97 disparos; mín. Meta de 100–1.000 usuários é restrição real aqui) e oferta cara (foi o piloto do [[Vibe]] 100%). Canais: SMS/WhatsApp/E-mail equilibrados.

### Dimensão Segmentos, 08 a 10/06/2026

| Segmento | Etapa | Disparos | Conversão | CAC |
|---|---|---|---|---|
| Aprovados_nao_convertidos | Meio funil | 97 | 16,4% | R$ 93,51 |

### Performance por segmento, 10/06/2026

| Segmento | Conversão | CAC | Leitura |
|---|---|---|---|
| Aprovados_nao_convertidos | 16,4% | R$ 93,51 | converte alto, mas caro |

### Dossiê Mestre, baseline de 08/06/2026

| Segmento | Conversão | CAC | Papel |
|---|---:|---:|---|
| Aprovados_nao_convertidos | 31,2% | R$ 96,39 | alta conversão, custo alto |

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Aprovados_nao_convertidos`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Aprovados_nao_convertidos`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-04 | 7 | 5 | 10 | 7/7 | 135 | 7/7 | 4 | [[#Retrospectiva 2025-04|ler junto]] |
| 2025-05 | 4 | 4 | 4 | 4/4 | 36 | 3/4 | 0 | [[#Retrospectiva 2025-05|ler junto]] |
| 2025-06 | 4 | 3 | 15 | 4/4 | 52 | 4/4 | 2 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | 5 | 5 | 6 | 5/5 | 9 | 5/5 | 5 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | 1 | 1 | 12 | 1/1 | 57 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | 5 | 5 | 22 | 5/5 | 99 | 5/5 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | 23 | 10 | 25 | 23/23 | 96 | 20/23 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | 5 | 5 | 13 | 5/5 | 55 | 4/5 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | 6 | 4 | 6 | 6/6 | 26 | 5/6 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | 12 | 9 | 48 | 12/12 | 135 | 11/12 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | 5 | 3 | 16 | 5/5 | 34 | 4/5 | 3 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | 4 | 3 | 47 | 4/4 | 83 | 4/4 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | 17 | 11 | 58 | 17/17 | 120 | 15/17 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | 9 | 6 | 10 | 9/9 | 20 | 9/9 | 2 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | 11 | 9 | 21 | 11/11 | 40 | 11/11 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | 33 | 16 | 46 | 33/33 | 127 | 33/33 | 1 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | 25 | 9 | 40 | 25/25 | 86 | 25/25 | 3 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | 11 | 6 | 34 | 6/11 | 81 | 6/11 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2025-04 | Proprietaria | 7 | 5 | 10 | 7/7 | 4 | [[#Retrospectiva 2025-04|ler junto]] |
| 2025-05 | Proprietaria | 4 | 4 | 4 | 4/4 | 0 | [[#Retrospectiva 2025-05|ler junto]] |
| 2025-06 | Proprietaria | 4 | 3 | 15 | 4/4 | 2 | [[#Retrospectiva 2025-06|ler junto]] |
| 2025-07 | Serasa | 5 | 5 | 6 | 5/5 | 5 | [[#Retrospectiva 2025-07|ler junto]] |
| 2025-08 | Proprietaria | 1 | 1 | 12 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-09 | Proprietaria | 5 | 5 | 22 | 5/5 | 0 | [[#Retrospectiva 2025-09|ler junto]] |
| 2025-10 | Plurix | 3 | 3 | 9 | 3/3 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-10 | Proprietaria | 20 | 7 | 16 | 20/20 | 0 | [[#Retrospectiva 2025-10|ler junto]] |
| 2025-11 | Plurix | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-11 | Proprietaria | 4 | 4 | 13 | 4/4 | 0 | [[#Retrospectiva 2025-11|ler junto]] |
| 2025-12 | Plurix | 1 | 1 | 2 | 1/1 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2025-12 | Proprietaria | 5 | 3 | 4 | 5/5 | 0 | [[#Retrospectiva 2025-12|ler junto]] |
| 2026-01 | Plurix | 6 | 5 | 36 | 6/6 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-01 | Proprietaria | 5 | 4 | 11 | 5/5 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-01 | Serasa | 1 | 1 | 1 | 1/1 | 0 | [[#Retrospectiva 2026-01|ler junto]] |
| 2026-02 | Plurix | 5 | 3 | 16 | 5/5 | 3 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | Plurix | 4 | 3 | 47 | 4/4 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | Plurix | 6 | 6 | 43 | 6/6 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | Proprietaria | 11 | 10 | 15 | 11/11 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | Bem Barato | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Plurix | 3 | 2 | 9 | 3/3 | 2 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-05 | Proprietaria | 5 | 4 | 1 | 5/5 | 0 | [[#Retrospectiva 2026-05|ler junto]] |
| 2026-06 | Plurix | 4 | 4 | 17 | 4/4 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-06 | Proprietaria | 7 | 5 | 4 | 7/7 | 0 | [[#Retrospectiva 2026-06|ler junto]] |
| 2026-07 | Bem Barato | 5 | 5 | 4 | 5/5 | 1 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Plurix | 11 | 7 | 24 | 11/11 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-07 | Proprietaria | 17 | 11 | 18 | 17/17 | 0 | [[#Retrospectiva 2026-07|ler junto]] |
| 2026-08 | Bem Barato | 6 | 4 | 4 | 6/6 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Plurix | 6 | 4 | 29 | 6/6 | 0 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-08 | Proprietaria | 13 | 8 | 7 | 13/13 | 3 | [[#Retrospectiva 2026-08|ler junto]] |
| 2026-09 | Plurix | 3 | 2 | 18 | 3/3 | 0 | [[#Retrospectiva 2026-09|ler junto]] |
| 2026-09 | Proprietaria | 8 | 5 | 16 | 3/8 | 0 | [[#Retrospectiva 2026-09|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2025-04

- **Observação:** segmento geral com 10 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-04-09 e 2025-04-28, em 5 dias distintos.
- **Cobertura:** 7 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 10 cartões em 7/7 linhas; 5 dias, 4 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-05

- **Observação:** segmento geral com 4 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-05-01 e 2025-05-31, em 4 dias distintos.
- **Cobertura:** 4 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 4 cartões em 4/4 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-06

- **Observação:** segmento geral com 15 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-06-02 e 2025-06-26, em 3 dias distintos.
- **Cobertura:** 4 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 15 cartões em 4/4 linhas; 3 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-07

- **Observação:** segmento geral com 6 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-07-10 e 2025-07-17, em 5 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Serasa:** 6 cartões em 5/5 linhas; 5 dias, 5 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-08

- **Observação:** segmento geral com 12 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-08-29 e 2025-08-29, em 1 dias distintos.
- **Cobertura:** 1 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 12 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-09

- **Observação:** segmento geral com 22 cartões observados; 1 classificações de parceiro registradas; registros entre 2025-09-01 e 2025-09-23, em 5 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 22 cartões em 5/5 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-10

- **Observação:** segmento geral com 25 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-10-01 e 2025-10-29, em 10 dias distintos.
- **Cobertura:** 23 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 9 cartões em 3/3 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 16 cartões em 20/20 linhas; 7 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-11

- **Observação:** segmento geral com 13 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-11-04 e 2025-11-28, em 5 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 13 cartões em 4/4 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2025-12

- **Observação:** segmento geral com 6 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-12-02 e 2025-12-17, em 4 dias distintos.
- **Cobertura:** 6 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 2 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 4 cartões em 5/5 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-01

- **Observação:** segmento geral com 48 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-01-06 e 2026-01-30, em 9 dias distintos.
- **Cobertura:** 12 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 36 cartões em 6/6 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 11 cartões em 5/5 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 1 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-02

- **Observação:** segmento geral com 16 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-02-03 e 2026-02-23, em 3 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 16 cartões em 5/5 linhas; 3 dias, 3 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-03

- **Observação:** segmento geral com 47 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-03-16 e 2026-03-27, em 3 dias distintos.
- **Cobertura:** 4 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 47 cartões em 4/4 linhas; 3 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-04

- **Observação:** segmento geral com 58 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-04-07 e 2026-04-30, em 11 dias distintos.
- **Cobertura:** 17 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 43 cartões em 6/6 linhas; 6 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 15 cartões em 11/11 linhas; 10 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-05

- **Observação:** segmento geral com 10 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-05-07 e 2026-05-29, em 6 dias distintos.
- **Cobertura:** 9 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 9 cartões em 3/3 linhas; 2 dias, 2 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 1 cartões em 5/5 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-06

- **Observação:** segmento geral com 21 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-06-01 e 2026-06-30, em 9 dias distintos.
- **Cobertura:** 11 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 17 cartões em 4/4 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 4 cartões em 7/7 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-07

- **Observação:** segmento geral com 46 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-07-04 e 2026-07-31, em 16 dias distintos.
- **Cobertura:** 33 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 4 cartões em 5/5 linhas; 5 dias, 1 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 24 cartões em 11/11 linhas; 7 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 18 cartões em 17/17 linhas; 11 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-08

- **Observação:** segmento geral com 40 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-08-01 e 2026-08-28, em 9 dias distintos.
- **Cobertura:** 25 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 4 cartões em 6/6 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Plurix:** 29 cartões em 6/6 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 7 cartões em 13/13 linhas; 8 dias, 3 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-09

- **Observação:** segmento geral com 34 cartões observados; 2 classificações de parceiro registradas; registros entre 2026-09-08 e 2026-09-23, em 6 dias distintos.
- **Cobertura:** 11 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 18 cartões em 3/3 linhas; 2 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 16 cartões em 3/8 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das notas de assunto, uma por variante, mais a lista do antigo hub.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-b9d196a55b]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-a695575900]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-85fefd8ebc]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-015928e5ba]] | Escopo candidato de operação | activities |

### Proprietaria (B2C), CRM-a695575900

#### O que este assunto representa

Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Proprietaria |
| segment | Aprovados_nao_convertidos |
| stages | ["Meio_de_Funil", "Reativacao"] |
| subgroups | ["Diario", "N/A"] |
| channels | ["E-mail", "SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Limite", "Padrao", "Vibe"] |
| promotions | ["Copa", "Em dobro", "N/A", "Padrao", "Upgrade"] |

**O que precisa ser validado:** Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-33f0dfb85c | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_JUN26 | 2026-06 | Meio_de_Funil | Diario | 3 |
| CAMP-32a250addb | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 07/26 | Reativacao | Diario | 1 |
| CAMP-515c44ae44 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 08/26 | Reativacao | Diario | 8 |
| CAMP-69385cb484 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 07/26 | Reativacao | Diario | 7 |
| CAMP-b5ff04305d | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 2026-07 | Reativacao | Diario | 9 |
| CAMP-b453d783a2 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_AGOSTO | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-3e7c0ea51a | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_AGOSTO_RPK | 2025-09 | Meio_de_Funil | N/A | 1 |
| CAMP-3d455b6b64 | JOR_AQS_B2C_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_SET26 |  | Meio_de_Funil | N/A | 5 |
| CAMP-5664890d56 | JOR_AQUISICAO_B2C_BPC_ANC_AQUISICAO_VIBE_NA_DEZ25 | 2025-12 | Meio_de_Funil | N/A | 5 |
| CAMP-660de49aad | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 9 |
| CAMP-85cf3468ca | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_JUN26 | 2026-06 | Meio_de_Funil | N/A | 4 |
| CAMP-d5f3f2ec98 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_COPA_PAD_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 5 |
| CAMP-99944c59ec | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_AGO26 | 08/26 | Meio_de_Funil | N/A | 5 |
| CAMP-345f9a2119 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_SET26 | 09/26 | Meio_de_Funil | N/A | 3 |
| CAMP-c0e81c0db3 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_VIBE_PAD_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 2 |
| CAMP-fb1b0b3989 | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_VIBE_PAD_JAN25 | 2026-01 | Meio_de_Funil | N/A | 1 |
| CAMP-6378380e3a | JOR_AQUISICAO_B2C_NA_ANC_MEIO_DE_FUNIL_VIBE_PAD_JAN26 | 2026-01 | Meio_de_Funil | N/A | 4 |
| CAMP-2c481f1815 | JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana1 | 2025-04 | Meio_de_Funil | N/A | 3 |
| CAMP-a055b37474 | JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana2 | 2025-04 | Meio_de_Funil | N/A | 2 |
| CAMP-6b94824f85 | JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana3 | 2025-04 | Meio_de_Funil | N/A | 2 |
| CAMP-0ff1206ed5 | JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana3 | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-f15e5b90da | JOR_AQUISICAO_B2C_NOVO_LIMITE_JUNHO_SEMANA1 | 2025-06 | Meio_de_Funil | N/A | 2 |
| CAMP-24da687094 | JOR_AQUISICAO_B2C_NOVO_LIMITE_JUNHO_SEMANA1 _RPK | 2025-06 | Meio_de_Funil | N/A | 1 |
| CAMP-366d081923 | JOR_AQUISICAO_B2C_Novo_Limite_Maio_RPK | 2025-05 | Meio_de_Funil | N/A | 1 |
| CAMP-2b88430475 | JOR_AQUISICAO_B2C_Novo_Limite_Maio_semana1 | 2025-05 | Meio_de_Funil | N/A | 2 |
| CAMP-bdcf8cfdc5 | JOR_AQUISICAO_B2C_NOVO_LIMITE_MAIO_SEMANA1_RPK | 2025-06 | Meio_de_Funil | N/A | 1 |
| CAMP-7265348b82 | JOR_AQUISICAO_B2C_PROPRI_ANC_MEIO_DE_FUNIL_PADRAO_NA_NOV25 | 2025-11 | Meio_de_Funil | N/A | 4 |
| CAMP-c120a3a39d | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_OUTUBRO_NIVER | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-b4b7154324 | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_OUTUBRO_NIVER_2 | 2025-10 | Meio_de_Funil | N/A | 4 |
| CAMP-deafb399a9 | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_OUTUBRO_NIVER_3 | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-c117953dcb | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_SMS | 10/25 | Meio_de_Funil | N/A | 2 |
| CAMP-00a6eaae8d | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_SMS | 2025-10 | Meio_de_Funil | N/A | 4 |
| CAMP-74a20d2d5e | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_SMS_2 | 10/25 | Meio_de_Funil | N/A | 1 |
| CAMP-023b91ac6c | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_SMS_2 | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-39a2100667 | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_WPP | 10/25 | Meio_de_Funil | N/A | 1 |
| CAMP-d290cf7726 | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_NIVER_WPP | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-6085195f8a | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_SEMANA1 | 2025-09 | Meio_de_Funil | N/A | 3 |
| CAMP-1a54786c13 | JOR_AQUISICAO_B2C_UPGRADE_MEIO_FUNIL_SETEMBRO_SEMANA2 | 2025-09 | Meio_de_Funil | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Mais de uma etapa física no escopo
- Nome de resposta/opt-out entre disparos do escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-a695575900 |
| Fonte | activities |
| Linhas no corte do inventário | 116 |
| Primeira data observada | 2025-04-09 |
| Última data observada | 2026-09-23 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Upgrade|Definição relacionada]] · [[07-Evolucao/Parceiro-Proprietaria|Visão do parceiro]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-a695575900",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Finalização de proposta e Upgrade candidato — Proprietaria — B2C",
  "family": "Finalização de proposta e Upgrade candidato",
  "bu": "B2C",
  "partner": "Proprietaria",
  "segment": "Aprovados_nao_convertidos",
  "stages": [
    "Meio_de_Funil",
    "Reativacao"
  ],
  "subgroups": [
    "Diario",
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
    "Limite",
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Em dobro",
    "N/A",
    "Padrao",
    "Upgrade"
  ],
  "records": 116,
  "first_date": "2025-04-09",
  "last_date": "2026-09-23",
  "observed_months": [
    "2025-04",
    "2025-05",
    "2025-06",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 3,
  "journey_count": 31,
  "activity_name_count": 82,
  "definition": "Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Upgrade.md",
  "validation": "Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.",
  "flags": [
    "Mais de uma etapa física no escopo",
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Ramo maior no nome",
    "Ramo menor no nome",
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Aprovados_nao_convertidos",
    "partner": "Proprietaria"
  }
}
```

### Plurix (Plurix), CRM-015928e5ba

#### O que este assunto representa

Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | Plurix |
| segment | Aprovados_nao_convertidos |
| stages | ["Meio_de_Funil", "Reativacao"] |
| subgroups | ["Diario", "N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-38d7a1f80b | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_AGO26 | 08/26 | Reativacao | Diario | 3 |
| CAMP-247cb57424 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUL26 | 07/26 | Reativacao | Diario | 8 |
| CAMP-a2ac85c056 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUL26 | 2026-07 | Reativacao | Diario | 3 |
| CAMP-cee846b9f0 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PAD_PAD_AGO26 | 08/26 | Meio_de_Funil | N/A | 3 |
| CAMP-7f86b53bca | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PAD_SET26 | 09/26 | Meio_de_Funil | N/A | 3 |
| CAMP-01187801c7 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 5 |
| CAMP-8752f88619 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-c8e542ab18 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUN26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-1352e1b0a4 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUN26 | 2026-06 | Meio_de_Funil | N/A | 4 |
| CAMP-6493406eb8 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-cb6b8f60b9 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_DEZ25 | 2025-12 | Meio_de_Funil | N/A | 1 |
| CAMP-c7e8ab6c9c | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_FEV26 | 2026-02 | Meio_de_Funil | N/A | 2 |
| CAMP-b0b2c87d1f | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_JAN26 | 2026-01 | Meio_de_Funil | N/A | 6 |
| CAMP-d8ae56df92 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_JAN26 | 2026-02 | Meio_de_Funil | N/A | 1 |
| CAMP-e52e11c95e | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-02 | Meio_de_Funil | N/A | 2 |
| CAMP-9f067e7cd3 | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_MAR26 | 2026-03 | Meio_de_Funil | N/A | 4 |
| CAMP-db950cbc0e | JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Meio_de_Funil | N/A | 2 |
| CAMP-c63435bbc5 | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26 | 2026-04 | Meio_de_Funil | N/A | 1 |
| CAMP-f73f0b144b | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_NOV25 | 2025-11 | Meio_de_Funil | N/A | 1 |
| CAMP-23d14f008f | JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_OUT25 | 2025-10 | Meio_de_Funil | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Mais de uma etapa física no escopo
- Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-015928e5ba |
| Fonte | activities |
| Linhas no corte do inventário | 53 |
| Primeira data observada | 2025-10-27 |
| Última data observada | 2026-09-10 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Upgrade|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-015928e5ba",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Finalização de proposta e Upgrade candidato — Plurix — Plurix",
  "family": "Finalização de proposta e Upgrade candidato",
  "bu": "Plurix",
  "partner": "Plurix",
  "segment": "Aprovados_nao_convertidos",
  "stages": [
    "Meio_de_Funil",
    "Reativacao"
  ],
  "subgroups": [
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
  "records": 53,
  "first_date": "2025-10-27",
  "last_date": "2026-09-10",
  "observed_months": [
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
  "physical_combinations": 2,
  "journey_count": 15,
  "activity_name_count": 31,
  "definition": "Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Upgrade.md",
  "validation": "Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.",
  "flags": [
    "Mais de uma etapa física no escopo",
    "Vibe em Plurix: confrontar vigência e produto; +amigo não é elegível por analogia"
  ],
  "name_signals": [
    "Ramo maior no nome",
    "Ramo menor no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Aprovados_nao_convertidos",
    "partner": "Plurix"
  }
}
```

### Bem Barato (B2B2C), CRM-b9d196a55b

#### O que este assunto representa

Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Aprovados_nao_convertidos |
| stages | ["Meio_de_Funil", "Reativacao"] |
| subgroups | ["Diario", "N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-1e6a92d80d | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 07/26 | Reativacao | Diario | 1 |
| CAMP-77f9ae88aa | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 08/26 | Reativacao | Diario | 1 |
| CAMP-7f3ed34544 | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_COPA_PAD_AGO26 | 08/26 | Meio_de_Funil | N/A | 2 |
| CAMP-430df84c1c | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_COPA_PAD_JUL26 | 07/26 | Meio_de_Funil | N/A | 4 |
| CAMP-27541e8754 | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_COPA_PAD_MAIO26 | 2026-05 | Meio_de_Funil | N/A | 1 |
| CAMP-eae9fc8752 | JOR_AQUISICAO_B2B2C_BB_ANC_MEIO_DE_FUNIL_PAD_VIBE_AGO26 | 08/26 | Meio_de_Funil | N/A | 3 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Mais de uma etapa física no escopo
- Nome de resposta/opt-out entre disparos do escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-b9d196a55b |
| Fonte | activities |
| Linhas no corte do inventário | 12 |
| Primeira data observada | 2026-05-18 |
| Última data observada | 2026-08-28 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Upgrade|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-b9d196a55b",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Finalização de proposta e Upgrade candidato — Bem Barato — B2B2C",
  "family": "Finalização de proposta e Upgrade candidato",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Aprovados_nao_convertidos",
  "stages": [
    "Meio_de_Funil",
    "Reativacao"
  ],
  "subgroups": [
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
  "records": 12,
  "first_date": "2026-05-18",
  "last_date": "2026-08-28",
  "observed_months": [
    "2026-05",
    "2026-07",
    "2026-08"
  ],
  "physical_combinations": 2,
  "journey_count": 4,
  "activity_name_count": 6,
  "definition": "Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Upgrade.md",
  "validation": "Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.",
  "flags": [
    "Mais de uma etapa física no escopo",
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Ramo maior no nome",
    "Ramo menor no nome",
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Aprovados_nao_convertidos",
    "partner": "Bem Barato"
  }
}
```

### Serasa (B2C), CRM-85fefd8ebc

#### O que este assunto representa

Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Serasa |
| segment | Aprovados_nao_convertidos |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Vibe"] |
| promotions | ["Em dobro", "Padrao"] |

**O que precisa ser validado:** Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-9789b99f45 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_JULHO_200_CRÉDITOS | 07/25 | Meio_de_Funil | N/A | 1 |
| CAMP-f6cdc37166 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_JULHO_200_CRÉDITOS_2 | 07/25 | Meio_de_Funil | N/A | 1 |
| CAMP-807a3faf78 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_JULHO_200_CRÉDITOS_3 | 07/25 | Meio_de_Funil | N/A | 1 |
| CAMP-36d8e41b71 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_JULHO_200_CRÉDITOS_4 | 07/25 | Meio_de_Funil | N/A | 1 |
| CAMP-179ce8ce69 | DISPARO_AQUISICAO_B2C_SERASA_UPGRADE_MEIO_FUNIL_JULHO_200_CRÉDITOS_5 | 07/25 | Meio_de_Funil | N/A | 1 |
| CAMP-b09863d045 | JOR_AQUISICAO_B2C_SERASA_LP_MEIO_DE_FUNIL_VIBE_PAD_JAN26 | 2026-01 | Meio_de_Funil | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-85fefd8ebc |
| Fonte | activities |
| Linhas no corte do inventário | 6 |
| Primeira data observada | 2025-07-10 |
| Última data observada | 2026-01-15 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Upgrade|Definição relacionada]] · [[07-Evolucao/Parceiro-Serasa|Visão do parceiro]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-85fefd8ebc",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Finalização de proposta e Upgrade candidato — Serasa — B2C",
  "family": "Finalização de proposta e Upgrade candidato",
  "bu": "B2C",
  "partner": "Serasa",
  "segment": "Aprovados_nao_convertidos",
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
    "Cartao",
    "Classic"
  ],
  "credit_profiles": [
    "Whitelist"
  ],
  "offers": [
    "Vibe"
  ],
  "promotions": [
    "Em dobro",
    "Padrao"
  ],
  "records": 6,
  "first_date": "2025-07-10",
  "last_date": "2026-01-15",
  "observed_months": [
    "2025-07",
    "2026-01"
  ],
  "physical_combinations": 1,
  "journey_count": 6,
  "activity_name_count": 6,
  "definition": "Continuar proposta não concluída; Upgrade pressupõe nova análise e ramo de limite.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Upgrade.md",
  "validation": "Confirmar reanálise e ramo maior/menor. Segmento não certifica Upgrade.",
  "flags": [],
  "name_signals": [],
  "scope_key": {
    "bu": "B2C",
    "segment": "Aprovados_nao_convertidos",
    "partner": "Serasa"
  }
}
```
