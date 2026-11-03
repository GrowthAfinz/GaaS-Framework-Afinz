---
title: "Teste nomeado — Seguros"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Abandonado", "segmento:Seguro", "bu:Seguros"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-929cf587a1"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "Seguros", "operation_id": "RENT-929cf587a1"}, "any_of": [{"segment": "Abandonado", "partner": "N/A", "subgroup": "Carrinho Seguro Mulher", "stage": "Rentabilizacao", "journey": "teste_JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26", "safra": ""}, {"segment": "Seguro", "partner": "N/A", "subgroup": "Seguro Mulher", "stage": "Rentabilizacao", "journey": "TESTE_JOR_RENTABILIZACAO_B2C_SEGURO_LP", "safra": ""}]}
---

# Teste nomeado — Seguros

## O que este assunto representa

Execução com nome de teste; revisar papel e público real.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

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

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-bf7d3dfb8a | teste_JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26 |  | Rentabilizacao | Carrinho Seguro Mulher | 1 |
| RENTC-3c7294816a | TESTE_JOR_RENTABILIZACAO_B2C_SEGURO_LP |  | Rentabilizacao | Seguro Mulher | 2 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado
- Revisar execução de teste antes de incluir em resultado comercial
- Família reúne mais de um segmento físico; revisar equivalência

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-929cf587a1 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 3 |
| Primeira data observada | 2026-06-11 |
| Última data observada | 2026-06-16 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

## Registro de descoberta

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
