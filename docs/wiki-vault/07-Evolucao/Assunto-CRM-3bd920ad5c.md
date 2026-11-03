---
title: "Carrinho abandonado — Bem Barato — B2B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Aquisição", "parceiro:Bem Barato", "segmento:Abandonados", "bu:B2B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "activities"
inventory_id: "CRM-3bd920ad5c"
inventory_date: "2026-10-03"
analytics: {"domain": "crm", "scope": {"bu": "B2B2C", "segment": "Abandonados", "partner": "Bem Barato", "operation_id": "CRM-3bd920ad5c"}}
---

# Carrinho abandonado — Bem Barato — B2B2C

## O que este assunto representa

Recuperar pedido iniciado e interrompido.

**Tipo de entrada:** Escopo candidato de operação. **Estado da evidência:** Observado nas dimensões; pertencimento de negócio candidato.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2B2C |
| partner | Bem Barato |
| segment | Abandonados |
| stages | ["Reativacao"] |
| subgroups | ["Diario"] |
| channels | ["SMS", "WhatsApp"] |
| products | ["Cartao"] |
| offers | ["Padrao", "Vibe"] |
| promotions | ["Copa", "Padrao"] |

**O que precisa ser validado:** Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| CAMP-7e20e1de97 | JOR_AQUISICAO_B2B2C_BB_CARRINHO_REATIVACAO_COPA_PAD_26 | 07/26 | Reativacao | Diario | 6 |
| CAMP-87fdcdc149 | JOR_AQUISICAO_B2B2C_BB_CARRINHO_REATIVACAO_COPA_PAD_26 | 08/26 | Reativacao | Diario | 13 |
| CAMP-5b57b51f27 | JOR_AQUISICAO_BB_CARRINHO_REATIVACAO_VIBE_PAD_26 | 08/26 | Reativacao | Diario | 25 |
| CAMP-2c13cb304e | JOR_AQUISICAO_BB_CARRINHO_REATIVACAO_VIBE_PAD_26 | 09/26 | Reativacao | Diario | 56 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Nome de resposta/opt-out entre disparos do escopo

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | CRM-3bd920ad5c |
| Fonte | activities |
| Linhas no corte do inventário | 100 |
| Primeira data observada | 2026-07-27 |
| Última data observada | 2026-09-30 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[01-Conceitos/Carrinho-Abandonado|Definição relacionada]] · [[07-Evolucao/Parceiro-Bem-Barato|Visão do parceiro]] · [[07-Evolucao/Segmento-Abandonados|Visão do segmento]]

## Registro de descoberta

```json
{
  "id": "CRM-3bd920ad5c",
  "domain": "CRM Aquisição",
  "kind": "Escopo candidato de operação",
  "title": "Carrinho abandonado — Bem Barato — B2B2C",
  "family": "Carrinho abandonado",
  "bu": "B2B2C",
  "partner": "Bem Barato",
  "segment": "Abandonados",
  "stages": [
    "Reativacao"
  ],
  "subgroups": [
    "Diario"
  ],
  "channels": [
    "SMS",
    "WhatsApp"
  ],
  "products": [
    "Cartao"
  ],
  "credit_profiles": [
    "Mar_aberto"
  ],
  "offers": [
    "Padrao",
    "Vibe"
  ],
  "promotions": [
    "Copa",
    "Padrao"
  ],
  "records": 100,
  "first_date": "2026-07-27",
  "last_date": "2026-09-30",
  "observed_months": [
    "2026-07",
    "2026-08",
    "2026-09"
  ],
  "physical_combinations": 1,
  "journey_count": 2,
  "activity_name_count": 8,
  "definition": "Recuperar pedido iniciado e interrompido.",
  "source": "activities",
  "status": "Observado nas dimensões; pertencimento de negócio candidato",
  "canonical_note": "01-Conceitos/Carrinho-Abandonado.md",
  "validation": "Confirmar entrada por abandono, origem, recência e destino. Diario não prova D0.",
  "flags": [
    "Nome de resposta/opt-out entre disparos do escopo"
  ],
  "name_signals": [
    "Opt-out no nome",
    "Copa"
  ],
  "scope_key": {
    "bu": "B2B2C",
    "segment": "Abandonados",
    "partner": "Bem Barato"
  }
}
```
