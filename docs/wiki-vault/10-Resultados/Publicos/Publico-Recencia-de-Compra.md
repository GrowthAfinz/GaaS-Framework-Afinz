---
title: "Recência de compra"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Recencia_de_Compra
aliases: [Recência de compra, Recencia_de_Compra, Compradores D-7, Não cartonistas]
etapa_funil: Aquisicao
bus: [Plurix, B2B2C]
parceiros_ativos: [Plurix, Bem Barato]
canais: [WhatsApp, SMS, E-mail]
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Recencia_de_Compra"}
analytics: {"domain": "crm", "scope": {"segment": "Recencia_de_Compra"}}
variantes: [{"operation_id": "CRM-4b4cf35f73", "bu": "Plurix", "partner": "Plurix"}, {"operation_id": "CRM-f5ee848cf4", "bu": "B2B2C", "partner": "Bem Barato"}]
---

# Recência de compra

## Em uma frase

Abordar quem acabou de comprar no varejo parceiro e ainda não tem o cartão, usando como argumento a economia que teria tido pagando com ele.

Nos dados, é o segmento `Recencia_de_Compra`, com subgrupo `Compradores D-7`. Quase todo o volume é da Plurix.

## Principais números: últimos meses com disparo

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Recencia_de_Compra`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados), não média de taxas.

**Não houve disparo de jul a set/2026.** Os últimos meses fechados com disparo foram fev a mai/2026:

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| fev/2026 | 6 | 40.110 | 590 | 40 | 33 | 0,082% | 82,5% | R$ 4.306,54 | R$ 130,50 |
| mar/2026 | 11 | 114.907 | 300 | 120 | 84 | 0,073% | 70,0% | R$ 6.102,36 | R$ 72,65 |
| abr/2026 | 12 | 507.324 | 586 | 395 | 283 | 0,056% | 71,6% | R$ 38.698,67 | R$ 136,74 |
| mai/2026 | 1 | 3.866 | 26 | 13 | 6 | 0,16% | 46,2% | R$ 1.621,20 | R$ 270,20 |
| **Média dos meses com disparo** | **8** | **166.552** | **376** | **142** | **102** | **0,061%** | **71,5%** | **R$ 12.682,19** | **R$ 124,95** |
| Total do período | 30 | 666.207 | 1.502 | 568 | 406 | 0,061% | 71,5% | R$ 50.728,77 | R$ 124,95 |

Em out/2026 o público voltou: 5 linhas, base de 26.371, 91 propostas, 88 aprovados, 59 cartões e R$ 3.495,67 de custo até 23/10 (CAC de R$ 59,25). O mês ainda não fechou.

Por parceiro, em 2026 (até 23/10):

| Parceiro | BU | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão | Finalização | Custo | CAC |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Plurix | Plurix | 34 | 688.712 | 1.567 | 643 | 459 | 0,067% | 71,4% | R$ 52.603,24 | R$ 114,60 |
| Bem Barato | B2B2C | 1 | 3.866 | 26 | 13 | 6 | 0,16% | 46,2% | R$ 1.621,20 | R$ 270,20 |

Como ler:
- **Abril concentrou o resultado**: 283 cartões, com base de 507 mil e CAC de R$ 136,74.
- Na média de fev a mai/2026, foram ~102 cartões por mês a CAC de R$ 124,95: caro para aquisição, porque a base é grande e o canal principal é WhatsApp.
- A volta de outubro começou com CAC bem menor (R$ 59,25), com a nova automação de cruzamento da Plurix.
- A Plurix responde por 459 dos 465 cartões de 2026; o Bem Barato teve um disparo só, em 06/05/2026.

## Por que esse público importa

É a única régua de aquisição que parte de um comportamento recente de compra, e não de um pedido de cartão. Se funcionar, transforma o volume de compras do varejo em fonte própria de leads.

## Pra quem é e quando entra

Comprador recente do varejo parceiro, sem cartão. Na operação de outubro da Plurix, a entrada é o arquivo `lista_nao_cartonistas.csv` (407.711 registros na carga observada), cruzado com comunicação, pré-aprovação, cartonistas e restrições. O detalhe completo (dados, automação `RECENCIA_CRUZAMENTO`, aptos e canais) está no [[04-Operacao/Plurix-Recencia-Automation-e-Comunicacoes|runbook de recência Plurix]], que funciona como a página da operação.

## Régua

A régua de outubro da Plurix tem WhatsApp e SMS (com versão de D+4), com textos, variáveis e cuidados de validade no runbook.

### Operação Plurix — outubro de 2026

[[04-Operacao/Plurix-Recencia-Automation-e-Comunicacoes|Runbook de recência Plurix: carga, cruzamento, aptos, canais e comunicações]]. Consolidação em 28/10/2026 das decisões e evidências operacionais, com snapshots separados de resultados de produção e pendências explícitas. Inclui as versões de SMS, variáveis WhatsApp e cuidados de validade da pré-aprovação. Não altera o corte histórico das análises de resultados desta seção.

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

## O que pode e não pode dizer

A economia (`economia_4_semanas`) é a economia potencial calculada pelo parceiro nas quatro semanas do arquivo. Não é desconto recebido, cashback, saldo nem economia futura garantida, e não é líquida da mensalidade.
Não criar falsa escassez nem apresentar pré-aprovado como aprovado. A oferta excepcional corrigida vence em 01/11/2026; um D+4 depois disso não pode usar essa pré-aprovação sem renovação.
Pontos foram encerrados em julho/2026: não usar. Regras completas no runbook e em [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como medir sem cair em armadilha

- `rec` no nome é ambíguo: pode ser Recência (público) ou Recorrente (área). Resolver pela posição no nome ([[07-Evolucao/Inconsistências-a-Corrigir|inconsistências]]).
- O segmento já apareceu como "Recencia de Compra", com espaço; o padrão é `Recencia_de_Compra`.
- O disparo de 23/10/2026 (`afz_car_plx_aqs_wpp_rec_disp1_pontual`) entrou sem `template_id`: o registro não prova o texto entregue.
- Comparar proposta concluída, aprovação, cartão e custo com controle e populações equivalentes; clique é diagnóstico, não prova de copy vencedora.
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o público inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Registro do inventário de 03/10/2026 (linhas e período observados naquela data). Os números do trimestre estão em Principais números, acima.

| Variante | BU | Parceiro | Subgrupos | Canais | Linhas no inventário | Período observado | Situação |
|---|---|---|---|---|---:|---|---|
| Acionamento por compra recente | Plurix | Plurix | Compradores D-7 | E-mail, SMS, WhatsApp | 29 | 20/02/2026 a 28/04/2026 | candidata |
| Acionamento por compra recente | B2B2C | Bem Barato | Compradores D-7 | WhatsApp | 1 | só 06/05/2026 | candidata |

Resultado ao vivo de cada combinação, enquanto o filtro por parceiro dentro desta página não fica pronto: [[07-Evolucao/Assunto-CRM-4b4cf35f73|Plurix]] · [[07-Evolucao/Assunto-CRM-f5ee848cf4|Bem Barato]].

Visão de cada parceiro: [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]]

## O que já aprendemos

- Ainda não há aprendizado validado. A hipótese registrada no runbook é testar "economia primeiro" contra "limite primeiro" em grupos comparáveis.

Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| A volta de outubro mantém a CAC perto de R$ 60? | decide se a régua escala | fechamento de outubro e novembro | a confirmar |
| O que vale depois de 01/11/2026, quando a oferta excepcional vence? | D+4 sem pré-aprovação válida | renovação da oferta | a confirmar |
| Supressão de quem pediu cartão, virou cartonista ou entrou em restrição está implementada? | contato indevido | desenho final da jornada | operador SFMC |
| Produto ofertado e gatilho de compra de cada variante | pertencimento ainda candidato | definição e execução | a confirmar |

## Onde mais este público aparece

Estas notas tratam de outros assuntos e também falam deste público. Elas continuam no lugar:

- [[04-Operacao/Plurix-Recencia-Automation-e-Comunicacoes|Runbook de recência Plurix]] (operação de out/2026).
- [[03-Dimensoes/Bandeiras-Plurix|Bandeiras Plurix]] e [[01-Conceitos/Funil-AARRR|Funil AARRR]].
- [[07-Evolucao/Inconsistências-a-Corrigir|Inconsistências]] e [[04-Operacao/Fabrica-de-Emails-GaaS|Fábrica de e-mails]].

## Relacionado


---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes.

### Dimensão Segmentos, 10/06/2026

> 📊 Snapshot 2026-06-10. Também: Rentabilizacao (65), Cartonistas (30), Recencia de Compra (26), Instabilidade (8). ⚠️ Base re-ingerida vs 06-08 — taxas de conversão recuaram em bloco; a hierarquia entre segmentos se mantém.

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Recencia_de_Compra`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Recencia_de_Compra`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2026-02 | 6 | 4 | 33 | 6/6 | 590 | 6/6 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | 11 | 5 | 84 | 11/11 | 300 | 11/11 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | 12 | 9 | 283 | 12/12 | 586 | 11/12 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | 1 | 1 | 6 | 1/1 | 26 | 1/1 | 0 | [[#Retrospectiva 2026-05|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2026-02 | Plurix | 6 | 4 | 33 | 6/6 | 0 | [[#Retrospectiva 2026-02|ler junto]] |
| 2026-03 | Plurix | 11 | 5 | 84 | 11/11 | 0 | [[#Retrospectiva 2026-03|ler junto]] |
| 2026-04 | Plurix | 12 | 9 | 283 | 12/12 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-05 | Bem Barato | 1 | 1 | 6 | 1/1 | 0 | [[#Retrospectiva 2026-05|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2026-02

- **Observação:** segmento geral com 33 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-02-20 e 2026-02-25, em 4 dias distintos.
- **Cobertura:** 6 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 33 cartões em 6/6 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-03

- **Observação:** segmento geral com 84 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-03-09 e 2026-03-18, em 5 dias distintos.
- **Cobertura:** 11 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 84 cartões em 11/11 linhas; 5 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-04

- **Observação:** segmento geral com 283 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-04-09 e 2026-04-28, em 9 dias distintos.
- **Cobertura:** 12 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Plurix:** 283 cartões em 12/12 linhas; 9 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-05

- **Observação:** segmento geral com 6 cartões observados; 1 classificações de parceiro registradas; registros entre 2026-05-06 e 2026-05-06, em 1 dias distintos.
- **Cobertura:** 1 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 6 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das notas de assunto, uma por variante, mais a lista do antigo hub.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-f5ee848cf4]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-4b4cf35f73]] | Escopo candidato de operação | activities |

### Plurix (Plurix), CRM-4b4cf35f73

#### O que este assunto representa

Recorte Compradores D-7 registrado na aquisição.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | Plurix |
| segment | Recencia_de_Compra |
| stages | ["Aquisicao"] |
| subgroups | ["Compradores D-7"] |
| channels | ["E-mail", "SMS", "WhatsApp"] |
| products | ["Cartao", "Classic"] |
| offers | ["Padrao"] |
| promotions | ["Copa", "N/A"] |

**O que precisa ser validado:** Confirmar produto ofertado e gatilho de compra; não assumir evento de conversão.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-f86b03709d | JOR_AQUISICAO_PLURIX_CLUBE_BOA_PADRAO_NA_FEV26 | 2026-02 | Aquisicao | Compradores D-7 | 6 |
| CAMP-e166088628 | JOR_AQUISICAO_PLURIX_RECENCIA_AQUISICAO_PADRAO_COPA_ABRI26 | 2026-04 | Aquisicao | Compradores D-7 | 3 |
| CAMP-fcd9c6a8a2 | JOR_AQUISICAO_PLURIX_RECENCIA_AQUISICAO_PADRAO_NA_ABRI26 | 2026-04 | Aquisicao | Compradores D-7 | 9 |
| CAMP-cd2f1ee3b7 | JOR_AQUISICAO_PLURIX_RECENCIA_BOA_PADRAO_NA_MAR26 | 2026-03 | Aquisicao | Compradores D-7 | 11 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-4b4cf35f73 |
| Fonte | activities |
| Linhas no corte do inventário | 29 |
| Primeira data observada | 2026-02-20 |
| Última data observada | 2026-04-28 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Subgrupos|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-4b4cf35f73",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Acionamento por compra recente — Plurix — Plurix",
  "family": "Acionamento por compra recente",
  "bu": "Plurix",
  "partner": "Plurix",
  "segment": "Recencia_de_Compra",
  "stages": [
    "Aquisicao"
  ],
  "subgroups": [
    "Compradores D-7"
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
    "Pre_analisado",
    "Whitelist"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "Copa",
    "N/A"
  ],
  "records": 29,
  "first_date": "2026-02-20",
  "last_date": "2026-04-28",
  "observed_months": [
    "2026-02",
    "2026-03",
    "2026-04"
  ],
  "physical_combinations": 1,
  "journey_count": 4,
  "activity_name_count": 20,
  "definition": "Recorte Compradores D-7 registrado na aquisição.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Subgrupos.md",
  "validation": "Confirmar produto ofertado e gatilho de compra; não assumir evento de conversão.",
  "flags": [],
  "name_signals": [
    "Copa"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Recencia_de_Compra",
    "partner": "Plurix"
  }
}
```

### Bem Barato (B2B2C), CRM-f5ee848cf4

#### O que este assunto representa

Recorte Compradores D-7 registrado na aquisição.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Recencia_de_Compra |
| stages | ["Aquisicao"] |
| subgroups | ["Compradores D-7"] |
| channels | ["WhatsApp"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["Copa"] |

**O que precisa ser validado:** Confirmar produto ofertado e gatilho de compra; não assumir evento de conversão.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-74b240359b | JOR_AQUISICAO_BB_RECENCIA_AQUISICAO_PADRAO_COPA_MAI26 | 2026-05 | Aquisicao | Compradores D-7 | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-f5ee848cf4 |
| Fonte | activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-05-06 |
| Última data observada | 2026-05-06 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Subgrupos|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-f5ee848cf4",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Acionamento por compra recente — Bem Barato — B2B2C",
  "family": "Acionamento por compra recente",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Recencia_de_Compra",
  "stages": [
    "Aquisicao"
  ],
  "subgroups": [
    "Compradores D-7"
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
    "Copa"
  ],
  "records": 1,
  "first_date": "2026-05-06",
  "last_date": "2026-05-06",
  "observed_months": [
    "2026-05"
  ],
  "physical_combinations": 1,
  "journey_count": 1,
  "activity_name_count": 1,
  "definition": "Recorte Compradores D-7 registrado na aquisição.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Subgrupos.md",
  "validation": "Confirmar produto ofertado e gatilho de compra; não assumir evento de conversão.",
  "flags": [],
  "name_signals": [
    "Copa"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Recencia_de_Compra",
    "partner": "Bem Barato"
  }
}
```
