---
title: "Estratégia de aquisição por bases segmentadas (regra original, jan/2026)"
tipo: estrategia
camada: estrategia
dominio: crm-aquisicao
status: referencia
atualizado: 2026-10-29
fonte: planilha Estrategias_Aquisicao_Bases_Segmentadas.xlsx
fonte_criada: 2025-03-24
fonte_modificada: 2026-01-06
aliases: [Bases Segmentadas, Estratégia de Bases Segmentadas, Regra original das réguas]
tags: [estrategia, crm, aquisicao, publicos, regua]
---

# Estratégia de aquisição por bases segmentadas (regra original, jan/2026)

> **O que é esta nota.** A transcrição da planilha `Estrategias_Aquisicao_Bases_Segmentadas.xlsx`, criada em 24/03/2025 e alterada pela última vez em 06/01/2026. Ela é a **regra original** das cinco réguas de aquisição do CRM: quem entra, quem sai, com que base, por quanto tempo e por qual canal. O que a operação faz hoje está nas páginas de cada público, na seção "Regra original (jan/2026) e o que a operação mostra hoje".

Páginas que comparam a regra com a operação:

- [[10-Resultados/Publicos/Publico-Carrinho-Abandonado|Carrinho abandonado]]
- [[10-Resultados/Publicos/Publico-Upgrade|Upgrade (aprovados não convertidos)]]
- [[10-Resultados/Publicos/Publico-Repescagem|Repescagem]]
- [[10-Resultados/Publicos/Publico-Leads-de-Parceiros|Leads de parceiros]]
- [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]]

## Leitura rápida

| Campanha | Funil | Quem entra | Pré-análise | Base nova | Duração | Ritmo | Canais | Status na planilha |
|---|---|---|---|---|---|---|---|---|
| Carrinho abandonado | Fim | Aceitou a oferta e parou em fraude (docs/biometria), assinatura ou finalização | Não | Diária (D+1 do abandono) | 15 dias | 2 ativações por semana | WhatsApp com transbordo, Push, SMS | Avaliar com o Zaidan |
| Upgrade de oferta | Meio | Aprovado e não convertido | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Repescagem | Meio | Negado com chance de aprovação | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Leads parceiros | Topo | Lead de parceiro sem simulação ou sem análise de crédito | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Esteiras de topo | Topo | Bases frias de pouco relacionamento | Não | Mensal | 30 dias | 2 ativações por semana | E-mail, SMS e mídia paga | (vazio) |

> **Escopo das esteiras de topo (decisão do Pablo, 29/10/2026).** As esteiras de topo desta planilha (Barril, bureaus, Pago Livre, orgânicos) são **só do B2C**. Os parceiros de varejo (Bem Barato, Plurix e os demais) seguem outro caminho: usam só os próprios leads, e as réguas de topo deles são só para membros do clube. Ver [[10-Resultados/Publicos/Publico-Topo-de-Funil|Topo de funil]].

## Aba "Visão Geral" (transcrição)

| Prioridade | Ciclo de vida | Campanha | Objetivo | Quem | O que precisamos? | Canal prioritário | Quando |
|---|---|---|---|---|---|---|---|
| 1 | Fim de funil | Carrinho abandonado | Finalização de propostas dos clientes que pararam em etapas finais de solicitação | Clientes que deram aceite na oferta, mas que abandonaram funil em etapas de fraude (docs/biometria) com exclusão negados; assinatura de contrato ou finalização | Marcação resultado análise de fraude | CRM: WhatsApp com transbordo; Push; SMS | D+1 após abandono, durante 15 dias com 2 ativações semanais |
| 2 | Meio de funil | Upgrade de oferta | Conversão dos clientes aprovados não convertidos | Clientes aprovados não convertidos dos últimos 3 meses de origem B2C + últimos 6 meses B2B2C sem repetição celular com oferta de aumento de limite para até R$ 2000 aprovados e limite + Platinum acima de R$ 2000 | Olhar repetição de celular para ser filtro de exclusão do todo | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 3 | Meio de funil | Repescagem | Clientes negados com possibilidade de aprovação | Clientes B2C com proposta negada crédito últimos 6 meses + clientes B2B2C negados mais de 6 meses sem repetição celular pré analisados | Validar se a hipótese é válida enquanto não temos swapin | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 4 | Topo de funil | Leads parceiros | Clientes sem simulação de proposta ou sem análise de crédito de origem parceiros | Clientes sem simulação de proposta ou sem análise de crédito de origem parceiros dos últimos 30 dias pré analisados | Dados cadastros obtidos via pré análise | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 4 | Topo de funil | Esteiras de topo | Criação de awareness e engajamento em bases mais frias de pouco relacionamento | Barril Afinz, bases bureau e Pago Livre com abertura ou clique ou início de simulação de propostas nos últimos 12 meses + clientes grupos acima sem engajamento nas ações acima nos últimos 90 dias | (vazio) | CRM: E-mail; SMS / Online: campanhas de mídia paga | Régua total com 30 dias duração, considerando frequência de 2 ativações semanais |

A coluna "Volumetria" existe na aba, mas está vazia em todas as linhas.

## Aba "Racional Lógico IN" (transcrição)

| Funil | Situação | Prioridade | Campanha | Objetivo | Fonte de dados | Critérios de inclusão | Critérios de exclusão | Pré-análise | Elegíveis para CRM | Base nova | Duração | Observações | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fim de funil | Redesigned | 2 | Carrinho Abandonado | Qualificação do público de abandono com atendimento mais especializado na mesa | Propostas + Fraude + Contratos | Aceite + Abandono docs/biometria/assinatura | Negado por fraude | Não | Todo público restante | Diário (D+1 abandono) | 15 dias | 2 ativações semanais | Avaliar com o Zaidan |
| Meio de funil | New | 1 | Upgrade de Oferta | Conversão dos aprovados não convertidos | Aprovados + Limites aprovados | Aprovados últimos 3 meses B2C ou aprovados de 6 a 12 meses B2B2C | Celular repetido | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Meio de funil | New | 1 | Repescagem | Reabordar negados com chance de aprovação | Negados + Histórico | Negados últimos 6 meses B2C ou negados 6 a 12 meses+ B2B2C negados há mais de 6 meses | Celular repetido | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Topo de funil | New | 1 | Leads Parceiros | Ativar leads de parceiros B2C sem simulação | Leads parceiros B2C | Leads B2C que não bateram no motor de crédito últimos 30 dias | Já convertidos | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Topo de funil | Redesigned | 3 | Esteiras de Topo | Awareness e reengajamento | Barril + Bureau + Pago Livre + Orgânicos B2C + Leads parceiros | CPFs com origem Barril (ipê roxo) (+) clientes com origem Bureaus de crédito (BVS, Quod e SPC Creditis) (+) clientes com origem Pago Livre que tiveram aberturas ou clicks em campanhas de CRM nos últimos 12 meses ou simulação de proposta nos últimos 12 meses (+) clientes orgânicos B2C (+) Leads parceiros sem simulação de proposta há mais de 60 dias que não entraram nas réguas de repescagem ou upgrade de oferta | Grupos acima | Não | 100% da base elegível | Mensal | 30 dias | 2 ativações semanais | (vazio) |

A coluna "Alavanca" da aba mostra erro de fórmula (`#VALUE!`) em todas as linhas, e por isso não foi transcrita. "Situação" é a coluna sem título que vem logo depois dela (New ou Redesigned).

## Onde as duas abas não batem

As duas abas foram feitas para dizer a mesma coisa, mas têm diferenças. Quando forem usar a regra, vale saber disso:

| Ponto | Visão Geral | Racional Lógico IN |
|---|---|---|
| Ordem de prioridade | Carrinho 1, Upgrade 2, Repescagem 3, Leads 4, Esteiras 4 | Upgrade, Repescagem e Leads 1, Carrinho 2, Esteiras 3 |
| Janela do Upgrade no B2B2C | últimos 6 meses | de 6 a 12 meses |
| Janela da Repescagem no B2B2C | negados há mais de 6 meses | "6 a 12 meses+" e "há mais de 6 meses" na mesma frase |
| Objetivo do Carrinho | finalizar a proposta de quem parou no fim | qualificar o público de abandono com atendimento mais especializado na mesa |
| Esteiras de topo | Barril, bureau e Pago Livre engajados em 12 meses, mais os grupos acima sem engajamento em 90 dias | soma também orgânicos B2C e leads de parceiros sem simulação há mais de 60 dias, fora de Repescagem e Upgrade |
| Oferta do Upgrade | aumento de limite até R$ 2000 e limite + Platinum acima de R$ 2000 | não fala de oferta, só de "informações de novo limite" |

## O que a operação mostra hoje (jul a set/2026, resumo)

Medido em `activities` em 29/10/2026, de 01/07 a 30/09/2026. Uma linha é um disparo (uma ação de uma jornada num dia). "Dias com disparo" conta os dias em que houve pelo menos um disparo do público, em qualquer jornada: mede o ritmo da operação, não quantas mensagens cada cliente recebe.

| Público (código no dado) | Disparos | Jornadas | Dias com disparo (de 92) | Cartões | Canais na prática |
|---|---:|---:|---:|---:|---|
| Carrinho (`Abandonados`) | 1.770 | 27 | 92 | 3.286 | WhatsApp quase tudo; Push e SMS no B2C; E-mail 1 disparo |
| Upgrade (`Aprovados_nao_convertidos`) | 247 | 14 | 55 | 194 | WhatsApp; SMS em 9 disparos; sem e-mail |
| Repescagem (`Negados`) | 255 | 15 | 59 | 3.080 | WhatsApp; SMS em 7 disparos; sem e-mail |
| Leads de parceiros (`Leads_Parceiros`) | 30 | 1 | 30 (só setembro) | 10 | só WhatsApp |
| Topo B2C (`Base_Proprietaria`) | 339 | 7 | 64 | 88 | E-mail; SMS em 4 disparos |
| Topo varejo (`CRM`) | 385 | 17 | 69 | 1.035 | E-mail; SMS em 7 disparos |

As diferenças que mais chamam atenção:

1. **O ritmo mudou.** A regra fala em 2 ativações por semana. Hoje o carrinho tem disparo todo dia e virou uma régua diária com três janelas (`Diario`, `Abandonados D-7` no sábado e `Abandonados D-21 A D>7` no dia útil).
2. **O e-mail sumiu do meio de funil.** Upgrade, Repescagem e Leads tinham WhatsApp, E-mail e SMS na regra. Na prática é quase tudo WhatsApp.
3. **O topo virou dois.** A esteira de topo da regra é B2C (`Base_Proprietaria`). O topo de varejo (`CRM`, Plurix, Bem Barato e Dia) não está na planilha: ele usa os leads do próprio parceiro e é só para membros do clube.
4. **A mídia paga da esteira de topo** não aparece em `activities`. Ela fica nos dados de mídia, que ainda não têm página própria nesta estrutura.
5. **O subgrupo do carrinho vazou.** Em setembro, 149 disparos de Upgrade, 144 de Repescagem e os 30 de Leads foram gravados com o subgrupo `Abandonados D-21 A D>7`. É erro de importação, não mudança de régua.

## Relacionado

- [[10-Resultados/Dominios/Dominio-CRM-Aquisicao|Domínio CRM Aquisição]]
- [[05-Estrategia/Briefing-e-Regua-de-Aquisicao|Briefing e régua de aquisição]]
- [[05-Estrategia/Estrategia-Multicanal-Vibe-Mar-Fechado|Estratégia multicanal Vibe com mar fechado]]
- [[05-Estrategia/Anti-Overlap-Pressão-de-Contato|Anti-overlap e pressão de contato]]
