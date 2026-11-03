---
title: "Pós-instabilidade"
tipo: publico
camada: resultados
dominio: crm-aquisicao
codigo_dado: Instabilidade
aliases: [Pós-instabilidade, Instabilidade, Recuperação após instabilidade]
etapa_funil: Reativacao
bus: [B2C, Plurix, B2B2C]
parceiros_ativos: [Serasa, Proprietaria]
canais: [SMS, WhatsApp, Push]
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [publico, crm, resultados, growth]
growth_catalog: {"segmento": "Instabilidade"}
analytics: {"domain": "crm", "scope": {"segment": "Instabilidade"}}
variantes: [{"operation_id": "CRM-6e7d329c84", "bu": "B2C", "partner": "Serasa"}, {"operation_id": "CRM-798bf8f3a7", "bu": "B2C", "partner": "Proprietaria"}, {"operation_id": "CRM-ac74764beb", "bu": "Plurix", "partner": "N/A"}, {"operation_id": "CRM-cc03a5f98d", "bu": "B2B2C", "partner": "Bem Barato"}]
---

# Pós-instabilidade

## Em uma frase

Recontatar quem foi afetado por uma falha ou instabilidade no fluxo do pedido, para retomar a solicitação.

Nos dados, é o segmento `Instabilidade`. É um público de ocasião: só existe quando há um incidente.

## Principais números: meses com disparo

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, segmento `Instabilidade`. Setembro ainda pode amadurecer. O resultado do mês corrente fica no bloco ao vivo, mais abaixo. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados), não média de taxas.

**Sem disparo de jul a set/2026.** O público só teve disparo em dois meses:

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ago/2025 | 5 | 4.130 | 458 | 439 | 308 | 7,5% | 70,2% | R$ 614,76 | R$ 2,00 |
| abr/2026 | 3 | 230 | 1 | 0 | 0 | 0,000% | n/d | R$ 14,72 | n/d |
| **Média dos meses com disparo** | **4** | **2.180** | **230** | **220** | **154** | **7,1%** | **70,2%** | **R$ 314,74** | **R$ 2,04** |
| Total do período | 8 | 4.360 | 459 | 439 | 308 | 7,1% | 70,2% | R$ 629,48 | R$ 2,04 |

Como ler:
- Em ago/2025, 5 linhas fizeram 308 cartões a CAC de R$ 2,00: uma recuperação muito eficiente.
- Em abr/2026, 3 linhas (Proprietária, Plurix e Bem Barato, todas em 08/04) não fizeram cartão.
- Com só dois episódios, média não diz muito: cada incidente é um caso.

## Por que esse público importa

Quando o fluxo de pedido falha, quem estava no meio do pedido tem intenção alta e perdeu o caminho. Recontatar rápido recupera cartão a custo baixo, como em ago/2025.

## Pra quem é e quando entra

Quem estava pedindo o cartão durante um incidente do fluxo. A população afetada depende de cada incidente e precisa ser confirmada caso a caso.

## Régua

Não há régua fixa: o disparo é pontual, logo depois do incidente, por SMS, WhatsApp ou Push.

## O que pode e não pode dizer

Valem as regras gerais de [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]]. A mensagem não deve prometer aprovação por causa da falha.

## Como medir sem cair em armadilha

- O nome "Instabilidade" tem dois sentidos no vault: aqui, recuperação depois de incidente; no [[01-Conceitos/Funil-AARRR|Funil AARRR]], "quarentena" (descanso forçado depois de N ações sem resposta). Confirmar qual vale antes de classificar.
- No gráfico do Relatório, `Instabilidade` aparece como série solta na legenda porque não está na lista de rótulos dos segmentos.
- Confirmar o incidente, a população afetada e se a recuperação é mensurável antes de comparar com outros públicos.
- Regras gerais de leitura: [[09-Inteligencia-IA/Fontes-e-Proveniencia-Growth|Fontes e proveniência]] e [[07-Evolucao/Resultados-Qualidade-e-Cobertura|Qualidade e cobertura]].

## Resultado ao vivo

O bloco de resultado desta página (configurado no `analytics` do topo) consulta `activities` ao vivo, para o público inteiro.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Por parceiro

Registro do inventário de 03/10/2026 (linhas e período observados naquela data). Os números do trimestre estão em Principais números, acima.

| Variante | BU | Parceiro | Subgrupos | Canais | Linhas no inventário | Período observado | Situação |
|---|---|---|---|---|---:|---|---|
| Recuperação após instabilidade | B2C | Serasa | N/A | SMS, WhatsApp | 4 | 07/08/2025 a 21/08/2025 | candidata |
| Recuperação após instabilidade | B2C | Proprietaria | N/A | Push, SMS | 2 | 26/08/2025 a 08/04/2026 | candidata |
| Recuperação após instabilidade | Plurix | N/A | N/A | SMS | 1 | só 08/04/2026 | candidata |
| Recuperação após instabilidade | B2B2C | Bem Barato | N/A | SMS | 1 | só 08/04/2026 | candidata |

Resultado ao vivo de cada combinação, enquanto o filtro por parceiro dentro desta página não fica pronto: [[07-Evolucao/Assunto-CRM-6e7d329c84|Serasa]] · [[07-Evolucao/Assunto-CRM-798bf8f3a7|Proprietaria]] · [[07-Evolucao/Assunto-CRM-ac74764beb|N/A]] · [[07-Evolucao/Assunto-CRM-cc03a5f98d|Bem Barato]].

Visão de cada parceiro: [[10-Resultados/Parceiros/Serasa|Serasa]] · [[10-Resultados/Parceiros/Proprietaria|Proprietária]] · [[10-Resultados/Parceiros/Plurix|Plurix]] · [[10-Resultados/Parceiros/Bem-Barato|Bem Barato]]

## O que já aprendemos

- O caso de ago/2025 (308 cartões a CAC de R$ 2,00) mostra que recontato rápido depois de falha pode ser o disparo mais barato do CRM. Ainda não validado como aprendizado.

Para registrar uma decisão ou aposta: [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Qual foi o incidente de ago/2025 e o de abr/2026? | sem contexto, o número não ensina | registro dos incidentes | a confirmar |
| "Instabilidade" é recuperação de incidente ou quarentena? | classificação errada | decisão de taxonomia | Pablo |
| Existe um gatilho automático para incidente? | recuperação depende de alguém lembrar | processo com produto e tecnologia | a confirmar |

## Onde mais este público aparece

Estas notas tratam de outros assuntos e também falam deste público. Elas continuam no lugar:

- [[01-Conceitos/Funil-AARRR|Funil AARRR]] (o outro sentido do nome).
- [[04-Operacao/Fabrica-de-Emails-GaaS|Fábrica de e-mails]] (segmento cadastrado) e [[98-Legado/03-Dimensoes/Segmentos|Segmentos]].

## Relacionado

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

Números de antes, preservados com a data e a fonte de cada um. Eles não batem entre si porque usam bases e métodos diferentes.

### Dimensão Segmentos, 10/06/2026

> 📊 Snapshot 2026-06-10. Também: Rentabilizacao (65), Cartonistas (30), Recencia de Compra (26), Instabilidade (8). ⚠️ Base re-ingerida vs 06-08 — taxas de conversão recuaram em bloco; a hierarquia entre segmentos se mantém.

## Registro histórico: série e retrospectivas (consulta de 03/10/2026)

Conteúdo integral da antiga nota `Resultados-CRM-Instabilidade`, gerada em 03/10/2026. Os números são daquela data; o resultado atual vem do bloco ao vivo.

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

### Contexto do segmento

Filtro exato: `Segmento = Instabilidade`; parceiro usa `parceiro_canonico`. Abrange todas as BUs e canais registrados neste segmento; não representa pessoas únicas nem um experimento. Consulte [[Segmentos]] e [[Parceiros]].

**Valores observados, sem deduplicação automática.** Cartões e propostas somam apenas valores presentes. A cobertura por campo e as chaves repetidas condicionam qualquer comparação. Não calcular CAC ou funil com subconjuntos diferentes.

### Evolução do segmento geral

| Mês | Linhas | Dias com registros | Cartões observados | Cobertura de cartões | Propostas observadas | Cobertura de propostas | Linhas com chave repetida | Retrospectiva |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 2025-08 | 5 | 5 | 308 | 5/5 | 458 | 4/5 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2026-04 | 3 | 1 | 0 | 3/3 | 1 | 1/3 | 0 | [[#Retrospectiva 2026-04|ler junto]] |

### Segmento por parceiro e mês

Leia cada parceiro junto da retrospectiva do mesmo mês abaixo. Uma combinação ausente na tabela não equivale a zero. N/A indica classificação registrada, não um parceiro confirmado.

| Mês | Parceiro canônico | Linhas | Dias | Cartões observados | Cobertura de cartões | Chaves repetidas: linhas | Retrospectiva |
|---|---|---:|---:|---:|---:|---:|---|
| 2025-08 | Proprietaria | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2025-08 | Serasa | 4 | 4 | 308 | 4/4 | 0 | [[#Retrospectiva 2025-08|ler junto]] |
| 2026-04 | Bem Barato | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | N/A | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2026-04|ler junto]] |
| 2026-04 | Proprietaria | 1 | 1 | 0 | 1/1 | 0 | [[#Retrospectiva 2026-04|ler junto]] |

### Retrospectivas integradas

#### Retrospectiva 2025-08

- **Observação:** segmento geral com 308 cartões observados; 2 classificações de parceiro registradas; registros entre 2025-08-07 e 2025-08-26, em 5 dias distintos.
- **Cobertura:** 5 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Proprietaria:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Serasa:** 308 cartões em 4/4 linhas; 4 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

#### Retrospectiva 2026-04

- **Observação:** segmento geral com 0 cartões observados; 3 classificações de parceiro registradas; registros entre 2026-04-08 e 2026-04-08, em 1 dias distintos.
- **Cobertura:** 3 linhas; a presença de dias não certifica completude da operação ou maturação do resultado.
- **Interpretação:** pendente de revisão do contexto operacional e do mês anterior equivalente.
- **Aprendizado:** não validado. Uma mudança na série isoladamente não estabelece causa.
- **Próxima verificação proposta:** conferir lacunas e alterações de execução, público e definição antes de abrir uma aposta.
- **Decisão, responsável e outcome:** ainda não registrados nesta retrospectiva. Usar [[Retrospectiva-Mensal-Growth]] e [[Loop-de-Aprendizado-Growth]] para completar a revisão.

**Leitura por parceiro neste mês:**
- **Bem Barato:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **N/A:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.
- **Proprietaria:** 0 cartões em 1/1 linhas; 1 dias, 0 linhas com chave repetida. Mudança de mix e efeito do parceiro: interpretação pendente.

### Conexões

[[Historico-Resultados-CRM|Voltar ao histórico geral]] · [[Resultados-CRM]] · [[Resultados-Qualidade-e-Cobertura]] · [[Retrospectiva-Mensal-Growth]].

## Detalhe das variantes por parceiro

Registro do inventário de 03/10/2026: conteúdo integral das notas de assunto, uma por variante, mais a lista do antigo hub.

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-cc03a5f98d]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-798bf8f3a7]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-6e7d329c84]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-ac74764beb]] | Escopo candidato de operação | activities |

### Serasa (B2C), CRM-6e7d329c84

#### O que este assunto representa

Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Serasa |
| segment | Instabilidade |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Classic"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Em dobro", "N/A"] |

**O que precisa ser validado:** Confirmar incidente, população afetada e se houve recuperação mensurável.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-3726b57005 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-e139ac6be4 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO _200_VIBES | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-9522c7e2d0 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO _200_VIBES_RPK | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-5d20d0099e | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO_RPK | 2025-08 | Meio_de_Funil | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-6e7d329c84 |
| Fonte | activities |
| Linhas no corte do inventário | 4 |
| Primeira data observada | 2025-08-07 |
| Última data observada | 2025-08-21 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Parceiro-Serasa|Visão do parceiro]] · [[07-Evolucao/Segmento-Instabilidade|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-6e7d329c84",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Recuperação após instabilidade — Serasa — B2C",
  "family": "Recuperação após instabilidade",
  "bu": "B2C",
  "partner": "Serasa",
  "segment": "Instabilidade",
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
    "Em dobro",
    "N/A"
  ],
  "records": 4,
  "first_date": "2025-08-07",
  "last_date": "2025-08-21",
  "observed_months": [
    "2025-08"
  ],
  "physical_combinations": 1,
  "journey_count": 4,
  "activity_name_count": 4,
  "definition": "Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Confirmar incidente, população afetada e se houve recuperação mensurável.",
  "flags": [],
  "name_signals": [
    "Incidente/erro"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Instabilidade",
    "partner": "Serasa"
  }
}
```

### Proprietaria (B2C), CRM-798bf8f3a7

#### O que este assunto representa

Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Proprietaria |
| segment | Instabilidade |
| stages | ["Meio_de_Funil", "Reativacao"] |
| subgroups | ["N/A"] |
| channels | ["Push", "SMS"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["N/A", "Padrao"] |

**O que precisa ser validado:** Confirmar incidente, população afetada e se houve recuperação mensurável.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-cbd7390844 | JOR_AQUISICAO_B2C_ERRO_AGOSTO_2608 | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-256991b847 | JOR_AQUISICAO_ERRO_APP_ABRIL_2026 | 2026-04 | Reativacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Mais de uma etapa física no escopo

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-798bf8f3a7 |
| Fonte | activities |
| Linhas no corte do inventário | 2 |
| Primeira data observada | 2025-08-26 |
| Última data observada | 2026-04-08 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Parceiro-Proprietaria|Visão do parceiro]] · [[07-Evolucao/Segmento-Instabilidade|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-798bf8f3a7",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Recuperação após instabilidade — Proprietaria — B2C",
  "family": "Recuperação após instabilidade",
  "bu": "B2C",
  "partner": "Proprietaria",
  "segment": "Instabilidade",
  "stages": [
    "Meio_de_Funil",
    "Reativacao"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "Push",
    "SMS"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Mar_aberto",
    "Whitelist"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "N/A",
    "Padrao"
  ],
  "records": 2,
  "first_date": "2025-08-26",
  "last_date": "2026-04-08",
  "observed_months": [
    "2025-08",
    "2026-04"
  ],
  "physical_combinations": 2,
  "journey_count": 2,
  "activity_name_count": 2,
  "definition": "Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Confirmar incidente, população afetada e se houve recuperação mensurável.",
  "flags": [
    "Mais de uma etapa física no escopo"
  ],
  "name_signals": [
    "Incidente/erro"
  ],
  "scope_key": {
    "bu": "B2C",
    "segment": "Instabilidade",
    "partner": "Proprietaria"
  }
}
```

### N/A (Plurix), CRM-ac74764beb

#### O que este assunto representa

Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | Instabilidade |
| stages | ["Reativacao"] |
| subgroups | ["N/A"] |
| channels | ["SMS"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["Padrao"] |

**O que precisa ser validado:** Confirmar incidente, população afetada e se houve recuperação mensurável.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-799d611e25 | JOR_AQUISICAO_ERRO_APP_ABRIL_2026 | 2026-04 | Reativacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro não resolvido

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-ac74764beb |
| Fonte | activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-04-08 |
| Última data observada | 2026-04-08 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Segmento-Instabilidade|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-ac74764beb",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Recuperação após instabilidade — N/A — Plurix",
  "family": "Recuperação após instabilidade",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": "Instabilidade",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "SMS"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Whitelist"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "Padrao"
  ],
  "records": 1,
  "first_date": "2026-04-08",
  "last_date": "2026-04-08",
  "observed_months": [
    "2026-04"
  ],
  "physical_combinations": 1,
  "journey_count": 1,
  "activity_name_count": 1,
  "definition": "Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Confirmar incidente, população afetada e se houve recuperação mensurável.",
  "flags": [
    "Parceiro não resolvido"
  ],
  "name_signals": [
    "Incidente/erro"
  ],
  "scope_key": {
    "bu": "Plurix",
    "segment": "Instabilidade",
    "partner": "N/A"
  }
}
```

### Bem Barato (B2B2C), CRM-cc03a5f98d

#### O que este assunto representa

Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Instabilidade |
| stages | ["Reativacao"] |
| subgroups | ["N/A"] |
| channels | ["SMS"] |
| products | ["Classic"] |
| offers | ["Padrao"] |
| promotions | ["Padrao"] |

**O que precisa ser validado:** Confirmar incidente, população afetada e se houve recuperação mensurável.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-3afd9ab415 | JOR_AQUISICAO_ERRO_APP_ABRIL_2026 | 2026-04 | Reativacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-cc03a5f98d |
| Fonte | activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-04-08 |
| Última data observada | 2026-04-08 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Instabilidade|Visão do segmento]]

#### Registro de descoberta

```json
{
  "id": "CRM-cc03a5f98d",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Recuperação após instabilidade — Bem Barato — B2B2C",
  "family": "Recuperação após instabilidade",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Instabilidade",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "SMS"
  ],
  "products": [
    "Classic"
  ],
  "credit_profiles": [
    "Whitelist"
  ],
  "offers": [
    "Padrao"
  ],
  "promotions": [
    "Padrao"
  ],
  "records": 1,
  "first_date": "2026-04-08",
  "last_date": "2026-04-08",
  "observed_months": [
    "2026-04"
  ],
  "physical_combinations": 1,
  "journey_count": 1,
  "activity_name_count": 1,
  "definition": "Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Segmentos.md",
  "validation": "Confirmar incidente, população afetada e se houve recuperação mensurável.",
  "flags": [],
  "name_signals": [
    "Incidente/erro"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Instabilidade",
    "partner": "Bem Barato"
  }
}
```
