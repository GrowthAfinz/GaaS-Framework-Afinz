---
tags: [entidade,produto,dicionario,copy,moc]
tipo: moc
camada: dados
atualizado: 2026-10-02
status: confirmado
fonte: pesquisa-externa
---

# Dicionário de Produtos

**Definição:** o registro canônico dos quatro cartões da Afinz — nome na copy, proposta de valor, benefícios com vigência, o que pode e o que não pode ser afirmado, tom de voz e encanação técnica. É a fonte que a IA consulta **antes** de escrever qualquer peça de aquisição.

## A regra que este dicionário existe para criar

> **Nenhum benefício entra na copy se não tiver linha em [[Beneficios-e-Vigencia]] com `STATUS=VIGENTE` e `PODE CITAR=Sim`. Sem linha, não existe.**

Isso não é burocracia. Em 20/08/2026 quase escrevemos uma régua inteira do `+amigo` prometendo o programa de pontos — que **encerrou em 01/07/2026** e cujo prazo de resgate **expirou em 31/07/2026**. Nada na nossa base sabia disso. As páginas das bandeiras Compre Mais e Superpão *ainda anunciavam* o programa quando a raspagem foi feita.

O que faltava não era o dado. Era o **campo de validade** no dado.

## Os quatro produtos

| Nota | Nome na copy | BU | Parceiro | Status |
|---|---|---|---|---|
| [[Cartao-Afinz-Visa]] | `cartão Afinz Visa` | B2C | Proprietária | Ativo |
| [[Cartao-Amigo-Afinz-Visa]] | `cartão +amigo Afinz Visa` | Plurix | Plurix / Grupo Amigão | Ativo (pontos encerrados) |
| [[Cartao-Bem-Mais-Afinz-Visa]] | `cartão Bem Mais Afinz Visa` | B2B2C | Grupo Bem Barato | Ativo, base pequena |
| [[Cartao-Dia-Afinz-Visa]] | `cartão Dia Afinz Visa` | B2B2C | DIA Supermercados | ⚠️ Risco de dormência |

## Mapa Vibe — a divisão que mais afeta a copy

[[Vibe]] é camada institucional da Afinz, não benefício de um cartão. Mas **não é uniforme**, e a diferença tem duas dimensões independentes:

| Produto | Ganha créditos Vibe | Jornada Vibe **dentro do app** |
|---|---|---|
| Afinz Visa | ✅ R$100 ativação + R$30/fatura | ✅ usa o app Afinz |
| Dia | ✅ R$100 ativação + R$30/fatura | ✅ usa o app Afinz |
| Bem Mais | ✅ R$100 ativação + R$30/fatura | ❌ **app whitelabel** |
| +amigo | ❌ **único de fora** | ❌ |

Três consequências operacionais:

1. **O pacote Vibe é idêntico nos três.** Dá para escrever uma copy-base e trocar só o nome do produto — a maior economia de esforço do portfólio.
2. **Plurix nunca menciona Vibe.** Confirmado pelo Pablo em 20/08/2026, não é dúvida em aberto.
3. **Bem Mais ganha o crédito mas não tem onde ver.** Toda a régua Vibe oficial ([[Regua-Vibe-Ativacao]]) pressupõe o app Afinz — opt-in por deeplink, "saldo e extrato no app", push de crédito recebido. Nada disso funciona para ele. **Precisa de régua própria e ela não existe.**

## Como a IA usa este dicionário

1. **[[Dicionario-de-Produtos]]** (esta nota) → identificar o produto e a proposta de valor.
2. **[[Beneficios-e-Vigencia]]** → filtrar `STATUS=VIGENTE` + `PODE CITAR=Sim`. Só o que sobrar pode entrar na peça.
3. **[[Pode-Dizer-Nao-Pode-Dizer]]** → filtrar pelo produto. Severidade `BLOQUEADOR` trava a entrega.
4. **Nota do produto** → tom, voz, CTA canônico, vocabulário.
5. **[[Formatacao-WhatsApp-Variaveis-e-Espacamento]]** → se o canal for WhatsApp.
6. **[[Conflitos-de-Fonte-Produtos-2026-08]]** → checar se o número que você vai usar está em disputa.

## Planilha operacional

`Dicionario_Produtos_Afinz_v3.xlsx` (nesta mesma pasta) — 10 abas, formato de máquina. A aba `Beneficios` tem a coluna `STATUS` como **fórmula contra `=TODAY()`**: benefício com data de fim no passado se marca `EXPIRADO` sozinho, sem ninguém revisar. É o guardrail executável.

## Cuidado de nomenclatura

Esta nota trata de **produto como marca comercial** (Afinz Visa, +amigo, Bem Mais, Dia). Não confundir com [[Produtos]] em `03-Dimensoes`, que é a dimensão do Framework e trata de **tier do cartão** (Classic, Platinum). São eixos diferentes: um cliente pode ter um `+amigo` Classic.

## Metodologia da coleta

Raspagem de fontes públicas em 19–20/08/2026, com URL para cada afirmação. Classificação de fonte:

- **OFICIAL** — site do produto, do parceiro, da Afinz, loja de app, regulamento.
- **TERCEIRA** — imprensa, comparador de cartões, Reclame Aqui. *Comparadores erram muito* — usados só quando não há oficial.
- **INTERNO** — nossa base (`REVISÃO VIBE.xlsx`, prints reais, guia de marca, material comercial).

## Relacionado

- [[Beneficios-e-Vigencia]] · [[Pode-Dizer-Nao-Pode-Dizer]] · [[Conflitos-de-Fonte-Produtos-2026-08]]
- [[Cartao-Afinz-Visa]] · [[Cartao-Amigo-Afinz-Visa]] · [[Cartao-Bem-Mais-Afinz-Visa]] · [[Cartao-Dia-Afinz-Visa]]
- [[Vibe]] · [[Regua-Vibe-Ativacao]] · [[Bandeiras-Plurix]] · [[Ofertas]] · [[Parceiros]] · [[BUs]]
- [[Motor-de-Briefing-Automatico]] · [[Formatacao-WhatsApp-Variaveis-e-Espacamento]]
- [[Galeria-de-Templates]] · [[Reguas-Inteligentes-Arquitetura]]

## Aplicação operacional — revisão editorial 02/10/2026

### Navegação para pessoas novas e IAs

Usar a ficha para entender o produto, [[Beneficios-e-Vigencia]] para condição/validade, [[Pode-Dizer-Nao-Pode-Dizer]] para claims e [[Ficha-de-Produto-Guia]] para a projeção operacional. Depois seguir [[Briefing-e-Regua-de-Aquisicao]] → [[Servico-Emails-Dinamicos]].

Marca comercial, tier, parceiro, bandeira e audiência são dimensões distintas. A nomenclatura comercial não deve ser copiada automaticamente para `NM_PRODUTO_INTERNO`: a chave técnica precisa corresponder à audiência e ao briefing.

### Cobertura atual e fontes

O vault tem quatro fichas comerciais. A consulta ao Supabase de 02/10 encontrou um contexto ativo na Fábrica, para +amigo, e sete guardrails. Isso significa cobertura operacional parcial; não prova cadastro das quatro fichas. As atualizações editoriais preservam a pesquisa de agosto e acrescentam regras operacionais datadas. Não revalidam tarifas, percentuais ou disponibilidade comercial.

A audiência de topo de Plurix, Dia e Bem Barato foi restringida a membros do Clube na decisão de 02/10, ver [[Topo-de-Funil]]. A regra de audiência não muda a elegibilidade de solicitação. [[Fontes-e-Proveniencia-Growth]] registra os conflitos atuais.
