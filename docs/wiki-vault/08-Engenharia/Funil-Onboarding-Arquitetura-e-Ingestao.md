---
tags: [engenharia, funil, meta, appsflyer, supabase, ingestao]
tipo: engenharia
camada: codigo-dados
atualizado: 2026-07-22
status: confirmado
fonte: codigo-gaas-meta-graph-e-validacao-operador
---

# Funil de Onboarding — Arquitetura e Ingestão

## Implementação em produção

Componentes principais:

- `FunilAquisicaoView.tsx`: central e roteamento entre Apps, Serasa e Mídia Paga;
- `AppAfinzFunnelView.tsx`: funil do App, recortes de população, gráfico combinado e detalhe diário;
- `PaidMediaFunnelView.tsx`: funil B2C App Install, custos, taxas e qualidade de fonte;
- visão Serasa dentro de `FunilAquisicaoView.tsx`;
- `collect-meta-events`: collector governado de `actions[]`, `results` e `cost_per_result`;
- tabelas `paid_media_collection_runs`, `event_map` e `paid_media_actions`;
- views `v_paid_media_actions_latest`, `v_funnel_ad_latest` e `v_paid_media_actions_reconciliation`.

Deploys centrais de 22/07/2026: `f7bbff7`, `a75b9cb`, `689bd14`, `6c82cb1`, `0e8828e`, `db5d293` e correções posteriores de UX/copy até `270e499`.

## Contrato Meta certificado

### `actions[]`

- clique no link: `link_click`;
- instalação: `mobile_app_install` / `omni_app_install`;
- sessão: `app_custom_event.fb_mobile_activate_app` / `omni_activate_app`;
- app aberto/checkout: `app_custom_event.fb_mobile_initiated_checkout` / `omni_initiated_checkout` / `initiate_checkout`.

Janelas retornadas pela API: `1d_view`, `1d_click`, `7d_click`, `28d_click`. `7d_view` e `28d_view` voltaram vazias no teste e não entram como políticas certificadas.

### `results`

StartTrial é retornado pelo campo `results` como:

`conversions:start_trial_mobile_app`

Gabarito reconciliado para `[B2C]App_Install_Onboarding_Afinz`, 22/06–21/07/2026:

- campanha = 115;
- soma dos anúncios = 115;
- série 19/07, 20/07, 21/07 = 2, 8, 1;
- custo por resultado = R$ 51,07;
- atribuição efetiva = 7 dias após clique, sem view.

Rótulo obrigatório no BI: **StartTrial atribuído à Meta — 7d click**. Nunca apresentar como total do app.

O collector persiste o `indicator` bruto devolvido pela API. Se o objetivo mudar e surgir outro indicador, ele fica sem mapeamento canônico até certificação humana.

## Lacuna do fundo do funil

- StartTrial existe no catálogo do app e é atribuível via `results`.
- O dataset 568302508775063 está ativo, porém sem volume produtivo; serve como monitor de instrumentação, não como fonte de volume.
- SubmitApplication / `Card order completed` não apareceu no catálogo nem na API Meta.
- AppsFlyer é a fonte necessária para StartTrial total, complete_registration total, split orgânico/pago e SubmitApplication.

## Governança implementada

- lifecycle de run: `pending → complete | failed`;
- views produtivas mostram apenas runs completas;
- ausência observada vira `not_available` com valor nulo;
- zero explícito permanece `explicit_zero` com valor zero;
- aliases ficam auditáveis, mas apenas a medida primária entra no funil;
- campanha, adset e anúncio são persistidos sem soma cruzada de grãos;
- política de atribuição faz parte da identidade da observação;
- token Meta apenas em `Authorization: Bearer`, nunca em URL ou log;
- feature flag e allowlist de campanhas governam o collector;
- falha de paginação invalida o run inteiro para o BI.

## Estado do rollout

O código e a migration foram implementados no repositório e enviados à `main`. A ativação produtiva do collector depende dos secrets, allowlist, backfill controlado e gate de reconciliação. Não confundir “código em produção” com “fonte já certificada em operação contínua”.

## Colaboração Codex ↔ Claude

O desenho foi refinado por troca assíncrona via arquivo de texto: o Codex formulou perguntas e gates; o Claude executou exploração read-only no Meta/Graph, devolveu evidências e revisou os drafts. O registro consolidado está em [Handoff-Codex-Claude-Funil-Meta.txt](../09-Inteligencia-IA/Handoff-Codex-Claude-Funil-Meta.txt).

## Relacionado

- [[Funis-de-Onboarding-GaaS]]
- [[Módulo-Paid-Media-Afinz]]
- [[Decisões-Técnicas]]
- [[Governança-de-Dados]]

