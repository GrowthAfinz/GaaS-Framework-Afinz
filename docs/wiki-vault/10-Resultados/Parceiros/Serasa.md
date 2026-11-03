---
title: "Serasa"
tipo: parceiro
camada: resultados
codigo_dado: Serasa
aliases: [Serasa, eCred, srsa, Serasa LP]
bus: [B2C]
produto: Cartão Afinz Visa (via eCred)
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [parceiro, crm, resultados, growth]
growth_catalog: {"parceiro": "Serasa"}
analytics: {"domain": "crm", "scope": {"partner": "Serasa"}}
---

# Serasa

## Em uma frase

Parceiro de originação do B2C. Hoje, quase tudo vem do carrinho eCred: pessoas que começaram o pedido pelo marketplace da Serasa e pararam no meio.

## Principais números: jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, parceiro canônico `Serasa`, só CRM aquisição. Setembro ainda pode amadurecer. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados).

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 191 | 26.228 | 25.784 | 25.707 | 939 | 3,6% | 3,7% | R$ 8.252,76 | R$ 8,79 |
| ago/2026 | 176 | 21.724 | 24.338 | 24.286 | 941 | 4,3% | 3,9% | R$ 7.120,46 | R$ 7,57 |
| set/2026 | 121 | 12.107 | 17.800 | 17.673 | 953 | 7,9% | 5,4% | R$ 3.101,27 | R$ 3,25 |
| **Média mensal** | **163** | **20.020** | **22.641** | **22.555** | **944** | **4,7%** | **4,2%** | **R$ 6.158,16** | **R$ 6,52** |
| Total do período | 488 | 60.059 | 67.922 | 67.666 | 2.833 | 4,7% | 4,2% | R$ 18.474,49 | R$ 6,52 |

Por público, no trimestre:

| Público | Disparos | Base acionável | Cartões | Conversão | Finalização | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|
| Carrinho abandonado | 488 | 60.059 | 2.833 | 4,7% | 4,2% | R$ 18.474,49 | R$ 6,52 |

Páginas dos públicos: [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]].

Em toda a série de `activities`, a Serasa soma 9.450 cartões.

Como ler:
- **2.833 cartões no trimestre, CAC de R$ 6,52**, a menor do CRM. Volume estável (939, 941 e 953 cartões) com custo caindo: a CAC de setembro foi de R$ 3,25.
- Todo o resultado do trimestre veio do carrinho eCred.
- Propostas e aprovados passam da base acionável porque o eCred recebe lead externo: não comparar a taxa de conversão da Serasa com a de outros parceiros.

## Produto e marca

A pessoa pede o cartão Afinz Visa pelo marketplace da Serasa (eCred). Nos templates, a origem aparece como `srsa`.
Antes de escrever: [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como o parceiro aparece nos dados

- O parceiro vem explícito na coluna `Parceiro`, então a regra de resolução não precisa adivinhar.
- Na jornada da Serasa, a quarta posição do nome é a cadência (`CARRINHO`, `21D`, `SAB`), nunca `SRS`: não ler o parceiro pela posição.
- A originação B2C da Serasa em `b2c_daily_metrics` (tipo `serasa_api`) é outra população: não somar com o CRM nem com o total B2C.
- Em mídia, seguidores e lookalike da audiência Serasa pertencem ao Branding ([[05-Estrategia/Ativacao-de-Audiencias-Diaria|ativação diária]]).

## Régua e jornadas

Carrinho eCred com toques D0, D3 e D6, desde 13/02/2026, nos ramos diário, 21D e sábado. A [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]] encontrou o D0 do eCred com link genérico, sem `af_sub`.
Leads da Serasa (LP meio de funil) dispararam até 30/03/2026.

## Resultado ao vivo

O bloco de resultado desta página consulta `activities` ao vivo para o parceiro canônico `Serasa`.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| O D0 do eCred continua sem `af_sub`? | atribuição do principal canal do CRM | conferir o link da jornada | operador SFMC |
| Por que os leads da Serasa pararam em mar/2026? | fonte de lead parada | decisão comercial | a confirmar |

## Relacionado

[[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] · [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]] · [[07-Evolucao/Resultados-B2C|Resultados B2C]]

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
| [[07-Evolucao/Assunto-CRM-f9b25b84df]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-85fefd8ebc]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-e2dbd0d4bf]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-6e7d329c84]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-e63826e827]] | Escopo candidato de operação | activities |
