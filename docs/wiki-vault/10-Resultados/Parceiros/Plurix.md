---
title: "Plurix"
tipo: parceiro
camada: resultados
codigo_dado: Plurix
aliases: [Plurix, Grupo Amigão, +amigo, plu, plx]
bus: [Plurix]
produto: Cartão +amigo Afinz Visa
status: ativo
atualizado: 2026-10-28
fonte: consolidacao-wiki-2026-10-28
tags: [parceiro, crm, resultados, growth]
growth_catalog: {"parceiro": "Plurix"}
analytics: {"domain": "crm", "scope": {"partner": "Plurix"}}
---

# Plurix

## Em uma frase

Rede de supermercados do Grupo Amigão (seis bandeiras), com o cartão co-branded +amigo Afinz Visa. É a BU Plurix inteira.

## Principais números: jul a set/2026

> 📊 Consulta em `activities` de 28/10/2026, por mês da data de disparo, parceiro canônico `Plurix`, só CRM aquisição. Setembro ainda pode amadurecer. Taxas e CAC da média e do total são calculados sobre a soma do período (ponderados).

| Mês | Disparos | Base acionável | Propostas | Aprovados | Cartões | Conversão (cartões/base) | Finalização (cartões/aprovados) | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| jul/2026 | 228 | 1.334.342 | 1.567 | 913 | 625 | 0,047% | 68,5% | R$ 14.426,57 | R$ 23,08 |
| ago/2026 | 199 | 987.988 | 1.307 | 928 | 698 | 0,071% | 75,2% | R$ 11.312,41 | R$ 16,21 |
| set/2026 | 127 | 733.445 | 620 | 341 | 244 | 0,033% | 71,6% | R$ 6.124,39 | R$ 25,10 |
| **Média mensal** | **185** | **1.018.592** | **1.165** | **727** | **522** | **0,051%** | **71,8%** | **R$ 10.621,12** | **R$ 20,33** |
| Total do período | 554 | 3.055.775 | 3.494 | 2.182 | 1.567 | 0,051% | 71,8% | R$ 31.863,37 | R$ 20,33 |

Por público, no trimestre:

| Público | Disparos | Base acionável | Cartões | Conversão | Finalização | Custo | CAC |
|---|---:|---:|---:|---:|---:|---:|---:|
| Repescagem | 24 | 35.002 | 673 | 1,9% | 78,3% | R$ 11.498,63 | R$ 17,09 |
| Topo de funil (varejo) | 99 | 2.974.838 | 639 | 0,021% | 73,8% | R$ 3.025,78 | R$ 4,74 |
| Carrinho abandonado | 407 | 10.987 | 170 | 1,5% | 59,0% | R$ 4.188,24 | R$ 24,64 |
| Upgrade | 24 | 34.948 | 85 | 0,24% | 50,6% | R$ 13.150,71 | R$ 154,71 |

Páginas dos públicos: [[10-Resultados/Publicos/Publico-Repescagem|Repescagem]] · [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]] · [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]] · [[10-Resultados/Publicos/Publico-Upgrade|Upgrade]].

Em toda a série de `activities`, a Plurix soma 11.830 cartões, o maior total entre os parceiros.

Como ler:
- **1.567 cartões no trimestre, CAC de R$ 20,33.** Repescagem (673) e topo de funil (639) fazem quase 84% disso.
- **Setembro caiu para 244 cartões** (contra 625 e 698). A maior parte veio da repescagem: a base dela foi 90% menor que em agosto (2.073 contra 21.364) e os cartões caíram de 403 para 76. O topo também caiu (de 213 para 118) e o carrinho, de 53 para 18.
- O topo de funil da Plurix é dos mais baratos do CRM (R$ 4,74); o Upgrade é o mais caro (R$ 154,71).

## Produto e marca

Cartão +amigo Afinz Visa: o único da família que **não usa Vibe**, e onde a Afinz aparece de forma discreta (o site do produto diz que "+amigo é uma marca da Plurix"). Praça em SP, PR e MS; app próprio (Cartão +amigo); OneLink `mais-amigo.onelink.me`. Ficha completa: [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Amigo-Afinz-Visa|Cartão +amigo]].
Bandeiras: Amigão, Boa, Avenida, Compre Mais, Paraná e Superpão ([[03-Dimensoes/Bandeiras-Plurix|Bandeiras Plurix]]). Compre Mais e Superpão comunicam como +amigo. O topo de funil é só para membros do Clube +amigo.
Antes de escrever: [[02-Entidades-Dados/Dicionario-de-Produtos/Pode-Dizer-Nao-Pode-Dizer|Pode dizer e não pode dizer]].

## Como o parceiro aparece nos dados

- Pela [[02-Entidades-Dados/Dimensao-Canonica-de-Parceiro|dimensão canônica de parceiro]], BU `Plurix` com token `plu`, `plx` ou `plurix` no Activity Name (ou `plurix` na jornada) vira Plurix, mesmo com `Parceiro = N/A`.
- `N/A` na BU Plurix é o próprio Plurix, não parceiro desconhecido. Em jul/2026, 478 cartões da Plurix (30% do mês) estavam escondidos dentro do `N/A` e o parceiro não tinha capítulo no Report Live.
- O prefixo de template tem três grafias: `plu_` (histórico), `plx_` (planilhas novas) e `plurix_` (esperado pela governança).
- A jornada não é fonte confiável de parceiro: o sinal certo é BU mais prefixo do Activity Name.

## Régua e jornadas

E-mail dinâmico com estado no topo de funil (entrada `COMUNICACAO_PLX`, decisão por `LIMITE_CRD`, split 4 × 25%, e-mail V12), descrito na [[07-Evolucao/Auditoria-Jornadas-SFMC-2026-10|auditoria das jornadas (out/2026)]]; detalhes em [[04-Operacao/Emails-Dinamicos-Plurix|E-mails dinâmicos Plurix]] e [[05-Estrategia/Fabrica-XLSX-TOPO-CRM-3|Fábrica TOPO CRM 3]].
Recência de compra voltou em out/2026 com automação de cruzamento própria: [[04-Operacao/Plurix-Recencia-Automation-e-Comunicacoes|runbook de recência Plurix]].

## Resultado ao vivo

O bloco de resultado desta página consulta `activities` ao vivo para o parceiro canônico `Plurix`.

Comece pela visão geral do mês, abra o assunto e suas variantes, e consulte a retrospectiva do mesmo recorte. O resumo pode agregar públicos diferentes; comparabilidade precisa de validação. A seleção de mês e o contexto de cada nota ficam no endereço compartilhável.

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| Por que o Upgrade da Plurix custa R$ 154,71 por cartão? | o ponto mais caro do parceiro | ramo, canal e oferta do Upgrade | a confirmar |
| Por que a base da repescagem Plurix caiu 90% em setembro? | queda de 65% dos cartões do parceiro no mês | MES_REF e calendário da jornada de setembro | a confirmar |
| Unificar o prefixo (`plu_`, `plx_`, `plurix_`) | reconciliação de template quebra | decisão de governança | Pablo |

## Relacionado

[[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] · [[03-Dimensoes/Bandeiras-Plurix|Bandeiras Plurix]] · [[02-Entidades-Dados/Dicionario-de-Produtos/Cartao-Amigo-Afinz-Visa|Cartão +amigo]] · [[02-Entidades-Dados/Dimensao-Canonica-de-Parceiro|dimensão canônica de parceiro]]

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
| [[07-Evolucao/Assunto-CRM-bdc57e480d]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-015928e5ba]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-6d4dfb4e59]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-0104a32e90]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-92fbd40403]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-CRM-4b4cf35f73]] | Escopo candidato de operação | activities |
| [[07-Evolucao/Assunto-603a21e6-0164-41d1-9cab-3d9b4421682e]] | Régua editorial cadastrada | dynamic_email_ruler_strategies |
