---
title: "Desbloqueio pós-tombamento — Plurix"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Desbloqueio", "bu:Plurix"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-f73bceeb96"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "Plurix", "operation_id": "RENT-f73bceeb96"}, "any_of": [{"segment": "Desbloqueio", "partner": "N/A", "subgroup": "Pós-Tombamento", "stage": "Rentabilizacao", "journey": "JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO", "safra": ""}, {"segment": "Desbloqueio", "partner": "N/A", "subgroup": "Pós-Tombamento", "stage": "Rentabilizacao", "journey": "JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO_MAIO", "safra": ""}]}
---

# Desbloqueio pós-tombamento — Plurix

## O que este assunto representa

Desbloqueio após migração, indicado na jornada.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | Plurix |
| partner | N/A |
| segment | ["Desbloqueio"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Pós-Tombamento"] |
| channels | ["WhatsApp"] |
| products | ["Cartao", "Desbloqueio Pos-Tombamento"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-c780d8361c | JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO |  | Rentabilizacao | Pós-Tombamento | 20 |
| RENTC-3c6757f38d | JOR_POS_TOMBAMENTO_DESBLOQUEIO_PLURIX_MAISAMIGO_MAIO |  | Rentabilizacao | Pós-Tombamento | 14 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-f73bceeb96 |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 34 |
| Primeira data observada | 2025-11-07 |
| Última data observada | 2026-06-04 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia|Definição relacionada]]

## Registro de descoberta

```json
{
  "id": "RENT-f73bceeb96",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Desbloqueio pós-tombamento — Plurix",
  "family": "Desbloqueio pós-tombamento",
  "bu": "Plurix",
  "partner": "N/A",
  "segment": [
    "Desbloqueio"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "Pós-Tombamento"
  ],
  "channels": [
    "WhatsApp"
  ],
  "products": [
    "Cartao",
    "Desbloqueio Pos-Tombamento"
  ],
  "records": 34,
  "first_date": "2025-11-07",
  "last_date": "2026-06-04",
  "campaign_clusters": 2,
  "journey_count": 2,
  "definition": "Desbloqueio após migração, indicado na jornada.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado"
  ]
}
```
