---
title: "Acionamento por compra recente — Plurix — Plurix"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Aquisição", "parceiro:Plurix", "segmento:Recencia_de_Compra", "bu:Plurix"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "activities"
inventory_id: "CRM-4b4cf35f73"
inventory_date: "2026-10-03"
analytics: {"domain": "crm", "scope": {"bu": "Plurix", "segment": "Recencia_de_Compra", "partner": "Plurix", "operation_id": "CRM-4b4cf35f73"}}
---

# Acionamento por compra recente — Plurix — Plurix

## O que este assunto representa

Recorte Compradores D-7 registrado na aquisição.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

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

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-f86b03709d | JOR_AQUISICAO_PLURIX_CLUBE_BOA_PADRAO_NA_FEV26 | 2026-02 | Aquisicao | Compradores D-7 | 6 |
| CAMP-e166088628 | JOR_AQUISICAO_PLURIX_RECENCIA_AQUISICAO_PADRAO_COPA_ABRI26 | 2026-04 | Aquisicao | Compradores D-7 | 3 |
| CAMP-fcd9c6a8a2 | JOR_AQUISICAO_PLURIX_RECENCIA_AQUISICAO_PADRAO_NA_ABRI26 | 2026-04 | Aquisicao | Compradores D-7 | 9 |
| CAMP-cd2f1ee3b7 | JOR_AQUISICAO_PLURIX_RECENCIA_BOA_PADRAO_NA_MAR26 | 2026-03 | Aquisicao | Compradores D-7 | 11 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-4b4cf35f73 |
| Fonte | activities |
| Linhas no corte do inventário | 29 |
| Primeira data observada | 2026-02-20 |
| Última data observada | 2026-04-28 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Subgrupos|Definição relacionada]] · [[07-Evolucao/Parceiro-Plurix|Visão do parceiro]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Visão do segmento]]

## Registro de descoberta

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
