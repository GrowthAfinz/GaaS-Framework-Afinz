---
tags: [performance, aquisicao, crm, serie-historica, cac, funil, parceiro]
tipo: evidencia
camada: performance
tipo_diataxis: reference
criado: 2026-09-13
atualizado: 2026-09-13
status: confirmado
fonte: gaas-supabase
aliases: [Série 6 meses, Faixa histórica de aquisição]
---

# Série histórica de aquisição — mar a ago/2026

**Definição:** a série mensal reconciliada de cartões, CAC e taxas de funil por parceiro canônico, que serve de **faixa histórica** para a régua de comparação do Report Live. É a memória que o deck não tinha.

## Contexto

Sem série, uma taxa isolada não prova nada. Esta nota existe porque o deck de agosto induzia à leitura errada: 58,6% de finalização da Proprietária parecia gargalo e é, na verdade, o melhor mês do semestre.

Dimensão de parceiro reconstruída pela regra de [[Dimensao-Canonica-de-Parceiro]] e reconciliada com o run certificado `9bb55892` em dois meses independentes.

## Total CRM

> 📊 Snapshot 2026-09-13

| Mês | Cartões | CAC | Finalização |
|---|---:|---:|---:|
| mar | 2.314 | R$ 15,56 | 7,7% |
| abr | 3.366 | R$ 22,73 | 11,6% |
| mai | 1.924 | R$ 16,28 | 8,6% |
| jun | 3.171 | R$ 9,50 | 13,0% |
| jul | 2.290 | R$ 19,21 | 8,2% |
| **ago** | **2.849** | **R$ 15,93** | **10,0%** |

Agosto: 2º melhor volume do semestre, CAC no meio da faixa (9,50–22,73) e ainda 68% acima do melhor mês.

## Cartões por parceiro

| Parceiro | mar | abr | mai | jun | jul | ago | Faixa mar–jul |
|---|---:|---:|---:|---:|---:|---:|---|
| Serasa | 1.155 | 1.143 | 1.025 | 887 | 939 | 988 | 887–1.155 |
| Proprietária | 133 | 997 | 275 | 985 | 473 | 912 | 133–997 |
| Plurix | 802 | 1.035 | 514 | 1.202 | 625 | 698 | 514–1.202 |
| Bem Barato | 224 | 142 | 95 | 86 | 217 | 158 | 86–224 |
| Dia | 0 | 49 | 15 | 11 | 36 | 93 | 0–49 |

## CAC por parceiro

| Parceiro | mar | abr | mai | jun | jul | ago |
|---|---:|---:|---:|---:|---:|---:|
| Serasa | 2,93 | 5,25 | 5,08 | 4,89 | 8,79 | 7,21 |
| Proprietária | 32,71 | 22,67 | 62,14 | 14,87 | 38,85 | 23,33 |
| Plurix | 16,73 | 44,71 | 12,29 | 8,33 | 23,08 | 16,21 |
| Bem Barato | 66,34 | 2,88 | 19,68 | 4,53 | 5,95 | 11,45 |
| Dia | — | 24,95 | 56,35 | 64,88 | 45,77 | 41,61 |

## Taxa de finalização (aprovados → cartões)

| Parceiro | mar | abr | mai | jun | jul | ago |
|---|---:|---:|---:|---:|---:|---:|
| Serasa | 4,1% | 4,5% | 5,3% | 5,3% | 3,7% | 3,9% |
| Proprietária | 46,7% | 54,9% | **12,5%** | **17,1%** | 53,8% | **58,6%** |
| Plurix | 72,4% | 72,0% | 73,9% | 75,5% | 68,5% | 75,2% |
| Bem Barato | 63,3% | 58,2% | 64,2% | 56,2% | 66,2% | 63,2% |
| Dia | — | 76,6% | 48,4% | 50,0% | 69,2% | 58,1% |

## Quatro leituras que a série revelou

1. **CAC da Serasa dobrou no semestre.** R$ 2,93 → R$ 7,21 (+146%) com volume estável (887–1.155). É o parceiro mais eficiente da operação ficando caro. O deck de agosto comunica o oposto ("CAC −18%" contra julho) — o delta mensal isolado inverteu o sinal.
2. **Maio e junho da Proprietária.** Finalização de 12,5% e 17,1% contra 46–59% nos outros quatro meses. Em junho, 6.469 propostas e 5.749 aprovados produziram 973 cartões. Investigar mudança de critério de aprovação, quebra na emissão ou mudança de semântica de coleta. Nenhum report registrou isso.
3. **CAC de Bem Barato com dispersão de 23×** (R$ 2,88 a R$ 66,34). Compatível com os 440 custos nulos achados na auditoria de 09/09 ([[Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09]]). O volume (86–224) é normal — a queda de 217→158 em agosto **não** é anomalia.
4. **Dia bateu recorde do semestre** (93 cartões, +158% vs. julho) e recebe o capítulo mais compacto do deck. A materialidade continua baixa, mas falta um gatilho de destaque para variação excepcional.

## Uso

Esta série alimenta a faixa histórica da régua padrão descrita em [[Report-Live-Arquitetura-Editorial]]. Regra de leitura: taxa varia em pontos percentuais; veredito retido quando a amostra é fina.

## Relacionado

- [[Dimensao-Canonica-de-Parceiro]] · [[Report-Live-Arquitetura-Editorial]] · [[Report-Live-Loop-de-Outcome]]
- [[CAC-por-Canal]] · [[Performance-por-Segmento]] · [[Evolução-Temporal]] · [[Funil-de-Aquisição]] · [[Metas-e-CAC]]
- [[activities]] · [[Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09]]
