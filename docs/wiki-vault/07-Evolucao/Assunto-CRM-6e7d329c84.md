---
title: "Recuperação após instabilidade — Serasa — B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Aquisição", "parceiro:Serasa", "segmento:Instabilidade", "bu:B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "activities"
inventory_id: "CRM-6e7d329c84"
inventory_date: "2026-10-03"
analytics: {"domain": "crm", "scope": {"bu": "B2C", "segment": "Instabilidade", "partner": "Serasa", "operation_id": "CRM-6e7d329c84"}}
---

# Recuperação após instabilidade — Serasa — B2C

## O que este assunto representa

Contato ligado a erro/instabilidade, indicado pelas jornadas registradas.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

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

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-3726b57005 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-e139ac6be4 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO _200_VIBES | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-9522c7e2d0 | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO _200_VIBES_RPK | 2025-08 | Meio_de_Funil | N/A | 1 |
| CAMP-5d20d0099e | JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO_RPK | 2025-08 | Meio_de_Funil | N/A | 1 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-6e7d329c84 |
| Fonte | activities |
| Linhas no corte do inventário | 4 |
| Primeira data observada | 2025-08-07 |
| Última data observada | 2025-08-21 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Segmentos|Definição relacionada]] · [[07-Evolucao/Parceiro-Serasa|Visão do parceiro]] · [[07-Evolucao/Segmento-Instabilidade|Visão do segmento]]

## Registro de descoberta

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
