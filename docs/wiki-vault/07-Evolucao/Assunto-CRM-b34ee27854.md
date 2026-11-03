---
title: "Originação por leads de parceiros — Acordo Certo — B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Aquisição", "parceiro:Acordo Certo", "segmento:Leads_Parceiros", "bu:B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "activities"
inventory_id: "CRM-b34ee27854"
inventory_date: "2026-10-03"
analytics: {"domain": "crm", "scope": {"bu": "B2C", "segment": "Leads_Parceiros", "partner": "Acordo Certo", "operation_id": "CRM-b34ee27854"}}
---

# Originação por leads de parceiros — Acordo Certo — B2C

## O que este assunto representa

Acionamento de público originado por parceiro; etapa e integração dependem da fonte.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | Acordo Certo |
| segment | Leads_Parceiros |
| stages | ["Meio_de_Funil"] |
| subgroups | ["N/A"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Classic"] |
| offers | ["Vibe"] |
| promotions | ["Padrao"] |

**O que precisa ser validado:** Distinguir origem comercial, comprada, institucional e papel do parceiro.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-8f012f8b3f | JOR_AQUISICAO_B2C_NA_LP_MEIO_DE_FUNIL_VIBE_PAD_FEV26 | 2026-02 | Meio_de_Funil | N/A | 2 |
| CAMP-3f93f08365 | JOR_AQUISICAO_B2C_NA_LP_MEIO_DE_FUNIL_VIBE_PAD_JAN26 | 2026-01 | Meio_de_Funil | N/A | 5 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-b34ee27854 |
| Fonte | activities |
| Linhas no corte do inventário | 7 |
| Primeira data observada | 2026-01-13 |
| Última data observada | 2026-02-24 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/03-Dimensoes/Parceiros|Definição relacionada]] · [[07-Evolucao/Parceiro-Acordo-Certo|Visão do parceiro]] · [[07-Evolucao/Segmento-Leads-Parceiros|Visão do segmento]]

## Registro de descoberta

```json
{
  "id": "CRM-b34ee27854",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Originação por leads de parceiros — Acordo Certo — B2C",
  "family": "Originação por leads de parceiros",
  "bu": "B2C",
  "partner": "Acordo Certo",
  "segment": "Leads_Parceiros",
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
    "Vibe"
  ],
  "promotions": [
    "Padrao"
  ],
  "records": 7,
  "first_date": "2026-01-13",
  "last_date": "2026-02-24",
  "observed_months": [
    "2026-01",
    "2026-02"
  ],
  "physical_combinations": 1,
  "journey_count": 2,
  "activity_name_count": 6,
  "definition": "Acionamento de público originado por parceiro; etapa e integração dependem da fonte.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "03-Dimensoes/Parceiros.md",
  "validation": "Distinguir origem comercial, comprada, institucional e papel do parceiro.",
  "flags": [],
  "name_signals": [],
  "scope_key": {
    "bu": "B2C",
    "segment": "Leads_Parceiros",
    "partner": "Acordo Certo"
  }
}
```
