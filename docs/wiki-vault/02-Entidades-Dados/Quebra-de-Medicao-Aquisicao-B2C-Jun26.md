---
tags: [dados,midia,medicao,aquisicao,meta,appsflyer,quebra-de-serie]
tipo: entidade-dados
camada: dados
atualizado: 2026-08-20
status: confirmado
fonte: supabase-paid_media_metrics
---

# Quebra de Medição — Aquisição B2C, junho de 2026

**Definição:** a mudança de objetivo e de conta da campanha de Aquisição B2C no Meta, em
22/06/2026, que quebra a série histórica de resultado. Qualquer leitura que atravesse essa data
**precisa** declarar a quebra, senão compara coisas diferentes.

## O que aconteceu

Em **22/06/2026** a campanha de Aquisição B2C migrou de conta e de objetivo:

| | Até 22/06 | A partir de 23/06 |
|---|---|---|
| Campanha | `[B2C]App_Install_Afinz` | `[Afinz \| Fábrica de Vendas] [B2C]App_Install_Onboarding_Afinz` |
| Objetivo real | **Instalação do app** | **Início de proposta (StartTrial)** |
| Campo preenchido | só `conversions` | `installs`, `start_trials` e `conversions` |
| O que `conversions` significa | instalação | início de proposta |

**Confirmado pelo operador da conta em 20/08/2026:** de junho para trás, a conversão da campanha
de Aquisição B2C era instalação.

## Como ler cada campo

- **Até 22/06:** `conversions` = instalação. `installs` e `start_trials` vêm zerados porque o
  campo não era coletado, não porque o resultado foi zero.
- **A partir de 23/06:** `conversions` = `start_trials` = início de proposta. `installs` é campo
  separado e maior.

Regra de leitura para qualquer relatório:

```sql
-- instalação, série completa — SÓ para campanhas de instalação de app
case when date < '2026-06-23' then conversions else installs end as instalacoes
```

> ⚠️ **Escopo da regra.** Ela vale apenas para campanhas cujo objetivo era instalação de app —
> Aquisição B2C e Plurix. **Não aplicar em Seguros nem em Rentabilização:** lá `conversions`
> sempre significou lead e clique na landing, e `installs` nunca foi preenchido. Aplicar a regra
> nessas frentes zera julho indevidamente. Erro cometido e corrigido em 20/08/2026.

## O efeito no trimestre maio–julho

| Mês | Investido | Instalações | Custo por instalação | Inícios de proposta |
|---|---|---|---|---|
| Maio | R$ 5.210 | 517 | R$ 10,08 | não medido |
| Junho | R$ 5.861 | 283 | R$ 20,71 | 41 (8 dias) |
| Julho | R$ 5.608 | 202 | R$ 27,76 | 97 |

**A leitura correta não é "o custo por instalação piorou".** É que a campanha **parou de comprar
instalação** e passou a comprar início de proposta, que é um evento mais fundo do funil. Menos
instalação por real é o resultado esperado dessa troca, não uma perda de eficiência.

Comparar custo por instalação de maio com o de julho é erro de leitura.

## O mesmo problema em Plurix — mas com causa diferente e mais grave

`[PLURIX]App_Install_Mais_Amigo` registrou **980 conversões em maio e zero em junho e julho**,
com R$ 7.616 investidos no trimestre reportado (valor real maior — ver nota de dias faltantes
abaixo). A causa **não é falta de reconciliação com o AppsFlyer**. É mais grave: a campanha nunca
teve um evento de instalação de fato configurado.

**Confirmado direto nas duas fontes em 21/08/2026:**

- **No Meta Ads (API), campanha `120242209589710723`:** objetivo `OUTCOME_APP_PROMOTION`,
  otimizando para `mobile_app_install`. Ao pedir o resultado por mês, o próprio Meta responde
  `"Not available (Mobile app installs)"` para maio, junho **e** julho — os 980 de maio não vieram
  desse indicador, vieram de um evento genérico `conversion` que a campanha usava antes de trocar
  de objetivo em 29/05.
- **No AppsFlyer (`appsflyer_governed_apps`):** só o app Afinz/Sorocred (Android e iOS) está
  cadastrado. O app **+amigo**, que é o app do Plurix, nunca foi registrado. Não existe SDK nem
  MMP conectado a ele.
- **Nos datasets do Meta (`ads_get_datasets`) da conta Fábrica de Vendas:** todos os datasets são
  pixels de site. Não existe nenhum dataset de app (mobile SDK) para o +amigo.

**Leitura correta:** rodamos dois meses de campanha de instalação de app sem nenhum canal capaz
de medir instalação — nem primário (Meta/SDK), nem de reconciliação (AppsFlyer). Não é medição
perdida por quebra de série; é medição que nunca existiu para esse objetivo. É o mesmo motivo que
mantém Plurix pausada no plano de agosto, mas a ação corretiva é diferente: não basta reconciliar
fonte, é preciso primeiro cadastrar o app no AppsFlyer e conectar o SDK/evento ao Meta.

## Divergência entre fontes — não resolvida

Três fontes discordam sobre a mesma instalação:

| Mês | Meta `installs` | AppsFlyer `appsflyer_acquisition_daily` | AppsFlyer `appsflyer_campaign_daily` |
|---|---|---|---|
| Junho | 58 | 90 | 29 |
| Julho | 202 | 1.104 | 376 |

Em julho o AppsFlyer reporta 5,5× mais instalação que o Meta. As duas tabelas do próprio
AppsFlyer também discordam entre si — são grãos e coberturas diferentes.

> ⚠️ **A validar:** qual fonte é oficial para instalação. O plano de agosto define o AppsFlyer
> como fonte da etapa 4 da escada de eventos, mas a reconciliação nunca foi feita. Enquanto isso
> não fechar, relatório executivo deve usar Meta e declarar a fonte, ou omitir instalação.

## Série de Seguros — comparável, sem ressalva

`SEGUROS Conversão_Leads` manteve campanha, objetivo e evento nos três meses. Houve migração de
conta em 29/06 **sem** quebra de medição. É a única frente do trimestre em que dá para comparar
mês a mês diretamente:

| Mês | Investido | Leads | Custo por lead |
|---|---|---|---|
| Maio | R$ 2.470 | 131 | R$ 18,85 |
| Junho | R$ 3.880 | 123 | R$ 31,54 |
| Julho | R$ 1.870 | 101 | R$ 18,51 |

Junho recebeu 57% mais verba e entregou menos lead — sinal de teto de audiência, não de mídia.

## Consequência para relatórios

1. Toda leitura que atravesse 22/06 declara a quebra em nota de rodapé.
2. Custo por instalação de maio não se compara com o de julho.
3. Início de proposta só existe a partir de 23/06 — não há série anterior.
4. Cartão emitido continua sem existir em mídia paga em todo o período.

## Relacionado

- [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) ·
  [AppsFlyer-Tracking-CRM](#appsflyer-tracking-crm) ·
  [Mídia-Paga](#mídia-paga) · [Etapa-de-Aquisição](#etapa-de-aquisição)
