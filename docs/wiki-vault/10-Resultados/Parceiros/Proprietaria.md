---
title: "Proprietária (base própria B2C)"
tipo: parceiro
camada: resultados
codigo_dado: Proprietaria
aliases: [Proprietária, Proprietaria, Base própria, Institucional, B2C institucional]
bus: [B2C]
produto: Cartão Afinz Visa
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [parceiro, crm, resultados, growth]
growth_catalog: {"parceiro": "Proprietaria"}
analytics: {"domain": "crm", "scope": {"partner": "Proprietaria"}}
---

# Proprietária (base própria B2C)

## Em uma frase

A base própria da Afinz no B2C, sem parceiro de varejo, com o cartão Afinz Visa. É o rótulo canônico do B2C institucional.

## Principais números: jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, parceiro canônico `Proprietaria`, só CRM aquisição. Setembro ainda pode amadurecer. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados).

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 411 | 956.239 | 1.386 | 879 | 473 | 0,049% | 53,8% | R$ 18.376,08 | R$ 38,85 |
| ago/2026 | 258 | 562.889 | 2.061 | 1.555 | 914 | 0,16% | 58,8% | R$ 21.279,49 | R$ 23,28 |
| set/2026 | 832 | 802.065 | 4.611 | 3.995 | 1.266 | 0,16% | 31,7% | R$ 26.699,42 | R$ 21,09 |
| **Média mensal** | **500** | **773.731** | **2.686** | **2.143** | **884** | **0,11%** | **41,3%** | **R$ 22.118,33** | **R$ 25,01** |
| Total do período | 1.501 | 2.321.193 | 8.058 | 6.429 | 2.653 | 0,11% | 41,3% | R$ 66.354,99 | R$ 25,01 |

Por público, no trimestre:

| Público | Disparos | Base acionável | Cartões | Conversão | Finalização | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|
| Repescagem | 185 | 136.242 | 2.182 | 1,6% | 59,7% | R$ 42.283,83 | R$ 19,38 |
| Carrinho abandonado | 759 | 24.208 | 278 | 1,1% | 12,4% | R$ 8.617,74 | R$ 31,00 |
| Upgrade | 188 | 47.791 | 95 | 0,20% | 32,8% | R$ 12.845,28 | R$ 135,21 |
| Topo de funil (B2C) | 339 | 2.111.809 | 88 | 0,004% | 41,7% | R$ 2.172,43 | R$ 24,69 |
| Leads de parceiros | 30 | 1.143 | 10 | 0,87% | 31,2% | R$ 435,71 | R$ 43,57 |

Páginas dos públicos: [[10-Resultados/Publicos/Publico-Repescagem|Repescagem]] · [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]] · [[10-Resultados/Publicos/Publico-Upgrade|Upgrade]] · [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]] · [[10-Resultados/Publicos/Publico-Leads-de-Parceiros|Leads de parceiros]].

Em toda a série de `activities`, a Proprietária soma 10.275 cartões.

Como ler:
- **2.653 cartões no trimestre, CAC de R$ 25,01**, e crescendo: 473, 914 e 1.266 cartões em julho, agosto e setembro.
- **A repescagem é 82% do resultado** (2.182 cartões, CAC de R$ 19,38).
- Os pontos caros: Upgrade (R$ 135,21), carrinho institucional (R$ 31,00) e topo de funil B2C (R$ 24,69).

## Produto e marca

Cartão Afinz Visa: o cartão proprietário, sem parceiro de varejo, onde a Afinz é o sujeito da comunicação. App Afinz; OneLink `cartao-afinz.onelink.me/9ODN`; prefixo `b2c_` na taxonomia e `afz_` nas peças reais. No topo de funil, o Vibe é a âncora da proposta de valor. Ficha completa: [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Afinz-Visa|Cartão Afinz Visa]].
Antes de escrever: [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como o parceiro aparece nos dados

- Pela [[02-Entidades-Dados/Dimensao-Canonica-de-Parceiro|dimensão canônica de parceiro]], toda linha da BU `B2C` sem parceiro externo vira Proprietária (por casar com `institucional` no Activity Name ou por ser campanha gêmea).
- `N/A` no B2C é a base própria, não falta de parceiro. Não criar categoria nova como "B2C institucional": o rótulo canônico já é `Proprietaria`.
- O token `_NA_` aparece tanto em jornadas da Proprietária (292 cartões em jul/2026) quanto em `N/A` de verdade: não classificar pela jornada.

## Régua e jornadas

Repescagem e Upgrade por WhatsApp com opt-out e SMS (entrada `DE_JORNADA_UNIFICADA_*`), topo Tudão por régua semanal de e-mail e carrinho institucional nos ramos diário, 21D e sábado, todos descritos na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]].
O carrinho institucional antigo (jornada das 14h) parou em 10/11/2025; o atual roda junto com o eCred da Serasa.

## Resultado ao vivo

O bloco de resultado desta página consulta `activities` ao vivo para o parceiro canônico `Proprietaria`.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| O crescimento de jul a set (473 para 1.266 cartões) se sustenta? | base do planejamento do B2C | fechamento de outubro | a confirmar |
| A base do Tudão ainda é a de mar/2026? | topo B2C falando com base velha | data da última carga | a confirmar |
| O Upgrade a R$ 135 por cartão vale a pena? | maior CAC do parceiro | teste de oferta no Upgrade | a confirmar |

## Relacionado

[[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] · [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Afinz-Visa|Cartão Afinz Visa]] · [[02-Entidades-Dados/Dimensao-Canonica-de-Parceiro|dimensão canônica de parceiro]]

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

### Dimensão Parceiros, 08/06/2026

N/A (2.869, Afinz direto), Proprietaria (1.064), Serasa (433), Dia (76), Bom_Pra_Credito (36), Alvorada (12), Acordo Certo (7), Bem Barato (24).

## Registro do inventário (03/10/2026)

Lista integral do antigo hub do parceiro. O conteúdo de cada assunto está, inteiro, na página do público correspondente, em "Detalhe das variantes por parceiro".

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-2cc364c6bd]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-a695575900]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-6714bb10d7]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-798bf8f3a7]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-5eaebf1046]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-89856bcf7b]] | Escopo candidato de operação | activities |
