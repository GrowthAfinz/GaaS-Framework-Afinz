---
title: "Cadastro pontual — B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Rentabilização", "bu:B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-7cfb8b35bf"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "B2C", "operation_id": "RENT-7cfb8b35bf"}, "any_of": [{"segment": "Rentabilização", "partner": "N/A", "subgroup": "N/A", "stage": "Rentabilizacao", "journey": "JOR_RENTABILIZACAO_CADASTRO_PONTUAL", "safra": ""}]}
---

# Cadastro pontual — B2C

## O que este assunto representa

Comunicação pontual de cadastro, com mecanismo a esclarecer.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | N/A |
| segment | ["Rentabilização"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["N/A"] |
| channels | ["E-mail"] |
| products | ["Pontual"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-b101cb7218 | JOR_RENTABILIZACAO_CADASTRO_PONTUAL |  | Rentabilizacao | N/A | 16 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-7cfb8b35bf |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 16 |
| Primeira data observada | 2026-07-10 |
| Última data observada | 2026-08-03 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/04-Operacao/Originação-B2C|Definição relacionada]]

## Registro de descoberta

```json
{
  "id": "RENT-7cfb8b35bf",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Cadastro pontual — B2C",
  "family": "Cadastro pontual",
  "bu": "B2C",
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
    "Pontual"
  ],
  "records": 16,
  "first_date": "2026-07-10",
  "last_date": "2026-08-03",
  "campaign_clusters": 1,
  "journey_count": 1,
  "definition": "Comunicação pontual de cadastro, com mecanismo a esclarecer.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "04-Operacao/Originação-B2C.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado"
  ]
}
```
