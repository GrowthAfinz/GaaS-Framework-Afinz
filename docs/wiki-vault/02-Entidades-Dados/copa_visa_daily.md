---
tags: [supabase, tabela, copa, visa, proposta]
tipo: entidade
camada: dados
atualizado: 2026-06-11
status: confirmado
fonte: bi-visa
---

# Tabela: copa_visa_daily

> 📊 Criada e populada em 2026-06-11 — 15 dias (27/05–10/06) extraídos dos rótulos diários do print do BI Visa, com deltas derivados. Atenção: 10/06 saltou +289 clientes/+185 cartões (3x a média) — pode ser consolidação atrasada do BI; regra de ingestão: sobrescrever os últimos 2-3 dias a cada novo print.

**Definição:** registros **oficiais** da campanha Copa Visa vindos do BI da Visa (Power BI, acesso só por terceiros) — a **fonte da verdade** de opt-ins (Clientes), cartões e gasto transacional. Decisão 2026-06-11: `Optins LP` do XLSX passa a ler daqui; o Looker ([[copa_lp_daily]]) vira proxy de funil/tráfego.

## O que o BI traz (snapshot 15/04–10/06/2026)
| Métrica | Valor | Leitura |
|---|---|---|
| Clientes (opt-ins confirmados) | 7.254 | 20,4% novos · 79,6% VDV (base existente) |
| Clientes com cartão | 3.027 | |
| Cartões | 3.229 | 83,9% novos · 16,1% VDV |
| Valor gasto | R$ 2.925.825,61 | Platinum 431k (ticket 127,78) + Classic 2.494k (ticket 114,47) |
| Transações | 25.167 | ticket médio R$ 116,26 |
| Chances | Normal 61,8% · Aceleradora 38,2% | aceleradores: Card on File 73,4% · Activate New Card 26,6% |

A "Visão Acumulada" do BI é **diária** → deriva-se clientes/cartões por dia pela diferença do acumulado.

## Schema proposto
| Campo | Tipo | Notas |
|---|---|---|
| `data` | date | PK |
| `clientes_acum` | int | acumulado do BI (linha azul) |
| `cartoes_acum` | int | acumulado (linha amarela) |
| `clientes_dia` / `cartoes_dia` | int | derivados (delta do acumulado) |
| `raw_payload` | jsonb | captura/print de origem p/ auditoria |

**Escopo v1 (decisão 2026-06-11): só isso.** Clientes e cartões diários, derivados do acumulado dos prints. Valor gasto, transações, ticket, chances e quebras Novos×VDV ficam **fora** — a semântica dessas métricas no BI ainda não é compreendida pelo operador e a fonte é só print de terceiros. Não construir análise (ex.: spend mídia ÷ receita transacionada) sobre dado não compreendido.

## Ingestão
Sem acesso direto ao BI (imagem recebida de terceiros). Fluxo: operador envia print/export → IA interpreta e faz upsert via MCP Supabase. Frequência conforme recebimento; `raw_payload` preserva a evidência.

## Reconciliação entre fontes (regra)
- **Visa = oficial** (opt-ins, cartões, gasto).
- **Looker/GA4 = funil comportamental** — captura ~39% dos opt-ins (2.856 sucesso vs 7.254 clientes); gap esperado de tracking (webview WPP/SMS, consent, ad blockers). Nunca somar nem comparar sem essa nota.
- Gasto transacional é rentabilização **real** — pode entrar no relatório como dado oficial, sem violar o guardrail "não inferir receita a partir de clique" do [[Dossie-Mestre-Operacao-CRM-Midia]] (não é inferência).
- VDV = cliente/cartão da **base existente** (vs Novos = adquiridos na campanha). Registrado no [[Glossário-de-Siglas]].

## Relacionado
- [[Copa-2026]] · [[copa_lp_daily]] · [[Export-XLSX-Renta-Copa]] · [[Dossie-Mestre-Operacao-CRM-Midia]] · [[paid_media_metrics]]
