---
title: "Comunicados operacionais e testes"
tipo: mecanica
camada: resultados
dominio: rentabilizacao
bus: [Plurix, Seguros]
status: ativo
atualizado: 2026-10-29
fonte: consolidacao-wiki-2026-10-29
tags: [mecanica, rentabilizacao, resultados, growth]
analytics: {"domain": "renta", "scope": {}, "any_of": [{"segment": "Rentabilização", "partner": "N/A", "subgroup": "N/A", "stage": "Rentabilizacao", "journey": "JOR_RENTABILIZACAO_INFORMATIVO_ENCERRAMENTO_PONTOS", "safra": ""}, {"segment": "Ativação", "partner": "N/A", "subgroup": "Copa", "stage": "Rentabilizacao", "journey": "JOR_ATIVACAO_PLURIX_COPA_TEST_SEM1 (Copiar)", "safra": ""}, {"segment": "Desbloqueio", "partner": "N/A", "subgroup": "Plurix Mais Amigo", "stage": "Rentabilizacao", "journey": "JOR_ATIVACAO_DESBLOQUEIO_PLURIX_MAISAMIGO_SEEDLIST", "safra": ""}, {"segment": "Abandonado", "partner": "N/A", "subgroup": "Carrinho Seguro Mulher", "stage": "Rentabilizacao", "journey": "teste_JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26", "safra": ""}, {"segment": "Seguro", "partner": "N/A", "subgroup": "Seguro Mulher", "stage": "Rentabilizacao", "journey": "TESTE_JOR_RENTABILIZACAO_B2C_SEGURO_LP", "safra": ""}]}
---

# Comunicados operacionais e testes

## Em uma frase

O que está registrado como rentabilização mas não é campanha: comunicados operacionais (encerramento de pontos), testes nomeados e seedlists. Fica separado para não distorcer as outras mecânicas.

## Principais números: últimos meses com disparo (mai/2026, jun/2026, jul/2026)

> 📊 Consulta em `rentabilizacao_activities` de 29/10/2026, por mês da data de disparo, somando as linhas cobertas pelos assuntos desta página. Rentabilização mede contato, não resultado: base, abertura e clique. Abertura e clique só existem em parte das linhas; as taxas usam como denominador a base das linhas que têm o dado. Custo quase não é registrado nesta tabela, por isso não há custo por clique.

| Mês | Disparos | Base acionável | Aberturas | Aberturas/base | Cliques | Cliques/base | Linhas com clique registrado |
|---|---:|---:|---:|---:|---:|---:|---:|
| mai/2026 | 1 | 8 | 6 | 75,0% | 0 | n/d | 0 de 1 |
| jun/2026 | 58 | 20.948 | 12.799 | 61,1% | 5 | 31,2% | 2 de 58 |
| jul/2026 | 1 | 18.181 | 405 | 2,2% | 3 | 0,017% | 1 de 1 |
| **Média mensal** | **20** | **13.046** | **4.403** | **33,8%** | **3** | **0,044%** | **1 de 20** |
| Total do período | 60 | 39.137 | 13.210 | 33,8% | 8 | 0,044% | 3 de 60 |

Por BU, no mesmo período:

| BU | Disparos | Base acionável | Aberturas | Aberturas/base | Cliques | Cliques/base | Linhas com clique registrado |
|---|---:|---:|---:|---:|---:|---:|---:|
| Plurix | 57 | 39.115 | 13.192 | 33,7% | 3 | 0,017% | 1 de 57 |
| Seguros | 3 | 22 | 18 | 81,8% | 5 | 31,2% | 2 de 3 |

Como ler:
- Os 561 disparos daqui são quase todos testes e seedlists; não somar com as mecânicas.
- Em out/2026 entraram nesta tabela 10 linhas de teste de uma jornada de **aquisição** (`TESTE_JOR_AQS_PLURIX_NA_CRM_AQUISICAO_PAD_PAD_SEM1`). Elas não pertencem a nenhum assunto e estão no lugar errado.
- Clique e abertura medem atenção à mensagem. Não provam uso, desbloqueio, venda de seguro nem receita.

## Variantes

Cada linha é um assunto do inventário de 03/10/2026; o conteúdo integral está no fim da página.

| Variante | BU | Disparos (série toda) | Período observado |
|---|---|---:|---|
| Seedlist nomeada | Plurix | 556 | 19/11/2025 a 11/06/2026 |
| Teste nomeado | Seguros | 3 | 11/06/2026 a 16/06/2026 |
| Informativo de encerramento de pontos | Plurix | 1 | 01/07/2026 a 01/07/2026 |
| Teste nomeado | Plurix | 1 | 27/05/2026 a 27/05/2026 |

Resultado ao vivo de cada variante: [[07-Evolucao/Assunto-RENT-16761c8a3a|Informativo de encerramento de pontos]] · [[07-Evolucao/Assunto-RENT-5051e37f02|Teste nomeado]] · [[07-Evolucao/Assunto-RENT-6afea2d2e0|Seedlist nomeada]] · [[07-Evolucao/Assunto-RENT-929cf587a1|Teste nomeado]].

## Como medir sem cair em armadilha

- Em rentabilização, usar só base, disparos, entrega, abertura e clique ([[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Dossiê Mestre]]).
- Abertura e clique faltam em muitas linhas: nunca tratar falta como zero.
- A jornada é a chave de cada variante; o mesmo segmento (`Ativação`, `Rentabilização`) aparece em mecânicas diferentes.

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Excluir testes e seedlists da ingestão automaticamente | testes inflam a rentabilização | regra no importador | a confirmar |
| As 10 linhas de teste de aquisição de out/2026 devem sair de `rentabilizacao_activities`? | dado de aquisição no lugar errado | conferir com quem fez a carga | Pablo |

## Relacionado

[[10-Resultados/Dominios/Dominio-Rentabilizacao|Rentabilização]] · [[02-Entidades-Dados/rentabilizacao_activities|rentabilizacao_activities]] · [[08-Engenharia/Export-XLSX-Renta-Copa|Export XLSX de rentabilização]]

---

## Detalhe das variantes

Registro do inventário de 03/10/2026: conteúdo integral de cada nota de assunto.

### Informativo de encerramento de pontos, Plurix (RENT-16761c8a3a)

#### O que este assunto representa

Comunicação informativa nomeada; não equivale a campanha de conversão.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | ["Rentabilização"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["N/A"] |
| channels | ["E-mail"] |
| products | ["Encerramento Pontos"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-3c58639a3f | JOR_RENTABILIZACAO_INFORMATIVO_ENCERRAMENTO_PONTOS |  | Rentabilizacao | N/A | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro literal N/A preservado

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-16761c8a3a |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-07-01 |
| Última data observada | 2026-07-01 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

#### Registro de descoberta

```json
{
  "id": "RENT-16761c8a3a",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Informativo de encerramento de pontos — Plurix",
  "family": "Informativo de encerramento de pontos",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": [
    "Rentabilização"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "N/A"
  ],
  "channels": [
    "E-mail"
  ],
  "products": [
    "Encerramento Pontos"
  ],
  "records": 1,
  "first_date": "2026-07-01",
  "last_date": "2026-07-01",
  "campaign_clusters": 1,
  "journey_count": 1,
  "definition": "Comunicação informativa nomeada; não equivale a campanha de conversão.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado"
  ]
}
```

### Teste nomeado, Plurix (RENT-5051e37f02)

#### O que este assunto representa

Execução com nome de teste; revisar papel e público real.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | ["Ativação"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Copa"] |
| channels | ["WhatsApp"] |
| products | ["Cartao"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-84cd496c21 | JOR_ATIVACAO_PLURIX_COPA_TEST_SEM1 (Copiar) |  | Rentabilizacao | Copa | 1 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro literal N/A preservado
- Revisar execução de teste antes de incluir em resultado comercial

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-5051e37f02 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-05-27 |
| Última data observada | 2026-05-27 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

#### Registro de descoberta

```json
{
  "id": "RENT-5051e37f02",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Teste nomeado — Plurix",
  "family": "Teste nomeado",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": [
    "Ativação"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "Copa"
  ],
  "channels": [
    "WhatsApp"
  ],
  "products": [
    "Cartao"
  ],
  "records": 1,
  "first_date": "2026-05-27",
  "last_date": "2026-05-27",
  "campaign_clusters": 1,
  "journey_count": 1,
  "definition": "Execução com nome de teste; revisar papel e público real.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado",
    "Revisar execução de teste antes de incluir em resultado comercial"
  ]
}
```

### Seedlist nomeada, Plurix (RENT-6afea2d2e0)

#### O que este assunto representa

Execução marcada seedlist; não certificar produção comercial.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | ["Desbloqueio"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Plurix Mais Amigo"] |
| channels | ["E-mail", "WhatsApp"] |
| products | ["Desbloqueio Plurix Mais Amigo"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-34ae3227d9 | JOR_ATIVACAO_DESBLOQUEIO_PLURIX_MAISAMIGO_SEEDLIST |  | Rentabilizacao | Plurix Mais Amigo | 556 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro literal N/A preservado
- Revisar execução de teste antes de incluir em resultado comercial

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-6afea2d2e0 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 556 |
| Primeira data observada | 2025-11-19 |
| Última data observada | 2026-06-11 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

#### Registro de descoberta

```json
{
  "id": "RENT-6afea2d2e0",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Seedlist nomeada — Plurix",
  "family": "Seedlist nomeada",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": [
    "Desbloqueio"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "Plurix Mais Amigo"
  ],
  "channels": [
    "E-mail",
    "WhatsApp"
  ],
  "products": [
    "Desbloqueio Plurix Mais Amigo"
  ],
  "records": 556,
  "first_date": "2025-11-19",
  "last_date": "2026-06-11",
  "campaign_clusters": 1,
  "journey_count": 1,
  "definition": "Execução marcada seedlist; não certificar produção comercial.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado",
    "Revisar execução de teste antes de incluir em resultado comercial"
  ]
}
```

### Teste nomeado, Seguros (RENT-929cf587a1)

#### O que este assunto representa

Execução com nome de teste; revisar papel e público real.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

#### Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Seguros |
| partner | N/A |
| segment | ["Abandonado", "Seguro"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Carrinho Seguro Mulher", "Seguro Mulher"] |
| channels | ["E-mail", "WhatsApp"] |
| products | ["Carrinho Seguro Mulher", "Seguro Mulher"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

#### Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-bf7d3dfb8a | teste_JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26 |  | Rentabilizacao | Carrinho Seguro Mulher | 1 |
| RENTC-3c7294816a | TESTE_JOR_RENTABILIZACAO_B2C_SEGURO_LP |  | Rentabilizacao | Seguro Mulher | 2 |

#### Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

#### Pendências específicas

- Parceiro literal N/A preservado
- Revisar execução de teste antes de incluir em resultado comercial
- Família reúne mais de um segmento físico; revisar equivalência

#### Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-929cf587a1 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 3 |
| Primeira data observada | 2026-06-11 |
| Última data observada | 2026-06-16 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

#### Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

#### Registro de descoberta

```json
{
  "id": "RENT-929cf587a1",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Teste nomeado — Seguros",
  "family": "Teste nomeado",
  "bu": "Seguros",
  "partner": "N/A",
  "segment": [
    "Abandonado",
    "Seguro"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "Carrinho Seguro Mulher",
    "Seguro Mulher"
  ],
  "channels": [
    "E-mail",
    "WhatsApp"
  ],
  "products": [
    "Carrinho Seguro Mulher",
    "Seguro Mulher"
  ],
  "records": 3,
  "first_date": "2026-06-11",
  "last_date": "2026-06-16",
  "campaign_clusters": 2,
  "journey_count": 2,
  "definition": "Execução com nome de teste; revisar papel e público real.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado",
    "Revisar execução de teste antes de incluir em resultado comercial",
    "Família reúne mais de um segmento físico; revisar equivalência"
  ]
}
```
