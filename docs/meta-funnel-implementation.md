# Funil Onboarding — Mídia Paga (Meta)

Base governada de ingestão do funil de mídia paga. É **aditiva**: o coletor legado
`paid_media_metrics` continua intocado até a certificação descrita no final deste documento.

---

## Arquitetura

| Objeto | Papel |
|---|---|
| `paid_media_collection_runs` | Lifecycle atômico da execução (`pending` → `complete`/`failed`). |
| `event_map` | Dicionário certificado e versionado de aliases Meta. Uma medida principal por alias group. |
| `paid_media_actions` | Fato long-format diário nos grãos campanha, conjunto e anúncio. |
| `v_paid_media_actions_latest` | Última maturação, **somente runs `complete`**. |
| `v_funnel_ad_latest` | Funil produtivo no grão anúncio, sem somar aliases nem janelas incompatíveis. |
| `v_paid_media_actions_reconciliation` | Controles anúncio × conjunto × campanha. |
| `v_b2c_app_install_daily` | View lida pela tela. |
| `v_b2c_app_install_freshness` | Frescor por etapa: entrega × eventos atribuídos. |
| `v_meta_legacy_certification` | Comparação diária governado × legado. |
| `v_meta_legacy_cutover_readiness` | Gate duplo de corte do legado. |
| `collect-meta-events` | Edge Function coletora (`actions[]`, `results`, `cost_per_result`). |

---

## Automação diária

Migration `20260727190000_schedule_collect_meta_events_daily.sql`.

- Cron `collect-meta-events-daily` — `20 11 * * *` UTC (08:20 America/São_Paulo).
- Cron `meta-collection-watchdog` — a cada 10 min; encerra como `failed` runs presas em `pending`.
- Despachante: `public.collect_meta_events_dispatch('daily')`.
- Campanhas governadas vivem em `public.meta_governed_campaigns` (dado, não código).
- A Edge Function resolve `lastClosedDay()` em `America/Sao_Paulo` e **reprocessa os últimos
  28 dias fechados** para contemplar maturação da atribuição.

### Segredo

A chave **não está no SQL versionado**. É lida do Vault pelo nome e enviada apenas no header
`Authorization`, nunca em URL ou log:

```sql
select vault.create_secret('<jwt>', 'collect_meta_events_auth_key',
       'JWT usado pelo cron para chamar collect-meta-events');
```

Sem o segredo, o despachante registra `skipped_missing_secret` em
`public.meta_events_dispatch_log` e emite `WARNING` — falha visível, nunca silenciosa.

### Anti-sobreposição

1. `pg_try_advisory_xact_lock` bloqueia despachos concorrentes.
2. Existência de run `meta` em `pending` nas últimas 2 h aborta o despacho.
3. Watchdog libera o estado em até 30 min caso a função morra no meio.

### Isolamento do BI

`v_paid_media_actions_latest` e as policies de RLS filtram `status = 'complete'`. Run `pending`,
`failed` ou com reconciliação crítica **nunca** aparece nas views produtivas.

---

## Semântica das etapas

| # | Etapa | Fonte | Classificação |
|---|---|---|---|
| 1 | Impressões | `paid_media_metrics` | plataforma · entrega |
| 2 | Cliques no link | `link_click` (Meta atribuído) | plataforma · entrega |
| 3 | Instalações | `paid_media_metrics` (legado) | **em certificação** — dual-write não cortado |
| 4 | Sessões no app | `app_custom_event.fb_mobile_activate_app` | apoio · direcional |
| 5 | **Início de checkout** | `initiated_checkout` | apoio · direcional |
| 6 | StartTrial | `conversions:start_trial_mobile_app` | CORE · **atribuído à Meta — 7d click** |
| 7 | Pedido de cartão | — | **bloqueado · não instrumentado** |

### Correção semântica de "App aberto"

A coluna antes chamada `app_opened` era alimentada por `canonical_event = 'initiated_checkout'`.
O nome era falso: início de checkout não é abertura de aplicativo. A coluna foi renomeada para
`initiated_checkout` na view e para `initiatedCheckout` no componente. Nenhum evento foi
inventado — é o mesmo dado com o nome correto. A abertura real de app continua exposta
separadamente como `app_sessions` (`fb_mobile_activate_app`).

### Estados por etapa

| Estado | Significado |
|---|---|
| `n/d` | `observation_status = not_available` — ausência de observação. **Nunca vira zero.** |
| `0` | `explicit_zero` — a Meta reportou zero. |
| `desatualizado` | Evento existe mas parou antes do último dia fechado. |
| `bloqueado` | Etapa sem fonte instrumentada. |

### Frescor

A tela **não** usa a última data da view como indicador geral. Exibe duas datas:

```
Entrega atualizada até DD/MM/AAAA
Eventos atribuídos atualizados até DD/MM/AAAA
```

"Eventos atribuídos" é o **elo mais fraco** — a menor data observada entre as etapas governadas.
O estado verde só aparece quando ambas alcançam o último dia fechado em `America/Sao_Paulo`.
Qualquer divergência gera estado de atenção (âmbar).

### CPA nunca é CAC

CPI e CP início de proposta são custos por evento **de plataforma**. Não representam custo de
aquisição de cliente. A tela declara isso explicitamente em três pontos.

---

## Pedido de cartão — contrato externo pendente

`SubmitApplication` **não existe** na fonte Meta, no `event_map` nem nos eventos brutos.
Não foi semeado e não deve ser. `initiated_checkout`, StartTrial ou qualquer conversão de
plataforma **não são substitutos** de pedido de cartão.

Para desbloquear a etapa, é necessário fechar o contrato abaixo com os times de app/backend:

| Item | Definição exigida |
|---|---|
| Nome canônico | `card_order_submitted` (proposta) — precisa ser fixado e versionado no `event_map`. |
| Momento exato de disparo | No **aceite do pedido pelo backend**, após validação, não no clique do usuário. Definir se é submissão ou aprovação; são etapas diferentes. |
| Fonte responsável | Decidir entre: app (SDK Meta), backend via **Conversions API server-to-server**, ou MMP (AppsFlyer) com postback para Meta. A escolha determina latência e janela. |
| Parâmetros mínimos | `event_name`, `event_time` (UTC), `event_id`, `action_source`, identificadores hasheados do usuário e `app_id` / `campaign_id` quando disponíveis. |
| Deduplicação | Obrigatória por `event_id` estável e determinístico, compartilhado entre app e servidor, para evitar dupla contagem em envio híbrido. |
| Validação | Confirmar recebimento e qualidade no **Meta Events Manager** (match quality, deduplicação, volume diário) antes de qualquer uso analítico. |
| Mapeamento | Inserir em `event_map` com `source`, `source_event_name`, `alias_group`, `is_primary_measure`, `valid_from` e `confidence`. Começar em `directional`; promover a `trusted` só após reconciliação. |
| Coletor e view | Estender `expectedEvents()` no `collect-meta-events` e adicionar a coluna em `v_b2c_app_install_daily` e `v_b2c_app_install_freshness`. |
| Reconciliação | Comparar diariamente contra a fonte operacional de pedidos (originação/Serasa) com tolerância declarada, antes de expor como CORE. |

Enquanto o contrato não fechar, a interface comunica **"Pedido de cartão — não instrumentado na Meta"**
e o valor permanece vazio.

---

## Certificação e corte do legado

O legado **não** é removido de imediato. O gate `v_meta_legacy_cutover_readiness` tem duas
condições, ambas obrigatórias:

1. `reconciliation_gate_met` — 14 dias fechados consecutivos com governado igual ao legado.
2. `daily_operation_gate_met` — 14 **dias distintos de execução** da coleta diária automática
   com status `complete`. Backfill manual reconcilia, mas não prova que a automação se sustenta.

`v_meta_legacy_certification` expõe, por dia e por métrica: valor governado, valor legado,
diferença absoluta, diferença percentual, status de reconciliação e data de atualização do legado.

> `is_approved` usa `coalesce(...,0)` porque compara **totais do dia**. Ele serve apenas ao gate.
> A coluna `reconciliation_status` preserva a distinção semântica (`sem_observacao_governada`
> ≠ `sem_evento`) e é ela que deve ser lida por humanos. A tela nunca usa `is_approved` para
> preencher valor.

---

## Sequência de ativação segura

1. Aplicar as migrations.
2. Configurar os secrets da Edge Function: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`,
   `META_GOVERNED_CAMPAIGN_IDS`, `COLLECT_META_EVENTS_ENABLED=true`.
3. Provisionar `collect_meta_events_auth_key` no Vault.
4. Rodar um backfill curto e conferir `paid_media_collection_runs`.
5. Ligar o cron diário (feito pela migration) e acompanhar `meta_events_dispatch_log`.
6. Monitorar `v_meta_legacy_cutover_readiness` até os dois gates fecharem.
7. Só então avaliar a remoção do mapeamento legado de StartTrial e Instalação.

## Exemplo de requisição

```json
{
  "mode": "backfill",
  "since": "2026-07-22",
  "until": "2026-07-26",
  "campaign_id": "120250049222750723"
}
```

O endpoint exige requisição autenticada, rejeita campanhas fora da allowlist governada e
recusa períodos futuros ou em aberto.
