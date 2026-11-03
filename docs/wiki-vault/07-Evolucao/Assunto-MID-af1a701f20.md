---
title: "[Institucional] [COPA][AQUISICAO]APP_INSTALL_B2C"
tags: ["growth", "growth-assunto", "resultados", "dominio:Mídia paga"]
tipo: "assunto-growth"
camada: "evolucao"
atualizado: "2026-10-03"
status: "inventariado"
fonte: "paid_media_metrics"
inventory_id: "MID-af1a701f20"
inventory_date: "2026-10-03"
analytics: {"domain": "media", "scope": {"channel": "google", "campaign": "google:name:516c225e3775", "operation_id": "MID-af1a701f20"}}
---

# [Institucional] [COPA][AQUISICAO]APP_INSTALL_B2C

## O que este assunto representa

Campanha preservada com sua identidade observada. Objetivo de plataforma e objetivo de negócio são camadas diferentes.

**Tipo de entrada:** Campanha observada por nome e plataforma. **Estado da evidência:** Observada; certificação de evento e alias conforme cadastro.

Esta é uma entrada de descoberta do inventário de 03/10/2026. Classificação por público ou nome não confirma sozinha a operação comercial.

## Escopo, mecanismo e elegibilidade

| Campo | Contexto observado |
|---|---|
| bu | não informado |
| partner | não informado |
| segment | não informado |

**O que precisa ser validado:** Não fundir nomes semelhantes sem alias governado. Evento, janela e grão condicionam qualquer CPA.

Elegibilidade, supressões e entrada/saída da régua devem ser confirmadas com a definição e a execução. Uma audiência Negados não comprova nova análise; um público aprovado não comprova Upgrade; clique não comprova uso ou venda.

## Campanhas e variantes observadas

A identificação desta entrada e suas relações registradas estão preservadas abaixo. Documentação ou cadastro não comprova execução.

## Resultados, evolução e retrospectiva

O bloco autenticado ao final desta nota consulta a fonte atual. Selecione mês, canais e variantes dentro do escopo. Evolução mensal, cobertura e retrospectiva acompanham o mesmo recorte; meses sem dados não recebem zero. A retrospectiva mantém versões e não equivale a um outcome validado.

A pergunta para cada mês é: o que mudou, qual contexto de execução foi comprovado, o que permanece hipótese, qual decisão foi assumida e como será verificada? Compare meses fechados ou o mesmo corte de dias.

## Pendências específicas

- Níveis de anúncio e campanha coexistem; não somar níveis
- Objetivo de plataforma muda no histórico

## Proveniência do inventário

| Campo | Evidência |
|---|---|
| ID | MID-af1a701f20 |
| Fonte | paid_media_metrics |
| Linhas no corte do inventário | 35 |
| Primeira data observada | 2026-04-16 |
| Última data observada | 2026-05-20 |

O corte acima é histórico e não representa o resultado do mês selecionado. O bloco analítico conserva a fonte, o horário da consulta e sua cobertura.

## Assuntos conectados

[[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário e regras]] · [[07-Evolucao/Retrospectiva-Mensal-Growth|Retrospectiva mensal]] · [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]]

## Registro de descoberta

```json
{
  "id": "MID-af1a701f20",
  "domain": "Mídia paga",
  "kind": "Campanha observada por nome e plataforma",
  "title": "[Institucional] [COPA][AQUISICAO]APP_INSTALL_B2C",
  "family": [
    "aquisicao"
  ],
  "bu": null,
  "partner": null,
  "segment": null,
  "platform": "google",
  "canonical_ids": [
    "google:name:516c225e3775"
  ],
  "canonical_objectives": [
    "aquisicao"
  ],
  "mapping_objectives": [
    "aquisicao"
  ],
  "platform_objectives": [
    "conversion",
    "unknown"
  ],
  "grains": [
    "ad",
    "campaign"
  ],
  "records": 35,
  "first_date": "2026-04-16",
  "last_date": "2026-05-20",
  "definition": "Campanha preservada com sua identidade observada. Objetivo de plataforma e objetivo de negócio são camadas diferentes.",
  "source": "paid_media_metrics",
  "status": "Observada; certificação de evento e alias conforme cadastro",
  "validation": "Não fundir nomes semelhantes sem alias governado. Evento, janela e grão condicionam qualquer CPA.",
  "flags": [
    "Níveis de anúncio e campanha coexistem; não somar níveis",
    "Objetivo de plataforma muda no histórico"
  ]
}
```
