---
title: "Rentabilização"
tipo: dominio
camada: resultados
dominio: rentabilizacao
status: ativo
atualizado: 2026-10-29
fonte: consolidacao-wiki-2026-10-29
tags: [dominio, rentabilizacao, resultados, growth]
analytics: {"domain": "renta", "scope": {}}
---

# Rentabilização

## Em uma frase

Os disparos de CRM para quem já é cliente: ativação, uso, reativação, seguros, crédito e campanhas como a Copa 2026. O objetivo é uso e receita, não cartão novo.

Fonte: `rentabilizacao_activities`. Cada mecânica tem a sua página, com as variantes e o registro do inventário; a Copa 2026 tem página de iniciativa.

## Principais números: jun a ago/2026

> 📊 Consulta em `rentabilizacao_activities` de 29/10/2026, por mês da data de disparo, somando as linhas cobertas pelos assuntos desta página. Rentabilização mede contato, não resultado: base, abertura e clique. Abertura e clique só existem em parte das linhas; as taxas usam como denominador a base das linhas que têm o dado. Custo quase não é registrado nesta tabela, por isso não há custo por clique.

| Mecânica | Disparos | Base acionável | Aberturas | Aberturas/base | Cliques | Cliques/base | Linhas com clique registrado |
|---|---:|---:|---:|---:|---:|---:|---:|
| Copa 2026 (iniciativa) | 2.310 | 5.277.160 | 269.176 | 8,8% | 6.036 | 0,20% | 768 de 2.310 |
| Ativação, desbloqueio e boas-vindas | 73 | 1.229.213 | 109.226 | 8,9% | 2.718 | 0,22% | 63 de 73 |
| Incentivo ao uso | 63 | 119.252 | 29.799 | 48,2% | 63 | 0,47% | 50 de 63 |
| Reativação e datas comerciais | 0 | 0 | 0 | n/d | 0 | n/d | 0 de 0 |
| Seguros | 233 | 7.164.425 | 444.248 | 6,2% | 2.819 | 0,039% | 115 de 233 |
| Crédito e investimento | 4 | 14.314 | 2.710 | 18,9% | 1 | 0,009% | 2 de 4 |
| Comunicados operacionais e testes | 59 | 39.129 | 13.204 | 33,7% | 8 | 0,044% | 3 de 59 |
| **Total** | **2.742** | **13.843.493** | **868.363** | **7,5%** | **11.645** | **0,10%** | **1.001 de 2.742** |

Atividade de cada mecânica na série toda:

| Mecânica | Disparos (série toda) | Primeiro disparo | Último disparo |
|---|---:|---|---|
| Copa 2026 (iniciativa) | 2.451 | 13/04/2026 | 23/08/2026 |
| Ativação, desbloqueio e boas-vindas | 2.596 | 02/01/2025 | 03/08/2026 |
| Incentivo ao uso | 2.321 | 14/10/2025 | 20/08/2026 |
| Reativação e datas comerciais | 19 | 26/09/2025 | 01/01/2026 |
| Seguros | 711 | 10/12/2025 | 23/08/2026 |
| Crédito e investimento | 5 | 04/12/2025 | 25/06/2026 |
| Comunicados operacionais e testes | 561 | 19/11/2025 | 01/07/2026 |

Como ler:
- **Não há disparo real de rentabilização desde 23/08/2026.** Depois disso entraram só 10 linhas de teste, em outubro. Pode ser pausa da operação ou parada da ingestão; isso precisa ser confirmado antes de qualquer leitura de setembro e outubro.
- **A Copa teve a maior parte dos disparos de jun a ago** (2.310 de 2.742). Em base acionável, quem falou com mais gente foram as réguas de seguros (7,2 milhões contra 5,3 milhões da Copa).
- **Custo quase não é registrado** (R$ 1.148 em ativação e R$ 4.076 em seguros na série toda), então não há custo por clique nem comparação de eficiência.
- Clique e abertura medem atenção. Nenhuma página de rentabilização afirma uso, desbloqueio, venda de seguro ou receita.

## Mecânicas

[[10-Resultados/Iniciativas/Iniciativa-Copa-2026|Copa 2026 (iniciativa)]] · [[10-Resultados/Mecanicas/Ativacao-e-Boas-Vindas|Ativação, desbloqueio e boas-vindas]] · [[10-Resultados/Mecanicas/Incentivo-ao-Uso|Incentivo ao uso]] · [[10-Resultados/Mecanicas/Reativacao-e-Datas|Reativação e datas comerciais]] · [[10-Resultados/Mecanicas/Seguros|Seguros]] · [[10-Resultados/Mecanicas/Credito-e-Investimento|Crédito e investimento]] · [[10-Resultados/Mecanicas/Comunicados-e-Testes|Comunicados operacionais e testes]].

## Perguntas em aberto

| Questão | Impacto | Evidência necessária | Dono |
|---|---|---|---|
| A rentabilização parou em 23/08/2026 ou parou a ingestão? | toda a leitura de set e out depende disso | conferir SFMC e a carga de `rentabilizacao_activities` | Pablo |
| Registrar o custo dos disparos de rentabilização | sem custo não há eficiência | tarifa por canal aplicada na ingestão, como já é feito na aquisição | a confirmar |
| Trazer um evento de resultado (uso, desbloqueio, venda de seguro) | hoje só existe atenção (abertura e clique) | integração com transação e seguradora | a confirmar |

## Relacionado

[[02-Entidades-Dados/rentabilizacao_activities|rentabilizacao_activities]] · [[08-Engenharia/Export-XLSX-Renta-Copa|Export XLSX de rentabilização]] · [[10-Resultados/Dominios/Dominio-CRM-Aquisicao|CRM Aquisição]] · [[07-Evolucao/Inventario-Operacoes-Growth|Inventário de operações]]

As famílias de rentabilização e seguros como estavam no inventário de 03/10/2026 (referência; a nota original continua no lugar):

### Famílias observadas em rentabilização e seguros

| ID | Família candidata | BU | Linhas | Agrupamentos |
|---|---|---|---|---|
| RENT-09a331cabd | Ativação | B2B2C | 1 | 1 |
| RENT-1565b28c8f | Black Friday inativos | B2B2C | 3 | 1 |
| RENT-7f04768511 | Copa Ativação | B2B2C | 1246 | 6 |
| RENT-68eae484cf | Copa Cartonistas | B2B2C | 12 | 1 |
| RENT-de7adb7cce | Copa Novos | B2B2C | 299 | 1 |
| RENT-fcb2005be4 | Copa Reativação | B2B2C | 342 | 2 |
| RENT-deaef88d25 | Copa cadastro incompleto | B2B2C | 1 | 1 |
| RENT-e26f566672 | Copa eventos e lembretes | B2B2C | 9 | 7 |
| RENT-77f8f33e8f | Copa incentivo ao cadastro | B2B2C | 15 | 1 |
| RENT-3d51d00ed6 | Copa público cadastrado | B2B2C | 83 | 1 |
| RENT-093062a4b8 | Incentivo ao uso Sorridentes e GIO | B2B2C | 2 | 1 |
| RENT-55b43e6e2a | Incentivo ao uso demais parceiros | B2B2C | 2 | 1 |
| RENT-839315987f | Oferta de investimento CDB | B2B2C | 4 | 2 |
| RENT-339eff5a34 | Aniversário com parceiro | B2C | 1 | 1 |
| RENT-7cfb8b35bf | Cadastro pontual | B2C | 16 | 1 |
| RENT-0500aab9d6 | Copa Ativação | B2C | 2 | 1 |
| RENT-aede134f3d | Desbloqueio | B2C | 366 | 1 |
| RENT-1752944e1c | Incentivo ao uso | B2C | 1308 | 1 |
| RENT-7b62e804a9 | Pagamento de contas | B2C | 2 | 1 |
| RENT-96f7a0892e | Pool de ofertas | B2C | 13 | 2 |
| RENT-6ca0baf5f3 | Recarga de celular | B2C | 1 | 1 |
| RENT-a9cebf447f | Recuperação de inativos no aniversário Afinz | B2C | 10 | 5 |
| RENT-63c4e611b8 | Welcome | B2C | 235 | 2 |
| RENT-392d973d79 | Ativação | Plurix | 10 | 2 |
| RENT-328952fe4d | Aumento de limite de cartonistas | Plurix | 1 | 1 |
| RENT-cafe598fb3 | Ação Avenida | Plurix | 1 | 1 |
| RENT-bda382d827 | Copa Ativação | Plurix | 95 | 3 |
| RENT-8cc1b6d474 | Copa Cartonistas | Plurix | 1 | 1 |
| RENT-bfa7c5c65b | Copa Novos | Plurix | 343 | 1 |
| RENT-e833be777d | Copa eventos e lembretes | Plurix | 3 | 3 |
| RENT-9bbaebd866 | Desbloqueio | Plurix | 917 | 1 |
| RENT-f73bceeb96 | Desbloqueio pós-tombamento | Plurix | 34 | 2 |
| RENT-2f0e84a868 | Incentivo ao uso | Plurix | 993 | 1 |
| RENT-16761c8a3a | Informativo de encerramento de pontos | Plurix | 1 | 1 |
| RENT-2cbba934fa | Natal Avenida | Plurix | 4 | 1 |
| RENT-0a46d97819 | Oferta de seguro em Plurix | Plurix | 79 | 1 |
| RENT-6afea2d2e0 | Seedlist nomeada | Plurix | 556 | 1 |
| RENT-5051e37f02 | Teste nomeado | Plurix | 1 | 1 |
| RENT-cd4c748d2b | Welcome | Plurix | 1017 | 1 |
| RENT-613bd68a2c | Carrinho de Seguro Mulher | Seguros | 372 | 3 |
| RENT-bc1d462c4c | Oferta Seguro Mulher | Seguros | 165 | 14 |
| RENT-7ab8558f4b | Seguro Residência 24h | Seguros | 95 | 9 |
| RENT-929cf587a1 | Teste nomeado | Seguros | 3 | 2 |

Parceiro aparece como N/A nessa fonte e foi preservado. Redes citadas em nomes são pistas, não identidades canônicas confirmadas. Aumento de limite de cartonistas em rentabilização permanece separado do conceito Upgrade de propostas em aquisição. Seguros e uso não herdam CAC/cartões como resultado apenas por possuírem campos semelhantes.
