---
title: "Bem Barato"
tipo: parceiro
camada: resultados
codigo_dado: Bem Barato
aliases: [Bem Barato, Bem Mais, Grupo Bem Barato, bb, bbt]
bus: [B2B2C]
produto: Cartão Bem Mais Afinz Visa
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [parceiro, crm, resultados, growth]
growth_catalog: {"parceiro": "Bem Barato"}
analytics: {"domain": "crm", "scope": {"partner": "Bem Barato"}}
---

# Bem Barato

## Em uma frase

Grupo Bem Barato (supermercados, farmácias e restaurantes), com o cartão co-branded Bem Mais Afinz Visa, na BU B2B2C.

## Principais números: jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, parceiro canônico `Bem Barato`, só CRM aquisição. Setembro ainda pode amadurecer. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados).

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 97 | 560.275 | 575 | 328 | 217 | 0,039% | 66,2% | R$ 1.290,30 | R$ 5,95 |
| ago/2026 | 107 | 371.311 | 459 | 250 | 158 | 0,043% | 63,2% | R$ 1.808,60 | R$ 11,45 |
| set/2026 | 147 | 282.212 | 340 | 232 | 133 | 0,047% | 57,3% | R$ 1.485,34 | R$ 11,17 |
| **Média mensal** | **117** | **404.599** | **458** | **270** | **169** | **0,042%** | **62,7%** | **R$ 1.528,08** | **R$ 9,02** |
| Total do período | 351 | 1.213.798 | 1.374 | 810 | 508 | 0,042% | 62,7% | R$ 4.584,24 | R$ 9,02 |

Por público, no trimestre:

| Público | Disparos | Base acionável | Cartões | Conversão | Finalização | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|
| Topo de funil (varejo) | 154 | 1.200.522 | 264 | 0,022% | 60,7% | R$ 1.233,95 | R$ 4,67 |
| Repescagem | 46 | 9.904 | 225 | 2,3% | 68,4% | R$ 2.600,62 | R$ 11,56 |
| Upgrade | 35 | 2.410 | 14 | 0,58% | 43,8% | R$ 551,54 | R$ 39,40 |
| Carrinho abandonado | 116 | 962 | 5 | 0,52% | 35,7% | R$ 198,13 | R$ 39,63 |

Páginas dos públicos: [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]] · [[10-Resultados/Publicos/Publico-Repescagem|Repescagem]] · [[10-Resultados/Publicos/Publico-Upgrade|Upgrade]] · [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]].

Em toda a série de `activities`, o Bem Barato soma 1.237 cartões.

Como ler:
- **508 cartões no trimestre, CAC de R$ 9,02**, mas caindo mês a mês: 217, 158 e 133.
- Topo de funil (264 cartões, CAC R$ 4,67) e repescagem (225, CAC R$ 11,56) fazem quase todo o resultado.
- O carrinho do Bem Barato fez 5 cartões no trimestre.

## Produto e marca

Cartão Bem Mais Afinz Visa: tem Vibe como o B2C, mas o app é whitelabel e não tem a jornada Vibe embarcada. OneLink `cartao-bem-mais.onelink.me/dJ0j`. A loja é Bem Barato; o cartão é Bem Mais. Ficha completa: [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Bem-Mais-Afinz-Visa|Cartão Bem Mais]].
O topo de funil é só para membros do Clube Bem Mais. Antes de escrever: [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como o parceiro aparece nos dados

- Prefixo `bb_` no e-mail e `bbt_` no WhatsApp: as duas siglas são Bem Barato ([[07-Evolucao/Inconsistências-a-Corrigir|inconsistências]]).
- Já existiu duplicidade de grafia (`Bem Barato` e `Bem_Barato`).
- `JOR_AQS_BB_NA_ANC_*` é Bem Barato no Upgrade. Jornadas `JOR_AQUISICAO_BB_...` sem `B2B2C_` no nome continuam sendo Bem Barato.
- No importador, `bb` chegou a ser lido como segmento, porque o parceiro vem antes do segmento no nome da jornada.

## Régua e jornadas

Clube Bem Barato com régua semanal de 4 e-mails e SMS para quem clicou; repescagem, Upgrade e carrinho com peças próprias de WhatsApp (`repescagem_bb_vibe_1/2`, `upgrade_vibe_mais_limite_bb_2_`, `carrinho_abandonado_bb_1/2_2026`), segundo a [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]].
Os RTFs da régua já vieram com merge field de jornada inválido e `af_sub` errado: conferir antes de subir.

## Resultado ao vivo

O bloco de resultado desta página consulta `activities` ao vivo para o parceiro canônico `Bem Barato`.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Por que os cartões caíram de 217 para 133 em três meses? | parceiro perdendo tração | decompor por público e canal | a confirmar |
| Repescagem e Upgrade de set/2026 ausentes em `activities` | resultado subestimado | conferir ingestão | a confirmar |
| O carrinho (cerca de 15 pessoas/dia, 5 cartões no trimestre) vale manter? | custo sem retorno | entrada diária e maturação | a confirmar |

## Relacionado

[[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] · [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Bem-Mais-Afinz-Visa|Cartão Bem Mais]] · [[02-Entidades-Dados/Dimensao-Canonica-de-Parceiro|dimensão canônica de parceiro]]

[[98-Legado/03-Dimensoes/Parceiros]] · [[98-Legado/03-Dimensoes/Segmentos]] · [[07-Evolucao/Resultados-Evolucao-e-Retrospectivas|Resultados]]

---

## Snapshots anteriores

### Dimensão Parceiros, 08/06/2026

N/A (2.869, Afinz direto), Proprietaria (1.064), Serasa (433), Dia (76), Bom_Pra_Credito (36), Alvorada (12), Acordo Certo (7), Bem Barato (24).

### Inconsistências, 08/06/2026

- "Bem Barato" (13) + "Bem_Barato" (11) = duplicidade → unificar.

## Registro do inventário (03/10/2026)

Lista integral do antigo hub do parceiro. O conteúdo de cada assunto está, inteiro, na página do público correspondente, em "Detalhe das variantes por parceiro".

### Assuntos relacionados

| Assunto | Tipo | Fonte |
|---|---|---|
| [[07-Evolucao/Assunto-CRM-3bd920ad5c]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-b9d196a55b]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-86b77dd1bc]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-cc03a5f98d]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-e3353b859a]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-f5ee848cf4]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-448af753-1fd9-48b9-b5cc-147edafa2b4d]] | Régua editorial cadastrada | dynamic_email_ruler_strategies |
