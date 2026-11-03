---
title: "Desbloqueio — B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:CRM Rentabilização e Seguros", "parceiro:N/A", "segmento:Desbloqueio", "bu:B2C"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "candidato"
fonte: "rentabilizacao_activities"
inventory_id: "RENT-aede134f3d"
inventory_date: "2026-10-03"
analytics: {"domain": "renta", "scope": {"bu": "B2C", "operation_id": "RENT-aede134f3d"}, "any_of": [{"segment": "Desbloqueio", "partner": "N/A", "subgroup": "Afinz VC", "stage": "Rentabilizacao", "journey": "JOR_ATIVACAO_DESBLOQUEIO_VC", "safra": ""}]}
---

# Desbloqueio — B2C

## O que este assunto representa

Contato para desbloqueio; envio/clique não provam desbloqueio.

**Tipo de entrada:** Família candidata por campos e nomes. **Estado da evidência:** Candidata por classificação explícita; sem prova de venda, uso ou receita.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | B2C |
| partner | N/A |
| segment | ["Desbloqueio"] |
| stages | ["Rentabilizacao"] |
| subgroups | ["Afinz VC"] |
| channels | ["E-mail", "Push"] |
| products | ["Cartao", "Desbloqueio VC"] |

**O que precisa ser validado:** Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

As campanhas abaixo preservam jornada e safra. Canal, oferta e produto são variantes; não foram convertidos em novas operações.

| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |
|---|---|---|---|---|---|
| RENTC-def819640a | JOR_ATIVACAO_DESBLOQUEIO_VC |  | Rentabilizacao | Afinz VC | 366 |

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Parceiro literal N/A preservado

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | RENT-aede134f3d |
| Fonte | rentabilizacao_activities |
| Linhas no corte do inventário | 366 |
| Primeira data observada | 2026-01-30 |
| Última data observada | 2026-06-11 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]] · [[98-Legado/04-Operacao/Originação-B2C|Definição relacionada]]

## Registro de descoberta

```json
{
  "id": "RENT-aede134f3d",
  "domain": "CRM Rentabilização e Seguros",
  "kind": "Família candidata por campos e nomes",
  "title": "Desbloqueio — B2C",
  "family": "Desbloqueio",
  "bu": "B2C",
  "partner": "N/A",
  "segment": [
    "Desbloqueio"
  ],
  "stages": [
    "Rentabilizacao"
  ],
  "subgroups": [
    "Afinz VC"
  ],
  "channels": [
    "E-mail",
    "Push"
  ],
  "products": [
    "Cartao",
    "Desbloqueio VC"
  ],
  "records": 366,
  "first_date": "2026-01-30",
  "last_date": "2026-06-11",
  "campaign_clusters": 1,
  "journey_count": 1,
  "definition": "Contato para desbloqueio; envio/clique não provam desbloqueio.",
  "source": "rentabilizacao_activities",
  "status": "Candidata por classificação explícita; sem prova de venda, uso ou receita",
  "canonical_note": "04-Operacao/Originação-B2C.md",
  "validation": "Validar gatilho, público, parceiro, evento e distinção entre teste e produção. Medir até engajamento; Opt-in Copa é exceção específica com fonte própria.",
  "flags": [
    "Parceiro literal N/A preservado"
  ]
}
```
