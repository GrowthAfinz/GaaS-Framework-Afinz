---
title: "Teste nomeado — Plurix"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Ativação", "bu:Plurix"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-5051e37f02"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "Plurix", "operation_id": "RENT-5051e37f02"}, "any_of": [{"segment": "Ativação", "partner": "N/A", "subgroup": "Copa", "stage": "Rentabilizacao", "journey": "JOR_ATIVACAO_PLURIX_COPA_TEST_SEM1 (Copiar)", "safra": ""}]}
---

# Teste nomeado — Plurix

## O que este assunto representa

Execução com nome de teste; revisar papel e público real.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

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

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-84cd496c21 | JOR_ATIVACAO_PLURIX_COPA_TEST_SEM1 (Copiar) |  | Rentabilizacao | Copa | 1 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado
- Revisar execução de teste antes de incluir em resultado comercial

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-5051e37f02 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-05-27 |
| Última data observada | 2026-05-27 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

## Registro de descoberta

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
