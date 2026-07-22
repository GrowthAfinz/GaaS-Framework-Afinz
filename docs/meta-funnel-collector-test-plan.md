# Plano de testes v2  collect-meta-events (PROPOSTA, no implementado)

Valida o writer v2 (`collect-meta-events.ts`) contra `paid_media_actions.sql` v2.
Read-only na Meta; escreve s em `paid_media_actions` + `paid_media_collection_runs`
(em Supabase **local ou branch**, nunca produo). Legado intocado.

Gabarito certificado (campanha `[B2C]App_Install_Onboarding_Afinz`):
- StartTrial (`results`, indicator `conversions:start_trial_mobile_app`, 7d click):
  22/0621/07 = **115**; 19/20/21 = **2 / 8 / 1**; ad-sum = adset = campanha = **115**; cost_per_result  **R$51,07**.
- Janelas `actions[]`: `1d_view,1d_click,7d_click,28d_click`.
- Rtulo BI obrigatrio: **"StartTrial atribudo  Meta  7d click"** (nunca "total do app").

| # | Caso | Setup | Esperado |
|---|------|-------|----------|
| 1 | Payload dirio 1921/07 | `results` gro ad, `time_increment=1` | 1 linha/anncio/dia/indicador; StartTrial dirio presente |
| 2 | Reconciliao 115 (30d) | gro campanha 22/0621/07, run **complete** | `v_paid_media_actions_latest` StartTrial campanha=115; cost_per_result51,07 |
| 3 | StartTrial 2/8/1 | gro campanha dirio 1921 | soma=11; valores 2,8,1 |
| 4 | Trs gros sem soma cruzada | persistir campaign+adset+ad | `v_funnel_ad_latest` s gro ad; `v_paid_media_actions_reconciliation` diff=0 |
| 5 | Indicator desconhecido | `results.indicator='conversions:foo_bar'` fora do seed | grava bruto; `raw_indicator` preenchido; **`canonical_event=null`** |
| 6 | Mudana de objetivo | indicator ? start_trial | persiste bruto; `canonical_event=null`; nunca vira start_trial |
| 7 | Evento ausente (com entrega) | entidade/data COM linha na API, sem o evento | linha `not_available`, `value=null` |
| 8 | Zero explcito | API retorna `value=0` | `explicit_zero`, `value=0` |
| 9 | `Not available` | fatia sem retorno | `not_available`, `value=null` |
| 10 | Maturao D+1/D+3/D+7 | mesmo `business_date`, `data_as_of` distintos | vrias linhas; `latest` devolve o `data_as_of` mais recente |
| 11 | Reexecuo idempotente | rodar 2x mesmo perodo/`data_as_of` | upsert pela chave natural ? sem duplicar |
| 12 | **Falha parcial de pgina (atmico)** | erro em 1 pgina aps retries | **run vira `failed`**; **nenhuma linha desse run aparece nas views**; re-run cria run novo e  idempotente |
| 13 | Feature flag desligada | `COLLECT_META_EVENTS_ENABLED=false` | no-op; legado intocado |
| 14 | Ausncia de SubmitApplication | procurar submit/card no output | nenhuma linha; no existe em fonte Meta; seed sem ela |
| 15 | initiated_checkout ? StartTrial | comparar | `funnel_stage` distintos; checkout nunca resolve `canonical_event='start_trial'` |
| 16 | **Run parcial no aparece no BI** | run `pending`/`failed` com linhas gravadas | views (latest, funil, reconc) NO retornam essas linhas (join `status='complete'`) |
| 17 | **Alias primrio evita dupla contagem de install** | persistir `mobile_app_install` + `omni_app_install` | `v_funnel_ad_latest` conta **s** o primrio (`is_primary_measure=true`); install no duplica |
| 18 | **Alias secundrio fica p/ auditoria** | idem 17 | `omni_app_install` existe em `paid_media_actions`/`latest`, mas fora do funil produtivo |
| 19 | Duas verses temporais do mesmo alias | seed com `valid_from`/`valid_to` distintos | resoluo pega a verso cuja vigncia contm `business_date` |
| 20 | **Vigncias sobrepostas rejeitadas** | inserir 2 verses sobrepostas do mesmo (source,event) | `EXCLUDE event_map_no_overlap` **rejeita** no DB; se passar, cdigo loga OVERLAP e  determinstico |
| 21 | **Campanha com 2 adsets, specs diferentes** | attribution_spec divergente | gro campanha grava `attribution_policy_key='mixed'`, `effective=null`; nunca inventa janela nica |
| 22 | **Token nunca em URL/log/erro** | inspecionar requests/logs/erros | token s no header `Authorization`; ausente de URL, paging, metadata e mensagens de erro |
| 23 | **Mudana de poltica efetiva no colide** | mesma entidade/data com policy 7d_click e depois mixed | `attribution_policy_key` distinto ? chave idempotente **no colide** (2 linhas) |
| 24 | **Run completo substitui run failed** | aps um `failed`, rodar `complete` | upsert (chave sem run_id) atualiza `collector_run_id` p/ o run complete; views passam a mostrar |
| 25 | **View produtiva s runs completas** | misturar runs complete e pending | `v_funnel_ad_latest`/`latest`/reconc retornam s linhas de run `complete` |

## Verificaes transversais
- **Atribuio por gro:** ad?adset; adset?prprio; campanha?todos os adsets (uniforme=poltica; divergente=`mixed`). `reported='default'` e `effective` preservados separados; `attribution_policy_key` no nula.
- **Ausncia ? zero:** s gera `not_available` para entidade/data que teve linha de entrega na API (no fabrica para quem no entregou).
- **Reconciliao:** tolerncia = max(R$0,05; 0,5%). `ad_sum ? campanha` acima da tolerncia = **critical ? run failed**; `adset ? campanha` = **warning** (no bloqueia). Nunca redistribui.
- **RLS:** `anon`/`authenticated` s leitura; escrita s `service_role`; sem policy de escrita para service_role.
- **Sem soma incompatvel:** nenhuma view soma gros, aliases (no-primrios) ou janelas/polticas diferentes.

## Critrio de aprovao
- 14 batem o gabarito (115; 2/8/1; ad-sum=campanha).
- 56: indicator desconhecido nunca  auto-mapeado.
- 79: ausncia ? zero.
- 1012: maturao + idempotncia + atomicidade (falha ? nada no BI).
- 1618: runs incompletas isoladas; alias no duplica; secundrio auditvel.
- 1921: vigncia temporal correta; sobreposio barrada; campanha mixed.
- 2225: token seguro; poltica na chave; run complete substitui failed; BI s complete.


