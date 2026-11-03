---
title: "Carrinho de Seguro Mulher — Seguros"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Abandonado", "segmento:Seguro", "bu:Seguros"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-613bd68a2c"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "Seguros", "operation_id": "RENT-613bd68a2c"}, "any_of": [{"segment": "Abandonado", "partner": "N/A", "subgroup": "Carrinho Seguro Mulher", "stage": "Rentabilizacao", "journey": "JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_JUN26", "safra": ""}, {"segment": "Abandonado", "partner": "N/A", "subgroup": "Carrinho Seguro Mulher", "stage": "Rentabilizacao", "journey": "JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26", "safra": ""}, {"segment": "Seguro", "partner": "N/A", "subgroup": "Carrinho Seguro Mulher", "stage": "Rentabilizacao", "journey": "JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26", "safra": ""}]}
---

# Carrinho de Seguro Mulher — Seguros

## O que este assunto representa

Recuperação de seguro indicada no nome e subgrupo.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Seguros |
| partner | N/A |
| segment | ["Abandonado", "Seguro"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Carrinho Seguro Mulher"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Carrinho Seguro Mulher", "Cartao"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-6b16afddc2 | JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_JUN26 |  | Rentabilizacao | Carrinho Seguro Mulher | 69 |
| RENTC-ed3e246577 | JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26 |  | Rentabilizacao | Carrinho Seguro Mulher | 120 |
| RENTC-5fde571620 | JOR_RENTABILIZACAO_CARRINHO_B2C_SEGURO_MULHER_MAR26 |  | Rentabilizacao | Carrinho Seguro Mulher | 183 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado
- Família reúne mais de um segmento físico; revisar equivalência

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-613bd68a2c |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 372 |
| Primeira data observada | 2026-03-05 |
| Última data observada | 2026-08-23 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

## Registro de descoberta

```json
{
  "id": "RENT-613bd68a2c",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Carrinho de Seguro Mulher — Seguros",
  "family": "Carrinho de Seguro Mulher",
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
    "Carrinho Seguro Mulher"
  ],
  "channels": [
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Carrinho Seguro Mulher",
    "Cartao"
  ],
  "records": 372,
  "first_date": "2026-03-05",
  "last_date": "2026-08-23",
  "campaign_clusters": 3,
  "journey_count": 2,
  "definition": "Recuperação de seguro indicada no nome e subgrupo.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado",
    "Família reúne mais de um segmento físico; revisar equivalência"
  ]
}
```
