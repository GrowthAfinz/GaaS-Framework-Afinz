---
title: "Acionamento por compra recente — Bem Barato — B2B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Aquisição", "parceiro:Bem Barato", "segmento:Recencia_de_Compra", "bu:B2B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "activities"
inventory_id: "CRM-f5ee848cf4"
inventory_date: "2026-10-03"
analytics: {"domain": "crm", "scope": {"bu": "B2B2C", "segment": "Recencia_de_Compra", "partner": "Bem Barato", "operation_id": "CRM-f5ee848cf4"}}
---

# Acionamento por compra recente — Bem Barato — B2B2C

## O que este assunto representa

Recorte Compradores D-7 registrado na aquisição.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

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

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-74b240359b | JOR_AQUISICAO_BB_RECENCIA_AQUISICAO_PADRAO_COPA_MAI26 | 2026-05 | Aquisicao | Compradores D-7 | 1 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-f5ee848cf4 |
| Fonte | activities |
| Linhas no corte do inventário | 1 |
| Primeira data observada | 2026-05-06 |
| Última data observada | 2026-05-06 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Subgrupos|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Visão do segmento]]

## Registro de descoberta

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
