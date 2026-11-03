---
tags: [estrategia,regua,vibe,ativacao,rentabilizacao]
tipo: estrategia
camada: estrategia
atualizado: 2026-08-20
status: confirmado
fonte: pesquisa-externa
---

# Régua Vibe — Ativação e Recorrência

**Definição:** a régua oficial do programa [[Vibe]], desenhada para levar o cliente **da adesão ao hábito de uso**. Não é régua de aquisição — é de **ativação/rentabilização**, e por isso não está em `reguas_taxonomia.md` da skill de copy.

> Fonte: material interno *"Treinamento Comercial — App integrado ao app Afinz"*, 08/08/2026.

## A tese

> *"O objetivo não termina no opt-in: clientes que utilizam e resgatam o benefício apresentam maior ativação. Por isso a estratégia de CRM acompanha o cliente da adesão ao hábito de uso."*

Os números sustentam: cupom ativado **com** resgate = **68%** de ativação de portfólio; **sem** resgate = 64%; sem ativação de cupom = 57%. O ganho está no **resgate**, não na adesão.

E o CRM tem papel explícito: *"Produto/App constrói a experiência; CRM garante que ela seja usada."*

## A régua

| Momento | Objetivo | Conteúdo | Canais |
|---|---|---|---|
| **(pré)** | **Opt-in** | Campanha de incentivo à adesão. Deeplink levando o elegível direto para a adesão no app Afinz | Push + SMS |
| **(transacional)** | **Crédito recebido** | Comunicação transacional; saldo e extrato no app. Torna o benefício percebido | E-mail + push |
| **D+7** | **1º resgate** | Ofertas patrocinadas, de **baixo valor e uso diário**: transporte, internet, gás, mobilidade. Resgate imediato pelo link, **sem app** | WhatsApp, e-mail |
| **D+15** | **2ª transação** | Amplia categorias e reforça o ganho percebido. Régua transacional | SMS, WhatsApp |
| **D+30** | **3ª transação** | Recorrência consolidada. Padrão de superapp — **3 transações em 30 dias** — aplicado ao ciclo Vibe | SMS, WhatsApp |
| **Pós D+30** | **Sorteios** | Chance de levar R$100 mil | WhatsApp, e-mail, SMS |

## Decisões de desenho que valem copiar

**O 1º resgate é deliberadamente barato e cotidiano.** Transporte, internet, gás — não cinema nem viagem. O objetivo do D+7 não é entregar valor máximo, é **provar que funciona** com a menor fricção possível. E é resgatável **pelo link, sem precisar do app** — remove a barreira de download exatamente no momento mais frágil.

**O sorteio vem depois do hábito, não antes.** Só entra pós-D+30, quando o cliente já resgatou três vezes. Usar sorteio como gancho de entrada inverteria a lógica: ele é recompensa de recorrência, não isca de adesão.

## 🔴 Dois buracos abertos

### 1 — Não existe régua Vibe para o Bem Mais

Toda a régua acima pressupõe o **app Afinz**: opt-in por deeplink no app, "saldo e extrato no app", push de crédito recebido.

O [[Cartao-Bem-Mais-Afinz-Visa]] tem app **whitelabel**. Ele **ganha os créditos** mas não tem opt-in, saldo nem extrato no app. **Nenhum momento desta régua funciona para ele como está escrito.**

→ Precisa de uma variante: como ele adere, onde vê saldo, como resgata. Não existe desenhada.

### 2 — O público sem opt-in não está mapeado

*"Somente clientes com opt-in passam a ganhar créditos Vibe."* Existe um segmento **elegível, com cartão, sem opt-in** — que não ganha nada e não sabe. O material pede push + SMS com deeplink, mas **essa régua não existe em nenhuma das nossas taxonomias**.

## Pendências de execução

- Entrar em `references/reguas_taxonomia.md` da skill `afinz-copy-aquisicao` como régua de **rentabilização/ativação**.
- Cruzar com [[Anti-Overlap-Pressão-de-Contato]] — o cliente pode estar simultaneamente numa régua de aquisição de outro produto.
- Definir o gatilho de D+0: é a data do opt-in, do crédito creditado, ou do primeiro crédito **visível** no app? Lembrando que o crédito leva **4 a 8 dias úteis** para aparecer.

## Relacionado

- [[Vibe]] · [[Dicionario-de-Produtos]] · [[Reguas-Inteligentes-Arquitetura]]
- [[Cartao-Bem-Mais-Afinz-Visa]] · [[Anti-Overlap-Pressão-de-Contato]] · [[Régua]]
- [[Estrategia-Multicanal-Vibe-Mar-Fechado]] · [[Ativacao-de-Audiencias-Diaria]]
