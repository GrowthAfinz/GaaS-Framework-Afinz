---
title: "Pool de Ofertas - Parceiros"
tipo: iniciativa
camada: resultados
dominio: rentabilizacao
aliases: [Pool de Ofertas Parceiros, Pool de ofertas, Pool de ofertas B2C, RENT-96f7a0892e]
periodo: 2026-05-21 a em aberto
bus: [B2C]
status: ativo
atualizado: 2026-11-03
fonte: inventario-operacoes-growth 2026-10-03 (via Incentivo-ao-Uso); operador
tags: [iniciativa, rentabilizacao, pool-de-ofertas, parceiros, resultados, growth]
analytics: {"domain": "renta", "scope": {}, "any_of": [{"segment": "Rentabilização", "partner": "N/A", "subgroup": "Afinz VC", "stage": "Rentabilizacao", "journey": "JOR_RENT_POOL_OFERTAS", "safra": ""}, {"segment": "Rentabilização", "partner": "N/A", "subgroup": "N/A", "stage": "Rentabilizacao", "journey": "JOR_RENT_POOL_OFERTAS_REPIQUE_EMAGRECENTRO", "safra": ""}]}
---

# Pool de Ofertas - Parceiros

## Em uma frase

Comunicação de rentabilização que leva ofertas de **parceiros comerciais da própria Afinz** a quem já tem o cartão B2C, por e-mail, SMS e WhatsApp, para estimular o uso.

**Definição e propósito:** é a variante "Pool de ofertas" da mecânica [[Incentivo-ao-Uso]] (assunto `RENT-96f7a0892e`). Ganhou nome próprio em 03/11/2026 para não ser confundida com o [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Pool de Ofertas - Vai de Visa]], que usa catálogo da bandeira e personalização por MCC.

> Status: escopo e jornadas = `confirmado` pelo inventário; regra de seleção de parceiro, público e oferta = `a-validar`.

## Visão de resultado por parceiro

O bloco autenticado do GaaS (frontmatter `analytics`) consulta `rentabilizacao_activities` pelas duas jornadas abaixo. A leitura por parceiro depende de o parceiro estar no nome da jornada ou do activity, porque o campo `partner` está registrado como `N/A` em todas as linhas (ver Lacunas).

| Jornada | Subgrupo | Parceiro inferido pelo nome | Linhas no inventário |
|---|---|---|---:|
| `JOR_RENT_POOL_OFERTAS` | Afinz VC | vários (a identificar no activity) | 9 |
| `JOR_RENT_POOL_OFERTAS_REPIQUE_EMAGRECENTRO` | N/A | Emagrecentro (repique) | 4 |

Para cada parceiro novo no pool, o padrão é uma jornada ou um activity com o nome do parceiro, para que esta visão se separe sem trabalho manual.

## Principais números

> 📊 Inventário de 03/10/2026 e consulta de 29/10/2026 em `rentabilizacao_activities`, reproduzidos de [[Incentivo-ao-Uso]]. Rentabilização mede contato, não resultado.

- 13 disparos entre 21/05/2026 e 20/08/2026, canais E-mail, SMS e WhatsApp, produto `Cartao`.
- Em ago/2026: 9 disparos do pool, base acionável de 113.885.
- É a parte do incentivo ao uso B2C que continuou depois de junho/2026.

## Como medir sem cair em armadilha

- Abertura e clique medem atenção, não uso do cartão nem venda do parceiro.
- Não somar com o Vai de Visa: mecânica, fonte de oferta e público diferentes.
- O SMS/WhatsApp do Vai de Visa reaproveita a **estrutura de briefing** deste pool (decisão de 03/11/2026), não os resultados.

## Lacunas e pendências

- `partner = N/A` em todas as linhas → impede a visão por parceiro pelo campo → padronizar parceiro na taxonomia ou no activity → Pablo.
- Regra de seleção de parceiros e ofertas não documentada → impede comparar ondas → registrar a cada onda nesta nota → time de rentabilização.
- Lista de parceiros do pool e vigência das ofertas → impede citar oferta com segurança → criar tabela de parceiros com `vigente_de`/`vigente_ate`, no padrão de [[Motor-de-Briefing-Automatico]] → a confirmar.

## Relacionado

[[Incentivo-ao-Uso]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[07-Evolucao/Assunto-RENT-96f7a0892e|Assunto do inventário]] · [[10-Resultados/Dominios/Dominio-Rentabilizacao|Rentabilização]]
