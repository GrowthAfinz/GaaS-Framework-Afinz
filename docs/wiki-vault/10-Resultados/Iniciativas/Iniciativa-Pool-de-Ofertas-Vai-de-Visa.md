---
title: "Pool de Ofertas - Vai de Visa"
tipo: iniciativa
camada: resultados
dominio: rentabilizacao
aliases: [Vai de Visa, VDV, Pool de Ofertas Vai de Visa, Best November, Vai de Visa Black Friday]
periodo: 2026-11 a definir
bus: [B2C, B2B2C]
jornada_prevista: JOR_RENT_POOL_OFERTAS_VAIDEVISA
status: em-andamento
atualizado: 2026-11-03
fonte: operador; spec "Exemplos de ofertas Vai de Visa - Estrutura de campanhas" (gestora, out/2026); consultas Query Studio SFMC 03/11/2026
tags: [iniciativa, rentabilizacao, visa, vai-de-visa, black-friday, mcc, resultados, growth]
---

# Pool de Ofertas - Vai de Visa

## Em uma frase

Vitrine de ofertas da bandeira Visa (catálogo "Vai de Visa") enviada a quem já tem o cartão Afinz Visa, **personalizada pela afinidade de compra por categoria ([[MCC]])**, começando pelo tema Black Friday (que a Visa chama de *Best November*).

**Definição e propósito:** iniciativa de rentabilização (incentivo ao uso) que testa se escolher as ofertas pelo histórico de compras do cliente gera mais uso do cartão do que mandar as mesmas ofertas para todos. É também a primeira operação da Afinz que usa transação por MCC para segmentar CRM.

> Status por seção: desenho e base elegível = `confirmado` (consultas reais de 03/11/2026); e-mail, LP, SMS/WhatsApp, medição = `a-validar` (ainda não construídos).

## Não confundir com o Pool de Ofertas - Parceiros

| | **Pool de Ofertas - Vai de Visa** (esta nota) | **[[Iniciativa-Pool-de-Ofertas-Parceiros\|Pool de Ofertas - Parceiros]]** |
|---|---|---|
| Fonte das ofertas | Catálogo da Visa (nov/26: 62 ofertas únicas, cupom e link de afiliado) | Parceiros comerciais da própria Afinz (ex.: repique Emagrecentro) |
| Quem escolhe a oferta | Regra por grupo de afinidade MCC + limite disponível | Campanha escolhe, igual para toda a base |
| Personalização | Por CPF (4 slots dinâmicos) | Por campanha |
| Desenho | Teste com controle (holdout de 10%) | Disparo sem controle |
| Jornadas | `JOR_RENT_POOL_OFERTAS_VAIDEVISA` (*a-validar*) | `JOR_RENT_POOL_OFERTAS`, `JOR_RENT_POOL_OFERTAS_REPIQUE_EMAGRECENTRO` |
| Medição | Compra no estabelecimento/categoria da oferta (ver [[Teste-Afinidade-MCC-vs-Generico]]) | Abertura e clique (regra de [[Incentivo-ao-Uso]]) |

As duas são variantes da mecânica [[Incentivo-ao-Uso]]. Somar resultados das duas sem separar a jornada mistura mecânicas diferentes.

## Contexto e conceitos

- **Vai de Visa:** programa de vantagens da bandeira Visa; já aparece como benefício em [[Cartao-Afinz-Visa]]. O catálogo de out/2026 tem três abas: orientações, "Ofertas VDV - Geral" (resgate no site do parceiro, com ou sem cupom) e "Ofertas | Só com Visa" (exclusivas para pagamento Visa).
- **Precedente com a Visa:** [[Iniciativa-Copa-2026]] usou o BI da Visa (`copa_visa_daily`) como fonte da verdade. Isso abre um caminho de medição para esta iniciativa (ver Lacunas).
- **Afinidade por MCC:** categoria de compra definida pelo código do estabelecimento ([[MCC]]), não pelo produto comprado.
- **Grupos:** b1 Moda · b2 Saúde e Beleza · b3 Eletrodomésticos · b4 Eletrônicos · b5 Brinquedos · b6 Viagem · b7 Pet · Genérico.

## Frentes e responsáveis

| Frente | Responsável | Status (03/11/2026, fim do dia) | Observação |
|---|---|---|---|
| Base de audiência | Pablo | em andamento | MAPA corrigida; DEs criadas; automação de preparação em 1ª execução ([[Automacao-VDV-Pool-de-Ofertas]]) |
| Ofertas | Tassia / Pablo | em andamento | Pool de 62 ofertas classificado e priorizado; vitrine do 1º teste definida ([[DE-BRIEFING_OFERTAS_VISA]]) |
| E-mail dinâmico | Pablo / Pietra | a iniciar | Template-fonte novo com KV e 3 cards ([[Emails-Dinamicos-Vai-de-Visa]]) |
| LP dinâmica | Pablo | a iniciar | CloudPage com a mesma lógica, `ID_ENVIO` no link |
| SMS e WhatsApp | Tassia / Pablo | a iniciar | Briefing no padrão do Pool de Ofertas - Parceiros |
| Medição | IN | a combinar | Relatório agregado D+7/15/30 a partir da `VDV_ENVIO` |

## Primeiro teste (safra `VDV_2026_11_BF`)

- **Grupos:** MODA, SAUDE_BELEZA e FAMILIA_PRESENTES (3 marcas cada) + GENERICO. Detalhe em [[DE-VDV_APTOS]] e [[DE-BRIEFING_OFERTAS_VISA]].
- **Sorteio:** controle de 10% com código fixo + A × B por safra ([[Teste-Afinidade-MCC-vs-Generico]]).
- **Disparo:** antes de 30/11 (Giuliana Flores e Evino vencem nessa data).

## Fases

1. **Fase 1 — B2C + B2B2C** (sem Plurix). Fonte: `CLIENTES ATIVOS`, que hoje só tem `CANAL` B2C e B2B2C.
2. **Fase 2 — Plurix / Cartonistas.** Entrada prevista do público [[Publico-Cartonistas]]; filtro `CANAL IN ('B2C','B2B2C')` existe justamente para isolar a fase 1.

## Funcionamento

```
SFTP (IN) → MAPA_MCC_ENTRADA (texto) → MAPA_MCC
CLIENTES ATIVOS (diária) ─┐
                          ├─► VDV_CRUZAMENTO → VDV_APTOS (grupo + célula) → VDV_FUNIL
MAPA_MCC (NR_CONTA) ──────┘                         │
                                    (dia do disparo) ▼
BRIEFING_OFERTAS_VISA ──► e-mail / LP ◄── VDV_ENVIO (congelado, sendable) ──► IN (30 dias)
```

Peças em [[MOC-SFMC-DEs-e-Automations]] e automações em [[Automacao-VDV-Pool-de-Ofertas]].

## Regras de elegibilidade (vigentes na fase 1)

| Regra | Implementação | Origem |
|---|---|---|
| Ativo | `DATA_ULTIMA_COMPRA` nos últimos 30 dias | spec da gestora |
| Limite | `LIMITE_DISPONIVEL ≥ 200` no cartão NORMAL | spec da gestora |
| Conta sem bloqueio/atraso | `STATUS = 'NORMAL'` | decisão 03/11 (campo legível substitui `CD_STATUS_CONTA`/`QT_DIAS_ATRASO`) |
| Atraso em **qualquer** conta do CPF | CPF sai | decisão 03/11 (a confirmar com a gestora) |
| Bloqueio de e-mail | `bloqueio_email = True` em qualquer linha do CPF → sai da base de e-mail | pedido do Pablo |
| Bloqueio de celular | gravado como flag; exclui só de SMS/WhatsApp | pedido do Pablo |
| Oferta × limite | oferta só aparece se `limite ≥ ticket mínimo × 1,10` | spec da gestora |

## Principais números

> 📊 Snapshot 2026-11-03 — Query Studio (SFMC), `CLIENTES ATIVOS` com DT_CARGA 03/11 05:16 e `MAPA_MCC` importada no mesmo dia. Contagens por CPF feitas com `GROUP BY` (ver [[SFMC-Query-Studio-e-SQL]]).

| Etapa | Valor | Leitura |
|---|---:|---|
| Linhas da `CLIENTES ATIVOS` | 517.025 | uma linha por cartão/produto, não por cliente |
| Linhas com `STATUS = 'NORMAL'` | 434.575 | B2B2C 308.389 · B2C 126.186 |
| … com compra nos últimos 30 dias | 212.820 | metade da base NORMAL está parada |
| … com limite disponível ≥ R$ 200 | 134.030 | **maior corte: −37%** dos ativos |
| … com e-mail liberado | 130.228 | bloqueio pesa ~3% |
| … com conta na MAPA_MCC | 129.955 | cruzamento por conta bate 99,8% |
| **CPFs elegíveis (regras por CPF)** | **130.175** | número oficial da base elegível |

As quatro primeiras linhas do funil foram calculadas com `COUNT(DISTINCT)` no Query Studio e podem estar infladas; o número oficial é o da última linha.

## Medição

Ver [[Teste-Afinidade-MCC-vs-Generico]] para células, KPIs e janela. Resumo: conversão = compra no estabelecimento ou na categoria da oferta até 30 dias após o envio, comparada ao grupo de controle. Abertura e clique entram como diagnóstico, não como resultado.

## Fontes e evidências

- Spec da gestora: abas "Estratégia de Ativação", "Ofertas x Segmento" e "Spec DE - IN" (arquivo local do Pablo; não versionado no vault).
- Catálogo Visa (out/2026) e e-mail da Visa com temas e parceiros de destaque da Best November (Viagem e Turismo, Esporte e Lazer, Beleza e Saúde, Eletrônicos; parceiros de maior venda: Decolar, Movida, GOL, CVC, Extra, iPlace).
- Consultas no Query Studio de 03/11/2026 (resultados acima).

## Lacunas e pendências

- Top vendidas Visa por categoria não veio na coluna da spec → define o conteúdo genérico (SEG-B, GEN-A) → e-mail da Visa cobre só parte (Adidas, Venancio, GOL, CVC, Extra, iPlace não estão no catálogo) → Tassia / Visa.
- Medição por nome de estabelecimento é frágil em compra online → subestima conversão → pedir à Visa dado de resgate por oferta/cupom, como `copa_visa_daily` → Pablo / gestora.
- Quantidade de compras em 6 meses ausente na MAPA → regra de grupo aproximada (`V1_12M_REC6M`) → coluna nova no arquivo da IN → IN.
- 79 mil clientes ativos sem limite ≥ R$ 200 ficam fora → público relevante sem comunicação → decidir mensagem sem oferta → gestora.
- Nome da jornada não definido → impede reconciliação com `rentabilizacao_activities` → definir na criação da jornada → Pablo.

Pendências registradas também em [[Decisões-Abertas]]; problemas do catálogo em [[Inconsistências-a-Corrigir]].

## Relacionado

[[Incentivo-ao-Uso]] · [[Iniciativa-Pool-de-Ofertas-Parceiros]] · [[Iniciativa-Copa-2026]] · [[Cartao-Afinz-Visa]] · [[MCC]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Emails-Dinamicos-Vai-de-Visa]] · [[MOC-SFMC-DEs-e-Automations]] · [[10-Resultados/Dominios/Dominio-Rentabilizacao|Rentabilização]]
